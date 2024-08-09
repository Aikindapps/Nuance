import Debug "mo:base/Debug";
import Bool "mo:base/Bool";
import Char "mo:base/Char";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Prelude "mo:base/Prelude";
import Canistergeek "../canistergeek/canistergeek";
import U "../shared/utils";
import Types "./types";
import Cycles "mo:base/ExperimentalCycles";
import Prim "mo:prim";
import Versions "../shared/versions";
import ENV "../shared/env";
import CanisterDeclarations "../shared/CanisterDeclarations";

actor PostIndex {
  let Unauthorized = "Unauthorized";
  let PostIdRequired = "PostIdRequired";
  let canistergeekMonitor = Canistergeek.Monitor();

  var initCapacity = 0;
  type List<T> = List.List<T>;

  //See: https://forum.dfinity.org/t/motoko-multiple-canister-imports-compile-error/10491
  type IndexPostResult = Result.Result<Text, Text>;
  type ClearIndexResult = Result.Result<Nat, Text>;
  type IndexPostModel = Types.IndexPostModel;

  stable var index : [(Text, [Text])] = [];
  stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
  func isEq(x : Text, y : Text) : Bool { x == y };

  var hashMap = HashMap.HashMap<Text, [Text]>(initCapacity, isEq, Text.hash);

  //SNS
  public type Validate = {
    #Ok : Text;
    #Err : Text;
  };

  public shared ({ caller }) func validate(input : Any) : async Validate {
    if (isAdmin(caller)) {
      return #Ok("success");
    } else {

      return #Err("Cannot use this method anonymously.");
    };
  };
  //#region Security Management

  stable var admins : List.List<Text> = List.nil<Text>();
  stable var trustedCanisters : List.List<Text> = List.nil<Text>();
  stable var platformOperators : List.List<Text> = List.nil<Text>();
  stable var cgusers : List.List<Text> = List.nil<Text>();

  private func isAnonymous(caller : Principal) : Bool {
    Principal.equal(caller, Principal.fromText("2vxsx-fae"));
  };

  private func isAdmin(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    U.arrayContains(ENV.POSTINDEX_CANISTER_ADMINS, c);
  };

  public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    #ok(ENV.POSTINDEX_CANISTER_ADMINS);
  };

  private func isPlatformOperator(caller : Principal) : Bool {
    ENV.isPlatformOperator(caller)
  };

  public shared query func getPlatformOperators() : async List.List<Text> {
    List.fromArray(ENV.PLATFORM_OPERATORS);
  };

  //These methods are deprecated. Admins are handled by env.mo file
  public shared ({ caller }) func registerAdmin(id : Text) : async Result.Result<(), Text> {
    #err("Deprecated function")
  };

  public shared ({ caller }) func unregisterAdmin(id : Text) : async Result.Result<(), Text> {
    #err("Deprecated function")
  };

  //platform operators, similar to admins but restricted to a few functions -> deprecated. Use env.mo file
  public shared ({ caller }) func registerPlatformOperator(id : Text) : async Result.Result<(), Text> {
    #err("Deprecated function.")
  };

  public shared ({ caller }) func unregisterPlatformOperator(id : Text) : async Result.Result<(), Text> {
    #err("Deprecated function.")
  };

  private func isTrustedCanister(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    var exists = List.find<Text>(trustedCanisters, func(val : Text) : Bool { val == c });
    exists != null;
  };


  public shared query ({ caller }) func getCgUsers() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    #ok(List.toArray(cgusers));
  };

  func isCgUser(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    var exists = List.find<Text>(cgusers, func(val : Text) : Bool { val == c });
    exists != null;
  };

  public shared ({ caller }) func registerCgUser(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    canistergeekMonitor.collectMetrics();
    if (List.size<Text>(cgusers) > 0 and not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    if (not List.some<Text>(cgusers, func(val : Text) : Bool { val == id })) {
      cgusers := List.push<Text>(id, cgusers);
    };

    #ok();
  };

  public shared ({ caller }) func unregisterCgUser(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    cgusers := List.filter<Text>(cgusers, func(val : Text) : Bool { val != id });
    #ok();
  };

  //Registers a trusted canister
  public shared ({ caller }) func registerCanister(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    canistergeekMonitor.collectMetrics();
    if (not isPlatformOperator(caller) and not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    if (not List.some<Text>(trustedCanisters, func(val : Text) : Bool { val == id })) {
      trustedCanisters := List.push<Text>(id, trustedCanisters);
    };

    #ok();
  };

  public shared ({ caller }) func unregisterCanister(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    trustedCanisters := List.filter<Text>(trustedCanisters, func(val : Text) : Bool { val != id });
    #ok();
  };

  public shared query ({ caller }) func getTrustedCanisters() : async Result.Result<[Text], Text> {
    #ok(List.toArray(trustedCanisters));
  };

  //#endregion

  //#region Post Index Management

  private func arrayContains(x : Text, xs : [Text]) : Bool {
    func isX(y : Text) : Bool { x == y };
    switch (Array.find<Text>(xs, isX)) {
      case (null) { false };
      case (_) { true };
    };
  };

  private func isIndexed(x : Text, xs : List.List<Text>) : Bool {
    func isX(y : Text) : Bool { x == y };
    switch (List.find<Text>(xs, isX)) {
      case (null) { false };
      case (_) { true };
    };
  };

  public shared query func indexSize() : async Nat {
    return hashMap.size();
  };

  public shared ({ caller }) func indexPosts(indexPostModels : [IndexPostModel]) : async [IndexPostResult] {
    if (isAnonymous(caller)) {
      return [#err("Cannot use this method anonymously.")];
    };

    if (not isThereEnoughMemoryPrivate()) {
      return [#err("Canister reached the maximum memory threshold. Please try again later.")];
    };

    canistergeekMonitor.collectMetrics();
    Debug.print("PostIndex->IndexPosts");

    if (not isAdmin(caller) and not isTrustedCanister(caller)) {
      return [#err("PostIndex->IndexPost Unauthorized")];
    };

    var resultsBuffer = Buffer.Buffer<IndexPostResult>(0);

    for (indexModel in indexPostModels.vals()) {
      let postId = indexModel.postId;
      let newTags = indexModel.newTags;
      let oldTags = indexModel.oldTags;
      let newHtml = indexModel.newHtml;
      let oldHtml = indexModel.oldHtml;
      if (postId == "") {
        resultsBuffer.add(#err(PostIdRequired));
      } else {
        let newTagNames : [Text] = Array.map<Text, Text>(
          newTags,
          func(newTagName) {
            "#" # U.upperCase(newTagName);
          },
        );
        let oldTagNames : [Text] = Array.map<Text, Text>(
          oldTags,
          func(oldTagName) {
            "#" # U.upperCase(oldTagName);
          },
        );

        var newWords = U.concatArrays(U.htmlToKeywords(newHtml), newTagNames);
        var oldWords = U.concatArrays(U.htmlToKeywords(oldHtml), oldTagNames);

        // add postId to the array of post ids associated with each word
        // key: word, value: [post ids]
        for (word in Iter.fromArray(newWords)) {
          var indexedPosts = U.safeGet(hashMap, word, []);
          var indexed : List.List<Text> = List.fromArray<Text>(indexedPosts);

          if (word.size() > 0 and not isIndexed(postId, indexed)) {
            indexed := List.push<Text>(postId, indexed);
            hashMap.put(word, List.toArray<Text>(indexed));
            Debug.print("PostIndex->IndexPost Indexing word: '" # word # "' for postId: " # postId);
          };
        };

        // remove words from the old text that is not in the new text
        for (word in Iter.fromArray(oldWords)) {
          if (word.size() > 0 and not arrayContains(word, newWords)) {
            var indexedPosts = U.safeGet(hashMap, word, []);

            if (isIndexed(postId, List.fromArray<Text>(indexedPosts))) {
              hashMap.put(word, Array.filter<Text>(indexedPosts, func isEq(x : Text) : Bool { postId != x }));
              Debug.print("PostIndex->IndexPost Removing word: " # word # " for postId: " # postId);
            };
          };
        };

        let result = resultsBuffer.add(#ok(postId));
      };

    };

    Buffer.toArray(resultsBuffer);
  };

  public shared ({ caller }) func indexPost(postId : Text, oldHtml : Text, newHtml : Text, oldTags : [Text], newTags : [Text]) : async IndexPostResult {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    canistergeekMonitor.collectMetrics();
    Debug.print("PostIndex->IndexPost PostId: " # postId);

    if (not isAdmin(caller) and not isTrustedCanister(caller)) {
      return #err("PostIndex->IndexPost Unauthorized");
    };

    if (postId == "") {
      return #err(PostIdRequired);
    };

    let newTagNames : [Text] = Array.map<Text, Text>(
      newTags,
      func(newTagName) {
        "#" # U.upperCase(newTagName);
      },
    );
    let oldTagNames : [Text] = Array.map<Text, Text>(
      oldTags,
      func(oldTagName) {
        "#" # U.upperCase(oldTagName);
      },
    );

    var newWords = U.concatArrays(U.htmlToKeywords(newHtml), newTagNames);
    var oldWords = U.concatArrays(U.htmlToKeywords(oldHtml), oldTagNames);

    // add postId to the array of post ids associated with each word
    // key: word, value: [post ids]
    for (word in Iter.fromArray(newWords)) {
      var indexedPosts = U.safeGet(hashMap, word, []);
      var indexed : List.List<Text> = List.fromArray<Text>(indexedPosts);

      if (word.size() > 0 and not isIndexed(postId, indexed)) {
        indexed := List.push<Text>(postId, indexed);
        hashMap.put(word, List.toArray<Text>(indexed));
        Debug.print("PostIndex->IndexPost Indexing word: '" # word # "' for postId: " # postId);
      };
    };

    // remove words from the old text that is not in the new text
    for (word in Iter.fromArray(oldWords)) {
      if (word.size() > 0 and not arrayContains(word, newWords)) {
        var indexedPosts = U.safeGet(hashMap, word, []);

        if (isIndexed(postId, List.fromArray<Text>(indexedPosts))) {
          hashMap.put(word, Array.filter<Text>(indexedPosts, func isEq(x : Text) : Bool { postId != x }));
          Debug.print("PostIndex->IndexPost Removing word: " # word # " for postId: " # postId);
        };
      };
    };

    #ok(postId);
  };

  public shared query ({ caller }) func search(searchTerm : Text, isTagSearch : Bool, indexFrom : Nat32, indexTo : Nat32) : async Types.SearchResultData {
    Debug.print("PostIndex->search");
    Debug.print("searchTerm: " # searchTerm # ", isTagSearch: " # Bool.toText(isTagSearch) # ", indexFrom: " # Nat32.toText(indexFrom) # ", indexTo: " # Nat32.toText(indexTo));
    //validate input
    if (not U.isTextLengthValid(searchTerm, 1000)) {
      return {
        totalCount = "Search term is too long";
        postIds = [];
      };
    };
    if (searchTerm == "") {
      return {
        totalCount = "0";
        postIds = [];
      };
    };

    // get list of post ids from each word searched and combine them into a single array
    var results = HashMap.HashMap<Text, ?Text>(1000000, Text.equal, Text.hash);

    var keyWords : [Text] = [];
    if (isTagSearch) {
      keyWords := ["#" # U.upperCase(U.trim(searchTerm))];
    } else {
      keyWords := U.htmlToKeywords(searchTerm);
    };

    for (word in Iter.fromArray(keyWords)) {
      Debug.print("word: " # word);
      let indexedPosts : [Text] = U.safeGet(hashMap, word, []);
      for (postId in Iter.fromArray(indexedPosts)) {
        Debug.print("  postId: " # postId);
        results.put(postId, null);
      };
    };

    let postIds = Iter.toArray(results.keys());

    // select a "page" from the results (for paging search results in the UI)
    var postIdsBuffer : Buffer.Buffer<Text> = Buffer.Buffer<Text>(10);

    // prevent underflow error
    let totalCount : Nat = postIds.size();
    if (totalCount == 0) {
      return {
        totalCount = "0";
        postIds = [];
      };
    };

    let lastIndex : Nat = totalCount - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return {
        totalCount = "0";
        postIds = [];
      };
    };

    var indexEnd = Nat32.toNat(indexTo);
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };

    Debug.print("Original search results count: " # Nat.toText(postIds.size()));

    for (i in Iter.range(indexStart, indexEnd)) {
      Debug.print("Buffer Post Added: " #postIds[i]);
      postIdsBuffer.add(postIds[i]);
    };

    Debug.print("Paged search results count: " # Nat.toText(postIdsBuffer.size()));

    // return the total count and the post ids to use for the page
    {
      totalCount = Nat.toText(totalCount);
      postIds = Buffer.toArray(postIdsBuffer);
    };
  };

  public shared composite query ({ caller }) func searchWithinPublication(searchTerm : Text, isTagSearch : Bool, indexFrom : Nat32, indexTo : Nat32, publicationHandle : Text) : async Types.SearchResultData {
    Debug.print("PostIndex->search");
    Debug.print("searchTerm: " # searchTerm # ", isTagSearch: " # Bool.toText(isTagSearch) # ", indexFrom: " # Nat32.toText(indexFrom) # ", indexTo: " # Nat32.toText(indexTo));
    //validate input
    if (not U.isTextLengthValid(searchTerm, 1000)) {
      return {
        totalCount = "Search term is too long";
        postIds = [];
      };
    };

    if (searchTerm == "") {
      return {
        totalCount = "0";
        postIds = [];
      };
    };

    // get list of post ids from each word searched and combine them into a single array
    var results = HashMap.HashMap<Text, ?Text>(1000000, Text.equal, Text.hash);

    var keyWords : [Text] = [];
    if (isTagSearch) {
      keyWords := ["#" # U.upperCase(U.trim(searchTerm))];
    } else {
      keyWords := U.htmlToKeywords(searchTerm);
    };

    //fetch the post ids in the given publication
    let postCoreCanister = CanisterDeclarations.getPostCoreCanister();
    switch(await postCoreCanister.getUserPostIds(U.lowerCase(publicationHandle))) {
      case(#ok(publicationPostIds)) {
        for (word in Iter.fromArray(keyWords)) {
          Debug.print("word: " # word);
          let indexedPosts : [Text] = U.safeGet(hashMap, word, []);
          for (postId in Iter.fromArray(indexedPosts)) {
            Debug.print("  postId: " # postId);
            if (U.arrayContains(publicationPostIds, postId)) {
              results.put(postId, null);
            };

          };
        };

        let postIds = Iter.toArray(results.keys());

        // select a "page" from the results (for paging search results in the UI)
        var postIdsBuffer : Buffer.Buffer<Text> = Buffer.Buffer<Text>(10);

        // prevent underflow error
        let totalCount : Nat = postIds.size();
        if (totalCount == 0) {
          return {
            totalCount = "0";
            postIds = [];
          };
        };

        let lastIndex : Nat = totalCount - 1;

        let indexStart = Nat32.toNat(indexFrom);
        if (indexStart > lastIndex) {
          return {
            totalCount = "0";
            postIds = [];
          };
        };

        var indexEnd = Nat32.toNat(indexTo);
        if (indexEnd > lastIndex) {
          indexEnd := lastIndex;
        };


        for (i in Iter.range(indexStart, indexEnd)) {
          Debug.print("Buffer Post Added: " #postIds[i]);
          postIdsBuffer.add(postIds[i]);
        };

        // return the total count and the post ids to use for the page
        {
          totalCount = Nat.toText(totalCount);
          postIds = Buffer.toArray(postIdsBuffer);
        };
      };
      case(#err(error)) {
        //handle not found
        //return an empty array
        return {
          totalCount = "0";
          postIds = [];
        };
      };
    };
    

    
  };

  //refactor this to just be search func that take in array of tags
  //dfx canister call PostIndex populateTags '(vec {"#ADDICTION"; "#ART"}, 0: nat32, 50: nat32)'
  // search for tags by an array of tags return array of posts ids and total count
  public shared query ({ caller }) func populateTags(tags : [Text], indexFrom : Nat32, indexTo : Nat32) : async Types.SearchResultData {
    Debug.print("PostIndex->searchTags");
    //Debug.print("tags: " # tags # ", indexFrom: " # Nat32.toText(indexFrom) # ", indexTo: " # Nat32.toText(indexTo));

    if (tags.size() == 0) {
      return {
        totalCount = "0";
        postIds = [];
      };
    };

    // get list of post ids from each word searched and combine them into a single array
    var results = HashMap.HashMap<Text, ?Text>(1000000, Text.equal, Text.hash);

    for (tag in Iter.fromArray(tags)) {
      Debug.print("tag: " # tag);
      let indexedPosts : [Text] = U.safeGet(hashMap, tag, []);
      for (postId in Iter.fromArray(indexedPosts)) {
        Debug.print("  postId: " # postId);
        results.put(postId, null);
      };
    };

    let postIds = Iter.toArray(results.keys());

    // select a "page" from the results (for paging search results in the UI)
    var postIdsBuffer : Buffer.Buffer<Text> = Buffer.Buffer<Text>(10);

    // prevent underflow error
    let totalCount : Nat = postIds.size();
    if (totalCount == 0) {
      return {
        totalCount = "0";
        postIds = [];
      };
    };

    let lastIndex : Nat = totalCount - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return {
        totalCount = "0";
        postIds = [];
      };
    };

    var indexEnd = Nat32.toNat(indexTo) - 1;
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };
    for (i in Iter.range(indexStart, indexEnd)) {
      Debug.print("Buffer Post Added: " #postIds[i]);
      postIdsBuffer.add(postIds[i]);
    };

    {
      totalCount = Nat.toText(totalCount);
      postIds = Buffer.toArray(postIdsBuffer);
    };
  };

  public shared ({ caller }) func clearIndex() : async ClearIndexResult {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller) and not isTrustedCanister(caller)) {
      return #err(Unauthorized);
    };

    let wordCount : Nat = hashMap.size();
    hashMap := HashMap.HashMap<Text, [Text]>(initCapacity, isEq, Text.hash);

    Debug.print("PostIndex->clearIndex: Cleared " # Nat.toText(wordCount) # " words from the index");

    #ok(wordCount);
  };

  //#endregion

  //#region Canister Geek

  public shared query ({ caller }) func getCanisterMetrics(parameters : Canistergeek.GetMetricsParameters) : async ?Canistergeek.CanisterMetrics {
    if (not isCgUser(caller) and not isAdmin(caller)) {
      Prelude.unreachable();
    };

    Debug.print("PostIndex->getCanisterMetrics: The method getCanistermetrics in the Post canister was called from the UI successfully");

    canistergeekMonitor.getMetrics(parameters);
  };

  public shared ({ caller }) func collectCanisterMetrics() : async () {
    if (isAnonymous(caller)) {
      return;
    };
    if (not isCgUser(caller) and not isAdmin(caller)) {
      Prelude.unreachable();
    };

    Debug.print("PostIndex->collectCanisterMetrics: The method collectCanisterMetrics was called from the UI successfully");

    canistergeekMonitor.collectMetrics();
  };

  public func acceptCycles() : async () {
    let available = Cycles.available();
    let accepted = Cycles.accept<system>(available);
    assert (accepted == available);
  };

  public shared query func availableCycles() : async Nat {
    Cycles.balance();
  };

  //#region memory management
  stable var MAX_MEMORY_SIZE = 380000000;

  public shared ({ caller }) func setMaxMemorySize(newValue : Nat) : async Result.Result<Nat, Text> {

    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("setMaxMemorySize", Principal.toText(caller));
    MAX_MEMORY_SIZE := newValue;

    #ok(MAX_MEMORY_SIZE);
  };

  public shared query func getMaxMemorySize() : async Nat {
    MAX_MEMORY_SIZE;
  };

  public shared query func isThereEnoughMemory() : async Bool {
    isThereEnoughMemoryPrivate();
  };

  private func isThereEnoughMemoryPrivate() : Bool {
    MAX_MEMORY_SIZE > getMemorySizePrivate();
  };

  public shared query func getMemorySize() : async Nat {
    getMemorySizePrivate();
  };

  private func getMemorySizePrivate() : Nat {
    Prim.rts_memory_size();
  };

  //#endregion

  public shared query func getCanisterVersion() : async Text {
    Versions.POSTINDEX_VERSION;
  };

  //#region System Hooks

  system func preupgrade() {
    Debug.print("PostIndex->preupgrade: hashmap size: " # Nat.toText(index.size()));
    _canistergeekMonitorUD := ?canistergeekMonitor.preupgrade();
    Debug.print("PostIndex->preupgrade:Inside Canistergeek preupgrade method");
    index := Iter.toArray(hashMap.entries());
  };

  system func postupgrade() {
    Debug.print("PostIndex->postupgrade: hashmap size: " # Nat.toText(index.size()));
    canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
    _canistergeekMonitorUD := null;
    Debug.print("PostIndex->postupgrade:Inside Canistergeek postupgrade method");
    hashMap := HashMap.fromIter(index.vals(), initCapacity, isEq, Text.hash);
    index := [];
  };

  //#endregion
};