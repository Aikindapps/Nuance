import List "mo:base/List";
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
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import PublisherTypes "../Publisher/types";
import PostCoreTypes "../Publisher/types_post_core";
import Result "mo:base/Result";
import ENV "../shared/env";
import NotificationTypes "../../../src/Notifications/types";

module {
  type Post = PostCoreTypes.Post;
  type MetadataContainer = PublisherTypes.MetadataContainer;
  type MetadataValue = PublisherTypes.MetadataValue;

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

  public func arraySize<T>(array : [T]) : Nat {
    List.size(List.fromArray(array));
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

  public func concatArrays<T>(a1 : [T], a2 : [T]) : [T] {
    var b : Buffer.Buffer<T> = Buffer.Buffer<T>(10);
    for (val in Iter.fromArray(a1)) {
      b.add(val);
    };
    for (val in Iter.fromArray(a2)) {
      b.add(val);
    };
    Buffer.toArray(b);
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

  public func populateMetadataWithAccessKeyIndex(container : ?MetadataContainer, index : Nat) : ?MetadataContainer {
    switch (container) {
      case (?metadataContainer) {
        var metadataValuesBuffer = Buffer.Buffer<MetadataValue>(0);
        metadataValuesBuffer.add(("Access key index", #text(Nat.toText(index))));
        switch (metadataContainer) {
          case (#data(values)) {
            for (value in values.vals()) {
              metadataValuesBuffer.add(value);
            };
          };
          case (_) {};
        };

        return ? #data(Buffer.toArray(metadataValuesBuffer));

      };
      case (_) { return null };
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

  public func isLinkValid(link : Text) : Bool {
    let lowerLink = lowerCase(link);
    if (link == "") {
      return true;
    };
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

  public func buildSvg(post : Post, headerImage : Text) : Text {
    let handle = if (post.isPublication) { post.creator } else { post.handle };
    let before_texts = "<svg width='659' height='709' viewBox='0 0 659 709' fill='none' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>  <rect x='537' y='590' width='120' height='117' stroke='url(#paint0_linear_3082_8737)' stroke-width='4'/>  <rect x='546' y='490' width='78' height='76' stroke='url(#paint1_linear_3082_8737)' stroke-width='4'/>  <rect x='439' y='617' width='53' height='52' stroke='url(#paint2_linear_3082_8737)' stroke-width='4'/>  <g filter='url(#filter0_f_3082_8737)'>  <path d='M12.6851 36.6133L39.8735 12.4457C43.2327 9.4598 48.3918 9.8263 51.2952 13.2571L584.424 643.229C587.773 647.186 586.531 653.234 581.895 655.553L542.689 675.155C541.578 675.711 540.353 676 539.111 676H18C13.5817 676 10 672.418 10 668V42.5925C10 40.3074 10.9772 38.1314 12.6851 36.6133Z' fill='url(#paint3_linear_3082_8737)'/>  </g>  <g filter='url(#filter1_d_3082_8737)'>  <rect x='54.8281' y='14.7103' width='534.952' height='630.29' fill='white'/>  </g>  <g filter='url(#filter2_d_3082_8737)'>  <rect x='50.4141' y='10.2966' width='534.952' height='630.29' fill='white'/>  </g>  <g filter='url(#filter3_d_3082_8737)'>  <rect x='46' y='5' width='534.952' height='630.29' fill='#151451'/>  </g>  <path d='M46 11C46 7.68628 48.6863 5 52 5H581V334H46V11Z' fill='url(#pattern0)'/>  <rect x='571' y='288' width='10' height='140' fill='url(#paint4_linear_3082_8737)'/>      <rect x='79' y='305.138' width='29.131' height='29.131' fill='#151451'/>  <rect x='86.2002' y='312.972' width='14.5655' height='1.82069' fill='#D9D9D9'/>  <rect x='86.2002' y='318.434' width='14.5655' height='1.82069' fill='#D9D9D9'/>  <rect x='86.2002' y='323.897' width='7.28276' height='1.82069' fill='#D9D9D9'/>  <path d='M581 635.405C406.5 635.405 60.9419 635.5 51.5005 635.5C41.6582 635.5 46.5 648 59.2338 648H590' stroke='#151451'/>  <g style='mix-blend-mode:multiply'>  <rect x='46' y='4' width='22' height='631' fill='url(#paint5_linear_3082_8737)'/>  </g>  <path opacity='0.4' d='M100 4H551L492.29 312L444.827 561L100 633V4Z' fill='url(#paint6_linear_3082_8737)'/>";
    let after_texts = "<defs>  <filter id='filter0_f_3082_8737' x='0' y='0.424896' width='596.318' height='685.575' filterUnits='userSpaceOnUse' color-interpolation-filters='sRGB'>  <feFlood flood-opacity='0' result='BackgroundImageFix'/>  <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape'/>  <feGaussianBlur stdDeviation='5' result='effect1_foregroundBlur_3082_8737'/>  </filter>  <filter id='filter1_d_3082_8737' x='51.2971' y='14.7103' width='542.014' height='637.352' filterUnits='userSpaceOnUse' color-interpolation-filters='sRGB'>  <feFlood flood-opacity='0' result='BackgroundImageFix'/>  <feColorMatrix in='SourceAlpha' type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0' result='hardAlpha'/>  <feOffset dy='3.53103'/>  <feGaussianBlur stdDeviation='1.76552'/>  <feComposite in2='hardAlpha' operator='out'/>  <feColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0'/>  <feBlend mode='normal' in2='BackgroundImageFix' result='effect1_dropShadow_3082_8737'/>  <feBlend mode='normal' in='SourceGraphic' in2='effect1_dropShadow_3082_8737' result='shape'/>  </filter>  <filter id='filter2_d_3082_8737' x='46.883' y='10.2966' width='542.014' height='637.352' filterUnits='userSpaceOnUse' color-interpolation-filters='sRGB'>  <feFlood flood-opacity='0' result='BackgroundImageFix'/>  <feColorMatrix in='SourceAlpha' type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0' result='hardAlpha'/>  <feOffset dy='3.53103'/>  <feGaussianBlur stdDeviation='1.76552'/>  <feComposite in2='hardAlpha' operator='out'/>  <feColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0'/>  <feBlend mode='normal' in2='BackgroundImageFix' result='effect1_dropShadow_3082_8737'/>  <feBlend mode='normal' in='SourceGraphic' in2='effect1_dropShadow_3082_8737' result='shape'/>  </filter>  <filter id='filter3_d_3082_8737' x='42.469' y='5' width='542.014' height='637.352' filterUnits='userSpaceOnUse' color-interpolation-filters='sRGB'>  <feFlood flood-opacity='0' result='BackgroundImageFix'/>  <feColorMatrix in='SourceAlpha' type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0' result='hardAlpha'/>  <feOffset dy='3.53103'/>  <feGaussianBlur stdDeviation='1.76552'/>  <feComposite in2='hardAlpha' operator='out'/>  <feColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0'/>  <feBlend mode='normal' in2='BackgroundImageFix' result='effect1_dropShadow_3082_8737'/>  <feBlend mode='normal' in='SourceGraphic' in2='effect1_dropShadow_3082_8737' result='shape'/>  </filter>  <pattern id='pattern0' patternContentUnits='objectBoundingBox' width='1' height='1'>  <use xlink:href='#image0_3082_8737' transform='matrix(0.00191574 0 0 0.00311526 -0.0862171 0)'/>  </pattern>  <linearGradient id='paint0_linear_3082_8737' x1='597' y1='588' x2='597' y2='709' gradientUnits='userSpaceOnUse'>  <stop stop-color='#25F68D'/>  <stop offset='1' stop-color='#1BC0F2'/>  </linearGradient>  <linearGradient id='paint1_linear_3082_8737' x1='585' y1='488' x2='585' y2='568' gradientUnits='userSpaceOnUse'>  <stop stop-color='#25F68D'/>  <stop offset='1' stop-color='#1BC0F2'/>  </linearGradient>  <linearGradient id='paint2_linear_3082_8737' x1='465.5' y1='615' x2='465.5' y2='671' gradientUnits='userSpaceOnUse'>  <stop stop-color='#25F68D'/>  <stop offset='1' stop-color='#1BC0F2'/>  </linearGradient>  <linearGradient id='paint3_linear_3082_8737' x1='409' y1='273' x2='105' y2='676' gradientUnits='userSpaceOnUse'>  <stop stop-color='#D9D9D9'/>  <stop offset='1' stop-color='#CDCDCD' stop-opacity='0.24'/>  </linearGradient>  <linearGradient id='paint4_linear_3082_8737' x1='576' y1='288' x2='576' y2='428' gradientUnits='userSpaceOnUse'>  <stop stop-color='#25F68D'/>  <stop offset='1' stop-color='#1BC0F2'/>  </linearGradient>  <linearGradient id='paint5_linear_3082_8737' x1='68' y1='219' x2='38.6667' y2='219' gradientUnits='userSpaceOnUse'>  <stop stop-color='#D9D9D9' stop-opacity='0'/>  <stop offset='0.489583' stop-color='#C6C6C6'/>  <stop offset='1' stop-color='#D9D9D9' stop-opacity='0'/>  </linearGradient>  <linearGradient id='paint6_linear_3082_8737' x1='522.408' y1='-206.236' x2='54.9074' y2='157.836' gradientUnits='userSpaceOnUse'>  <stop stop-color='white'/>  <stop offset='0.515625' stop-color='white' stop-opacity='0.671875'/>  <stop offset='1' stop-color='white' stop-opacity='0'/>  </linearGradient>  <image id='image0_3082_8737' width='612' height='321' xlink:href='"
    # headerImage # "'/>  </defs>  </svg>";
    let text_svg_elements = getTitleSvgElement(post.title) # getSubtitleAndHandleSvgElements(post.subtitle, handle);
    return before_texts # text_svg_elements # after_texts;
  };

  private func getTitleSvgElement(title : Text) : Text {
    if (title.size() <= 35) {
      return "<text opacity='0.9' x='80' y='380' font-size='28' font-family='Georgia' font-style='normal' font-weight='400' line-height='30px' fill='#ffffff'>" # title # "</text>";
    } else {
      let words = Text.split(title, #text(" "));
      var first_line = "";
      var second_line = "";
      var is_second_line_allowed = true;
      var is_first_line_allowed = true;
      for (word in words) {
        if (first_line.size() + word.size() < 34 and is_first_line_allowed) {
          first_line := first_line # " " # word;
        } else {
          is_first_line_allowed := false;
          if (second_line.size() + word.size() < 31 and is_second_line_allowed) {
            second_line := second_line # " " # word;
          } else if (is_second_line_allowed) {
            second_line := second_line # "...";
            is_second_line_allowed := false;
          };
        };
      };
      return "<text opacity='0.9' x='80' y='380' font-size='28' font-family='Georgia' font-style='normal' font-weight='400' line-height='30px' fill='#ffffff'>" # first_line
      # "</text> <text opacity='0.9' x='80' y='415' font-size='28' font-family='Georgia' font-style='normal' font-weight='400' line-height='30px' fill='#ffffff'>" # second_line # "</text>";
    };
  };
  private func getSubtitleAndHandleSvgElements(subtitle : Text, handle : Text) : Text {
    if (subtitle.size() <= 55) {
      return "<text opacity='0.9' x='80' y='470' font-size='19.4' font-family='Georgia' font-style='normal' font-weight='400' line-height='28px' fill='#B2B2B2'>" # subtitle # "</text>" #
      "<text x='80' y='612' font-size='21.4' font-family='Arial' font-style='normal' font-weight='700' line-height='21px' fill='white'>@" # handle # "</text>";
    } else {
      let words = Text.split(subtitle, #text(" "));
      var first_line = "";
      var second_line = "";
      var third_line = "";
      var is_second_line_allowed = true;
      var is_first_line_allowed = true;
      var is_third_line_allowed = true;
      for (word in words) {
        if (first_line.size() + word.size() < 55 and is_first_line_allowed) {
          first_line := first_line # " " # word;
        } else {
          is_first_line_allowed := false;
          if (second_line.size() + word.size() < 55 and is_second_line_allowed) {
            second_line := second_line # " " # word;
          } else {
            is_second_line_allowed := false;
            if (third_line.size() + word.size() < 52 and is_third_line_allowed) {
              third_line := third_line # " " # word;
            } else if (is_third_line_allowed) {
              third_line := third_line # "...";
              is_third_line_allowed := false;
            };
          };
        };
      };

      return "<text opacity='0.9' x='80' y='470' font-size='19.4' font-family='Georgia' font-style='normal' font-weight='400' line-height='28px' fill='#B2B2B2'>" # first_line
      # "</text> <text opacity='0.9' x='80' y='495' font-size='19.4' font-family='Georgia' font-style='normal' font-weight='400' line-height='28px' fill='#B2B2B2'>" # second_line #
      "</text> <text opacity='0.9' x='80' y='520' font-size='19.4' font-family='Georgia' font-style='normal' font-weight='400' line-height='28px' fill='#B2B2B2'>" # third_line # "</text>" #
      "<text x='80' y='612' font-size='21.4' font-family='Arial' font-style='normal' font-weight='700' line-height='21px' fill='white'>@" # handle # "</text>"

    };
  };

  let MetricsCanisterId : Text = ENV.METRICS_CANISTER_ID;
  let MetricsActor = actor (MetricsCanisterId) : actor {
    logCommand : (commandName : Text, operator : Text) -> async Result.Result<(), Text>;
  };

  public func logMetrics(commandName : Text, operator : Text) : async Result.Result<(), Text> {
    await MetricsActor.logCommand(commandName, operator);
  };

  //notification
  let NotificationCanisterId : Text = ENV.NOTIFICATIONS_CANISTER_ID;
  type NotificationType = NotificationTypes.NotificationType;
  type NotificationContent = NotificationTypes.NotificationContent;

  let NotificationActor = actor (NotificationCanisterId) : actor {
    createNotification : (notificationType : NotificationType, content : NotificationContent) -> async Result.Result<(), Text>;
  };

  public func createNotification(notificationType : NotificationType, content : NotificationContent) : async Result.Result<(), Text> {
    await NotificationActor.createNotification(notificationType, content);
  };


};
