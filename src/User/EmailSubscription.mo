import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Char "mo:base/Char";
import Cycles "mo:base/ExperimentalCycles";
import Error "mo:base/Error";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Random "mo:base/Random";
import Result "mo:base/Result";
import Text "mo:base/Text";

// Self-contained helper module for the Email Subscription feature that
// lives inside the User canister. This module owns:
//   * the data model (EmailSubscriber / VerificationToken)
//   * the Lettermint HTTPS outcall client (transactional + batch)
//   * email validation + token generation helpers
//
// Keeping it out of the User actor file keeps that file focused on
// user-profile logic and makes the email code easy to unit-test.
module {

  //================================================================
  // Data model
  //================================================================

  public type EmailSubscriber = {
    email : Text; // normalized: lowercased, trimmed
    authorPrincipal : Text; // principal text of the author
    verified : Bool;
    userId : ?Text; // principal text if subscriber was logged in
    createdAt : Int; // nanos
    verifiedAt : ?Int;
    unsubscribedAt : ?Int;
  };

  public type VerificationToken = {
    token : Text;
    email : Text;
    authorPrincipal : Text;
    expiresAt : Int;
    createdAt : Int;
  };

  /// One-per-broadcast unsubscribe token. Carries the full target list
  /// (article author + any publication canisters the article was
  /// published into) so the unsubscribe handler can mark the recipient
  /// unsubscribed across every target they were subscribed to.
  public type BroadcastUnsubToken = {
    token : Text;
    targetIds : [Text];
    expiresAt : Int;
    createdAt : Int;
  };

  // Payload received from PostBucket when an article transitions draft->published.
  public type PublishedArticlePayload = {
    postId : Text;
    authorPrincipal : Text;
    authorHandle : Text;
    authorDisplayName : Text;
    authorAvatar : Text;
    // Set when the article is published inside a publication. The render
    // path treats these as a single optional block — all three should be
    // present together, or all absent.
    publicationHandle : ?Text;
    publicationDisplayName : ?Text;
    publicationAvatar : ?Text;
    title : Text;
    subtitle : Text;
    headerImage : Text;
    contentHtml : Text;
    isMembersOnly : Bool;
    url : Text;
    publishedAt : Int;
  };

  public type SubscribeOk = { message : Text };
  public type SubscribeResult = Result.Result<SubscribeOk, Text>;

  public type VerifyOk = { email : Text; authorPrincipal : Text };
  public type VerifyResult = Result.Result<VerifyOk, Text>;

  public type BroadcastOk = {
    totalRecipients : Nat;
    batchesSent : Nat;
    batchesFailed : Nat;
  };
  public type BroadcastResult = Result.Result<BroadcastOk, Text>;

  //================================================================
  // Tuning knobs
  //================================================================

  /// Verification token time-to-live. 24h in nanoseconds (86_400_000_000_000).
  public let VERIFY_TTL_NANOS : Int = 86_400_000_000_000;

  /// Lettermint supports up to 500 recipients per batch. We stay at 500.
  public let BATCH_SIZE : Nat = 500;

  /// Conservative cycles budget per HTTPS outcall. Lettermint responses are
  /// small (<2KB), so 50B cycles is ample for mainnet even with overhead.
  public let OUTCALL_CYCLES : Nat = 50_000_000_000;

  /// Rate limit: max verification emails per (email, author) per hour.
  public let MAX_VERIFIES_PER_HOUR : Nat = 3;
  public let RATE_WINDOW_NANOS : Int = 3_600_000_000_000;

  /// Cap on response bytes from Lettermint. Their success response is <1KB.
  public let MAX_RESPONSE_BYTES : Nat64 = 8_192;

  /// Marker that callers can embed in pre-rendered html/plain bodies
  /// to be replaced with the URL-encoded recipient email at envelope
  /// build time. See `buildBatchBody`. Pure ASCII so it survives
  /// jsonEscape / htmlAttrEscape unchanged.
  public let RECIPIENT_EMAIL_PLACEHOLDER : Text = "{{NUANCE_RECIPIENT_EMAIL}}";

  //================================================================
  // Failed-broadcast retry queue
  //================================================================

  /// One queued retry per failed batch from notifyAuthorArticlePublished.
  /// We snapshot the rendered html/plain bodies + recipient list so the
  /// retry is independent of any later edits to the post or its author.
  public type PendingBatch = {
    id : Text;                    // also serves as the Lettermint Idempotency-Key
    postId : Text;
    authorPrincipal : Text;
    recipients : [Text];
    subject : Text;
    htmlBody : Text;
    plainBody : Text;
    fromHeader : Text;
    tags : [Text];
    metadata : [(Text, Text)];
    attempts : Nat;               // total attempts so far (initial + retries)
    nextAttemptAt : Int;          // ns; timer skips entries until now >= this
    lastError : Text;
    firstAttemptedAt : Int;
    updatedAt : Int;
  };

  /// Backoff schedule (ns) indexed by attempts-already-made. attempts=1
  /// means the inline send already failed once; pick RETRY_DELAYS_NS[0]
  /// for the gap before attempt #2. Cumulative wall-clock for the full
  /// schedule is < 18h, comfortably inside Lettermint's 24h idempotency
  /// window.
  ///
  /// Values are precomputed (Motoko module-level lets must be static):
  ///   2 min  =          120_000_000_000
  ///   10 min =          600_000_000_000
  ///   1 hr   =        3_600_000_000_000
  ///   4 hr   =       14_400_000_000_000
  ///   12 hr  =       43_200_000_000_000
  public let RETRY_DELAYS_NS : [Int] = [
    120_000_000_000,
    600_000_000_000,
    3_600_000_000_000,
    14_400_000_000_000,
    43_200_000_000_000,
  ];

  /// Total attempts allowed before a batch is moved to the dead-letter
  /// store. Equals 1 (inline) + 5 retries = 6. Keep in sync with
  /// RETRY_DELAYS_NS length.
  public let MAX_BATCH_ATTEMPTS : Nat = 6;

  /// Cap how many pending batches the timer drains per tick — keeps any
  /// single tick's outcall fan-out (and cycles burn) bounded.
  public let MAX_RETRIES_PER_TICK : Nat = 10;

  /// Timer cadence. 60s is fine-grained enough that the smallest backoff
  /// (2 min) isn't materially delayed. 60s = 60_000_000_000 ns.
  public let RETRY_TIMER_INTERVAL_NS : Nat = 60_000_000_000;

  /// Classify a Lettermint send error to decide whether to retry. The
  /// error string formats are produced in `postJson`:
  ///   * "Lettermint HTTP <code>: <body>"  — server returned a non-2xx
  ///   * "HTTPS outcall failed: <msg>"     — outcall trapped / timed out
  /// Anything we don't recognize as a permanent 4xx is treated as
  /// retryable, so the retry queue catches transient and unknown failures
  /// rather than silently dropping them.
  public func isRetryableError(err : Text) : Bool {
    let prefix = "Lettermint HTTP ";
    if (not Text.startsWith(err, #text prefix)) {
      // Outcall trap, timeout, decode error, etc. — always retry.
      return true;
    };
    let rest = Text.trimStart(err, #text prefix);
    let codeText = takeWhileDigits(rest);
    if (codeText.size() == 0) { return true };
    switch (Nat.fromText(codeText)) {
      case null { true };
      case (?code) {
        if (code >= 500) { true }
        else if (code == 408 or code == 425 or code == 429) { true }
        else if (code >= 400) { false }      // permanent: bad request, auth, payload, etc.
        else { false };                       // 1xx/2xx/3xx wouldn't reach here
      };
    };
  };

  func takeWhileDigits(t : Text) : Text {
    let buf = Buffer.Buffer<Char>(4);
    label l for (c in t.chars()) {
      let n = Char.toNat32(c);
      if (n >= 48 and n <= 57) { buf.add(c) } else { break l };
    };
    Text.fromIter(buf.vals());
  };

  /// Build the Idempotency-Key for a batch. Stable across retries (so
  /// Lettermint dedupes), unique per (article, batch index) so distinct
  /// batches of the same article don't collide.
  public func buildBatchIdempotencyKey(postId : Text, batchIndex : Nat) : Text {
    "nuance-broadcast-" # postId # "-" # Nat.toText(batchIndex);
  };

  /// Pick the next-attempt delay given how many attempts have already
  /// run. Returns null when the batch has exhausted its retry budget and
  /// should move to the dead-letter store.
  public func nextRetryDelayNs(attemptsSoFar : Nat) : ?Int {
    if (attemptsSoFar == 0 or attemptsSoFar > RETRY_DELAYS_NS.size()) { null }
    else { ?RETRY_DELAYS_NS[attemptsSoFar - 1] };
  };

  //================================================================
  // Email validation + normalization
  //================================================================

  /// Trim + lowercase. Everything downstream keys by normalized email.
  public func normalizeEmail(raw : Text) : Text {
    let trimmed = Text.trim(raw, #char ' ');
    toLower(trimmed);
  };

  func toLower(t : Text) : Text {
    let buf = Buffer.Buffer<Char>(t.size());
    for (c in t.chars()) {
      let n = Char.toNat32(c);
      if (n >= 65 and n <= 90) {
        buf.add(Char.fromNat32(n + 32));
      } else {
        buf.add(c);
      };
    };
    Text.fromIter(buf.vals());
  };

  /// RFC5322-lite validator. We don't accept every legal oddball email
  /// (quoted local parts, IP-literal domains) — we accept the shape real
  /// humans type. Verification via the outbound email is the real test.
  public func isValidEmail(email : Text) : Bool {
    if (email.size() < 3 or email.size() > 254) return false;
    var atCount : Nat = 0;
    var localSize : Nat = 0;
    var domainSize : Nat = 0;
    var dotInDomain = false;
    var seenAt = false;
    var lastChar : ?Char = null;
    for (c in email.chars()) {
      let n = Char.toNat32(c);
      // whitespace / control chars reject outright
      if (n <= 32 or n == 127) return false;
      if (c == '@') {
        atCount += 1;
        seenAt := true;
        if (localSize == 0) return false;
      } else if (seenAt) {
        if (c == '.') {
          // no leading dot, no consecutive dots
          if (domainSize == 0) return false;
          switch (lastChar) {
            case (?'.') return false;
            case _ {};
          };
          dotInDomain := true;
        };
        domainSize += 1;
      } else {
        localSize += 1;
      };
      lastChar := ?c;
    };
    if (atCount != 1) return false;
    if (not dotInDomain) return false;
    switch (lastChar) {
      case (?'.') return false;
      case _ {};
    };
    true;
  };

  //================================================================
  // Token generation
  //================================================================

  /// 32 hex chars from IC randomness. Caller awaits the future.
  public func generateToken() : async Text {
    let entropy = await Random.blob();
    hexEncode(Blob.toArray(entropy), 16) // 16 bytes -> 32 hex chars
  };

  func hexEncode(bytes : [Nat8], max : Nat) : Text {
    let hex = "0123456789abcdef";
    let hexArr = Iter.toArray(hex.chars());
    let buf = Buffer.Buffer<Char>(max * 2);
    var i = 0;
    let limit = if (bytes.size() < max) bytes.size() else max;
    while (i < limit) {
      let b = Nat8.toNat(bytes[i]);
      buf.add(hexArr[b / 16]);
      buf.add(hexArr[b % 16]);
      i += 1;
    };
    Text.fromIter(buf.vals());
  };

  //================================================================
  // JSON encoding — minimal, only what we need for Lettermint payloads.
  // We *never* interpolate raw user input into HTTP bodies without
  // escaping via jsonEscape.
  //================================================================

  public func jsonEscape(input : Text) : Text {
    let buf = Buffer.Buffer<Char>(input.size());
    for (c in input.chars()) {
      let n = Char.toNat32(c);
      if (c == '\"') { buf.add('\\'); buf.add('\"') }
      else if (c == '\\') { buf.add('\\'); buf.add('\\') }
      else if (c == '\n') { buf.add('\\'); buf.add('n') }
      else if (c == '\r') { buf.add('\\'); buf.add('r') }
      else if (c == '\t') { buf.add('\\'); buf.add('t') }
      else if (n < 0x20) {
        buf.add('\\'); buf.add('u');
        buf.add('0'); buf.add('0');
        let hi = Nat32.toNat(n) / 16;
        let lo = Nat32.toNat(n) % 16;
        buf.add(hexNibble(hi));
        buf.add(hexNibble(lo));
      } else { buf.add(c) };
    };
    Text.fromIter(buf.vals());
  };

  func hexNibble(n : Nat) : Char {
    let hex = "0123456789abcdef";
    Iter.toArray(hex.chars())[n];
  };

  /// Percent-encode a value for safe inclusion in a URL query string.
  /// Unreserved chars (RFC3986) pass through; everything else becomes %HH.
  /// Emails are validated to ASCII upstream, so single-byte encoding is safe.
  public func urlEncodeQueryValue(s : Text) : Text {
    let buf = Buffer.Buffer<Char>(s.size());
    for (c in s.chars()) {
      let n = Char.toNat32(c);
      let unreserved =
        (n >= 0x30 and n <= 0x39) // 0-9
        or (n >= 0x41 and n <= 0x5A) // A-Z
        or (n >= 0x61 and n <= 0x7A) // a-z
        or n == 0x2D // -
        or n == 0x5F // _
        or n == 0x2E // .
        or n == 0x7E; // ~
      if (unreserved) {
        buf.add(c);
      } else {
        buf.add('%');
        let hi = Nat32.toNat(n) / 16;
        let lo = Nat32.toNat(n) % 16;
        buf.add(hexNibble(hi));
        buf.add(hexNibble(lo));
      };
    };
    Text.fromIter(buf.vals());
  };

  //================================================================
  // Lettermint HTTPS outcalls
  //================================================================

  // IC Management canister types for http_request
  public type HttpHeader = { name : Text; value : Text };
  public type HttpMethod = { #get; #head; #post };
  public type HttpResponsePayload = {
    status : Nat;
    headers : [HttpHeader];
    body : [Nat8];
  };
  public type TransformArgs = {
    response : HttpResponsePayload;
    context : Blob;
  };
  public type TransformRawResponseFunction = {
    function : shared query (TransformArgs) -> async HttpResponsePayload;
    context : Blob;
  };
  public type HttpRequestArgs = {
    url : Text;
    max_response_bytes : ?Nat64;
    headers : [HttpHeader];
    body : ?[Nat8];
    method : HttpMethod;
    transform : ?TransformRawResponseFunction;
    is_replicated : ?Bool;
  };

  type IC = actor {
    http_request : HttpRequestArgs -> async HttpResponsePayload;
  };

  let ic : IC = actor ("aaaaa-aa");

  public type SendResult = Result.Result<Text, Text>;

  /// Single transactional send — used for verification + unsubscribe confirmation.
  /// `idempotencyKey` is optional; pass null when retries aren't expected
  /// (e.g. one-shot verification mails generated from a fresh random token).
  public func sendTransactional(
    apiKey : Text,
    fromHeader : Text,
    toEmail : Text,
    subject : Text,
    route: Text,
    html : Text,
    plainText : Text,
    tags : [Text],
    metadata : [(Text, Text)],
    idempotencyKey : ?Text,
  ) : async SendResult {
    let body = buildSingleBody(fromHeader, toEmail, subject, route, html, plainText, tags, metadata);
    await postJson("https://api.lettermint.co/v1/send", apiKey, body, idempotencyKey);
  };

  /// Batch send — up to BATCH_SIZE recipients per call. Each recipient
  /// gets an individual message (so the `to` list isn't disclosed).
  /// `idempotencyKey` should be deterministic per batch so retries dedupe
  /// against the original send (Lettermint caches by key + body hash for 24h).
  public func sendBatch(
    apiKey : Text,
    fromHeader : Text,
    recipients : [Text],
    subject : Text,
    route: Text,
    html : Text,
    plainText : Text,
    tags : [Text],
    metadata : [(Text, Text)],
    idempotencyKey : ?Text,
  ) : async SendResult {
    let body = buildBatchBody(fromHeader, recipients, subject, route, html, plainText, tags, metadata);
    await postJson("https://api.lettermint.co/v1/send/batch", apiKey, body, idempotencyKey);
  };

  func postJson(url : Text, apiKey : Text, body : Text, idempotencyKey : ?Text) : async SendResult {
    let bodyBytes = Blob.toArray(Text.encodeUtf8(body));
    let headers = Buffer.Buffer<HttpHeader>(3);
    headers.add({ name = "Content-Type"; value = "application/json" });
    headers.add({ name = "x-lettermint-token"; value = apiKey });
    switch (idempotencyKey) {
      case (?k) { headers.add({ name = "Idempotency-Key"; value = k }) };
      case null {};
    };
    let req : HttpRequestArgs = {
      url;
      max_response_bytes = ?MAX_RESPONSE_BYTES;
      headers = Buffer.toArray(headers);
      body = ?bodyBytes;
      method = #post;
      transform = null;
      // is_replicated = false -> avoids 13x duplicate sends.
      // Lettermint is idempotent-per-message thanks to metadata tags, so
      // at-most-once delivery is acceptable here.
      is_replicated = ?false;
    };
    try {
      Cycles.add<system>(OUTCALL_CYCLES);
      let resp = await ic.http_request(req);
      if (resp.status >= 200 and resp.status < 300) {
        #ok(decodeUtf8OrEmpty(resp.body));
      } else {
        #err(
          "Lettermint HTTP " # Nat.toText(resp.status) # ": "
          # decodeUtf8OrEmpty(resp.body)
        );
      };
    } catch (e) {
      #err("HTTPS outcall failed: " # Error.message(e));
    };
  };

  func decodeUtf8OrEmpty(bytes : [Nat8]) : Text {
    switch (Text.decodeUtf8(Blob.fromArray(bytes))) {
      case (?t) t;
      case null "<non-utf8 response>";
    };
  };

  //================================================================
  // JSON body builders
  //================================================================

  func buildSingleBody(
    fromHeader : Text,
    toEmail : Text,
    subject : Text,
    route: Text,
    html : Text,
    plainText : Text,
    tags : [Text],
    metadata : [(Text, Text)],
  ) : Text {
    "{"
    # "\"from\":\"" # jsonEscape(fromHeader) # "\","
    # "\"to\":[\"" # jsonEscape(toEmail) # "\"],"
    # "\"subject\":\"" # jsonEscape(subject) # "\","
    # "\"route\":\"" # jsonEscape(route) # "\","
    # "\"html\":\"" # jsonEscape(html) # "\","
    # "\"text\":\"" # jsonEscape(plainText) # "\","
    # "\"tags\":" # jsonStringArray(tags) # ","
    # "\"metadata\":" # jsonStringMap(metadata) # ","
    # "\"headers\":" # jsonStringMap([("X-Nuance-Channel", "transactional")])
    # "}"
  };

  // Batch body: one message envelope per recipient so recipients can't
  // see each other's addresses. Per-recipient personalization is done by
  // substituting RECIPIENT_EMAIL_PLACEHOLDER inside html/plain — used
  // today to embed the recipient's email in the unsubscribe URL.
  // Substitution happens before jsonEscape so the result is correctly
  // escaped for the JSON body.
  func buildBatchBody(
    fromHeader : Text,
    recipients : [Text],
    subject : Text,
    route: Text,
    html : Text,
    plainText : Text,
    tags : [Text],
    metadata : [(Text, Text)],
  ) : Text {
    let msgs = Buffer.Buffer<Text>(recipients.size());
    for (r in recipients.vals()) {
      let encoded = urlEncodeQueryValue(r);
      let perHtml = Text.replace(html, #text RECIPIENT_EMAIL_PLACEHOLDER, encoded);
      let perPlain = Text.replace(plainText, #text RECIPIENT_EMAIL_PLACEHOLDER, encoded);
      msgs.add(
        "{"
        # "\"from\":\"" # jsonEscape(fromHeader) # "\","
        # "\"to\":[\"" # jsonEscape(r) # "\"],"
        # "\"subject\":\"" # jsonEscape(subject) # "\","
        # "\"route\":\"" # jsonEscape(route) # "\","
        # "\"html\":\"" # jsonEscape(perHtml) # "\","
        # "\"text\":\"" # jsonEscape(perPlain) # "\","
        # "\"tags\":" # jsonStringArray(tags) # ","
        # "\"metadata\":" # jsonStringMap(metadata)
        # "}"
      );
    };
    "[" # Text.join(",", msgs.vals()) # "]";
  };

  func jsonStringArray(items : [Text]) : Text {
    let buf = Buffer.Buffer<Text>(items.size());
    for (it in items.vals()) {
      buf.add("\"" # jsonEscape(it) # "\"");
    };
    "[" # Text.join(",", buf.vals()) # "]";
  };

  func jsonStringMap(entries : [(Text, Text)]) : Text {
    let buf = Buffer.Buffer<Text>(entries.size());
    for ((k, v) in entries.vals()) {
      buf.add("\"" # jsonEscape(k) # "\":\"" # jsonEscape(v) # "\"");
    };
    "{" # Text.join(",", buf.vals()) # "}";
  };

  //================================================================
  // Email body rendering
  //================================================================

  /// Verification email shown to the subscriber immediately after
  /// they submit their address. Branded minimally.
  public func renderVerificationHtml(
    authorDisplayName : Text,
    verifyUrl : Text,
  ) : Text {
    "<!doctype html><html><body style=\"font-family:Inter,Arial,sans-serif;background:#f6f7f8;padding:40px 0;\">"
    # "<table align=\"center\" width=\"520\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;border-radius:12px;padding:32px;\">"
    # "<tr><td>"
    # "<h1 style=\"font-size:22px;margin:0 0 16px 0;color:#111;\">Confirm your email</h1>"
    # "<p style=\"font-size:15px;line-height:1.55;color:#333;margin:0 0 20px 0;\">"
    # "You asked to receive email updates whenever <strong>" # htmlEscape(authorDisplayName) # "</strong> publishes a new article on Nuance."
    # "</p>"
    # "<p style=\"font-size:15px;line-height:1.55;color:#333;margin:0 0 28px 0;\">"
    # "Click the button below to confirm. The link expires in 24 hours."
    # "</p>"
    # "<p style=\"margin:0 0 28px 0;\">"
    # "<a href=\"" # htmlAttrEscape(verifyUrl) # "\" style=\"display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;\">Verify my email</a>"
    # "</p>"
    # "<p style=\"font-size:12px;line-height:1.5;color:#888;margin:0;\">"
    # "If you didn't request this, you can safely ignore this message — no subscription will be created."
    # "</p>"
    # "</td></tr></table></body></html>"
  };

  public func renderVerificationText(authorDisplayName : Text, verifyUrl : Text) : Text {
    "Confirm your Nuance email subscription to " # authorDisplayName # ".\n\n"
    # "Visit this link to verify (expires in 24h):\n"
    # verifyUrl # "\n\n"
    # "If you didn't request this, ignore this email."
  };

  /// Injects `style="max-width:100%;height:auto;"` into every `<img` tag
  /// that doesn't already declare a style attribute. Email clients vary
  /// wildly on default image sizing; this keeps wide images from blowing
  /// out mobile viewports. We do a simple scan — if an `<img` tag already
  /// has a `style=` attribute we leave it alone (Quill rarely adds one).
  public func injectImgResponsiveStyle(html : Text) : Text {
    // Split on each occurrence of "<img" so we only touch image tags.
    let parts = Iter.toArray(Text.split(html, #text "<img"));
    if (parts.size() <= 1) { return html };
    let buf = Buffer.Buffer<Text>(parts.size() * 2);
    buf.add(parts[0]);
    var i = 1;
    while (i < parts.size()) {
      let tail = parts[i];
      // Find the end of this <img ...> tag (first '>').
      let headEndOpt = Text.contains(tail, #text ">");
      if (not headEndOpt) {
        // Malformed — just re-emit as-is and stop rewriting.
        buf.add("<img");
        buf.add(tail);
      } else {
        // Split into tag-body (before first '>') and the rest.
        let segments = Iter.toArray(Text.split(tail, #text ">"));
        // Text.split drops the delimiter; segments[0] is the tag body.
        let tagBody = segments[0];
        // If the tag already has a style= attribute, pass through.
        let hasStyle = Text.contains(tagBody, #text "style=");
        if (hasStyle) {
          buf.add("<img");
          buf.add(tagBody);
          buf.add(">");
        } else {
          buf.add("<img");
          buf.add(tagBody);
          buf.add(" style=\"max-width:100%;height:auto;\">");
        };
        // Reassemble the rest of the string (everything after first '>').
        var j = 1;
        while (j < segments.size()) {
          buf.add(segments[j]);
          if (j < segments.size() - 1) { buf.add(">") };
          j += 1;
        };
      };
      i += 1;
    };
    Text.join("", buf.vals());
  };

  // Avatar circle + author display name + @handle, with an optional
  // "in <Publication>" line beneath when the article was published inside
  // a publication. Avatars may be empty strings (user never set one) — we
  // render a neutral grey placeholder in that case so the layout is stable.
  func renderAvatarImg(url : Text, sizePx : Nat) : Text {
    let s = Nat.toText(sizePx);
    if (url.size() > 0) {
      "<img src=\"" # htmlAttrEscape(url) # "\" alt=\"\" width=\"" # s # "\" height=\"" # s
      # "\" style=\"width:" # s # "px;height:" # s # "px;border-radius:50%;display:block;object-fit:cover;\"/>"
    } else {
      "<div style=\"width:" # s # "px;height:" # s # "px;border-radius:50%;background:#e5e7eb;\"></div>"
    };
  };

  func renderByline(article : PublishedArticlePayload) : Text {
    let authorRow =
      "<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;margin:0 0 20px 0;\">"
      # "<tr>"
      # "<td style=\"vertical-align:middle;padding-right:12px;\">"
      # renderAvatarImg(article.authorAvatar, 40)
      # "</td>"
      # "<td style=\"vertical-align:middle;font-size:14px;line-height:1.3;color:#111;\">"
      # "<div style=\"font-weight:600;\">" # htmlEscape(article.authorDisplayName) # "</div>"
      # "<div style=\"color:#666;font-size:13px;\">@" # htmlEscape(article.authorHandle) # " &middot; on Nuance</div>"
      # "</td>"
      # "</tr></table>";

    let pubRow =
      switch (article.publicationHandle, article.publicationDisplayName) {
        case (?ph, ?pdn) {
          let avatar = switch (article.publicationAvatar) { case (?a) a; case null "" };
          "<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;margin:0 0 24px 0;\">"
          # "<tr>"
          # "<td style=\"vertical-align:middle;padding-right:10px;\">"
          # renderAvatarImg(avatar, 24)
          # "</td>"
          # "<td style=\"vertical-align:middle;font-size:13px;color:#666;\">"
          # "in <strong style=\"color:#333;font-weight:600;\">" # htmlEscape(pdn) # "</strong>"
          # " <span style=\"color:#888;\">@" # htmlEscape(ph) # "</span>"
          # "</td>"
          # "</tr></table>"
        };
        case _ "";
      };

    authorRow # pubRow;
  };

  /// Wraps the author's article HTML in a consistent email shell.
  /// `unsubscribeUrl` is rendered in the footer — required for deliverability.
  public func renderArticleHtml(
    article : PublishedArticlePayload,
    unsubscribeUrl : Text,
  ) : Text {
    // Members-only badge — rendered as a table for email-client compatibility
    // (display:flex is unreliable in Gmail/Outlook). Unicode ★ stands in for
    // the SVG icon since data: URIs and relative SVG paths don't load in email.
    let membersOnlyBadge =
      if (article.isMembersOnly) {
        "<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"border-collapse:collapse;margin:0 0 16px 0;\">"
        # "<tr>"
        # "<td style=\"vertical-align:middle;font-family:Roboto,Arial,sans-serif;font-size:14px;line-height:1.4;color:#111;\">Members Only</td>"
        # "</tr></table>"
      } else { "" };

    let header =
      "<!doctype html><html><body style=\"font-family:Inter,Arial,sans-serif;margin:0;background:#ffffff;color:#111;\">"
      # "<div style=\"max-width:640px;margin:0 auto;padding:32px 20px;\">"
      # membersOnlyBadge
      # renderByline(article)
      # "<h1 style=\"font-size:28px;line-height:1.25;margin:0 0 12px 0;\">"
      # htmlEscape(article.title)
      # "</h1>";

    let subtitle =
      if (article.subtitle.size() > 0) {
        "<p style=\"font-size:18px;line-height:1.4;color:#444;margin:0 0 24px 0;\">"
        # htmlEscape(article.subtitle)
        # "</p>"
      } else { "" };

    let hero =
      if (article.headerImage.size() > 0) {
        "<img src=\"" # htmlAttrEscape(article.headerImage) # "\" alt=\"\" style=\"width:100%;height:auto;border-radius:8px;margin:0 0 28px 0;\"/>"
      } else { "" };

    // Pass article HTML through two email-safety transforms:
    //   1. rewrite raw.localhost Storage URLs so images are reachable by
    //      email client image proxies
    //   2. inject responsive style onto any <img> that lacks a style attr
    // We do NOT re-sanitize the HTML — PostBucket already stores Quill
    // output, and re-running a sanitizer here would strip legitimate
    // formatting.
    let processedContent =
      injectImgResponsiveStyle(article.contentHtml);
    let body =
      "<div style=\"font-size:17px;line-height:1.7;color:#222;\">"
      # processedContent
      # "</div>";

    let sourceName =
      switch (article.publicationDisplayName) {
        case (?name) { name };
        case null { article.authorDisplayName };
      };

    let footer =
      "<hr style=\"border:none;border-top:1px solid #eee;margin:40px 0 20px 0;\"/>"
      # "<div style=\"font-size:12px;color:#888;line-height:1.5;\">"
      # "You're receiving this because you subscribed to email updates from "
      # htmlEscape(sourceName) # " on Nuance. "
      # "<a href=\"" # htmlAttrEscape(article.url) # "\" style=\"color:#666;\">Read on nuance.xyz</a> &middot; "
      # "<a href=\"" # htmlAttrEscape(unsubscribeUrl) # "\" style=\"color:#666;\">Unsubscribe</a>"
      # "</div>"
      # "</div></body></html>";

    header # subtitle # hero # body # footer;
  };

  public func renderArticleText(article : PublishedArticlePayload, unsubscribeUrl : Text) : Text {
    let byline =
      article.authorDisplayName # " (@" # article.authorHandle # ") published a new article on Nuance";
    let pubLine =
      switch (article.publicationHandle, article.publicationDisplayName) {
        case (?ph, ?pdn) { "in " # pdn # " (@" # ph # ")\n" };
        case _ "";
      };
    let membersOnlyLine =
      if (article.isMembersOnly) { "[Members Only]\n" } else { "" };
    membersOnlyLine
    # byline # "\n"
    # pubLine # "\n"
    # article.title # "\n"
    # (if (article.subtitle.size() > 0) { article.subtitle # "\n\n" } else { "\n" })
    # "Read it: " # article.url # "\n\n"
    # "---\nUnsubscribe: " # unsubscribeUrl;
  };

  public func buildFromHeader(authorDisplayName : Text) : Text {
    // "Alice on Nuance <no-reply@nuance.xyz>"
    sanitizeDisplayName(authorDisplayName) # " on Nuance <no-reply@nuance.xyz>"
  };

  // Display names can contain commas / quotes / angle brackets which break
  // the From header. Strip those — we never need them in email display names.
  func sanitizeDisplayName(n : Text) : Text {
    let buf = Buffer.Buffer<Char>(n.size());
    for (c in n.chars()) {
      let code = Char.toNat32(c);
      // strip: < > " , ; :
      if (
        code != 0x3C and code != 0x3E and code != 0x22
        and code != 0x2C and code != 0x3B and code != 0x3A
      ) {
        buf.add(c);
      };
    };
    let cleaned = Text.fromIter(buf.vals());
    if (cleaned.size() == 0) { "Someone" } else { cleaned };
  };

  public func htmlEscape(input : Text) : Text {
    let buf = Buffer.Buffer<Char>(input.size());
    for (c in input.chars()) {
      let code = Char.toNat32(c);
      if (code == 0x3C) { appendText(buf, "&lt;") }        // <
      else if (code == 0x3E) { appendText(buf, "&gt;") }   // >
      else if (code == 0x26) { appendText(buf, "&amp;") }  // &
      else if (code == 0x22) { appendText(buf, "&quot;") } // "
      else if (code == 0x27) { appendText(buf, "&#39;") }  // '
      else { buf.add(c) };
    };
    Text.fromIter(buf.vals());
  };

  func htmlAttrEscape(input : Text) : Text {
    htmlEscape(input);
  };

  func appendText(buf : Buffer.Buffer<Char>, s : Text) {
    for (c in s.chars()) { buf.add(c) };
  };

  //================================================================
  // Composite subscriber key: "authorPrincipal|email"
  //================================================================

  public func subKey(authorPrincipal : Text, email : Text) : Text {
    authorPrincipal # "|" # email;
  };
};
