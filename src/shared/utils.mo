import Prim "mo:prim";
import Time "mo:base/Time";
import Bool "mo:base/Bool";
import Char "mo:base/Char";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import HashMap "mo:base/HashMap";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Nat32 "mo:base/Nat32";
import Nat8 "mo:base/Nat8";
import Principal "mo:base/Principal";
import Blob "mo:base/Blob";
import Option "mo:base/Option";
import Array "mo:base/Array";
import List "mo:base/List";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import SHA224 "./SHA224";
import CRC32 "./CRC32";
import Hex "./Hex";
import ENV "../shared/env";

module {

  private func trimPattern(char : Char) : Bool {
    Char.equal(' ', char) or Char.equal('\r', char) or Char.equal('\n', char);
  };

  // Gets the epoch time in milliseconds,
  // the best format for JavaScript dates.
  // Number.MAX_SAFE_INTEGER:
  //   9007199254740991
  // Time.now() precision exceeds this:
  //   1646708217959545468
  // We only need milliseconds though:
  //   1646708217959
  // This is still larger than an Nat32 max:
  //   4294967295
  // So it's a bigint in TypeScript, but can be used safely as follows:
  //   new Date(Number(post.created))
  public func epochTime() : Int {
    let ms : Int = Time.now() / 1000000;
    return ms;
  };

  public func safeGet<K, V>(hashMap : HashMap.HashMap<K, V>, key : K, defaultValue : V) : V {
    switch (hashMap.get(key)) {
      case null defaultValue;
      case (?value) value;
    };
  };

  public func isTextLengthValid(text : Text, maxLength : Nat) : Bool {
    let size = text.size();
    if (size > maxLength) {
      false;
    } else {
      true;
    };

  };

  public func isNatSizeValid(nat : Nat, maxSize : Nat) : Bool {

    if (nat > maxSize) {
      false;
    } else {
      true;
    };
  };

  public func isIntSizeValid(int : Int, maxSize : Int) : Bool {

    if (int > maxSize) {
      false;
    } else {
      true;
    };
  };

  public func isLinkValid(link : Text) : Bool {
    let lowerLink = lowerCase(link);

    if (
      Text.startsWith(lowerLink, #text "javascript:") or Text.contains(lowerLink, #text "<script>") or Text.contains(lowerLink, #text "</script>") or Text.contains(lowerLink, #text "data:") or Text.contains(lowerLink, #text "vbscript:") or Text.contains(lowerLink, #text "onerror") or Text.contains(lowerLink, #text "onload") or Text.contains(lowerLink, #text "eval(") or Text.contains(lowerLink, #text "document.cookie") or Text.contains(lowerLink, #text "window.location") or Text.contains(lowerLink, #text "%3Cscript%3E") or Text.contains(lowerLink, #text "%3C/script%3E")
    ) {
      return false;
    } else {
      if (Text.startsWith(lowerLink, #text "http://") or Text.startsWith(lowerLink, #text "https://")) {
        return true;
      } else {
        return false;
      };
    };
  };

  public func doesNotContainXss(text : Text) : Bool {
    let lowerText = lowerCase(text);

    if (
      Text.contains(lowerText, #text "<script>") or
      Text.contains(lowerText, #text "</script>") or
      Text.contains(lowerText, #text "data:") or
      Text.contains(lowerText, #text "vbscript:") or
      Text.contains(lowerText, #text "onerror") or
      Text.contains(lowerText, #text "onload") or
      Text.contains(lowerText, #text "eval(") or
      Text.contains(lowerText, #text "document.cookie") or
      Text.contains(lowerText, #text "window.location") or
      Text.contains(lowerText, #text "%3Cscript%3E") or
      Text.contains(lowerText, #text "%3C/script%3E") or
      Text.contains(lowerText, #text "<div") or
      Text.contains(lowerText, #text "<a") or
      Text.contains(lowerText, #text "<span") or
      Text.contains(lowerText, #text "<img") or
      Text.contains(lowerText, #text "%3C") or
      Text.contains(lowerText, #text "%3E") or
      Text.contains(lowerText, #text "%2F") or
      Text.contains(lowerText, #text "&#x3C") or
      Text.contains(lowerText, #text "&#x3E") or
      Text.contains(lowerText, #text "&#x2F") or
      Text.contains(lowerText, #text "&lt;") or
      Text.contains(lowerText, #text "&gt;") or
      Text.contains(lowerText, #text "&#60;") or
      Text.contains(lowerText, #text "&#62;")
    ) {
      return false;
    } else {
      return true;
    };
  };

  public func isTextEmpty(content : Text) : Bool {
    var counter = 0;
    for (char in content.chars()) {
      if (char != ' ') {
        counter += 1;
      };
    };
    return counter == 0;
  };

  public func trim(value : Text) : Text {
    Text.trim(value, #predicate(trimPattern));
  };

  public func lowerCase(value : Text) : Text {
    Text.map(value, Prim.charToLower);
  };

  public func upperCase(value : Text) : Text {
    Text.map(value, Prim.charToUpper);
  };

  public func compareIgnoreCase(x : Text, y : Text) : Bool {
    lowerCase(x) == lowerCase(y);
  };

  public func filterArrayByIndexes<T>(indexStart : Nat, indexEnd : Nat, array : [T]) : [T] {

    let size = array.size();

    if (indexStart > size) {
      return [];
    };

    var start = indexStart;
    let end = if (indexEnd > size) { size } else { indexEnd };

    var resultBuffer = Buffer.Buffer<T>(0);

    while (start < end) {
      resultBuffer.add(array[start]);
      start += 1;
    };

    Buffer.toArray(resultBuffer);
  };

  public func concatArrays<T>(a1 : [T], a2 : [T]) : [T] {
    var b : Buffer.Buffer<T> = Buffer.Buffer<T>(10);
    for (val in Iter.fromArray(a1)) {
      b.add(val);
    };
    for (val in Iter.fromArray(a2)) {
      b.add(val);
    };
    b.toArray();
  };

  // mimics JavaScript substring function
  public func subText(value : Text, indexStart : Nat, indexEnd : Nat) : Text {
    if (indexStart == 0 and indexEnd >= value.size()) {
      return value;
    };
    if (indexStart >= value.size()) {
      return "";
    };

    var result : Text = "";
    var i : Nat = 0;
    label l for (c in value.chars()) {
      if (i >= indexStart and i < indexEnd) {
        result := result # Char.toText(c);
      };
      if (i == indexEnd) {
        break l;
      };
      i += 1;
    };

    result;
  };

  // extracts unique words over 1 character in length from HTML,
  // removing any non alphabetic characters and converts the words to uppercase
  public func htmlToKeywords(html : Text) : [Text] {
    // prevent underflow error
    var l : Nat = html.size();
    if (l == 0) {
      return [];
    };

    // used only for creating a unique list of words
    // a Set data structure would probably be better, but no time to learn it rn
    var words = HashMap.HashMap<Text, ?Text>(1000000, Text.equal, Text.hash);
    var w = "";
    var ws = false;
    let cs = html.chars();
    var i : Nat = 0;
    let lastIndex : Nat = l - 1;
    var inside = false;
    var inside_ce = false;
    var endOfWord = false;

    while (i < l) {
      switch (cs.next()) {
        case null ();
        case (?c) {
          if (c == '<') {
            endOfWord := true;
            inside := true;
          } else if (c == '>') {
            inside := false;
          } else if (c == '&') {
            endOfWord := true;
            inside_ce := true;
          } else if (c == ';') {
            inside_ce := false;
          };

          if (endOfWord) {
            w := trim(w);
            if (w.size() > 1) {
              w := upperCase(w);
              words.put(w, null);
            };
            w := "";
          } else if (not inside and not inside_ce) {
            if (Char.isWhitespace(c) and w.size() > 0) {
              w := trim(w);
              if (w.size() > 1) {
                w := upperCase(w);
                words.put(w, null);
              };
              w := "";
            } else if (Char.isAlphabetic(c)) {
              w #= Prim.charToText(c);
            };
          };

          if (i == lastIndex) {
            w := trim(w);
            if (w.size() > 1) {
              w := upperCase(w);
              words.put(w, null);
            };
            w := "";
          };
          endOfWord := false;
        };
      };
      i += 1;
    };

    Iter.toArray(words.keys());
  };

  // removes all non-alphanumeric characters except for hyphens
  // replaces all consecutive whitespace and hyphens with a single hyphen
  public func textToUrlSegment(html : Text) : Text {
    var seg = "";
    let cs = html.chars();
    var prevHyphen : Bool = false;
    var l : Nat = html.size();
    var i : Nat = 0;

    while (i < l) {
      switch (cs.next()) {
        case null ();
        case (?c) {
          if (Char.isAlphabetic(c) or Char.isDigit(c)) {
            seg #= lowerCase(Prim.charToText(c));
            prevHyphen := false;
          } else if (c == '-' or Char.isWhitespace(c)) {
            if (not prevHyphen) {
              seg #= "-";
              prevHyphen := true;
            };
          };
        };
      };
      i += 1;
    };

    seg;
  };
  //gets Nat from Text
  public func textToNat(txt : Text) : Nat {
    assert (txt.size() > 0);
    let chars = txt.chars();

    var num : Nat = 0;
    for (v in chars) {
      let charToNum = Nat32.toNat(Char.toNat32(v) -48);
      assert (charToNum >= 0 and charToNum <= 9);
      num := num * 10 + charToNum;
    };

    num;
  };
  public func arrayContains(array : [Text], element : Text) : Bool {
    for (el in array.vals()) {
      if (Text.equal(el, element)) {
        return true;
      };
    };
    return false;
  };
  public func trim_category_name(phrase : Text) : Text {
    let lowerCase = Text.map(phrase, Prim.charToLower);
    return Text.map(
      lowerCase,
      func(char : Char) : Char {
        if (Char.equal(Char.fromNat32(32), char)) {
          return Char.fromNat32(45);
        } else {
          return char;
        };
      },
    );
  };

  public func calculate_total_word_count(body : Text) : Nat {
    var i = 0;
    let newLine = "\n";
    let space = Char.fromNat32(32);
    let lessThan = Char.fromNat32(60);
    let greaterThan = Char.fromNat32(62);
    let charsBuffer = Buffer.Buffer<Char>(0);
    for (body_iter in body.chars()) {
      charsBuffer.add(body_iter);
    };
    let charSize = charsBuffer.size();
    let elementsPositionsBuffer = Buffer.Buffer<({ startingPoint : Nat; endingPoint : Nat })>(0);
    let values = Buffer.Buffer<Text>(0);
    var totalWordCount = 0;

    switch (charsBuffer.getOpt(0)) {
      case (null) return 0;
      case (?firstEl) {
        if (not Char.equal(lessThan, firstEl)) {
          return 0;
        };
      };
    };

    while (i +1 < charSize) {
      if (Char.equal(charsBuffer.get(i), greaterThan) and not Char.equal(charsBuffer.get(i +1), lessThan)) {
        i := i +1;
        let startingIndex = i;
        while (not Char.equal(charsBuffer.get(i), lessThan)) {
          i := i +1;
        };
        let endIndex = i;
        elementsPositionsBuffer.add({
          startingPoint = startingIndex;
          endingPoint = endIndex;
        });
      } else {
        i := i +1;
      };
    };

    for (elementPositionObject in elementsPositionsBuffer.vals()) {
      var start = elementPositionObject.startingPoint;
      let end = elementPositionObject.endingPoint;
      var value = "";
      while (start < end) {
        value := value # Char.toText(charsBuffer.get(start));
        start := start + 1;
      };
      values.add(value);
    };

    for (value in values.vals()) {
      var iter = 0;
      let valueCharsBuffer = Buffer.Buffer<Char>(0);
      for (value_iter in value.chars()) {
        valueCharsBuffer.add(value_iter);
      };
      let valueLength = valueCharsBuffer.size();
      while (iter +1 < valueLength) {
        let char = valueCharsBuffer.get(iter);
        let nextChar = valueCharsBuffer.get(iter +1);
        if (Char.equal(space, char)) {
          totalWordCount += 1;
          if (Char.equal(nextChar, space)) {
            totalWordCount -= 1;
          };
        } else if (Text.equal(newLine, Char.toText(char) #Char.toText(nextChar))) {
          totalWordCount += 1;
          iter += 1;
        };
        iter += 1;
      };
      totalWordCount += 1;
    };
    return totalWordCount;
  };

  public func principalToAID(principal : Text) : Text {
    return fromText(principal, null);
  };
  public func fromText(t : Text, sa : ?[Nat8]) : Text {
    return fromPrincipal(Principal.fromText(t), sa);
  };
  public func fromPrincipal(p : Principal, sa : ?[Nat8]) : Text {
    return fromBlob(Principal.toBlob(p), sa);
  };
  public func fromBlob(b : Blob, sa : ?[Nat8]) : Text {
    return fromBytes(Blob.toArray(b), sa);
  };
  public func fromBytes(data : [Nat8], sa : ?[Nat8]) : Text {
    let SUBACCOUNT_ZERO : [Nat8] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let ads : [Nat8] = [10, 97, 99, 99, 111, 117, 110, 116, 45, 105, 100];
    var _sa : [Nat8] = SUBACCOUNT_ZERO;
    if (Option.isSome(sa)) {
      _sa := Option.unwrap(sa);
    };
    var hash : [Nat8] = SHA224.sha224(Array.append(Array.append(ads, data), _sa));
    var crc : [Nat8] = CRC32.crc32(hash);
    return Hex.encode(Array.append(crc, hash));
  };
  public func arraySize<T>(array : [T]) : Nat {
    List.size(List.fromArray(array));
  };

  let MetricsCanisterId : Text = ENV.METRICS_CANISTER_ID;
  let MetricsActor = actor (MetricsCanisterId) : actor {
    logCommand : (commandName : Text, operator : Text) -> async Result.Result<(), Text>;
  };

  public func logMetrics(commandName : Text, operator : Text) : async Result.Result<(), Text> {
    await MetricsActor.logCommand(commandName, operator);
  };

  public func natToSubAccount(n : Nat) : [Nat8] {
    let n_byte = func(i : Nat) : Nat8 {
      assert (i < 32);
      let shift : Nat = 8 * (32 - 1 - i);
      Nat8.fromIntWrap(n / 2 ** shift);
    };
    Array.tabulate<Nat8>(32, n_byte);
  };

};
