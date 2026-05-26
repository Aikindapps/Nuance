import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Char "mo:base/Char";
import Cycles "mo:base/ExperimentalCycles";
import Error "mo:base/Error";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Random "mo:base/Random";
import Result "mo:base/Result";
import Text "mo:base/Text";

// DecideID OIDC client. Encapsulates state storage, HTTPS outcalls to
// the DecideID token + userinfo endpoints, and minimal response parsing.
//
// Used by the User canister to replace the old verifiable-credentials
// JWT flow. The frontend now redirects users through DecideID's
// authorization endpoint and hands the resulting `code` + `state` back
// to the canister, which exchanges them for a userinfo response that
// confirms proof-of-humanity.
module {

  //================================================================
  // Constants
  //================================================================

  // Production endpoints from the DecideID OIDC config.
  public let DECIDEID_TOKEN_ENDPOINT : Text = "https://rlz47-aqaaa-aaaah-qdcra-cai.icp0.io/token";
  public let DECIDEID_USERINFO_ENDPOINT : Text = "https://rlz47-aqaaa-aaaah-qdcra-cai.icp0.io/userinfo?scope=poh";

  // OIDC `state` time-to-live. 10 minutes in ms.
  public let OIDC_SESSION_TTL_MS : Nat = 600_000;

  // Cap response bodies; userinfo + token payloads are tiny JSON.
  let MAX_RESPONSE_BYTES : Nat64 = 8_192;

  // Cycles per outcall. The token + userinfo bodies are tiny so this is
  // generous; matches the email-sender outcall budget.
  let OUTCALL_CYCLES : Nat = 50_000_000_000;

  //================================================================
  // Types
  //================================================================

  /// In-flight OIDC session, keyed by the random `state` value handed to
  /// the browser. Tracks who started the flow so the redeem call can
  /// only be completed by the same caller.
  public type OidcSession = {
    caller : Principal;
    redirectUri : Text;
    createdAtMs : Nat;
  };

  /// Minimal subset of the userinfo response we need from DecideID.
  /// `verified=true` is the only signal that gates Nuance verification.
  public type DecideIdPohUserInfo = {
    verified : Bool;
  };

  //================================================================
  // HTTPS outcall plumbing (IC management canister types)
  //================================================================

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

  //================================================================
  // State helpers
  //================================================================

  /// 32 hex chars from IC randomness. Used as the OIDC `state`.
  public func newState() : async Text {
    let entropy = await Random.blob();
    hexEncode(Blob.toArray(entropy), 16);
  };

  /// Remove any session whose age exceeds OIDC_SESSION_TTL_MS.
  /// Called opportunistically on each create/redeem so storage doesn't
  /// grow with abandoned flows.
  public func purgeExpiredSessions(
    sessions : HashMap.HashMap<Text, OidcSession>,
    nowMs : Nat,
  ) {
    let expired = Buffer.Buffer<Text>(0);
    for ((state, session) in sessions.entries()) {
      if (nowMs >= session.createdAtMs and nowMs - session.createdAtMs > OIDC_SESSION_TTL_MS) {
        expired.add(state);
      };
    };
    for (state in expired.vals()) {
      sessions.delete(state);
    };
  };

  //================================================================
  // Outcall + parsing
  //================================================================

  /// POST application/x-www-form-urlencoded body and return the raw
  /// response bytes. Caller is responsible for JSON parsing.
  public func httpPostForm(url : Text, body : Text) : async Result.Result<[Nat8], Text> {
    let bodyBytes = Blob.toArray(Text.encodeUtf8(body));
    let headers : [HttpHeader] = [
      { name = "Content-Type"; value = "application/x-www-form-urlencoded" },
      { name = "Accept"; value = "application/json" },
    ];
    let req : HttpRequestArgs = {
      url;
      max_response_bytes = ?MAX_RESPONSE_BYTES;
      headers;
      body = ?bodyBytes;
      method = #post;
      transform = null;
      // Form posts are state-changing — must be replicated.
      is_replicated = ?true;
    };
    try {
      Cycles.add<system>(OUTCALL_CYCLES);
      let resp = await ic.http_request(req);
      if (resp.status >= 200 and resp.status < 300) {
        #ok(resp.body);
      } else {
        #err(
          "DecideID HTTP " # Nat.toText(resp.status) # ": "
          # decodeUtf8OrEmpty(resp.body)
        );
      };
    } catch (e) {
      #err("HTTPS outcall failed: " # Error.message(e));
    };
  };

  /// GET with a Bearer access token, returning raw response bytes.
  public func httpGetJsonBearer(url : Text, accessToken : Text) : async Result.Result<[Nat8], Text> {
    let headers : [HttpHeader] = [
      { name = "Accept"; value = "application/json" },
      { name = "Authorization"; value = "Bearer " # accessToken },
    ];
    let req : HttpRequestArgs = {
      url;
      max_response_bytes = ?MAX_RESPONSE_BYTES;
      headers;
      body = null;
      method = #get;
      transform = null;
      is_replicated = ?true;
    };
    try {
      Cycles.add<system>(OUTCALL_CYCLES);
      let resp = await ic.http_request(req);
      if (resp.status >= 200 and resp.status < 300) {
        #ok(resp.body);
      } else {
        #err(
          "DecideID HTTP " # Nat.toText(resp.status) # ": "
          # decodeUtf8OrEmpty(resp.body)
        );
      };
    } catch (e) {
      #err("HTTPS outcall failed: " # Error.message(e));
    };
  };

  /// Build an x-www-form-urlencoded body from key/value pairs.
  public func formUrlEncode(pairs : [(Text, Text)]) : Text {
    let buf = Buffer.Buffer<Text>(pairs.size());
    for ((k, v) in pairs.vals()) {
      buf.add(urlEncodeQueryValue(k) # "=" # urlEncodeQueryValue(v));
    };
    Text.join("&", buf.vals());
  };

  /// Extract the value of a top-level JSON string field. Robust enough
  /// for the small, well-formed payloads DecideID returns (token +
  /// userinfo); not a general-purpose JSON parser. Returns null if the
  /// field isn't present.
  public func jsonGetString(json : Text, field : Text) : ?Text {
    let needle = "\"" # field # "\"";
    if (not Text.contains(json, #text needle)) return null;
    // Locate `"field"` then walk forward through `:` whitespace `"` to
    // the opening quote of the value.
    let parts = Iter.toArray(Text.tokens(json, #text needle));
    if (parts.size() < 2) return null;
    readQuotedAfterColon(parts[1]);
  };

  /// Look up a top-level boolean field. Accepts `true` / `false`
  /// possibly surrounded by whitespace.
  public func jsonGetBool(json : Text, field : Text) : ?Bool {
    let needle = "\"" # field # "\"";
    let parts = Iter.toArray(Text.tokens(json, #text needle));
    if (parts.size() < 2) return null;
    let tail = parts[1];
    readBoolAfterColon(tail);
  };

  //================================================================
  // Internal helpers
  //================================================================

  func decodeUtf8OrEmpty(bytes : [Nat8]) : Text {
    switch (Text.decodeUtf8(Blob.fromArray(bytes))) {
      case (?t) t;
      case null "<non-utf8 response>";
    };
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

  func hexNibble(n : Nat) : Char {
    let hex = "0123456789abcdef";
    Iter.toArray(hex.chars())[n];
  };

  /// Percent-encode per RFC3986 unreserved set. Safe for ASCII inputs;
  /// non-ASCII chars are encoded as their UTF-8 byte sequence.
  public func urlEncodeQueryValue(s : Text) : Text {
    let bytes = Blob.toArray(Text.encodeUtf8(s));
    let buf = Buffer.Buffer<Char>(bytes.size());
    for (byte in bytes.vals()) {
      let n = Nat8.toNat(byte);
      let unreserved =
        (n >= 0x30 and n <= 0x39) // 0-9
        or (n >= 0x41 and n <= 0x5A) // A-Z
        or (n >= 0x61 and n <= 0x7A) // a-z
        or n == 0x2D // -
        or n == 0x5F // _
        or n == 0x2E // .
        or n == 0x7E; // ~
      if (unreserved) {
        buf.add(Char.fromNat32(Nat32.fromNat(n)));
      } else {
        buf.add('%');
        buf.add(hexNibble(n / 16));
        buf.add(hexNibble(n % 16));
      };
    };
    Text.fromIter(buf.vals());
  };

  // Given the text immediately following a `"field"` match, read the
  // quoted string value of `"field": "..."` and return it. Returns null
  // if the structure doesn't match.
  func readQuotedAfterColon(tail : Text) : ?Text {
    let chars = Iter.toArray(tail.chars());
    var i = 0;
    // Skip whitespace and the colon.
    label skip while (i < chars.size()) {
      let c = chars[i];
      if (c == ' ' or c == '\t' or c == '\n' or c == '\r' or c == ':') {
        i += 1;
      } else {
        break skip;
      };
    };
    if (i >= chars.size() or chars[i] != '\"') return null;
    i += 1;
    let buf = Buffer.Buffer<Char>(32);
    var escaped = false;
    label read while (i < chars.size()) {
      let c = chars[i];
      if (escaped) {
        // Pass through escaped char as-is; we never embed control bytes
        // in the values we care about, so this round-trips fine.
        buf.add(c);
        escaped := false;
      } else if (c == '\\') {
        escaped := true;
      } else if (c == '\"') {
        break read;
      } else {
        buf.add(c);
      };
      i += 1;
    };
    ?Text.fromIter(buf.vals());
  };

  func readBoolAfterColon(tail : Text) : ?Bool {
    let chars = Iter.toArray(tail.chars());
    var i = 0;
    label skip while (i < chars.size()) {
      let c = chars[i];
      if (c == ' ' or c == '\t' or c == '\n' or c == '\r' or c == ':') {
        i += 1;
      } else {
        break skip;
      };
    };
    let remaining = chars.size() - i;
    if (remaining >= 4 and chars[i] == 't' and chars[i + 1] == 'r' and chars[i + 2] == 'u' and chars[i + 3] == 'e') {
      return ?true;
    };
    if (remaining >= 5 and chars[i] == 'f' and chars[i + 1] == 'a' and chars[i + 2] == 'l' and chars[i + 3] == 's' and chars[i + 4] == 'e') {
      return ?false;
    };
    null;
  };

  //================================================================
  // Redirect URI validation
  //================================================================

  /// Verify a redirect URI matches the expected Nuance asset-canister
  /// origin. Path component is required; query / fragment are rejected
  /// to keep the canonical form small and predictable.
  public func validateRedirectUri(redirectUri : Text, expectedOrigin : Text) : Result.Result<Text, Text> {
    if (not Text.startsWith(redirectUri, #text(expectedOrigin # "/"))) {
      return #err("Redirect URI does not match expected origin");
    };
    if (Text.contains(redirectUri, #char '?') or Text.contains(redirectUri, #char '#')) {
      return #err("Redirect URI must not contain query or fragment");
    };
    #ok(redirectUri);
  };
};