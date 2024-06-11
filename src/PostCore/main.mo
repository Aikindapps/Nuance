import Result "mo:base/Result";
import Principal "mo:base/Principal";
import List "mo:base/List";
import Canistergeek "../canistergeek/canistergeek";
import PostBucket "../PostBucket/main";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Cycles "mo:base/ExperimentalCycles";
import Iter "mo:base/Iter";
// import UpgradeBucket "UpgradeBucket";
import Blob "mo:base/Blob";
import Types "types";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import U "../shared/utils";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Array "mo:base/Array";
import MC "modclub/modclub";
import Prelude "mo:base/Prelude";
import Error "mo:base/Error";
import Nat32 "mo:base/Nat32";
import Bool "mo:base/Bool";
import Time "mo:base/Time";
import Nat64 "mo:base/Nat64";
import Order "mo:base/Order";
import ICexperimental "mo:base/ExperimentalInternetComputer";
import Float "mo:base/Float";
import IC "IC";
import DateTime "../shared/DateTime";

import Prim "mo:prim";
import CanisterDeclarations "../shared/CanisterDeclarations";
import Versions "../shared/versions";
import OperationLog "../shared/Types";
import ENV "../shared/env";
import Sonic "../shared/sonic";

actor PostCore {

  let canistergeekMonitor = Canistergeek.Monitor();
  let initCapacity = 0;

  // error messages
  let Unauthorized = "Unauthorized";
  let ArticleNotFound = "Article not found";
  let RejectedByModerators = "RejectedByModerators";
  let TagAlreadyExists = "Tag already exists";
  var InvalidTagId = "Invalid tag ID";
  let TagAlreadyFollowed = "Tag already followed";
  let UserNotFound = "User not found";
  let NotNuanceCanister = "Not a nuance canister, unauthorized";
  let NotPublicationPost = "Not a publication post. Can't have a category.";
  let ArticleNotEditable = "Premium article. Can not edit.";
  let NotPremium = "Post is not premium.";

  type PostModerationStatus = Types.PostModerationStatus;
  type PostModerationStatusV2 = Types.PostModerationStatusV2;
  type Tag = Types.Tag;
  type TagModel = Types.TagModel;
  type PostTag = Types.PostTag;
  type PostTagModel = Types.PostTagModel;
  type FrontendInterface = Types.FrontendInterface;
  type PostKeyProperties = CanisterDeclarations.PostKeyProperties;
  type Post = CanisterDeclarations.Post;
  type PostBucketType = CanisterDeclarations.PostBucketType;
  type PostSaveModel = CanisterDeclarations.PostSaveModel;
  type UserPostCounts = Types.UserPostCounts;
  type GetPostsByFollowers = Types.GetPostsByFollowers;
  type NftCanisterEntry = Types.NftCanisterEntry;
  type Order = { #less; #equal; #greater };
  type RecallOptions = Types.RecallOptions;
  type DayOfWeek = Types.DayOfWeek;
  type MonthOfYear = Types.MonthOfYear;
  type DateTimeParts = Types.DateTimeParts;

  // permanent in-memory state (data types are not lost during upgrades)
  stable var admins : List.List<Text> = List.nil<Text>();
  stable var platformOperators : List.List<Text> = List.nil<Text>();
  stable var cgusers : List.List<Text> = List.nil<Text>();
  stable var nuanceCanisters : List.List<Text> = List.nil<Text>();
  stable var activeBucketCanisterId = "";
  stable var postId : Nat = 0;
  stable var tagIdCounter : Nat = 0;
  stable var modClubRulesAdded = false;
  stable var environment = "local";
  stable var totalViewsToday : Nat = 0; //stored by date and reset by timer daily, incremented by viewPost func
  stable var totalDailyViewsDate : Text = "20230101";
  stable var isStoreSEOcalled = false;

  stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
  stable var bucketCanisterIdsEntries : [(Text, Text)] = [];
  stable var handleEntries : [(Text, Text)] = [];
  stable var handleReverseEntries : [(Text, Text)] = [];
  stable var lowercaseHandleEntries : [(Text, Text)] = [];
  stable var lowercaseHandleReverseEntries : [(Text, Text)] = [];
  stable var userPostsEntries : [(Text, List.List<Text>)] = [];

  stable var postIdsToBucketCanisterIdEntries : [(Text, Text)] = [];
  stable var postIdsToNftCanisterIdEntries : [(Text, Text)] = [];
  stable var principalIdEntries : [(Text, Text)] = [];
  stable var createdEntries : [(Text, Int)] = [];
  stable var modifiedEntries : [(Text, Int)] = [];
  stable var isDraftEntries : [(Text, Bool)] = [];
  stable var publishedDateEntries : [(Text, Int)] = [];
  stable var latestPostsEntries : [(Text, Text)] = [];
  stable var viewsEntries : [(Text, Nat)] = [];
  stable var dailyViewHistory : [(Text, Nat)] = [];
  stable var postModerationStatusEntries : [(Text, PostModerationStatus)] = [];
  stable var postModerationStatusEntriesV2 : [(Text, PostModerationStatusV2)] = [];
  stable var postVersionEntries : [(Text, Nat)] = [];
  stable var tagEntries : [(Text, Tag)] = [];
  stable var categoryEntries : [(Text, Text)] = [];
  stable var relationshipEntries : [(Text, [PostTag])] = [];
  stable var userTagRelationshipEntries : [(Text, [PostTag])] = [];
  stable var clapsEntries : [(Text, Nat)] = [];
  stable var applaudsEntries : [(Text, Nat)] = [];
  stable var popularity : [(Text, Nat)] = [];
  stable var popularityToday : [(Text, Nat)] = [];
  stable var popularityThisWeek : [(Text, Nat)] = [];
  stable var popularityThisMonth : [(Text, Nat)] = [];
  //these 4 will be used in indexPopular method. There's no hashmap
  stable var popularitySortedArray : [(Text, Nat)] = [];
  stable var popularitySortedArrayToday : [(Text, Nat)] = [];
  stable var popularitySortedArrayThisWeek : [(Text, Nat)] = [];
  stable var popularitySortedArrayThisMonth : [(Text, Nat)] = [];

  //publication canisters entries
  stable var publicationCanisterIdsEntries : [(Text, Text)] = [];

  stable var publicationEditorsEntries : [(Text, [Text])] = [];
  stable var publicationWritersEntries : [(Text, [Text])] = [];


  //   key: bucket canister id, value: first post id of the bucket canister
  var bucketCanisterIdsHashMap = HashMap.fromIter<Text, Text>(bucketCanisterIdsEntries.vals(), initCapacity, Text.equal, Text.hash);
  //   key: principalId, value: handle
  var handleHashMap = HashMap.fromIter<Text, Text>(handleEntries.vals(), initCapacity, Text.equal, Text.hash);
  //   key: handle, value: principalId
  var handleReverseHashMap = HashMap.fromIter<Text, Text>(handleReverseEntries.vals(), initCapacity, Text.equal, Text.hash);
  //   key: principalId, value: handle(lowercase)
  var lowercaseHandleHashMap = HashMap.fromIter<Text, Text>(lowercaseHandleEntries.vals(), initCapacity, Text.equal, Text.hash);
  //   key: handle(lowercase), value: principalId
  var lowercaseHandleReverseHashMap = HashMap.fromIter<Text, Text>(lowercaseHandleReverseEntries.vals(), initCapacity, Text.equal, Text.hash);
  //   key: principalId, value: List<postId>
  var userPostsHashMap = HashMap.fromIter<Text, List.List<Text>>(userPostsEntries.vals(), initCapacity, Text.equal, Text.hash);

  //post data
  //key: postId, value: corresponding value
  var postIdsToBucketCanisterIdsHashMap = HashMap.fromIter<Text, Text>(postIdsToBucketCanisterIdEntries.vals(), initCapacity, Text.equal, Text.hash);
  var postIdsToNftCanisterIdsHashMap = HashMap.fromIter<Text, Text>(postIdsToNftCanisterIdEntries.vals(), initCapacity, Text.equal, Text.hash);
  var principalIdHashMap = HashMap.fromIter<Text, Text>(principalIdEntries.vals(), initCapacity, Text.equal, Text.hash);
  var createdHashMap = HashMap.fromIter<Text, Int>(createdEntries.vals(), initCapacity, Text.equal, Text.hash);
  var modifiedHashMap = HashMap.fromIter<Text, Int>(modifiedEntries.vals(), initCapacity, Text.equal, Text.hash);
  var isDraftHashMap = HashMap.fromIter<Text, Bool>(isDraftEntries.vals(), initCapacity, Text.equal, Text.hash);
  var publishedDateHashMap = HashMap.fromIter<Text, Int>(publishedDateEntries.vals(), initCapacity, Text.equal, Text.hash);
  var latestPostsHashmap = HashMap.fromIter<Text, Text>(latestPostsEntries.vals(), initCapacity, Text.equal, Text.hash);
  var viewsHashMap = HashMap.fromIter<Text, Nat>(viewsEntries.vals(), initCapacity, Text.equal, Text.hash);
  var dailyViewHistoryHashMap = HashMap.fromIter<Text, Nat>(dailyViewHistory.vals(), initCapacity, Text.equal, Text.hash);
  var postModerationStatusMap = HashMap.fromIter<Text, PostModerationStatus>(postModerationStatusEntries.vals(), initCapacity, Text.equal, Text.hash);
  var postModerationStatusMapV2 = HashMap.fromIter<Text, PostModerationStatusV2>(postModerationStatusEntriesV2.vals(), initCapacity, Text.equal, Text.hash);
  var postVersionMap = HashMap.fromIter<Text, Nat>(postVersionEntries.vals(), initCapacity, Text.equal, Text.hash);
  var tagsHashMap = HashMap.fromIter<Text, Tag>(tagEntries.vals(), initCapacity, Text.equal, Text.hash);
  var categoryHashMap = HashMap.fromIter<Text, Text>(categoryEntries.vals(), initCapacity, Text.equal, Text.hash);
  var relationships = HashMap.fromIter<Text, [PostTag]>(relationshipEntries.vals(), initCapacity, Text.equal, Text.hash);
  var userTagRelationships = HashMap.fromIter<Text, [PostTag]>(userTagRelationshipEntries.vals(), initCapacity, Text.equal, Text.hash);
  var clapsHashMap = HashMap.fromIter<Text, Nat>(clapsEntries.vals(), initCapacity, Text.equal, Text.hash);
  var applaudsHashMap = HashMap.fromIter<Text, Nat>(applaudsEntries.vals(), initCapacity, Text.equal, Text.hash);
  var popularityHashMap = HashMap.fromIter<Text, Nat>(popularity.vals(), initCapacity, Text.equal, Text.hash);
  var popularityTodayHashMap = HashMap.fromIter<Text, Nat>(popularityToday.vals(), initCapacity, Text.equal, Text.hash);
  var popularityThisWeekHashMap = HashMap.fromIter<Text, Nat>(popularityThisWeek.vals(), initCapacity, Text.equal, Text.hash);
  var popularityThisMonthHashMap = HashMap.fromIter<Text, Nat>(popularityThisMonth.vals(), initCapacity, Text.equal, Text.hash);

  //key: pub-handle, value: publication canister id
  var publicationCanisterIdsHashmap = HashMap.fromIter<Text, Text>(publicationCanisterIdsEntries.vals(), initCapacity, Text.equal, Text.hash);

  //key: publication canister id, value:  editor principal ids
  var publicationEditorsHashmap = HashMap.fromIter<Text, [Text]>(publicationEditorsEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: publication canister id, value: writer principal ids
  var publicationWritersHashmap = HashMap.fromIter<Text, [Text]>(publicationWritersEntries.vals(), initCapacity, Text.equal, Text.hash);



  //#bucket canister management
  func updateSettings(canisterId: Principal, manager: [Principal]): async () {

    let controllers = Buffer.Buffer<Principal>(0);
    controllers.add(Principal.fromActor(PostCore));

    for (managerId in manager.vals()) {
      controllers.add(managerId);
    };

    await IC.IC.update_settings(({canister_id = canisterId; settings = {
        controllers = ?Buffer.toArray(controllers);
        freezing_threshold = null;
        memory_allocation = null;
        compute_allocation = null;
    }}));
};

  public shared ({ caller }) func updateSettingsForAllBucketCanisters() : async Result.Result<Text, Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller) and not Principal.equal(caller, Principal.fromActor(PostCore)) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    for (bucketCanisterId in bucketCanisterIdsHashMap.keys()) {

      let bucketActor = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);
      let status = await IC.IC.canister_status({ canister_id = Principal.fromText(bucketCanisterId); });
      let controllers = status.settings.controllers;
      
      let controllersBuffer = Buffer.Buffer<Principal>(0);

      for (controller in controllers.vals()) {
        if (Principal.toText(controller).size() < 28) {
        controllersBuffer.add(controller);
        }
      };

      controllersBuffer.add(Principal.fromActor(PostCore));
      controllersBuffer.add(Principal.fromText(ENV.SNS_GOVERNANCE_CANISTER));



      switch (await IC.IC.update_settings(({ canister_id = Principal.fromActor(bucketActor); settings = { 
        controllers = ?Buffer.toArray(controllersBuffer);
        freezing_threshold = null;
        memory_allocation = null; 
        compute_allocation = null; } }))
      ) {
        case () {};
      };
    };

    #ok("Success");
  };


  public shared ({ caller }) func createNewBucketCanister() : async Result.Result<Text, Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    //check the caller is admin or the canister's itself
    if (not isAdmin(caller) and not Principal.equal(caller, Principal.fromActor(PostCore)) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    if (activeBucketCanisterId != "") {
      let activeBucketCanister = CanisterDeclarations.getPostBucketCanister(activeBucketCanisterId);

      switch (await activeBucketCanister.makeBucketCanisterNonActive()) {
        case (#ok(val)) {};
        case (_) {
          return #err("An error occured while making the active canister non-active. Please try again.");
        };
      };
    };

    try {
      Cycles.add(5_000_000_000_000);
      let bucketCanister = await PostBucket.PostBucket();
      let canisterId = Principal.toText(Principal.fromActor(bucketCanister));
      let PostIndexCanister = CanisterDeclarations.getPostIndexCanister();
      switch (await PostIndexCanister.registerCanister(canisterId)) {
        case (#err(err)) {
          return #err("An error occured while registering the bucket canister as admin in PostIndex canister.");
        };
        case (_) {};
      };

      let CyclesDispenserCanister = CanisterDeclarations.getCyclesDispenserCanister();
      switch (await CyclesDispenserCanister.addCanister({ canisterId = canisterId; minimumThreshold = 10_000_000_000_000; topUpAmount = 5_000_000_000_000; isStorageBucket = false; })) {
        case (#err(err)) {
          return #err("An error occured while adding the bucket canister in CyclesDispenser.");
        };
        case (_) {};
      };

      let MetricsCanister = CanisterDeclarations.getMetricsCanister();
      switch (await MetricsCanister.registerCanister(canisterId)) {
        case (#err(err)) {
          return #err("An error occured while adding the bucket canister to Metrics canister.");
        };
        case (_) {};
      };

      

      try {
        //authorize bucket canister in frontend canister
        let frontendActor = CanisterDeclarations.getFrontendCanister();
       
        await frontendActor.authorize(Principal.fromActor(bucketCanister));
        
      } catch (e) {
        Debug.print("authorize error");
      };

      try {
        await updateSettings(Principal.fromActor(bucketCanister), [Principal.fromText(ENV.SNS_GOVERNANCE_CANISTER)]);
      } catch (e) {
        Debug.print("update settings error");
      };

      switch (await bucketCanister.initializeBucketCanister(List.toArray(admins), List.toArray(nuanceCanisters), List.toArray(cgusers), [], Principal.toText(Principal.fromActor(PostCore)), ENV.NUANCE_ASSETS_CANISTER_ID, ENV.POST_INDEX_CANISTER_ID, ENV.USER_CANISTER_ID)) {
        case (#ok(cai)) {
          activeBucketCanisterId := canisterId;
          bucketCanisterIdsHashMap.put(canisterId, Nat.toText(postId + 1));
          #ok(canisterId);
        };
        case (#err(err)) {
          return #err(err);
        };
      };

    } catch (e) {
      return #err("An error occured while creating the bucket canister. Please check cycles.");
    };

  };

  public shared ({ caller }) func initializePostCoreCanister() : async Result.Result<Text, Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (activeBucketCanisterId == "") {
      return await createNewBucketCanister();
    } else {
      return #err("Already initialized.");
    };
  };

  //initialize method to store the canister ids that this canister interacts with
  public shared ({ caller }) func initializeCanister(postIndexCai : Text, userCai : Text, cyclesDispenserCai : Text) : async Result.Result<Text, Text> {
    return #err("Deprecated function.");
  };

  public shared ({ caller }) func setFrontendCanisterId(canisterId : Text) : async Result.Result<Text, Text> {
    return #err("Deprecated function.");
  };

  public shared query ({ caller }) func getFrontendCanisterId() : async Result.Result<Text, Text> {
    #ok(ENV.NUANCE_ASSETS_CANISTER_ID);
  };

  public shared ({ caller }) func testInstructionSize() : async Text {
    if (isAnonymous(caller)) {
      return ("Cannot use this method anonymously.");
    };

    if (isAdmin(caller) != true) {
      return "You are not authorized to run this method";
    };

    //👀👀👀 warning IC.countInstructions executes the functions passed to it
    let preupgradeCount = ICexperimental.countInstructions(func() { preupgrade() });
    let postupgradeCount = ICexperimental.countInstructions(func() { postupgrade() });

    // "the limit for a canister install and upgrade is 200 billion instructions."
    // "the limit for an update message is 20 billion instructions"

    return "Preupgrade Count: " # Nat64.toText(preupgradeCount) # "\n Postupgrade Count: " # Nat64.toText(postupgradeCount) # "\n Preupgrade remaining instructions: " # Nat64.toText(200000000000 - preupgradeCount) # "\n Postupgrade remaining instructions: " # Nat64.toText(200000000000 - postupgradeCount);

  };

  public shared query func getBucketCanisters() : async [(Text, Text)] {
    Iter.toArray(bucketCanisterIdsHashMap.entries());
  };

  public shared query func getAllNftCanisters() : async [(Text, Text)] {
    Iter.toArray(postIdsToNftCanisterIdsHashMap.entries());
  };

  //#region Security Management

  private func isAnonymous(caller : Principal) : Bool {
    Principal.equal(caller, Principal.fromText("2vxsx-fae"));
  };

  private func isAdmin(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    U.arrayContains(ENV.POSTCORE_CANISTER_ADMINS, c);
  };

  public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    #ok(ENV.POSTCORE_CANISTER_ADMINS);
  };

  private func isPlatformOperator(caller : Principal) : Bool {
    ENV.isPlatformOperator(caller);
  };

  public shared query func getPlatformOperators() : async List.List<Text> {
    List.fromArray(ENV.PLATFORM_OPERATORS);
  };

  private func isEditor(publicationCanisterId: Text, caller: Principal) : Bool {
    switch(publicationEditorsHashmap.get(publicationCanisterId)) {
      case(?editors) {
        return U.arrayContains(editors, Principal.toText(caller));
      };
      case(null) {
        return false;
      };
    };
  };

  private func isWriter(publicationCanisterId: Text, caller: Principal) : Bool {
    switch(publicationWritersHashmap.get(publicationCanisterId)) {
      case(?writers) {
        return U.arrayContains(writers, Principal.toText(caller));
      };
      case(null) {
        return false;
      };
    };
  };

  private func isDraftOrFutureArticle(postId: Text) : Bool {
    let now = U.epochTime();
    let isDraft = U.safeGet(isDraftHashMap, postId, false);
    let publishedDate = U.safeGet(publishedDateHashMap, postId, now);
    publishedDate > now or isDraft
  };

  public shared query func isWriterPublic(publicationCanisterId: Text, caller: Principal) : async Bool {
    isWriter(publicationCanisterId, caller)
  };

  public shared query func isEditorPublic(publicationCanisterId: Text, caller: Principal) : async Bool {
    isEditor(publicationCanisterId, caller)
  };

  //These methods are deprecated. Admins are handled by env.mo file
  public shared ({ caller }) func registerAdmin(id : Text) : async Result.Result<(), Text> {
    #err("Deprecated function");
  };

  public shared ({ caller }) func unregisterAdmin(id : Text) : async Result.Result<(), Text> {
    #err("Deprecated function");
  };

  //platform operators, similar to admins but restricted to a few functions -> deprecated. Use env.mo file
  public shared ({ caller }) func registerPlatformOperator(id : Text) : async Result.Result<(), Text> {
    #err("Deprecated function.");
  };

  public shared ({ caller }) func unregisterPlatformOperator(id : Text) : async Result.Result<(), Text> {
    #err("Deprecated function.");
  };

  private func isAuthor(caller : Principal, postId : Text) : Bool {
    ?Principal.toText(caller) == principalIdHashMap.get(postId);
  };

  func isNuanceCanister(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    var exists = List.find<Text>(nuanceCanisters, func(val : Text) : Bool { val == c });
    exists != null;
  };

  public shared query ({ caller }) func getTrustedCanisters() : async Result.Result<[Text], Text> {
    /*if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };*/

    #ok(List.toArray(nuanceCanisters));
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

  public shared ({ caller }) func registerCanister(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller) and not Principal.equal(Principal.fromActor(PostCore), caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    if (not List.some<Text>(nuanceCanisters, func(val : Text) : Bool { val == id })) {
      nuanceCanisters := List.push<Text>(id, nuanceCanisters);
    };

    for (bucketCanisterId in bucketCanisterIdsHashMap.keys()) {
      let bucketActor = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);

      ignore await bucketActor.registerCanister(id);
    };

    #ok();
  };

  public shared ({ caller }) func unregisterCanister(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };
    nuanceCanisters := List.filter<Text>(nuanceCanisters, func(val : Text) : Bool { val != id });
    #ok();
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
  public query func idQuick() : async Principal {
    return Principal.fromActor(PostCore);
  };

  //#region Post Management
  //getNextPostId method can be called by bucket canisters only
  public shared ({ caller }) func getNextPostId() : async Result.Result<Text, Text> {
    switch (bucketCanisterIdsHashMap.get(Principal.toText(caller))) {
      case (?value) {
        //caller is a bucket canister
        postId += 1;
        #ok(Nat.toText(postId));
      };
      case (null) {
        return #err(Unauthorized);
      };
    };

  };

  private func setPostId(newPostId : Nat) : () {
    postId := newPostId;
  };

  public shared ({ caller }) func getKinicList() : async Result.Result<[Text], Text> {

    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isNuanceCanister(caller)) {
      return #err(NotNuanceCanister);
    };
    var result = Buffer.Buffer<Text>(0);
    for (bucketCanisterId in bucketCanisterIdsHashMap.keys()) {
      let bucketActor = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);

      switch (await bucketActor.getKinicList()) {
        case (#ok(list)) {
          result.append(Buffer.fromArray(list));
        };
        case (_) {};
      };
    };

    #ok(Buffer.toArray(result));
  };

  public shared ({ caller }) func getPostUrls() : async Result.Result<Text, Text> {

    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };
    var postUrls : Text = "";

    for (bucketCanisterId in bucketCanisterIdsHashMap.keys()) {
      let bucketActor = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);
      switch (await bucketActor.getPostUrls()) {
        case (#ok(urls)) {
          postUrls #= urls # "\n";
        };
        case (_) {};
      };
    };

    #ok(postUrls);
  };

  public shared ({ caller }) func updateHandle(principalId : Text, newHandle : Text) : async Result.Result<Text, Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    //validate input
    if (not U.isTextLengthValid(newHandle, 64)) {
      return #err("Author Text length exceeded");
    };

    if (not Principal.equal(caller, Principal.fromText(ENV.USER_CANISTER_ID))) {
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    switch (handleHashMap.get(principalId)) {
      case (?existingHandle) {
        var failed_bucket_canisters = Buffer.Buffer<Text>(0);
        //call the bucket canisters first
        //if all the bucket canisters works fine, change the internal state
        for (bucketCanisterId in bucketCanisterIdsHashMap.keys()) {
          let bucketActor = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);
          try {
            switch (await bucketActor.updateHandle(principalId, newHandle)) {
              case (#ok(urls)) {};
              case (_) {
                failed_bucket_canisters.add(bucketCanisterId);
              };
            };
          } catch (e) {
            failed_bucket_canisters.add(bucketCanisterId);
          };

        };
        if (failed_bucket_canisters.size() != 0) {
          var error = "List of bucket canister ids that failed while updating the handle: ";
          for (failed in failed_bucket_canisters.vals()) {
            error #= failed;
          };
          return #err(error);
        };

        handleHashMap.put(principalId, newHandle);
        handleReverseHashMap.delete(existingHandle);
        handleReverseHashMap.put(newHandle, principalId);
        lowercaseHandleHashMap.put(principalId, U.lowerCase(newHandle));
        lowercaseHandleReverseHashMap.delete(U.lowerCase(existingHandle));
        lowercaseHandleReverseHashMap.put(U.lowerCase(newHandle), principalId);

        //if it's a publication, update the publicationCanisterIdsHashmap
        switch (publicationCanisterIdsHashmap.get(existingHandle)) {
          case (?publicationCanisterId) {
            publicationCanisterIdsHashmap.put(newHandle, publicationCanisterId);
            publicationCanisterIdsHashmap.delete(existingHandle);
          };
          case (null) {};
        };
        

        return #ok("Success");

      };
      case (null) {
        return #ok("There's no instance of the given user. Nothing to do.");
      };
    };

  };

  private func buildPostKeyProperties(postId : Text) : PostKeyProperties {
    Debug.print("PostCore-buildPostKeyProperties: " # postId);

    let principalId = U.safeGet(principalIdHashMap, postId, "");
    //the old claps received without any tipping
    let oldClaps = U.safeGet(clapsHashMap, postId, 0);
    //claps received by tipping
    let applauds_e8s = (U.safeGet(applaudsHashMap, postId, 0));
    let applauds = Float.fromInt(applauds_e8s) / Float.pow(10, Float.fromInt(ENV.NUA_TOKEN_DECIMALS));
    let applaudsNat = Int.abs(Float.toInt(Float.nearest(applauds)));
    {
      postId = postId;
      handle = U.safeGet(handleHashMap, principalId, "");
      principal = principalId;
      bucketCanisterId = U.safeGet(postIdsToBucketCanisterIdsHashMap, postId, "");
      created = Int.toText(U.safeGet(createdHashMap, postId, 0));
      modified = Int.toText(U.safeGet(modifiedHashMap, postId, 0));
      publishedDate = Int.toText(U.safeGet(publishedDateHashMap, postId, 0));
      views = Nat.toText(U.safeGet(viewsHashMap, postId, 0));
      tags = getTagModelsByPost(postId);
      claps = Nat.toText(oldClaps + applaudsNat);
      category = U.safeGet(categoryHashMap, postId, "");
      isDraft = U.safeGet(isDraftHashMap, postId, false);
    };
  };
  //equivalent of the get method in old bucket canister
  public shared query func getPostKeyProperties(postId : Text) : async Result.Result<PostKeyProperties, Text> {
    switch (principalIdHashMap.get(postId)) {
      case (?val) {
        return #ok(buildPostKeyProperties(postId));
      };
      case (_) {
        return #err(ArticleNotFound);
      };
    };
  };

  public shared query func getList(postIds : [Text]) : async [PostKeyProperties] {
    Debug.print("PostCore->getList: size=" # Nat.toText(postIds.size()));

    var posts : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    label l for (postId in Iter.fromArray(postIds)) {
      if (postId != "" and not rejectedByModClub(postId) and U.isTextLengthValid(postId, 20)) {
        posts.add(buildPostKeyProperties(postId));
      };
      if (posts.size() == 20) {
        break l;
      };
    };

    Buffer.toArray(posts);
  };

  public shared query func getTotalPostCount() : async Nat {
    Debug.print("PostCore->Count");
    principalIdHashMap.size();
  };

  public shared query func getTotalArticleViews() : async Nat {
    var counter = 0;
    for (view in viewsHashMap.vals()) {
      counter += view;
    };
    counter;
  };

  public shared query func getHistoricalPublishedArticlesData() : async [(Text, Int)] {
    Iter.toArray(publishedDateHashMap.entries())
  };

  public shared composite query func getTotalAmountOfTipsReceived() : async Nat {
    var counter = 0;
    for(cai in bucketCanisterIdsHashMap.vals()){
      let bucketActor = CanisterDeclarations.getPostBucketCanister(cai);
      let allApplauds = await bucketActor.getAllApplauds();
      for(applaud in allApplauds.vals()){
        counter += applaud.numberOfApplauds
      }
    };
    counter
  };

  public shared query func currentId() : async Nat {
    Debug.print("PostCore->CurrentId");
    postId;
  };

  public shared query ({caller}) func getLastWeekRejectedPostKeyProperties() : async [PostKeyProperties] {
    if(not isPlatformOperator(caller)){
      return []
    };

    let result = Buffer.Buffer<PostKeyProperties>(0);

    let now = U.epochTime();    
    let WEEK = 604800000;
    let lastWeek = now - WEEK;
    
    var i = postId;
    var createdIter = now;
    while(createdIter > lastWeek){
      let created = U.safeGet(createdHashMap, Nat.toText(i), 0);
      if(created > lastWeek and rejectedByModClub(Nat.toText(i))){
        result.add(buildPostKeyProperties(Nat.toText(i)));
      };
      i -= 1;
      createdIter := created;
    };
    
    Buffer.toArray(result);
  };

  public shared ({ caller }) func deletePostFromUserDebug(handle : Text, postId : Text) : async Result.Result<[Text], Text> {
    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    let trimmedHandle = U.trim(handle);
    let authorPrincipalId = U.safeGet(lowercaseHandleReverseHashMap, trimmedHandle, "");

    if (authorPrincipalId == "") {
      return #err(UserNotFound);
    };

    let existingPostIds = U.safeGet(userPostsHashMap, authorPrincipalId, List.nil());

    let filteredPostIds = Buffer.Buffer<Text>(0);

    for (existingPostId in List.toArray(existingPostIds).vals()) {
      if (postId != existingPostId) {
        filteredPostIds.add(existingPostId);
      };
    };
    userPostsHashMap.put(authorPrincipalId, List.fromArray(Buffer.toArray(filteredPostIds)));

    return #ok(Buffer.toArray(filteredPostIds))

  };

  //call deleteUserPosts method from each bucket canister that has the post from the given user
  public shared ({ caller }) func deleteUserPosts(principalId : Text) : async Result.Result<Nat, Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };
    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };
    Debug.print("PostCore->deleteUserPosts for PrincipalId: " # principalId);

    let userPosts = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());
    var bucketCanisterIds = Buffer.Buffer<Text>(0);
    //add all the different bucket canister ids to the buffer
    for (postId in List.toArray(userPosts).vals()) {
      let post = buildPostKeyProperties(postId);
      if (not U.arrayContains(Buffer.toArray(bucketCanisterIds), post.bucketCanisterId)) {
        bucketCanisterIds.add(post.bucketCanisterId);
      };
    };
    //call deleteUserPosts from each bucket canister
    for (bucketCanisterId in bucketCanisterIds.vals()) {
      let bucketActor = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);
      ignore await bucketActor.deleteUserPosts(principalId);
    };

    //delete all the posts internally
    for (postId in List.toArray(userPosts).vals()) {
      deleteInternal(postId);
    };
    await generateLatestPosts();
    #ok(principalIdHashMap.size());
  };

  public shared ({ caller }) func delete(postId : Text) : async Result.Result<Nat, Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };
    //validate input
    if (not U.isTextLengthValid(postId, 20)) {
      return #err("Invalid postId");
    };
    canistergeekMonitor.collectMetrics();
    //ensure the caller owns the post before deleting it
    if (not isAuthor(caller, postId) and not isAdmin(caller) and not isNuanceCanister(caller)) {
      return #err(Unauthorized);
    };
    switch (postIdsToBucketCanisterIdsHashMap.get(postId)) {
      case (?canisterId) {
        let bucketActor = CanisterDeclarations.getPostBucketCanister(canisterId);
        switch (await bucketActor.get(postId)) {
          case (#ok(post)) {
            //Author can not delete a premium article but admin can delete.
            if (isAuthor(caller, postId) and post.isPremium) {
              return #err(ArticleNotEditable);
            };
            ignore await bucketActor.delete(postId);
            deleteInternal(postId);
            await generateLatestPosts();
            return #ok(principalIdHashMap.size());
          };
          case (_) {
            return #err(ArticleNotFound);
          };
        };

      };
      case (null) {
        return #err(ArticleNotFound);
      };
    };

  };
  //internal function that deletes the post from core canister
  //ToDo: delete the post from the writer's postIds also
  private func deleteInternal(postId : Text) : () {
    let principalId = U.safeGet(principalIdHashMap, postId, "");
    if (principalId != "") {
      principalIdHashMap.delete(postId);

      // remove postId from the user's posts
      removePostIdFromUser(principalId, postId);

    };
    //find post in latestpostsHashmap and remove it
    for (i in Iter.range(0, latestPostsHashmap.size())) {
      let latestPosts = U.safeGet(latestPostsHashmap, Int.toText(i), "");
      if (latestPosts == postId) {
        latestPostsHashmap.delete(Int.toText(i));
        Debug.print("PostCore->Delete: post " # latestPosts # " removed from latestPostsHashmap from postition " # Int.toText(i));
      };
    };

    createdHashMap.delete(postId);
    publishedDateHashMap.delete(postId);
    modifiedHashMap.delete(postId);
    viewsHashMap.delete(postId);
    postIdsToBucketCanisterIdsHashMap.delete(postId);
    clapsHashMap.delete(postId);
    applaudsHashMap.delete(postId);
    categoryHashMap.delete(postId);
  };

  public shared ({ caller }) func registerPublisher() : async () {
    if (isAnonymous(caller)) {
      return;
    };

    if (not isThereEnoughMemoryPrivate()) {
      return;
    };

    let callerPrincipalId = Principal.toText(caller);
    let UserCanister = CanisterDeclarations.getUserCanister();
    var user = await UserCanister.getUserInternal(callerPrincipalId);
    switch (user) {
      case (null) {};
      case (?userReturn) {
        handleHashMap.put(callerPrincipalId, userReturn.handle);
        handleReverseHashMap.put(userReturn.handle, callerPrincipalId);
        lowercaseHandleHashMap.put(callerPrincipalId, U.lowerCase(userReturn.handle));
        lowercaseHandleReverseHashMap.put(U.lowerCase(userReturn.handle), callerPrincipalId);
        publicationCanisterIdsHashmap.put(userReturn.handle, callerPrincipalId);
      };
    };
  };


  //it will be called just once by platform operators
  //calling more than one doesn't harm
  public shared ({caller}) func migrateAllPublicationEditorsAndWriters() : async Result.Result<([(Text, [Text])], [(Text, [Text])]), Text>{
    if(not isPlatformOperator(caller)){
      return #err(Unauthorized);
    };
    for(publicationCanisterId in publicationCanisterIdsHashmap.vals()){
      let canister = CanisterDeclarations.getPublicationCanister(publicationCanisterId);
      let editorsAndWriters = await canister.getEditorAndWriterPrincipalIds();
      let editorPrincipalIds = editorsAndWriters.0;
      let writerPrincipalIds = editorsAndWriters.1;
      publicationEditorsHashmap.put(publicationCanisterId, editorPrincipalIds);
      publicationWritersHashmap.put(publicationCanisterId, writerPrincipalIds);
    };

    #ok((Iter.toArray(publicationEditorsHashmap.entries())), (Iter.toArray(publicationWritersHashmap.entries())))
  };

  public shared ({caller}) func updatePublicationEditorsAndWriters(publicationHandle: Text, editorPrincipalIds: [Text], writerPrincipalIds: [Text]) : async Result.Result<(), Text> {
    Debug.print("Here in the updatePublicationEditorsAndWriters");
    switch(publicationCanisterIdsHashmap.get(publicationHandle)) {
      case(?canisterId) {
        Debug.print("canisterId: " # canisterId);
        if(Principal.toText(caller) == canisterId){
          Debug.print("ok");
          publicationEditorsHashmap.put(canisterId, editorPrincipalIds);
          publicationWritersHashmap.put(canisterId, writerPrincipalIds);
          return #ok()
        }
        else{
          Debug.print("unauthorized");
          return #err(Unauthorized);
        }
      };
      case(null) {
        Debug.print("doesn't exist");
        return #err("Publication doesn't exist.")
      };
    };
  };


  public shared ({ caller }) func save(postModel : PostSaveModel) : async Result.Result<Post, Text> {
     Debug.print("PostCore save input: " # debug_show(postModel));
    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    if (not U.isTextLengthValid(postModel.category, 50)) {
      return #err("Invalid category");
    };
    if (not U.isTextLengthValid(postModel.content, 300000)) {
      return #err("Your content is unusually large, please contact support to post");
    };
    if (not U.isTextLengthValid(postModel.creatorHandle, 64)) {
      return #err("Invalid creator");
    };
    if (not U.isTextLengthValid(postModel.headerImage, 1000)) {
      return #err("Invalid headerImage size");
    };
    if (not U.isTextLengthValid(postModel.postId, 20)) {
      return #err("Invalid postId");
    };
    if (not U.isTextLengthValid(postModel.subtitle, 400)) {
      return #err("Invalid subtitle");
    };
    if (not U.isTextLengthValid(postModel.title, 400)) {
      return #err("Invalid title");
    };
    //check post title for scripts
    if (not U.doesNotContainXss(postModel.title)) {
      return #err("Invalid post title");
    };

    //check the price if premium
    switch(postModel.premium) {
      case(?premiumValue) {
        if(premiumValue.icpPrice < 100_000){
          return #err("Sale price too low.");
        };
      };
      case(null) {
        //nothing to check
      };
    };

    for (tagId in Iter.fromArray(postModel.tagIds)) {
      if (not U.isTextLengthValid(tagId, 50)) {
        return #err("Invalid tagId");
      };
    };    

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    let callerPrincipalId = Principal.toText(caller);
    let postIdTrimmed = U.trim(postModel.postId);
    let isNew = (postIdTrimmed == "");

    if (getUserPostsCountLastDay(callerPrincipalId) > userDailyAllowedPostNumber and isNew) {
      //ToDo: Publications can add new editors and create new posts 
      return #err("You have reached the limit of posts you can publish in one day.");
    };

    //if scheduledPublishedDate value is not null, check if the input is valid
    switch(postModel.scheduledPublishedDate) {
      case(?scheduledPublishedDate) {
        let now = U.epochTime();
        if(now > scheduledPublishedDate){
          return #err("Invalid scheduled time.")
        };
        
        if(postModel.isDraft){
          //scheduled posts can not be draft
          return #err("Scheduled posts can not be draft!")
        }

      };
      case(null) {
        //nothing to check
      };
    };

    //even if the isPublication field is true, caller should be a publication canister
    let isPublication = switch(publicationCanisterIdsHashmap.get(postModel.handle)) {
      case(?publicationCanisterId) {
        //the publication with the given handle exists
        postModel.isPublication;
      };
      case(null) {
        //there is no publication with the given handle
        false
      };
    };

    //authorization for publication posts
    var creatorHandle = postModel.creatorHandle;
    var creatorPrincipal = U.safeGet(handleReverseHashMap, creatorHandle, "");
    if(isPublication){
      let publicationCanisterId = U.safeGet(publicationCanisterIdsHashmap, postModel.handle, "");
      if(isNew and postModel.isDraft){
        //new and draft
        //caller can be writer or editor to proceed
        if(not (isEditor(publicationCanisterId, caller) or isWriter(publicationCanisterId, caller))){
          //caller is not a writer or editor
          return #err(Unauthorized);
        };
      }
      else{
        if(not isEditor(publicationCanisterId, caller)){
          return #err(Unauthorized)
        }
      };
      //check if the given creator is a writer or editor in the publication (caller is authorized but is creator still a writer or editor?)
      if (creatorPrincipal == "") {
        let UserCanister = CanisterDeclarations.getUserCanister();
        var user = await UserCanister.getUserListItemByHandle(U.lowerCase(creatorHandle));
        switch (user) {
          case (#err(err)) {
            return #err("Cross canister user not found");
          };
          case (#ok(value)) {
            creatorHandle := value.handle;
            creatorPrincipal := value.principal;
            handleHashMap.put(value.principal, value.handle);
            handleReverseHashMap.put(value.handle, value.principal);
            lowercaseHandleHashMap.put(value.principal, U.lowerCase(value.handle));
            lowercaseHandleReverseHashMap.put(U.lowerCase(value.handle), value.principal);
          };
        };
      };
      if(isNew and not(isEditor(publicationCanisterId, Principal.fromText(creatorPrincipal)) or isWriter(publicationCanisterId, Principal.fromText(creatorPrincipal)))){
        //post is new but the creator is not an editor or writer anymore
        return #err("Creator is not a writer or editor of the publication!");
      };
    };

    //if not isNew and isPublication, check if the old creator value and the new creator value matches
    if((not isNew) and isPublication){
      let creatorPostIds = U.safeGet(userPostsHashMap, creatorPrincipal, List.nil<Text>());
      if(not U.arrayContains(List.toArray(creatorPostIds), postModel.postId)){
        return #err("The writer value doesn't match!")
      };
    };

    //if publication post, owner is the publication canister id, else owner is caller
    let postOwnerPrincipalId = if(isPublication){
      U.safeGet(publicationCanisterIdsHashmap, postModel.handle, "");
    }else{callerPrincipalId};

    //if isMembersOnly field is true, check if the owner of the post has the subscription feature enabled
    if(postModel.isMembersOnly){
      let SubscriptionCanister = CanisterDeclarations.getSubscriptionCanister();
      let isSubscriptionActive = await SubscriptionCanister.isWriterActivatedSubscription(postOwnerPrincipalId);
      if(not isSubscriptionActive){
        //subscription feature has not been enabled by the writer yet
        //return an error
        return #err("Subscription option is not available!");
      }
    };

    let bucketCanisterId = if (isNew) { activeBucketCanisterId } else {
      U.safeGet(postIdsToBucketCanisterIdsHashMap, postIdTrimmed, activeBucketCanisterId);
    };
    let bucketActor = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);
    if (bucketCanisterId == "") {
      //there's no bucket canister id mapped to the given post id
      return #err(ArticleNotFound);
    };

    //ensure the caller owns the post before updating it
    //exclude the publication posts because the authorization is done above
    if (not isPublication and not isNew and not isAuthor(caller, postIdTrimmed)) {
      return #err(Unauthorized);
    };

    //if isPremium field is true make sure it's a publication post, caller is an editor and post is not draft
    //also check if the max supply is enough to mint NFTs for all editors
    switch(postModel.premium) {
      case(?premiumInfo) {
        if(not isPublication){
          return #err(Unauthorized)
        }
        else{
          //isPremium and publication post
          //check if caller is an editor
          let publicationCanisterId = U.safeGet(publicationCanisterIdsHashmap, postModel.handle, "");
          if(not isEditor(publicationCanisterId, caller)){
            return #err(Unauthorized)
          }
          else if(postModel.isDraft){
            return #err("Premium articles can not be draft.");
          };

          let numberOfEditors = U.safeGet(publicationEditorsHashmap, publicationCanisterId, []).size();
          if(not (premiumInfo.maxSupply > numberOfEditors + 1)){
            return #err("The number of NFTs are not enough for editors.")
          };

          //check the price
          if(not (premiumInfo.icpPrice > 1000)){
            return #err("Price is too low.");
          };

          //check the number of tokens
          if(premiumInfo.maxSupply > 100_000){
            return #err("Total supply is too much.")
          };
        };
        };
        case(null) {
          //nothing to check
        };
    };

    // ensure the tags exist
    for (tagId in postModel.tagIds.vals()) {
      if (tagsHashMap.get(tagId) == null) {
        return #err(InvalidTagId # ": " # tagId);
      };
    };

    if (postModel.content == "") {
      return #err("Body can not be empty.");
    };

    if (postModel.tagIds.size() == 0) {
      return #err("There should be at least 1 tag id.");
    };

    if (postModel.tagIds.size() > 3) {
      return #err("There can be maximum of 3 tag ids.");
    };

    var tagNamesBuffer = Buffer.Buffer<Text>(0);
    for (tagId in postModel.tagIds.vals()) {
      let tagName = U.safeGet(tagsHashMap, tagId, { value = ""; id = ""; createdDate = 0 }).value;
      if (tagName != "") {
        tagNamesBuffer.add(tagName);
      };
    };

    // retrieve user handle if it's not already mapped to the principalId
    var userHandle = if(isPublication){postModel.handle} else{U.safeGet(handleHashMap, callerPrincipalId, "")};
    if (userHandle == "") {

      let UserCanister = CanisterDeclarations.getUserCanister();
      var user = await UserCanister.getUserInternal(callerPrincipalId);
      switch (user) {
        case (null) return #err("cross canister User not found");
        case (?value) {
          userHandle := value.handle;
          handleHashMap.put(callerPrincipalId, value.handle);
          handleReverseHashMap.put(value.handle, callerPrincipalId);
          lowercaseHandleHashMap.put(callerPrincipalId, U.lowerCase(value.handle));
          lowercaseHandleReverseHashMap.put(U.lowerCase(value.handle), callerPrincipalId);
        };
      };
    };

    Debug.print("PostCore-> calling the bucket actor save method.");
    //build the premium data passing to bucketActor
    let premiumData = switch(postModel.premium) {
      case(?data) {
        let publicationCanisterId = U.safeGet(publicationCanisterIdsHashmap, postModel.handle, "");
        ?{
          icpPrice = data.icpPrice;
          maxSupply = data.maxSupply;
          thumbnail = data.thumbnail;
          editorPrincipals = U.safeGet(publicationEditorsHashmap, publicationCanisterId, []);
        }
      };
      case(null) {
        null
      };
    };
    let saveReturn = await bucketActor.save({
      caller = caller;
      handle = userHandle;
      postOwnerPrincipalId = postOwnerPrincipalId;
      category = postModel.category;
      content = postModel.content;
      creatorHandle = postModel.creatorHandle;
      headerImage = postModel.headerImage;
      isDraft = postModel.isDraft;
      premium = premiumData;
      isMembersOnly = postModel.isMembersOnly;
      isPublication = isPublication;
      postId = postModel.postId;
      subtitle = postModel.subtitle;
      tagNames = Buffer.toArray(tagNamesBuffer);
      title = postModel.title;
      scheduledPublishedDate = postModel.scheduledPublishedDate
    });

    switch (saveReturn) {
      case (#ok(postBucketReturn)) {
        //if the bucket canister saved the post succesfully, change the internal state (tagIds, modclub - postVersion - indexing- user post ids)

        await addOrUpdatePost(isNew, postOwnerPrincipalId, postModel.tagIds, bucketCanisterId, postBucketReturn);

        // add this postId to the user's posts if not already added
        addPostIdToUser(postOwnerPrincipalId, postBucketReturn.postId);

        // if it's a publication post add this postId to the writer's posts if not already added
        if (postBucketReturn.isPublication and creatorPrincipal != "") {
          addPostIdToUser(creatorPrincipal, postBucketReturn.postId);
        };

        //if a premium post, store the nft canister id
        switch(postBucketReturn.nftCanisterId) {
          case(?cai) {
            postIdsToNftCanisterIdsHashMap.put(postBucketReturn.postId, cai);
          };
          case(null) {
            //do nothing
          };
        };
        
        //store version
        var postVersion = 1;
        if (not isNew) {
          switch (postVersionMap.get(postBucketReturn.postId)) {
            case (null)();
            case (?version) {
              postVersion := version + 1;
            };
          };
        };
        postVersionMap.put(postBucketReturn.postId, postVersion);

        // TODO: should we move indexing to the modclub callback function when content is approved?
        // returns UnauthorizedError if this canister is not registered as an admin in the PostIndex canister
        let handle = postBucketReturn.handle;
        let prevTitle = postBucketReturn.title;
        let prevSubtitle = postBucketReturn.subtitle;
        let prevContent = postBucketReturn.content;
        let previous = handle # " " # prevTitle # " " # prevSubtitle;
        let current = handle # " " # postModel.title # " " # postModel.subtitle;
        let prevTags = getTagNamesByPostId(postBucketReturn.postId);
        let currentTags = getTagNamesByTagIds(postModel.tagIds);
        let PostIndexCanister = CanisterDeclarations.getPostIndexCanister();
        var indexResult = await PostIndexCanister.indexPost(postBucketReturn.postId, previous, current, prevTags, currentTags);

        switch (indexResult) {
          case (#ok(id)) Debug.print("indexed post id: " # id);
          case (#err(msg)) return #err(msg);
        };

        ignore submitPostToModclub(postBucketReturn.postId, postBucketReturn, postVersion);

        let keyProperties = buildPostKeyProperties(postBucketReturn.postId);
        return #ok({
          bucketCanisterId = bucketCanisterId;
          category = postBucketReturn.category;
          claps = keyProperties.claps;
          content = postBucketReturn.content;
          created = postBucketReturn.created;
          creatorHandle = postBucketReturn.creatorHandle;
          creatorPrincipal = postBucketReturn.creatorPrincipal;
          handle = postBucketReturn.handle;
          headerImage = postBucketReturn.headerImage;
          isDraft = postBucketReturn.isDraft;
          isPremium = postBucketReturn.isPremium;
          isMembersOnly = postBucketReturn.isMembersOnly;
          nftCanisterId = postBucketReturn.nftCanisterId;
          isPublication = postBucketReturn.isPublication;
          modified = postBucketReturn.modified;
          postId = postBucketReturn.postId;
          publishedDate = postBucketReturn.publishedDate;
          subtitle = postBucketReturn.subtitle;
          tags = keyProperties.tags;
          title = postBucketReturn.title;
          url = postBucketReturn.url;
          wordCount = postBucketReturn.wordCount;
          views = keyProperties.views;
        });
      };
      case (#err(err)) {
        //if the bucket canister returns an error, return the same error
        return #err(err);
      };
    };

  };

  //migration function for new nft canister architecture
  public shared ({caller}) func migratePremiumArticleFromOldArch() : async Result.Result<PostKeyProperties, Text> {
    if(not isPlatformOperator(caller)){
      return #err(Unauthorized)
    };
    //(postId, bucketCanisterId)
    let allNotMigratedPostIds = Buffer.Buffer<(Text, Text)>(0);
    for(bucketCanisterId in bucketCanisterIdsHashMap.keys()){
      let bucketCanister = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);
      let notMigratedPostIds = await bucketCanister.getNotMigratedPremiumArticlePostIds();
      for(postId in notMigratedPostIds.vals()){
        allNotMigratedPostIds.add((postId, bucketCanisterId));
      }
    };
    if(allNotMigratedPostIds.size() == 0){
      return #err("There is no remaining not migrated premium articles left. Congrats!");
    };
    //if here, there's still some posts to migrate
    let migratingPostId = Buffer.toArray(allNotMigratedPostIds)[0].0;
    let migratingPostBucketCanisterId = Buffer.toArray(allNotMigratedPostIds)[0].1;
    let bucketCanister = CanisterDeclarations.getPostBucketCanister(migratingPostBucketCanisterId);
    switch(await bucketCanister.migratePremiumArticleFromOldArch(migratingPostId, null)) {
      case(#ok(nftCanisterId)) {
        //successful migration
        //put the canister id to postIdsToNftCanisterIdsHashMap
        postIdsToNftCanisterIdsHashMap.put(migratingPostId, nftCanisterId);
        return #ok(buildPostKeyProperties(migratingPostId));
      };
      case(#err(error)) {
        //an error happened in bucket canister
        //return the error
        return #err(error);
      };
    };
  };

  public shared ({ caller }) func makePostPublication(postId : Text, publicationHandle : Text, userHandle : Text, isDraft : Bool) : async () {
    if (isAnonymous(caller)) {
      return;
    };

    if (not isThereEnoughMemoryPrivate()) {
      return;
    };

    switch (bucketCanisterIdsHashMap.get(Principal.toText(caller))) {
      case (?value) {
        //caller is a bucket canister
        //continue
      };
      case (_) {
        return;
      };
    };

    var publicationPrincipalId = U.safeGet(handleReverseHashMap, publicationHandle, "");
    let userPrincipalId = U.safeGet(handleReverseHashMap, userHandle, "");

    //if the publication canister id is not stored in the bucket canister, fetch it from user canister and store it first.
    if (publicationPrincipalId == "") {
      let UserCanister = CanisterDeclarations.getUserCanister();
      let userReturn = await UserCanister.getPrincipalByHandle(U.lowerCase(publicationHandle));
      switch (userReturn) {
        case (#ok(principal)) {
          switch (principal) {
            case (?value) {
              publicationPrincipalId := value;
              handleHashMap.put(publicationPrincipalId, publicationHandle);
              handleReverseHashMap.put(publicationHandle, publicationPrincipalId);
              lowercaseHandleHashMap.put(publicationPrincipalId, U.lowerCase(publicationHandle));
              lowercaseHandleReverseHashMap.put(U.lowerCase(publicationHandle), publicationPrincipalId);
            };
            case (null) {
              assert false;
            };
          };
        };
        case (_) {
          assert false;
        };
      };
    };

    if (not Text.equal(publicationPrincipalId, "") and not Text.equal(userPrincipalId, "")) {
      //change the principal-id of the post to publication principal-id
      principalIdHashMap.put(postId, publicationPrincipalId);
      //add postId to publication's posts
      addPostIdToUser(publicationPrincipalId, postId);
      if (isDraft) {
        //if draft, remove the published date value if exists
        publishedDateHashMap.delete(postId);
        //remove the post from popular posts if it's draft
        removePostFromPopularityArrays(postId);
        //ToDo: remove the post from latest posts if it's draft
      } else {
        let now = U.epochTime();
        modifiedHashMap.put(postId, now);
        isDraftHashMap.put(postId, isDraft);
      };

    };
  };

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

  public shared ({caller}) func addPostIdToUserDebug(principalId: Text, postId: Text) : async Result.Result<(), Text> {
    if(not isPlatformOperator(caller)){
      return #err(Unauthorized)
    };
    #ok(addPostIdToUser(principalId, postId))
  };

  public shared ({caller}) func removePostIdToUserDebug(principalId: Text, postId: Text) : async Result.Result<(), Text> {
    if(not isPlatformOperator(caller)){
      return #err(Unauthorized)
    };
    #ok(removePostIdFromUser(principalId, postId))
  };

  private func addPostIdToUser(principalId: Text, postId: Text) : () {
    // add this postId to the user's posts if not already added
    var userPostIds = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());
    let exists = List.find<Text>(userPostIds, func(val : Text) : Bool { val == postId });
    if (exists == null) {
      let updatedUserPostIds = List.append<Text>(List.fromArray([postId]), userPostIds);
      userPostsHashMap.put(principalId, updatedUserPostIds);
    };
  };

  private func removePostIdFromUser(principalId: Text, postId: Text) : () {
    var existingPostIds = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());
    let filteredPostIds = List.filter<Text>(existingPostIds, func(val : Text) : Bool { val != postId });
    userPostsHashMap.put(principalId, filteredPostIds);
  };

  public shared ({caller}) func removePostFromPopularityArrays(id: Text) : () {
    if(idInternal() != caller){
      return;
    };
    popularitySortedArray := Array.filter<(Text, Nat)>(popularitySortedArray, func ((postId : Text, p: Nat)) : Bool {postId != id;});
    popularitySortedArrayToday := Array.filter<(Text, Nat)>(popularitySortedArrayToday, func ((postId : Text, p: Nat)) : Bool {postId != id;});
    popularitySortedArrayThisWeek := Array.filter<(Text, Nat)>(popularitySortedArrayThisWeek, func ((postId : Text, p: Nat)) : Bool {postId != id;});
    popularitySortedArrayThisMonth := Array.filter<(Text, Nat)>(popularitySortedArrayThisMonth, func ((postId : Text, p: Nat)) : Bool {postId != id;});
  };

  private func addOrUpdatePost(isNew : Bool, principal : Text, tagIds : [Text], bucketCanisterId : Text, saveReturn : PostBucketType) : async () {

    principalIdHashMap.put(saveReturn.postId, principal);
    postIdsToBucketCanisterIdsHashMap.put(saveReturn.postId, bucketCanisterId);
    modifiedHashMap.put(saveReturn.postId, U.textToNat(saveReturn.modified));
    if (isNew) {
      createdHashMap.put(saveReturn.postId, U.textToNat(saveReturn.created));
    };
    let post = buildPostKeyProperties(saveReturn.postId);
    if (not saveReturn.isDraft) {
      publishedDateHashMap.put(saveReturn.postId, U.textToNat(saveReturn.publishedDate));
      if(not U.arrayContains(Iter.toArray(latestPostsHashmap.vals()), saveReturn.postId)){
        latestPostsHashmap.put(Int.toText(latestPostsHashmap.size()), saveReturn.postId);
      }
    };

    //publishedDate
    addOrUpdatePostTag(saveReturn.postId, tagIds);

    //draft
    if (saveReturn.isDraft) {
      isDraftHashMap.put(saveReturn.postId, saveReturn.isDraft);
      //remove the post from popularity sorted arrays
      removePostFromPopularityArrays(saveReturn.postId);
      //delete the publishedDate value if exists
      publishedDateHashMap.delete(saveReturn.postId);
    } else {
      isDraftHashMap.delete(saveReturn.postId);
    };

    if (saveReturn.category == "") {
      categoryHashMap.delete(saveReturn.postId);
    } else {
      categoryHashMap.put(saveReturn.postId, saveReturn.category);
    };
  };
  

  //returns the user's posts excluding the drafts
  public shared query ({ caller }) func getUserPosts(handle : Text) : async [PostKeyProperties] {
    Debug.print("PostCore->GetUserPosts: " # handle);

    //validate input
    if (not U.isTextLengthValid(handle, 64)) {
      return [];
    };

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(0);
    let trimmedHandle = U.trim(handle);
    let callerPrincipalId = Principal.toText(caller);
    let authorPrincipalId = U.safeGet(lowercaseHandleReverseHashMap, trimmedHandle, "");

    if (authorPrincipalId != "") {
      let userPostIds = U.safeGet(userPostsHashMap, authorPrincipalId, List.nil<Text>());

      Debug.print("PostCore->GetUserPosts: " # trimmedHandle # " " # authorPrincipalId # " " # debug_show (userPostIds));

      List.iterate(
        userPostIds,
        func(postId : Text) : () {
          let isDraft = isDraftOrFutureArticle(postId);

          if (not isDraft and not rejectedByModClub(postId)) {
            let postListItem = buildPostKeyProperties(postId);
            postsBuffer.add(postListItem);
          };
        },
      );
    };

    Buffer.toArray(postsBuffer);
  };

  //returns the list of bucket canister ids that stores the posts of given handles
  public shared query func getBucketCanisterIdsOfGivenHandles(handles : [Text]) : async [Text] {
    var usingBucketCanisterIds = Buffer.Buffer<Text>(0);
    for (handle in handles.vals()) {
      let principalId = U.safeGet(handleReverseHashMap, handle, "");
      if (principalId != "") {
        let postIds = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());
        for (postId in Iter.fromList(postIds)) {
          let bucketCanisterId = U.safeGet(postIdsToBucketCanisterIdsHashMap, postId, "");
          if (bucketCanisterId != "" and not U.arrayContains(Buffer.toArray(usingBucketCanisterIds), bucketCanisterId)) {
            usingBucketCanisterIds.add(bucketCanisterId);
          };
        };
      };
    };
    return Buffer.toArray(usingBucketCanisterIds);
  };

  //returns the posts of given postIds excluding the drafts
  public shared query func getPostsByPostIds(postIds : [Text]) : async [PostKeyProperties] {
    Debug.print("PostCore->GetPostsByPostIds");

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(0);

    let givenPostIds = List.fromArray(postIds);

    List.iterate(
      givenPostIds,
      func(postId : Text) : () {
        //validate input
        if (not U.isTextLengthValid(postId, 20)) {
          return;
        };

        let isDraft = isDraftOrFutureArticle(postId);
        if (not isDraft and not rejectedByModClub(postId)) {
          let postListItem = buildPostKeyProperties(postId);
          postsBuffer.add(postListItem);
        };
      },
    );

    Buffer.toArray(postsBuffer);
  };

  //returns the publication's posts
  //only callable by editors of the given publication
  public shared query ({ caller }) func getPublicationPosts(
    indexFrom : Nat32,
    indexTo : Nat32,
    publicationHandle: Text
  ) : async [PostKeyProperties] {

    let publicationCanisterId = U.safeGet(publicationCanisterIdsHashmap, publicationHandle, "");
    if(not isEditor(publicationCanisterId, caller)){
      //caller is not editor
      //return an empty array
      return [];
    };

    Debug.print("PostCore->getPublicationPosts");

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    let publicationPosts = U.safeGet(userPostsHashMap, publicationCanisterId, List.nil<Text>());

    // filter: draft or published state
    // posts are already stored desc by created time
    let postIds = List.toArray(publicationPosts);

    // prevent underflow error
    let l : Nat = postIds.size();
    if (l == 0) {
      return [];
    };

    let lastIndex : Nat = l - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return [];
    };

    var indexEnd = Nat32.toNat(indexTo) - 1;
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };

    for (i in Iter.range(indexStart, indexEnd)) {
      Debug.print(debug_show(i));
      let postListItem = buildPostKeyProperties(postIds[i]);
      postsBuffer.add(postListItem);
    };

    Buffer.toArray(postsBuffer);
  };
  //returns the caller's posts
  public shared query ({ caller }) func getMyAllPosts(
    indexFrom : Nat32,
    indexTo : Nat32,
  ) : async [PostKeyProperties] {

    Debug.print("PostCore->getMyPosts");

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    let callerPrincipalId = Principal.toText(caller);
    let userPosts = U.safeGet(userPostsHashMap, callerPrincipalId, List.nil<Text>());

    // posts are already stored desc by created time
    let postIds = List.toArray(userPosts);

    // prevent underflow error
    let l : Nat = postIds.size();
    if (l == 0) {
      return [];
    };

    let lastIndex : Nat = l - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return [];
    };

    var indexEnd = Nat32.toNat(indexTo) - 1;
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };

    for (i in Iter.range(indexStart, indexEnd)) {
      let postListItem = buildPostKeyProperties(postIds[i]);
      postsBuffer.add(postListItem);
    };

    Buffer.toArray(postsBuffer);
  };

  //returns the caller's posts
  public shared query ({ caller }) func getMyDraftPosts(
    indexFrom : Nat32,
    indexTo : Nat32,
  ) : async [PostKeyProperties] {

    Debug.print("PostCore->getMyPosts");

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    let callerPrincipalId = Principal.toText(caller);
    let userPosts = U.safeGet(userPostsHashMap, callerPrincipalId, List.nil<Text>());

    // filter: only draft posts (exclude submitted for review posts)
    // posts are already stored desc by created time
    let postIds = Array.filter<Text>(
      List.toArray(userPosts),
      func filter(postId : Text) : Bool {
        let isDraft = U.safeGet(isDraftHashMap, postId, false);
        let postOwnerPrincipalId = U.safeGet(principalIdHashMap, postId, "");
        return isDraft and postOwnerPrincipalId == callerPrincipalId;
      },
    );

    // prevent underflow error
    let l : Nat = postIds.size();
    if (l == 0) {
      return [];
    };

    let lastIndex : Nat = l - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return [];
    };

    var indexEnd = Nat32.toNat(indexTo) - 1;
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };

    for (i in Iter.range(indexStart, indexEnd)) {
      let postListItem = buildPostKeyProperties(postIds[i]);
      postsBuffer.add(postListItem);
    };

    Buffer.toArray(postsBuffer);
  };

  //returns the caller's posts
  public shared query ({ caller }) func getMySubmittedToReviewPosts(
    indexFrom : Nat32,
    indexTo : Nat32,
  ) : async [PostKeyProperties] {

    Debug.print("PostCore->getMyPosts");

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    let callerPrincipalId = Principal.toText(caller);
    let userPosts = U.safeGet(userPostsHashMap, callerPrincipalId, List.nil<Text>());

    // filter: only submitted for review posts
    // posts are already stored desc by created time
    let postIds = Array.filter<Text>(
      List.toArray(userPosts),
      func filter(postId : Text) : Bool {
        let isDraft = U.safeGet(isDraftHashMap, postId, false);
        let postOwnerPrincipalId = U.safeGet(principalIdHashMap, postId, "");
        return isDraft and postOwnerPrincipalId != callerPrincipalId;
      },
    );

    // prevent underflow error
    let l : Nat = postIds.size();
    if (l == 0) {
      return [];
    };

    let lastIndex : Nat = l - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return [];
    };

    var indexEnd = Nat32.toNat(indexTo) - 1;
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };

    for (i in Iter.range(indexStart, indexEnd)) {
      let postListItem = buildPostKeyProperties(postIds[i]);
      postsBuffer.add(postListItem);
    };

    Buffer.toArray(postsBuffer);
  };

  //returns the caller's planned posts key properties
  public shared query ({ caller }) func getMyPlannedPosts(
    indexFrom : Nat32,
    indexTo : Nat32,
  ) : async [PostKeyProperties] {

    Debug.print("PostCore->getMyPosts");

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    let callerPrincipalId = Principal.toText(caller);
    let userPosts = U.safeGet(userPostsHashMap, callerPrincipalId, List.nil<Text>());
    let now = U.epochTime();

    // filter: only planned posts
    // posts are already stored desc by created time
    let postIds = Array.filter<Text>(
      List.toArray(userPosts),
      func filter(postId : Text) : Bool {
        let isDraft = U.safeGet(isDraftHashMap, postId, false);
        let publishedDate = U.safeGet(publishedDateHashMap, postId, now);
        return (not isDraft) and publishedDate > now;
      },
    );

    // prevent underflow error
    let l : Nat = postIds.size();
    if (l == 0) {
      return [];
    };

    let lastIndex : Nat = l - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return [];
    };

    var indexEnd = Nat32.toNat(indexTo) - 1;
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };

    for (i in Iter.range(indexStart, indexEnd)) {
      let postListItem = buildPostKeyProperties(postIds[i]);
      postsBuffer.add(postListItem);
    };

    Buffer.toArray(postsBuffer);
  };

  //returns the caller's posts
  public shared query ({ caller }) func getMyPublishedPosts(
    indexFrom : Nat32,
    indexTo : Nat32,
  ) : async [PostKeyProperties] {

    Debug.print("PostCore->getMyPosts");

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    let callerPrincipalId = Principal.toText(caller);
    let userPosts = U.safeGet(userPostsHashMap, callerPrincipalId, List.nil<Text>());

    // filter: only published posts
    // posts are already stored desc by created time
    let postIds = Array.filter<Text>(
      List.toArray(userPosts),
      func filter(postId : Text) : Bool {
        let isDraft = U.safeGet(isDraftHashMap, postId, false);
        return not isDraft
      },
    );

    // prevent underflow error
    let l : Nat = postIds.size();
    if (l == 0) {
      return [];
    };

    let lastIndex : Nat = l - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return [];
    };

    var indexEnd = Nat32.toNat(indexTo) - 1;
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };

    for (i in Iter.range(indexStart, indexEnd)) {
      let postListItem = buildPostKeyProperties(postIds[i]);
      postsBuffer.add(postListItem);
    };

    Buffer.toArray(postsBuffer);
  };

  public shared query func getUsersPostCountsByHandles(userHandles: [Text]) : async [UserPostCounts] {
    let result = Buffer.Buffer<UserPostCounts>(0);
    let now = U.epochTime();

    for(userHandle in userHandles.vals()){
      let trimmedHandle = U.trim(userHandle);
      var totalPostCount : Nat = 0;
      var draftCount : Nat = 0;
      var submittedToReviewCount : Nat = 0;
      var premiumCount : Nat = 0;
      var plannedCount : Nat = 0;
      var publishedCount : Nat = 0;
      var totalViewCount : Nat = 0;
      var totalClapCount : Nat = 0;

      let principalId = U.safeGet(lowercaseHandleReverseHashMap, trimmedHandle, "");
      if (principalId != "") {

        let userPostIds = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());

        totalPostCount := List.size(userPostIds);

        List.iterate(
          userPostIds,
          func(postId : Text) : () {
            let isDraft = U.safeGet(isDraftHashMap, postId, false);
            let postOwnerPrincipalId = U.safeGet(principalIdHashMap, postId, "");
            let publishedDate = U.safeGet(publishedDateHashMap, postId, now);

            if (isDraft) {
              if(postOwnerPrincipalId != principalId){
                submittedToReviewCount += 1;
              }
              else{
                draftCount += 1;
              }
            } else {
              if(publishedDate > now){
                plannedCount += 1;
              }
              else{
                publishedCount += 1;
              }
            };

            if(postIdsToNftCanisterIdsHashMap.get(postId) != null){
              premiumCount += 1;
            };

            let postViewCount = U.safeGet(viewsHashMap, postId, 0);
            totalViewCount += postViewCount;
            let clapCount = U.safeGet(clapsHashMap, postId, 0);
            totalClapCount += clapCount;
            let applauds_e8s = (U.safeGet(applaudsHashMap, postId, 0));
            let applauds = Float.fromInt(applauds_e8s) / Float.pow(10, Float.fromInt(ENV.NUA_TOKEN_DECIMALS));
            let applaudsNat = Int.abs(Float.toInt(Float.nearest(applauds)));
            totalClapCount += applaudsNat;
          },
        );
      };

      let userPostCounts = {
        handle = U.safeGet(handleHashMap, principalId, "");
        totalPostCount = Nat.toText(totalPostCount);
        publishedCount = Nat.toText(publishedCount);
        premiumCount = Nat.toText(premiumCount);
        draftCount = Nat.toText(draftCount);
        plannedCount = Nat.toText(plannedCount);
        submittedToReviewCount = Nat.toText(submittedToReviewCount);
        totalViewCount = Nat.toText(totalViewCount);
        // TODO: Implement counts
        uniqueClaps = Nat.toText(totalClapCount);
        uniqueReaderCount = "0";
      };
      result.add(userPostCounts);
    };

    Buffer.toArray(result)
  };

  //returns user's post counts
  public shared query func getUserPostCounts(userHandle : Text) : async UserPostCounts {
    // Iterates all of the user's posts, then adds up the
    // draft and published counts and the total view count of all posts.
    let now = U.epochTime();
    let trimmedHandle = U.trim(userHandle);
    var totalPostCount : Nat = 0;
    var draftCount : Nat = 0;
    var plannedCount : Nat = 0;
    var submittedToReviewCount : Nat = 0;
    var premiumCount : Nat = 0;
    var publishedCount : Nat = 0;
    var totalViewCount : Nat = 0;
    var totalClapCount : Nat = 0;

    let principalId = U.safeGet(lowercaseHandleReverseHashMap, trimmedHandle, "");
    if (principalId != "") {

      let userPostIds = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());

      totalPostCount := List.size(userPostIds);

      List.iterate(
        userPostIds,
        func(postId : Text) : () {
          let isDraft = U.safeGet(isDraftHashMap, postId, false);
          let postOwnerPrincipalId = U.safeGet(principalIdHashMap, postId, "");
          let publishedDate = U.safeGet(publishedDateHashMap, postId, now);

          if (isDraft) {
            if(postOwnerPrincipalId != principalId){
              submittedToReviewCount += 1;
            }
            else{
              draftCount += 1;
            }
          } else {
            if(publishedDate > now){
              plannedCount += 1;
            }
            else{
              publishedCount += 1;
            }
            
          };

          if(postIdsToNftCanisterIdsHashMap.get(postId) != null){
            premiumCount += 1;
          };
          

          let postViewCount = U.safeGet(viewsHashMap, postId, 0);
          totalViewCount += postViewCount;
          let clapCount = U.safeGet(clapsHashMap, postId, 0);
          totalClapCount += clapCount;
          let applauds_e8s = (U.safeGet(applaudsHashMap, postId, 0));
          let applauds = Float.fromInt(applauds_e8s) / Float.pow(10, Float.fromInt(ENV.NUA_TOKEN_DECIMALS));
          let applaudsNat = Int.abs(Float.toInt(Float.nearest(applauds)));
          totalClapCount += applaudsNat;
        },
      );
    };

    {
      handle = U.safeGet(handleHashMap, principalId, "");
      totalPostCount = Nat.toText(totalPostCount);
      publishedCount = Nat.toText(publishedCount);
      premiumCount = Nat.toText(premiumCount);
      draftCount = Nat.toText(draftCount);
      plannedCount = Nat.toText(plannedCount);
      submittedToReviewCount = Nat.toText(submittedToReviewCount);
      totalViewCount = Nat.toText(totalViewCount);
      // TODO: Implement counts
      uniqueClaps = Nat.toText(totalClapCount);
      uniqueReaderCount = "0";
    };
  };
  //returns latest posts only by key properties
  public shared query func getLatestPosts(indexFrom : Nat32, indexTo : Nat32) : async GetPostsByFollowers {
    canistergeekMonitor.collectMetrics();
    Debug.print("PostCore->LatestPosts");

    let totalCount = latestPostsHashmap.size();
    let lastIndex : Nat = totalCount - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return {
        totalCount = "0";
        posts = [];
      };

    };

    var indexEnd = Nat32.toNat(indexTo) - 1;
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);

    for (i in Iter.range(indexStart, indexEnd)) {
      //get the post id from latestPostsHashmap to build post
      let post = buildPostKeyProperties(U.safeGet(latestPostsHashmap, Nat.toText((latestPostsHashmap.size() - 1) - i), ""));
      let isDraft = isDraftOrFutureArticle(post.postId);

      if (rejectedByModClub(post.postId)) {
        Debug.print("rejected");
        indexEnd := indexEnd + 1;
      } else if (isDraft) {
        Debug.print("Post is draft");
        indexEnd := indexEnd + 1;
      } else {
        postsBuffer.add(post);
        Debug.print("Post is successfully added");
      };
    };

    {
      totalCount = Nat.toText(latestPostsHashmap.size());
      posts = Buffer.toArray(postsBuffer);
    };
  };
  //returns the post ids of the user
  public shared query func getUserPostIds(userHandle : Text) : async Result.Result<[Text], Text> {

    //validate input
    if (not U.isTextLengthValid(userHandle, 64)) {
      return #err("Handle length is invalid");
    };

    switch (lowercaseHandleReverseHashMap.get(userHandle)) {
      case null { return #err(UserNotFound) };
      case (?principalId) {
        let userPostIds = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());
        return #ok(List.toArray(userPostIds));
      };
    };
  };

  //load more of the latest posts
  public shared query func getMoreLatestPosts(indexFrom : Nat32, indexTo : Nat32) : async [PostKeyProperties] {
    Debug.print("PostCore->getMoreLatestPosts");

    if (indexTo > Nat32.fromNat(latestPostsHashmap.size())) {
      return [];
    };

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    let indexStart = Nat32.toNat(indexFrom);
    let indexEnd = Nat32.toNat(indexTo) - 1;

    for (i in Iter.range(indexStart, indexEnd)) {
      let post = buildPostKeyProperties(Nat.toText(i));
      let isDraft = isDraftOrFutureArticle(post.postId);
      //do not add draft posts
      if (not isDraft and not rejectedByModClub(Nat.toText(i))) {
        postsBuffer.add(post);
      };
    };

    Buffer.toArray(postsBuffer);
  };

  public shared query func getPostsByFollowers(handles : [Text], indexFrom : Nat32, indexTo : Nat32) : async GetPostsByFollowers {
    Debug.print("PostCore->getPostsByFollowers");
    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    var postIdsBuffer : Buffer.Buffer<Text> = Buffer.Buffer<Text>(10);

    if (handles.size() > 0) {
      label l for (handle in Iter.fromArray(handles)) {
        //validate input
        if (not U.isTextLengthValid(handle, 64)) {
          return {
            totalCount = "Handle length invalid";
            posts = [];
          };
        };
        let trimmedHandle = U.trim(handle);
        let principalId = U.safeGet(lowercaseHandleReverseHashMap, trimmedHandle, "");
        if (principalId != "") {
          let userPostIds = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());
          List.iterate(
            userPostIds,
            func(postId : Text) : () {
              //check if draft
              let isDraft = isDraftOrFutureArticle(postId);
              if (not isDraft and not rejectedByModClub(postId) and not U.arrayContains(Buffer.toArray(postIdsBuffer), postId)) {
                postIdsBuffer.add(postId);
              };
            },
          );
        };
      };
      //page the results from newest to oldest
      let postIds = Array.sort(
        Iter.toArray(postIdsBuffer.vals()),
        func(postId_1 : Text, postId_2 : Text) : { #less; #equal; #greater } {
          let post_1_created = U.safeGet(createdHashMap, postId_1, 0);
          let post_2_created = U.safeGet(createdHashMap, postId_2, 0);
          return Int.compare(post_2_created, post_1_created);
        },
      );

      let totalCount = postIds.size();

      if (totalCount == 0) {
        return {
          totalCount = "0";
          posts = [];
        };
      };

      let lastIndex : Nat = totalCount - 1;

      let indexStart = Nat32.toNat(indexFrom);
      if (indexStart > lastIndex) {
        return {
          totalCount = "0";
          posts = [];
        };
      };

      var indexEnd = Nat32.toNat(indexTo) - 1;
      if (indexEnd > lastIndex) {
        indexEnd := lastIndex;
      };

      for (i in Iter.range(indexStart, indexEnd)) {
        let post = buildPostKeyProperties(postIds[i]);
        postsBuffer.add(post);
      };

      {
        totalCount = Nat.toText(postIdsBuffer.size());
        posts = Buffer.toArray(postsBuffer);
      };
    } else {

      {
        totalCount = "0";
        posts = [];
      };
    };
  };
  //#category management
  public shared query func getPostsByCategory(handle : Text, category : Text, indexFrom : Nat32, indexTo : Nat32) : async GetPostsByFollowers {

    //validate input
    if (not U.isTextLengthValid(handle, 64) or not U.isTextLengthValid(category, 64)) {
      return {
        totalCount = "Text length invalid";
        posts = [];
      };
    };

    Debug.print("PostCore->getPostsByCategory");

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    let principalId = U.safeGet(lowercaseHandleReverseHashMap, handle, "");
    if (principalId != "") {
      let userPosts = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());

      // filter: draft or published state
      // posts are already stored desc by created time
      let postIds = Array.filter<Text>(
        List.toArray(userPosts),
        func filter(postId : Text) : Bool {
          let post = buildPostKeyProperties(postId);
          let isDraft = isDraftOrFutureArticle(postId);
          not isDraft and Text.equal(U.trim_category_name(post.category), category);
        },
      );

      // prevent underflow error
      let l : Nat = postIds.size();
      if (l == 0) {
        return {
          totalCount = "0";
          posts = [];
        };
      };

      let lastIndex : Nat = l - 1;

      let indexStart = Nat32.toNat(indexFrom);
      if (indexStart > lastIndex) {
        return {
          totalCount = "0";
          posts = [];
        };
      };

      var indexEnd = Nat32.toNat(indexTo) - 1;
      if (indexEnd > lastIndex) {
        indexEnd := lastIndex;
      };

      for (i in Iter.range(indexStart, indexEnd)) {
        let postListItem = buildPostKeyProperties(postIds[i]);
        postsBuffer.add(postListItem);
      };

      return {
        totalCount = Nat.toText(postIds.size());
        posts = Buffer.toArray(postsBuffer);
      };
    } else {
      return {
        totalCount = "0";
        posts = [];
      };
    };
  };
  //category management normally handled by bucket canisters. PostCore canister only holds the value
  //this method can only be called by the PostBucket canister
  public shared ({ caller }) func addPostCategory(postId : Text, category : Text, time : Int) : async () {
    if (isAnonymous(caller)) {
      return;
    };

    if (not isThereEnoughMemoryPrivate()) {
      return;
    };

    switch (bucketCanisterIdsHashMap.get(Principal.toText(caller))) {
      case (?value) {
        //caller is a bucket canister
        if (category == "") {
          categoryHashMap.delete(postId);
          modifiedHashMap.put(postId, time);
        } else {
          categoryHashMap.put(postId, category);
          modifiedHashMap.put(postId, time);
        };
      };
      case (_) {};
    };
  };


  //isDraft management normally handled by bucket canisters. PostCore canister only holds the value if it's true
  //this method can only be called by the PostBucket canister
  public shared ({ caller }) func updatePostDraft(postId : Text, isDraft : Bool, time : Int, writerPrincipalId : Text) : async PostKeyProperties {

    //validate inputs
    if (not U.isTextLengthValid(postId, 20)) {
      return buildPostKeyProperties("");
    };

    if (not isThereEnoughMemoryPrivate()) {
      assert false;
    };

    let principalFromText = Principal.fromText(writerPrincipalId);

    switch (bucketCanisterIdsHashMap.get(Principal.toText(caller))) {
      case (?value) {
        //caller is a bucket canister
        if (isDraft) {
          isDraftHashMap.put(postId, true);
          publishedDateHashMap.delete(postId);
          modifiedHashMap.put(postId, time);
          removePostFromPopularityArrays(postId);
          buildPostKeyProperties(postId);
        } else {
          isDraftHashMap.delete(postId);
          modifiedHashMap.put(postId, time);
          if (not U.arrayContains(Iter.toArray(latestPostsHashmap.vals()), postId)) {
            latestPostsHashmap.put(Int.toText(latestPostsHashmap.size()), postId);
          };
          buildPostKeyProperties(postId);
        };
      };
      case (_) {
        buildPostKeyProperties(postId);
      };
    };
  };

  //#region migration

  public shared ({ caller }) func copyTrustedCanisters(canisterId : Text) : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    let canister = actor (canisterId) : actor {
      getTrustedCanisters : () -> async Result.Result<[Text], Text>;
    };

    switch (await canister.getTrustedCanisters()) {
      case (#ok(canisters)) {
        for (id in canisters.vals()) {
          ignore await registerCanister(id);
        };
        return #ok(List.toArray(nuanceCanisters));
      };
      case (#err(err)) {
        return #err(err);
      };
    };
  };


  public shared ({ caller }) func handleModclubMigration(postCanisterId : Text) : async Result.Result<Text, Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    let oldPostCanister = actor (postCanisterId) : actor {
      getAllModerationStatus : () -> async Result.Result<([(Text, Nat)], [(Text, PostModerationStatus)]), Text>;
    };

    switch (await oldPostCanister.getAllModerationStatus()) {
      case (#ok(values)) {
        postVersionMap := HashMap.fromIter<Text, Nat>(Iter.fromArray(values.0), initCapacity, Text.equal, Text.hash);
        postModerationStatusMap := HashMap.fromIter<Text, PostModerationStatus>(Iter.fromArray(values.1), initCapacity, Text.equal, Text.hash);
        return #ok("Success");

      };
      case (#err(err)) {
        return #err(err);
      };
    };

  };

  //#region indexing

  //call reindex method from each bucket canister - if one of the calls return an error, return the bucket canister id
  public shared ({ caller }) func reindex() : async Result.Result<Text, Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    let PostIndexCanister = CanisterDeclarations.getPostIndexCanister();
    var result = await PostIndexCanister.clearIndex();

    switch (result) {
      case (#ok(wordCount)) Debug.print("PostBucket->reindex: Cleared " # Nat.toText(wordCount) # " words from the index");
      case (#err(msg)) return #err(msg);
    };

    var counter = 0;
    var errorCanisterIds = " ";
    for (bucketCanisterId in bucketCanisterIdsHashMap.keys()) {
      let bucketActor = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);
      switch (await bucketActor.reindex()) {
        case (#ok(c)) {
          counter += U.textToNat(c);
        };
        case (#err(err)) {
          errorCanisterIds #= " " # bucketCanisterId;
        };
      };
    };

    if (errorCanisterIds == " ") {
      return #err(errorCanisterIds);
    } else {
      return #ok(Nat.toText(counter));
    };
  };

  //#region popularity
  public shared ({ caller }) func viewPost(postId : Text) : () {
    //validate input
    if (not U.isTextLengthValid(postId, 20)) {
      return;
    };

    if (not isThereEnoughMemoryPrivate()) {
      return;
    };

    viewsHashMap.put(postId, U.safeGet(viewsHashMap, postId, 0) + 1);
    totalViewsToday += 1;
  };
  
  public shared query func debugGetApplaudsHashMap() : async [(Text, Nat)] {
    Iter.toArray(applaudsHashMap.entries())
  };

  public shared query func debugApplaudsHashMap() : async [(Text, Nat)] {
    Iter.toArray(applaudsHashMap.entries())
  };

  //only callable by 
  public shared ({caller}) func incrementApplauds(postId: Text, applauds: Nat) : async () {
    let callerPrincipal = Principal.toText(caller);
    switch(bucketCanisterIdsHashMap.get(callerPrincipal)) {
      case(?value) {
        //caller is a bucket canister
        //increment the claps
        applaudsHashMap.put(postId, U.safeGet(applaudsHashMap, postId, 0) + applauds);
      };
      case(null) {
        //caller is not authorized
        return;
      };
    };
  };

  public shared ({ caller }) func clapPost(postId : Text) : () {
    //deprecated func
    return;
  };

  private func indexPopularPosts() : () {
    Debug.print("PostCore -> indexPopularPosts is called");
    let now = U.epochTime() / 1000;
    for (key in popularityHashMap.keys()) {
      popularityHashMap.delete(key);
    };
    for (key in popularityTodayHashMap.keys()) {
      popularityTodayHashMap.delete(key);
    };
    for (key in popularityThisWeekHashMap.keys()) {
      popularityThisWeekHashMap.delete(key);
    };
    for (key in popularityThisMonthHashMap.keys()) {
      popularityThisMonthHashMap.delete(key);
    };
    for ((postId, principalId) in principalIdHashMap.entries()) {
      let isDraft = isDraftOrFutureArticle(postId);
      let isRejected = rejectedByModClub(postId);
      if (not isDraft and not isRejected) {
        //the old clapsHashMap is frozen
        //we use the new applaudsHashMap to store the applauds sent by tokens
        let clapCount = U.safeGet(clapsHashMap, postId, 0) * Nat.pow(10, ENV.NUA_TOKEN_DECIMALS) + U.safeGet(applaudsHashMap, postId, 0) + 1;
        let viewCount = (U.safeGet(viewsHashMap, postId, 0) + 1);

        let popularity = clapCount * viewCount;
        Debug.print("PostCore->getPopular: " # postId # " " # Nat.toText(popularity));

        let created = U.safeGet(createdHashMap, postId, 0);

        let DAY = 86400000000000;
        let now = Time.now();

        let todayThreshold = (now - DAY) / 1000000;
        let thisWeekThreshold = (now - 7 * DAY) / 1000000;
        let thisMonthThreshold = (now - 28 * DAY) / 1000000;

        if (created != 0 and created > todayThreshold) {
          popularityTodayHashMap.put(postId, popularity);
        };

        if (created != 0 and created > thisWeekThreshold) {
          popularityThisWeekHashMap.put(postId, popularity);
        };

        if (created != 0 and created > thisMonthThreshold) {
          popularityThisMonthHashMap.put(postId, popularity);
        };

        popularityHashMap.put(postId, popularity);
      } else {
        popularityHashMap.delete(postId);
        popularityTodayHashMap.delete(postId);
        popularityThisWeekHashMap.delete(postId);
        popularityThisMonthHashMap.delete(postId);
      };

    };
  };
  private type PopularityType = { #ever; #today; #week; #month };
  public shared ({ caller }) func sortPopularPosts(popularityType : PopularityType) : async () {
    if (isAnonymous(caller)) {
      return;
    };

    if (not isAdmin(caller) and idInternal() != caller) {
      return;
    };
    switch (popularityType) {
      case (#ever) {
        var ever = Iter.toArray(popularityHashMap.entries());
        popularitySortedArray := Array.sort<(Text, Nat)>(ever, ivEqual);
      };
      case (#today) {
        var today = Iter.toArray(popularityTodayHashMap.entries());
        popularitySortedArrayToday := Array.sort<(Text, Nat)>(today, ivEqual);
      };
      case (#week) {
        var week = Iter.toArray(popularityThisWeekHashMap.entries());
        popularitySortedArrayThisWeek := Array.sort<(Text, Nat)>(week, ivEqual);
      };
      case (#month) {
        var month = Iter.toArray(popularityThisMonthHashMap.entries());
        popularitySortedArrayThisMonth := Array.sort<(Text, Nat)>(month, ivEqual);
      };
    };
  };
  

  public shared ({ caller }) func indexPopular() : async () {
    if (isAnonymous(caller)) {
      return;
    };

    if (isAdmin(caller) or Principal.equal(caller, Principal.fromActor(PostCore)) or isPlatformOperator(caller)) {
      indexPopularPosts();
      ignore sortPopularPosts(#ever);
      ignore sortPopularPosts(#today);
      ignore sortPopularPosts(#week);
      ignore sortPopularPosts(#month);
    };
  };

  public shared query func getPopular(indexFrom : Nat32, indexTo : Nat32) : async GetPostsByFollowers {
    Debug.print("PostCore->getPopular");

    let totalCount = popularitySortedArray.size();

    if (totalCount == 0) {
      return {
        totalCount = "0";
        posts = [];
      };
    };

    let lastIndex : Nat = totalCount - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return {
        totalCount = "0";
        posts = [];
      };

    };

    var indexEnd = Nat32.toNat(indexTo) - 1;
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    for (i in Iter.range(indexStart, indexEnd)) {
      let post = buildPostKeyProperties(popularitySortedArray[lastIndex - i].0);
      postsBuffer.add(post);
    };

    {
      totalCount = Nat.toText(popularitySortedArray.size());
      posts = Buffer.toArray(postsBuffer);
    };
  };

  public shared query func getPopularToday(indexFrom : Nat32, indexTo : Nat32) : async GetPostsByFollowers {
    Debug.print("PostCore->getPopularToday");

    let totalCount = popularitySortedArrayToday.size();

    if (totalCount == 0) {
      return {
        totalCount = "0";
        posts = [];
      };
    };

    let lastIndex : Nat = totalCount - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return {
        totalCount = "0";
        posts = [];
      };

    };

    var indexEnd = Nat32.toNat(indexTo) - 1;
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    for (i in Iter.range(indexStart, indexEnd)) {
      let post = buildPostKeyProperties(popularitySortedArrayToday[lastIndex - i].0);
      postsBuffer.add(post);
    };

    {
      totalCount = Nat.toText(popularitySortedArrayToday.size());
      posts = Buffer.toArray(postsBuffer);
    };
  };

  public shared query func getPopularThisWeek(indexFrom : Nat32, indexTo : Nat32) : async GetPostsByFollowers {
    Debug.print("PostCore->getPopularThisWeek");

    let totalCount = popularitySortedArrayThisWeek.size();

    if (totalCount == 0) {
      return {
        totalCount = "0";
        posts = [];
      };
    };

    let lastIndex : Nat = totalCount - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return {
        totalCount = "0";
        posts = [];
      };

    };

    var indexEnd = Nat32.toNat(indexTo) - 1;
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    for (i in Iter.range(indexStart, indexEnd)) {
      let post = buildPostKeyProperties(popularitySortedArrayThisWeek[lastIndex - i].0);
      postsBuffer.add(post);
    };

    {
      totalCount = Nat.toText(popularitySortedArrayThisWeek.size());
      posts = Buffer.toArray(postsBuffer);
    };
  };

  public shared query func getPopularThisMonth(indexFrom : Nat32, indexTo : Nat32) : async GetPostsByFollowers {
    Debug.print("PostCore->getPopularThisMonth");

    let totalCount = popularitySortedArrayThisMonth.size();

    if (totalCount == 0) {
      return {
        totalCount = "0";
        posts = [];
      };
    };

    let lastIndex : Nat = totalCount - 1;

    let indexStart = Nat32.toNat(indexFrom);
    if (indexStart > lastIndex) {
      return {
        totalCount = "0";
        posts = [];
      };

    };

    var indexEnd = Nat32.toNat(indexTo) - 1;
    if (indexEnd > lastIndex) {
      indexEnd := lastIndex;
    };

    var postsBuffer : Buffer.Buffer<PostKeyProperties> = Buffer.Buffer<PostKeyProperties>(10);
    for (i in Iter.range(indexStart, indexEnd)) {
      let post = buildPostKeyProperties(popularitySortedArrayThisMonth[lastIndex - i].0);
      postsBuffer.add(post);
    };

    {
      totalCount = Nat.toText(popularitySortedArrayThisMonth.size());
      posts = Buffer.toArray(postsBuffer);
    };
  };

  //#SEO management

  public shared ({ caller }) func storeAllSEO() : async Result.Result<(), Text> {
    #err("Deprecated func.")
  };

  private func idInternal() : Principal {
    Principal.fromActor(PostCore);
  };

  private stable var userDailyAllowedPostNumber = 10;

  public shared query func getUserDailyAllowedPostNumber() : async Nat {
    userDailyAllowedPostNumber;
  };

  public shared ({ caller }) func setUserDailyAllowedPostNumber(newVal : Nat) : async Result.Result<Nat, Text> {
    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("setUserDailyAllowedPostNumber", Principal.toText(caller));
    userDailyAllowedPostNumber := newVal;
    return #ok(userDailyAllowedPostNumber);
  };

  private func getUserPostsCountLastDay(principal : Text) : Nat {
    let DAY : Int = 86400000000000 / 1000000;
    let oneDayAgo = U.epochTime() - DAY;
    let userPosts = U.safeGet(userPostsHashMap, principal, List.nil());

    var result = 0;
    for (postId in List.toIter(userPosts)) {
      let post = buildPostKeyProperties(postId);
      if (U.textToNat(post.created) > oneDayAgo) {
        result += 1;
      };
    };
    result;
  };

  public shared query ({ caller }) func getMyDailyPostsStatus() : async Bool {
    let principalId = Principal.toText(caller);
    return userDailyAllowedPostNumber > getUserPostsCountLastDay(principalId);
  };


  public shared query func getPublicationCanisters() : async [(Text, Text)] {
    Iter.toArray(publicationCanisterIdsHashmap.entries());
  };

  public shared ({ caller }) func copyPublicationCanisters(publicationManagementCai : Text) : async Result.Result<[(Text, Text)], Text> {
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };
    let publicationManagementCanister = actor (publicationManagementCai) : actor {
      getPublishers : () -> async [(Text, Text)];
    };
    let publishers = await publicationManagementCanister.getPublishers();
    publicationCanisterIdsHashmap := HashMap.fromIter<Text, Text>(Iter.fromArray(publishers), initCapacity, Text.equal, Text.hash);
    #ok(Iter.toArray(publicationCanisterIdsHashmap.entries()));
  };

  //#modclub management

  private func submitPostToModclub(postId : Text, postModel : PostBucketType, versionId : Nat) : async () {
    let postIdWithVersion = getPostIdWithVersionId(postId, versionId);
    // On local, don't send posts to Modclub
    if (environment != "local") {
      let _ = await MC.getModclubActor(environment).submitHtmlContent(postIdWithVersion, "<img style='max-height: 500px; max-width: 500px;' src='" # postModel.headerImage # "' />" # postModel.content, ?postModel.title, null, null);
    };
    postModerationStatusMapV2.put(postIdWithVersion, #new);
  };

  private func rejectedByModClub(postId : Text) : Bool {
    switch (postVersionMap.get(postId)) {
      case (null)();
      case (?versionId) {
        let postIdWithVersion = getPostIdWithVersionId(postId, versionId);
        switch (postModerationStatusMapV2.get(postIdWithVersion)) {
          case (? #rejected) {
            return true;
          };
          case (_)();
        };
      };
    };
    return false;
  };

  private func getPostIdWithVersionId(postId : Text, versionId : Nat) : Text {
    postId # "_" # Nat.toText(versionId);
  };

  public shared ({caller}) func migrateModclubInterface () : async Result.Result<Text, Text> {
  
  if (isAnonymous(caller)) {
    return #err("Cannot use this method anonymously.");
  };

  if (not isAdmin(caller) and not isPlatformOperator(caller)) {
    return #err(Unauthorized);
  };

  for (postId in postModerationStatusMap.keys()) {
    let postModerationStatus = postModerationStatusMap.get(postId);
    
    if (postModerationStatus == ?#reviewRequired) {
    postModerationStatusMapV2.put(postId, #new);
    }
    else if (postModerationStatus == ?#rejected) {
      postModerationStatusMapV2.put(postId, #rejected);
    } else {
      postModerationStatusMapV2.put(postId, #approved);
    };

  };

  return #ok("ok");
};

public shared query ({caller}) func verifyMigration() : async Result.Result<Bool, Text> {
  if(not isAdmin(caller) and not isPlatformOperator(caller)){
    return #err(Unauthorized);
  };
  for((postId, status) in postModerationStatusMap.entries()){
    switch(postModerationStatusMapV2.get(postId)) {
      case(?statusV2) {
        switch(statusV2) {
          case(#approved) {
            if(status != #approved){
              return #ok(false);
            };
          };
          case(#new) {
            if(status != #reviewRequired){
              return #ok(false);
            };
          };
          case(#rejected){
            if(status != #rejected){
              return #ok(false);
            };
          };
        };
      };
      case(null) {
        //this key doesn't exist in map v2
        return #ok(false);
      };
    };
  };
  return #ok(true)
};

func toText (postModerationStatus : ?PostModerationStatus) : Text {
  switch (postModerationStatus) {
    case (?#approved) {
      return "approved";
    };
    case (?#rejected) {
      return "rejected";
    };
    case (?#reviewRequired) {
      return "reviewRequired";
    };
    case (_) {
      return "Error";
    };
  };
};

func toTextV2 (postModerationStatus : ?PostModerationStatusV2) : Text {
  switch (postModerationStatus) {
    case (?#approved) {
      return "approved";
    };
    case (?#rejected) {
      return "rejected";
    };
    case (?#new) {
      return "new";
    };
    case (_) {
      return "error";
    };
  };
};

public shared ({caller}) func getAllStatusCount () : async Result.Result<Text, Text> {
  
  if (isAnonymous(caller)) {
    return #err("Cannot use this method anonymously.");
  };

  if (not isAdmin(caller) and not isPlatformOperator(caller)) {
    return #err(Unauthorized);
  };

  var changedCount = 0;
  var totalCount = 0;
  
  for (postId in postModerationStatusMap.keys()) {
    let postModerationStatus = postModerationStatusMap.get(postId);
    let postModerationStatusV2 = postModerationStatusMapV2.get(postId);
    
    Debug.print(debug_show(postId) # " " # debug_show(postModerationStatus) # " " # debug_show(postModerationStatusV2));
    if (postModerationStatusV2 == ?#new) {
      changedCount += 1;
    };
    totalCount += 1;

    };

  return #ok( "Total: " # debug_show(totalCount) # " Changed: " # debug_show(changedCount));
  };




  public shared ({ caller }) func simulateModClub(postId : Text, status : PostModerationStatusV2) : async () {
    if (isAnonymous(caller)) {
      return;
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return;
    };

    if (environment == "prod") { //No centralized moderation in prod, fine for testing in dev
      return;
    };

    let versionId = postVersionMap.get(postId);
    switch (versionId) {
      case (null)();
      case (?versionId) {
        let postIdWithVersion = getPostIdWithVersionId(postId, versionId);
        postModerationStatusMapV2.put(postIdWithVersion, status);
        let bucketCanisterId = U.safeGet(postIdsToBucketCanisterIdsHashMap, postId, "");
        let bucketActor = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);
        if (status == #rejected) {
          //inform the bucket canister that post was rejected
          await bucketActor.rejectPostByModclub(postId);
          await generateLatestPosts();
        } else {
          //inform the bucket canister that post is not rejected
          await bucketActor.unRejectPostByModclub(postId);
        };
      };
    };
  };

  public shared ({ caller }) func setUpModClub(env : Text) {
    if (isAnonymous(caller)) {
      return;
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      Prelude.unreachable();
    };
    ignore U.logMetrics("setupModClub ENV: " # env # " ", Principal.toText(caller));

    if (env != "local" and env != "dev" and env != "prod") {
      throw Error.reject("Please Provide correct environment value");
    };
    switch (env) {
      case ("local") {
        environment := "local";
      };
      case ("dev") {
        environment := "dev";
      };
      case ("prod") {
        environment := "prod";
      };
      case (_) {
        throw Error.reject("Please Provide correct environment value");
    };
    };

    // On local don't set up Modclub
    if (environment == "local") {
      return;
    };

    let _ = await MC.getModclubActor(environment).registerProvider("Nuance", "Nuance", null);
    if (not modClubRulesAdded) {
      let rules = [
        "This post threatens violence against an individual or a group of people",
        "This post glorifies violence",
        "This post threatens or promotes terrorism or violent extremism",
        "This post contains child sexual exploitation",
        "This post contains targeted harassment of someone, or incite other people to do so. This includes wishing or hoping that someone experiences physical harm",
        "This post promotes violence against, threatens, or harasses other people on the basis of race, ethnicity, national origin, caste, sexual orientation, gender, gender identity, religious affiliation, age, disability, or serious disease",
        "This post promotes or encourages suicide or self-harm",
        "This post is excessively gory",
        "This post shares violent or adult content within live video or in profile or image",
        "This post depicts sexual violence and/or assault",
        "This post has an unlawful purpose or facilitates illegal activities. This includes selling, buying, or facilitating transactions in illegal goods or services, as well as certain types of regulated goods or services",
        "This post contains other people's private information (such as home phone number and address) without their express authorization and permission.",
        "This post threatens to expose private information or incentivizes others to do so",
        "This post contains intimate photos or videos of someone that were produced or distributed without their consent",
        "This post artificially amplifies or suppresses information or engages in behavior that manipulates or disrupts people’s experience on Nuance",
        "This post manipulates or interferes in elections or other civic processes. This includes posting or sharing content that may suppress participation or mislead people about when, where, or how to participate in a civic process",
        "This post impersonates individuals, groups, or organizations in a manner that is intended to or does mislead, confuse, or deceive others",
        "This post contains deceptively share synthetic or manipulated media that are likely to cause harm",
        "This post violates others’ intellectual property rights, including copyright and trademark",
      ];
      await MC.getModclubActor(environment).addRules(rules, null);
      modClubRulesAdded := true;
    };
    await MC.getModclubActor(environment).subscribe({
      callback = modClubCallback;
    });
  };

  public shared ({ caller }) func modClubCallback(postStatus : MC.ContentResult) {

    if (not isAdmin(caller) and (Principal.toText(caller) != MC.getModclubId(environment))) {
      Prelude.unreachable();
    };

    if (not isThereEnoughMemoryPrivate()) {
      assert false;
    };

    switch (postModerationStatusMapV2.get(postStatus.sourceId)) {
      case (null)();
      case (_) {
        postModerationStatusMapV2.put(postStatus.sourceId, postStatus.status);
        let postId = getPostIdFromVersionId(postStatus.sourceId);
        let bucketCanisterId = U.safeGet(postIdsToBucketCanisterIdsHashMap, postId, "");
        let bucketActor = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);
        if (postStatus.status == #rejected) {
          //inform the bucket canister that post was rejected
          await bucketActor.rejectPostByModclub(postId);
          await removePostFromIndex(postStatus.sourceId);
          await generateLatestPosts();
        } else {
          //inform the bucket canister that post is not rejected
          await bucketActor.unRejectPostByModclub(postId);
        };
      };
    };
  };


  private func removePostFromIndex(sourceId : Text) : async () {

    let postId = getPostIdFromVersionId(sourceId);
    let bucketCanisterId = U.safeGet(postIdsToBucketCanisterIdsHashMap, postId, "");
    let bucketActor = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);

    switch (await bucketActor.get(postId)) {
      case (#ok(post)) {
        let handle = post.handle;
        let prevTitle = post.title;
        let prevSubtitle = post.subtitle;
        let prevContent = post.content;
        let previous = handle # " " # prevTitle # " " # prevSubtitle;
        let prevTags = getTagNamesByPostId(postId);
        let PostIndexCanister = CanisterDeclarations.getPostIndexCanister();
        var indexResult = await PostIndexCanister.indexPost(postId, previous, "", prevTags, [""]);
      };
      case (_) {};
    };

  };

  public shared ({ caller }) func addNewRules(rules : [Text]) : async () {
    if (isAnonymous(caller)) {
      return;
    };

    if (not isThereEnoughMemoryPrivate()) {
      return;
    };

    if (not isAdmin(caller)) {
      Prelude.unreachable();
    };
    if (rules.size() > 0) {
      await MC.getModclubActor(environment).addRules(rules, null);
    };
  };


  private func getPostIdFromVersionId(postIdWithVersion : Text) : Text {
    // postid & version are concatenated using postId # "_" # Nat.toText(versionId);
    let fields : Iter.Iter<Text> = Text.split(postIdWithVersion, #text("_"));
    let fieldArray = Iter.toArray(fields);
    if (fieldArray.size() == 2) {
      return fieldArray[0];
    };
    "";
  };

  //#region dump
  public shared ({ caller }) func dumpIds() : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    Debug.print("PostCore->DumpIds");
    for ((postId, principalId) in principalIdHashMap.entries()) {
      Debug.print("PostCore->DumpIds: " # postId);
    };

    #ok();
  };

  public shared ({ caller }) func dumpUserIds() : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    Debug.print("PostCore->DumpUserIds");
    for ((postId, principalId) in principalIdHashMap.entries()) {
      Debug.print("PostCore->DumpUserIds: " # principalId);
    };

    #ok();
  };

  public shared ({ caller }) func dumpPosts() : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    Debug.print("PostCore->DumpPosts");
    for ((postId, principalId) in principalIdHashMap.entries()) {
      var post : PostKeyProperties = buildPostKeyProperties(postId);
      Debug.print("PostCore->DumpUserIds: postId -> " # postId);
      Debug.print("PostCore->DumpUserIds: principalId -> " # principalId);
    };

    #ok();
  };
  //#tag management
  private func comparePost(postA : (Text, Int), postB : (Text, Int)) : Order.Order {
    if (postA.1 == postB.1) {
      return #equal;
    };

    if (postA.1 < postB.1) {
      return #greater;
    };

    return #less;
  };

  private func createNewRelationship(tagIdNew : Text) : PostTag {
    let now = U.epochTime();

    {
      tagId = U.trim(tagIdNew);
      isActive = true;
      createdDate = now;
      modifiedDate = now;
    };
  };

  private func arrayContains(x : Text, xs : [Text]) : Bool {
    func isX(y : Text) : Bool { x == y };
    switch (Array.find<Text>(xs, isX)) {
      case (null) { false };
      case (_) { true };
    };
  };

  private func addOrUpdatePostTag((postId : Text, tagIds : [Text])) : () {
    // var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(userPostsHashMap.size());
    var changes : Buffer.Buffer<PostTag> = Buffer.Buffer<PostTag>(tagIds.size());

    switch (relationships.get(postId)) {
      case (?rels) {
        for (rel in Iter.fromArray(rels)) {

          // if the existing tag is not listed in the new tags, de-activate
          changes.add({
            tagId = rel.tagId;
            isActive = arrayContains(rel.tagId, tagIds);
            createdDate = rel.createdDate;
            modifiedDate = U.epochTime();
          });
        };

        // filter out existing tags
        let newTagIds = Array.filter<Text>(
          tagIds,
          func(newTagId) {
            null == Array.find<PostTag>(rels, func(existingTag) { existingTag.tagId == newTagId });
          },
        );

        // create new relationship for any new tags (not found above in existing relationships)
        for (newTagId in Iter.fromArray(newTagIds)) {
          changes.add(createNewRelationship(newTagId));
        };
      };
      case (null) {
        // create new relationships since all the tags are new
        for (newTagId in Iter.fromArray(tagIds)) {
          changes.add(createNewRelationship(newTagId));
        };
      };
    };

    let changesArray = Buffer.toArray(changes);
    relationships.put(postId, changesArray);
  };

  private func getTagModelsByPost(postId : Text) : [PostTagModel] {
    let rels = U.safeGet(relationships, postId, []);
    let activeRels = Array.filter<PostTag>(rels, func(rel) { rel.isActive });

    // return array of tag models with id and name for the UI
    Array.map<PostTag, PostTagModel>(
      activeRels,
      func(rel) {
        switch (tagsHashMap.get(rel.tagId)) {
          case (null)({
            tagId = rel.tagId;
            tagName = ""; //should never happen
          });
          case (?tag)({
            tagId = rel.tagId;
            tagName = tag.value;
          });
        };
      },
    );
  };

  private func tagExists(tagName : Text) : Bool {
    var lowerCaseTagName = U.lowerCase(tagName);
    for ((key : Text, existingTag : Tag) in tagsHashMap.entries()) {
      if (lowerCaseTagName == U.lowerCase(existingTag.value)) {
        Debug.print("PostCore->TagName already exists: " # tagName);
        return true;
      };
    };
    return false;
  };

  private func getTagNamesByTagIds(tagIds : [Text]) : [Text] {
    // return array of tag names
    Array.map<Text, Text>(
      tagIds,
      func(tagId) {
        switch (tagsHashMap.get(tagId)) {
          case (null) "";
          case (?tag) tag.value;
        };
      },
    );
  };

  private func getTagNamesByPostId(postId : Text) : [Text] {
    let rels = U.safeGet(relationships, postId, []);
    let activeRels = Array.filter<PostTag>(rels, func(rel) { rel.isActive });

    // return array of tag names
    Array.map<PostTag, Text>(
      activeRels,
      func(rel) {
        switch (tagsHashMap.get(rel.tagId)) {
          case (null) ""; //should never happen
          case (?tag) tag.value;
        };
      },
    );
  };

  public shared ({ caller }) func createTag(tagName : Text) : async Result.Result<TagModel, Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    canistergeekMonitor.collectMetrics();

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    let tagNameTrimmed = U.trim(tagName);

    if (tagExists(tagNameTrimmed)) {
      Debug.print("PostCore->createTag tag already exists: " # tagName);
      return #err(TagAlreadyExists # ": " # tagNameTrimmed);
    };

    Debug.print("PostCore->createTag creating new tag: " # tagName);

    tagIdCounter := tagIdCounter + 1;

    let newTag : Tag = {
      id = Nat.toText(tagIdCounter);
      value = tagNameTrimmed;
      createdDate = U.epochTime();
    };

    tagsHashMap.put(Nat.toText(tagIdCounter), newTag);

    let model : TagModel = {
      id = newTag.id;
      value = newTag.value;
      createdDate = Int.toText(newTag.createdDate);
    };

    #ok(model);
  };

  public shared query func getAllTags() : async [TagModel] {
    canistergeekMonitor.collectMetrics();
    Debug.print("Tags->getAllTags");

    var listTags : List.List<TagModel> = List.nil<TagModel>();
    for ((key : Text, tag : Tag) in tagsHashMap.entries()) {
      let model : TagModel = {
        id = tag.id;
        value = tag.value;
        createdDate = Int.toText(tag.createdDate);
      };
      listTags := List.push(model, listTags);
    };

    List.toArray(listTags);
  };

  public shared query func getTagsByUser(userPrincipalId : Text) : async [PostTag] {
    //validate principal
    let principalFromText = Principal.fromText(userPrincipalId);

    var postTags = userTagRelationships.get(userPrincipalId);
    switch (postTags) {
      case (?postTags) {
        //improve return only isActive tags
        var postTags = userTagRelationships.get(userPrincipalId);
        switch (postTags) {
          case (?postTags) { postTags };
          case (null) { [] };
        };
      };
      case (null) { [] };
    };
  };

  public shared query ({ caller }) func getMyTags() : async [PostTagModel] {

    // Should be called from user's browser.
    let userPrincipalId = Principal.toText(caller);

    var postTags = userTagRelationships.get(userPrincipalId);
    switch (postTags) {
      case (?postTags) {
        var activePostTags = Array.filter<PostTag>(postTags, func isEq(x : PostTag) : Bool { x.isActive == true });

        Array.map<PostTag, PostTagModel>(
          activePostTags,
          func(postTag) {
            switch (tagsHashMap.get(postTag.tagId)) {
              case (null)({
                tagId = postTag.tagId;
                tagName = ""; //should never happen
              });
              case (?tag)({
                tagId = postTag.tagId;
                tagName = tag.value;
              });
            };
          },
        );
      };
      case (null) {
        [];
      };
    };
  };

  private func getTagsByPrincipal(userPrincipalId : Text) : [PostTagModel] {
    var postTags = userTagRelationships.get(userPrincipalId);
    switch (postTags) {
      case (?postTags) {
        var activePostTags = Array.filter<PostTag>(postTags, func isEq(x : PostTag) : Bool { x.isActive == true });

        Array.map<PostTag, PostTagModel>(
          activePostTags,
          func(postTag) {
            switch (tagsHashMap.get(postTag.tagId)) {
              case (null)({
                tagId = postTag.tagId;
                tagName = ""; //should never happen
              });
              case (?tag)({
                tagId = postTag.tagId;
                tagName = tag.value;
              });
            };
          },
        );
      };
      case (null) {
        [];
      };
    };
  };

  public shared composite query ({caller}) func getMyFollowingTagsPostKeyProperties(indexFrom: Nat32, indexTo: Nat32) : async GetPostsByFollowers {
    let userPrincipalId = Principal.toText(caller);
    let userTags = getTagsByPrincipal(userPrincipalId);
    let formattedTagNames = Array.map<PostTagModel, Text>(
      userTags,
      func(userTag) {
        "#" # U.upperCase(userTag.tagName);
      },
    );
    let PostIndexCanister = CanisterDeclarations.getPostIndexCanister();
    let postIndexCanisterResponse = await PostIndexCanister.populateTags(formattedTagNames, indexFrom, indexTo);
    let postIds = postIndexCanisterResponse.postIds;
    let postsBuffer = Buffer.Buffer<PostKeyProperties>(0);
    for(postId in postIds.vals()){
      postsBuffer.add(buildPostKeyProperties(postId));
    };
    return {
      posts = Buffer.toArray(postsBuffer);
      totalCount = postIndexCanisterResponse.totalCount;
    }
  };

  public shared ({ caller }) func followTag(tagId : Text) : async Result.Result<(), Text> {

    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };
    //validate input
    if (not U.isTextLengthValid(tagId, 50)) {
      return #err("TagId is not valid.");
    };
    canistergeekMonitor.collectMetrics();

    // Should be called from user's browser.
    let userPrincipalId = Principal.toText(caller);

    var postTags = userTagRelationships.get(userPrincipalId);

    switch (postTags) {
      case (?postTags) {
        //check if the tag is already being followed
        var tagIdTrimmed = U.trim(tagId);

        var followedTag : ?PostTag = Array.find<PostTag>(postTags, func isEq(x : PostTag) : Bool { x.tagId == tagIdTrimmed });
        switch (followedTag) {
          case (null) {

            let newTag = [createNewRelationship(tagId)];

            //empty buffer
            //var changes : Buffer.Buffer<PostTag> = Buffer.Buffer<PostTag>(tagIds.size());
            var followedTagBuffer : Buffer.Buffer<PostTag> = Buffer.Buffer<PostTag>(1);
            for (tag in Iter.fromArray(postTags)) {
              followedTagBuffer.add(tag);
            };
            followedTagBuffer.add(newTag[0]);

            //userTagRelationships.put(userPrincipalId, Array.append(postTags, [createNewRelationship(tagId)]));
            userTagRelationships.put(userPrincipalId, Buffer.toArray(followedTagBuffer));
          };
          case (?tag) {
            if (not tag.isActive) {
              let updatedPostTags = Array.map<PostTag, PostTag>(
                postTags,
                func(t : PostTag) {
                  if (t.tagId == tag.tagId) {
                    {
                      tagId = tag.tagId;
                      isActive = true;
                      createdDate = tag.createdDate;
                      modifiedDate = U.epochTime();
                    };
                  } else {
                    t;
                  };
                },
              );

              userTagRelationships.put(userPrincipalId, updatedPostTags);
            } else {
              return #err(TagAlreadyFollowed);
            };
          };
        };
      };
      case (null) {
        //create new relationship
        userTagRelationships.put(userPrincipalId, [createNewRelationship(tagId)]);
      };
    };

    #ok();
  };

  public shared ({ caller }) func unfollowTag(tagId : Text) : async Result.Result<(), Text> {
    canistergeekMonitor.collectMetrics();

    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    //validate input
    if (not U.isTextLengthValid(tagId, 50)) {
      return #err("TagId is not valid.");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    // Should be called from user's browser.
    let userPrincipalId = Principal.toText(caller);

    var postTags = userTagRelationships.get(userPrincipalId);
    switch (postTags) {
      case (?postTags) {
        //check if the tag is already being followed
        var tagIdTrimmed = U.trim(tagId);

        var followedTag : ?PostTag = Array.find<PostTag>(postTags, func isEq(x : PostTag) : Bool { x.tagId == tagIdTrimmed });

        switch (followedTag) {
          case (null) {
            return #err("TagNotFollowed");
          };
          case (?tag) {
            if (tag.isActive) {
              let updatedPostTags = Array.map<PostTag, PostTag>(
                postTags,
                func(t : PostTag) {
                  if (t.tagId == tag.tagId) {
                    {
                      tagId = tag.tagId;
                      isActive = false;
                      createdDate = tag.createdDate;
                      modifiedDate = U.epochTime();
                    };
                  } else {
                    t;
                  };
                },
              );

              userTagRelationships.put(userPrincipalId, updatedPostTags);
            } else {
              return #err("TagNotFollowed");
            };
          };
        };
      };
      case (null) {
        return #err("TagNotFollowed");
      };
    };

    #ok();
  };

public shared ({caller}) func getTagFollowers(tagName : Text) : async Result.Result<[Text], Text> {
  if (isAnonymous(caller)) {
    return #err("Cannot use this method anonymously.");
  };

  //convert tag name to tag id
  var tagId = "";
  for ((key, tag) in tagsHashMap.entries()) {
    if (U.lowerCase(tag.value) == U.lowerCase(tagName)) {
      tagId := tag.id;
    };
  };


  var followers : Buffer.Buffer<Text> = Buffer.Buffer<Text>(userTagRelationships.size());
  for ((principalId, postTags) in userTagRelationships.entries()) {
    for (postTag in Iter.fromArray(postTags)) {
      if (postTag.tagId == tagId and postTag.isActive) {
        followers.add(principalId);
      };
    };
  };

  return #ok (Buffer.toArray(followers));
};


  
    


  //#region latest posts management
  public shared ({ caller }) func generateLatestPosts() : async () {

    if (isAdmin(caller) or Principal.equal(Principal.fromActor(PostCore), caller)) {

      var publishedDateArray = Iter.toArray(publishedDateHashMap.entries());
      var publishedDateSortedArray = Array.sort<(Text, Int)>(publishedDateArray, ivEqual2);
      for (j in latestPostsHashmap.keys()) {
        latestPostsHashmap.delete(j);
      };
      for (i in Iter.range(0, publishedDateSortedArray.size() - 1)) {
        latestPostsHashmap.put(Nat.toText(i), publishedDateSortedArray[i].0);
      };
    };

  };

  public shared ({ caller }) func generatePublishedDates() : async () {
    let now = U.epochTime();
    for (postId in principalIdHashMap.keys()) {
      let isDraft = U.safeGet(isDraftHashMap, postId, false);
      if (not isDraft) {
        let publishedDate = U.safeGet(publishedDateHashMap, postId, 0);
        if (Int.equal(publishedDate, 0)) {
          publishedDateHashMap.put(postId, now);
        };
      };

    };
  };

  //sorting func for hashmaps
  func ivEqual(a : (Text, Nat), b : (Text, Nat)) : Order {
    if (a.1 > b.1) {
      return #greater;
    };
    if (a.1 < b.1) {
      return #less;
    } else {
      return #equal;
    };
  };

  func ivEqual2(a : (Text, Int), b : (Text, Int)) : Order {
    if (a.1 > b.1) {
      return #greater;
    };
    if (a.1 < b.1) {
      return #less;
    } else {
      return #equal;
    };
  };

  //#endregion
  //#region Bucket Management

  public shared ({ caller }) func getActiveBucketCanisterId() : async Result.Result<Text, Text> {
    #ok(activeBucketCanisterId);
  };

  //holds wasm for upgrade
  private stable var wasmChunks : Blob = Blob.fromArray([]);

  //adds wasm chunk to wasmChunks
  public shared ({ caller }) func addWasmChunk(chunk : Blob) : async Result.Result<(), Text> {

    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    wasmChunks := Blob.fromArray(Array.append(Blob.toArray(wasmChunks), Blob.toArray(chunk)));
    #ok();
  };

  public shared ({ caller }) func getWasmChunks() : async Result.Result<Blob, Text> {

    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    #ok(wasmChunks);
  };

  public shared ({ caller }) func upgradeBucket(canisterId : Text, arg : [Nat8]) : async Result.Result<(), Text> {

    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    let wasm = wasmChunks;
    if (not isAdmin(caller) and not isNuanceCanister(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    switch (await IC.IC.install_code { arg = arg; wasm_module = wasm; mode = #upgrade; canister_id = Principal.fromText(canisterId) }) {
      case ((_)) {
        #ok();
      };
    };
  };

  public shared ({ caller }) func resetWasmChunks() {
    if (isAnonymous(caller)) {
      return;
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return;
    };
    wasmChunks := Blob.fromArray([]);
  };

  // 👋 if you need to clear buckets for local test, reactivate this function
  // public shared ({caller}) func temporaryDeleteAllBuckets() : async Result.Result<(), Text> {
  //     if (not isAdmin(caller)) {
  //         return #err(Unauthorized);
  //     };
  //     let bucketCanisterIdsEntries =  Iter.toArray(bucketCanisterIdsHashMap.entries());
  //     for (bucketCanisterId in bucketCanisterIdsEntries.vals()) {
  //         await IC.IC.stop_canister{canister_id = Principal.fromText(bucketCanisterId.1)};
  //         switch (await IC.IC.delete_canister{canister_id = Principal.fromText(bucketCanisterId.1)}) {
  //             case(_) {
  //                 bucketCanisterIdsHashMap.delete(bucketCanisterId.0);
  //             };
  //         };
  //     };
  //     #ok();
  // };

  public shared ({ caller }) func getAllBuckets() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    var canisterBuffer = Buffer.Buffer<Text>(1);
    for (bucketCanisterId in bucketCanisterIdsHashMap.keys()) {
      canisterBuffer.add(bucketCanisterId);
    };
    #ok(Buffer.toArray(canisterBuffer));
  };

  public shared ({ caller }) func upgradeAllBuckets(canisterId : Text, arg : [Nat8]) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    //TODO: add indexing for large number of buckets

    for (bucketCanisterId in bucketCanisterIdsHashMap.keys()) {
      switch (await upgradeBucket(bucketCanisterId, arg)) {
        case (ok) {
          //TODO: add logging
          Debug.print("Upgrading bucket canister: " # bucketCanisterId);
        };
      };
    };

    #ok();
  };

  //#views metrics region

  private func trimDateDay(date : Int) : (DateTimeParts) {
    var dateParts = DateTime.getDateTimeParts(Int.abs(date));

    dateParts := {
      year = dateParts.year;
      month = dateParts.month;
      day = dateParts.day;
      wday = dateParts.wday;
      hours = 0;
      minutes = 0;
      seconds = 0;
      milliseconds = 0;
    };
    dateParts;
  };

  private func formatDateForStorage(date : DateTimeParts) : (Text) {
    //ex 20230101
    let year = Nat.toText(date.year);
    let month = if (date.month < 10) { "0" # Nat.toText(date.month) } else {
      Nat.toText(date.month);
    };
    let day = if (date.day < 10) { "0" # Nat.toText(date.day) } else {
      Nat.toText(date.day);
    };

    let dateText = year # month # day;
    dateText;
  };

  //get total applause count
  public shared query func getTotalClaps() : async Nat {
    var counter = 0;
    for (clap in clapsHashMap.vals()) {
      counter += clap;
    };
    return counter;
  };

  //recall by date funcs
  public shared ({ caller }) func getViewsByRange(recallOptions : RecallOptions) : async (Int) {

    if (not isAdmin(caller)) {
      return 0;
    };
    let today : DateTimeParts = trimDateDay(Time.now());
    let todayFormattedDate = formatDateForStorage(today);
    let viewBuffer = Iter.toArray(dailyViewHistoryHashMap.entries());

    switch recallOptions {
      case (#today) {
        let today = totalViewsToday;
        today;
      };

      case (#thisWeek) {
        var thisWeekViews = 0;
        var i = 0;
        let duration = if (viewBuffer.size() < 7) { viewBuffer.size() } else 7;
        //each day is stored, so just need to add up the first 7 days
        while (i < duration) {
          let formattedDate = viewBuffer[i].0;
          let dayViews = U.safeGet(dailyViewHistoryHashMap, formattedDate, 0);
          thisWeekViews := thisWeekViews + dayViews;
          i := i + 1;
        };
        thisWeekViews;
      };

      case (#thisMonth) {
        var thisMonthViews = 0;
        var i = 0;
        let duration = if (viewBuffer.size() < 30) { viewBuffer.size() } else 30;

        while (i < duration) {
          let formattedDate = viewBuffer[i].0;
          let dayViews = U.safeGet(dailyViewHistoryHashMap, formattedDate, 0);
          thisMonthViews := thisMonthViews + dayViews;
          i := i + 1;
        };
        thisMonthViews;
      };

      case (#sixtydays) {
        var sixtyDaysViews = 0;
        var i = 0;
        let duration = if (viewBuffer.size() < 60) { viewBuffer.size() } else 60;

        while (i < duration) {
          let formattedDate = viewBuffer[i].0;
          let dayViews = U.safeGet(dailyViewHistoryHashMap, formattedDate, 0);
          sixtyDaysViews := sixtyDaysViews + dayViews;
          i := i + 1;
        };
        sixtyDaysViews;
      };

      case (#ninetydays) {
        var ninetyDaysViews = 0;
        var i = 0;
        let duration = if (viewBuffer.size() < 90) { viewBuffer.size() } else 90;

        while (i < duration) {
          let formattedDate = viewBuffer[i].0;
          let dayViews = U.safeGet(dailyViewHistoryHashMap, formattedDate, 0);
          ninetyDaysViews := ninetyDaysViews + dayViews;
          i := i + 1;
        };
        ninetyDaysViews;
      };

      case (#thisYear) {
        var thisYearViews = 0;
        var i = 0;
        let duration = if (viewBuffer.size() < 365) { viewBuffer.size() } else 365;

        while (i < duration) {
          let formattedDate = viewBuffer[i].0;
          let dayViews = U.safeGet(dailyViewHistoryHashMap, formattedDate, 0);
          thisYearViews := thisYearViews + dayViews;
          i := i + 1;
          Debug.print("Date: " # viewBuffer[i].0 # "  views:" # Nat.toText(dayViews));
          Debug.print("CheckSum: " # Nat.toText(viewBuffer[i].1));
        };
        thisYearViews;
      };

      case (#allTime) {
        var counter = 0;
        for (view in viewsHashMap.vals()) {
          counter += view;
        };
        return counter;
      };
    };

  };

  private func incrementDailyViewsDate() : async () {

    let unixTimeStamp = Time.now();
    let trimDate : DateTimeParts = trimDateDay(unixTimeStamp);
    let storageFormattedDate = formatDateForStorage(trimDate);

    let today : DateTimeParts = trimDateDay(Time.now());
    let todayFormattedDate = formatDateForStorage(today);

    if (todayFormattedDate != totalDailyViewsDate) {

      //store historic views for the day.
      dailyViewHistoryHashMap.put(todayFormattedDate, totalViewsToday);

      //clear views, start new day
      totalDailyViewsDate := storageFormattedDate;
      totalViewsToday := 0;
    } else {
      Debug.print("Today is the same as stored date no need to increment");

    };

  };

  //returns an array that shows the created posts by hours in last 24 hours
  public shared query func getPostsPerHourLast24Hours() : async (Nat, [(Int, Nat)]) {
    let DAY : Int = 86400000000000 / 1000000;
    let HOUR : Int = 3600000000000 / 1000000;
    let now = U.epochTime();
    let dayThreshold = now - DAY;
    var latestPostId = postId;
    var loopRunning = true;
    var last24HoursPostsCreatedTimes = Buffer.Buffer<(Text, Int)>(0);
    while (loopRunning) {
      let created = U.safeGet(createdHashMap, Int.toText(latestPostId), 0);
      if (created != 0) {
        if (created > dayThreshold) {
          last24HoursPostsCreatedTimes.add(Int.toText(latestPostId), created);
        } else {
          loopRunning := false;
        };
      };

      if (latestPostId != 0) {
        latestPostId -= 1;
      } else {
        loopRunning := false;
      };

    };

    var hourlyCreatedHashmap = HashMap.HashMap<Int, Nat>(initCapacity, Int.equal, Int.hash);

    for ((postId, created) in last24HoursPostsCreatedTimes.vals()) {
      let hour = (created - dayThreshold) / HOUR;
      hourlyCreatedHashmap.put(hour, U.safeGet(hourlyCreatedHashmap, hour, 0) + 1);
    };

    var result = Buffer.Buffer<(Int, Nat)>(0);

    var counter : Int = 0;

    while (counter < 24) {
      switch (hourlyCreatedHashmap.get(counter)) {
        case (?value) {
          result.add(counter, value);
        };
        case (null) {
          result.add(counter, 0);
        };
      };
      counter += 1;
    };

    (last24HoursPostsCreatedTimes.size(), Buffer.toArray(result));
  };

  private func getTotalViews() : Nat {
    var totalViews = 0;
    for (view in viewsHashMap.vals()) {
      totalViews += view;
    };
    return totalViews;
  };

  stable var last24HoursViews = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  stable var totalViewsLastTimeChecked = getTotalViews();
  stable var lastTimeCheckViewsLast24HoursCalled = Time.now();

  public shared ({ caller }) func checkViewsLast24Hours() : async () {
    if (not isAdmin(caller) and not Principal.equal(caller, Principal.fromActor(PostCore))) {
      return;
    };

    if (not isThereEnoughMemoryPrivate()) {
      return;
    };

    Debug.print("PostCore -> checkViewsLast24Hours");
    let HOUR : Int = 3600000000000;
    let now = Time.now();

    if (now - lastTimeCheckViewsLast24HoursCalled < HOUR) {
      Debug.print("PostCore -> checkViewsLast24Hours: Already checked the views for this hour");
      return;
    };
    let totalViews = getTotalViews();
    let lastHourViewed = Nat.sub(totalViews, totalViewsLastTimeChecked);
    //remove the first item in the array
    var newLast24HoursViews = Buffer.fromArray<Nat>(Array.subArray<Nat>(last24HoursViews, 1, 23));
    //add the hourly view
    newLast24HoursViews.add(lastHourViewed);
    //update the last24HoursViews array
    last24HoursViews := Buffer.toArray(newLast24HoursViews);
    //update the totalViewsLastTimeChecked value
    totalViewsLastTimeChecked := totalViews;
    //update the stable var to be able to check the periodic calls
    lastTimeCheckViewsLast24HoursCalled := now;

  };

  public shared query func getPostViewsPerHourLast24Hours() : async (Nat, [(Nat, Nat)]) {
    var counter = 0;
    var totalDailyViews = 0;
    var hourlyViews = Buffer.fromArray<Nat>(Array.subArray<Nat>(last24HoursViews, 0, 23));
    hourlyViews.add(getTotalViews() - totalViewsLastTimeChecked);
    var result = Buffer.Buffer<(Nat, Nat)>(0);
    while (counter < 24) {
      result.add((counter, hourlyViews.get(counter)));
      totalDailyViews += hourlyViews.get(counter);
      counter += 1;
    };

    (totalDailyViews, Buffer.toArray(result));
  };

  //#region memory management
  stable var MAX_MEMORY_SIZE = 380000000;

  public shared ({ caller }) func setMaxMemorySize(newValue : Nat) : async Result.Result<Nat, Text> {

    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };
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

  public shared query func getCanisterVersion() : async Text {
    Versions.POSTCORE_VERSION;
  };

  system func preupgrade() {

    // transfer canister state to swap variables so data is not lost during upgrade
    Debug.print("PostCore->preupgrade: hashmap size: " # Nat.toText(principalIdHashMap.size()));
    _canistergeekMonitorUD := ?canistergeekMonitor.preupgrade();
    Debug.print("PostCore->preupgrade:Inside Canistergeek preupgrade method");
    postIdsToBucketCanisterIdEntries := Iter.toArray(postIdsToBucketCanisterIdsHashMap.entries());
    postIdsToNftCanisterIdEntries := Iter.toArray(postIdsToNftCanisterIdsHashMap.entries());
    bucketCanisterIdsEntries := Iter.toArray(bucketCanisterIdsHashMap.entries());
    principalIdEntries := Iter.toArray(principalIdHashMap.entries());
    userPostsEntries := Iter.toArray(userPostsHashMap.entries());
    handleEntries := Iter.toArray(handleHashMap.entries());
    handleReverseEntries := Iter.toArray(handleReverseHashMap.entries());
    lowercaseHandleEntries := Iter.toArray(lowercaseHandleHashMap.entries());
    lowercaseHandleReverseEntries := Iter.toArray(lowercaseHandleReverseHashMap.entries());
    createdEntries := Iter.toArray(createdHashMap.entries());
    publishedDateEntries := Iter.toArray(publishedDateHashMap.entries());
    latestPostsEntries := Iter.toArray(latestPostsHashmap.entries());
    modifiedEntries := Iter.toArray(modifiedHashMap.entries());
    isDraftEntries := Iter.toArray(isDraftHashMap.entries());
    viewsEntries := Iter.toArray(viewsHashMap.entries());
    dailyViewHistory := Iter.toArray(dailyViewHistoryHashMap.entries());
    postModerationStatusEntries := Iter.toArray(postModerationStatusMap.entries());
    postModerationStatusEntriesV2 := Iter.toArray(postModerationStatusMapV2.entries());
    postVersionEntries := Iter.toArray(postVersionMap.entries());
    tagEntries := Iter.toArray(tagsHashMap.entries());
    categoryEntries := Iter.toArray(categoryHashMap.entries());
    relationshipEntries := Iter.toArray(relationships.entries());
    userTagRelationshipEntries := Iter.toArray(userTagRelationships.entries());
    clapsEntries := Iter.toArray(clapsHashMap.entries());
    applaudsEntries := Iter.toArray(applaudsHashMap.entries());
    popularity := Iter.toArray(popularityHashMap.entries());
    popularityToday := Iter.toArray(popularityTodayHashMap.entries());
    popularityThisWeek := Iter.toArray(popularityThisWeekHashMap.entries());
    popularityThisMonth := Iter.toArray(popularityThisMonthHashMap.entries());

    publicationCanisterIdsEntries := Iter.toArray(publicationCanisterIdsHashmap.entries());

    publicationEditorsEntries := Iter.toArray(publicationEditorsHashmap.entries());
    publicationWritersEntries := Iter.toArray(publicationWritersHashmap.entries());
  };

  system func postupgrade() {

    // invoke canister geek postupgrade logic
    Debug.print(debug_show ("PostCore->postupgrade: hashmap size: " # Nat.toText(principalIdHashMap.size())));
    canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
    Debug.print("PostCore->postupgrade:Inside Canistergeek postupgrade method");

    // clear in-memory state swap variables after upgrade
    _canistergeekMonitorUD := null;
    postIdsToBucketCanisterIdEntries := [];
    bucketCanisterIdsEntries := [];
    principalIdEntries := [];
    userPostsEntries := [];
    handleEntries := [];
    handleReverseEntries := [];
    lowercaseHandleEntries := [];
    lowercaseHandleReverseEntries := [];
    createdEntries := [];
    publishedDateEntries := [];
    latestPostsEntries := [];
    modifiedEntries := [];
    isDraftEntries := [];
    viewsEntries := [];
    dailyViewHistory := [];
    postModerationStatusEntries := [];
    postModerationStatusEntriesV2 := [];
    postVersionEntries := [];
    tagEntries := [];
    categoryEntries := [];
    relationshipEntries := [];
    userTagRelationshipEntries := [];
    clapsEntries := [];
    applaudsEntries := [];
    popularity := [];
    popularityToday := [];
    popularityThisWeek := [];
    popularityThisMonth := [];
    isStoreSEOcalled := false;

    publicationCanisterIdsEntries := [];

    publicationEditorsEntries := [];
    publicationWritersEntries := [];
  };

  stable var lastTimerCalled : Int = 0;
  stable var cyclesBalanceWhenTimerIsCalledLastTime = 0;

  public shared query func getLatestTimerCall() : async (Text, Text) {
    (Int.toText(lastTimerCalled), Nat.toText(cyclesBalanceWhenTimerIsCalledLastTime));
  };

  public func acceptCycles() : async () {
    let available = Cycles.available();
    let accepted = Cycles.accept(available);
    assert (accepted == available);
  };

  public shared query func availableCycles() : async Nat {
    Cycles.balance();
  };

  public shared ({ caller }) func addCanisterToCyclesDispenser(canisterId : Text, minimumThreshold : Nat, topUpAmount : Nat) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };
    if (not isAdmin(caller) and not isNuanceCanister(caller)) {
      return #err(Unauthorized);
    };
    let CyclesDispenserCanister = CanisterDeclarations.getCyclesDispenserCanister();
    ignore await CyclesDispenserCanister.addCanister({
      canisterId = canisterId;
      minimumThreshold = minimumThreshold;
      topUpAmount = topUpAmount;
      isStorageBucket = false;
    });

    //add the canister to Metrics canister
    ignore await CanisterDeclarations.getMetricsCanister().registerCanister(canisterId);
    return #ok();
  };

  system func timer(setGlobalTimer : Nat64 -> ()) : async () {
    Debug.print("PostCore -> timer");
    try {
      ignore indexPopular();
      Debug.print("PostCore -> index popular posts end.");
    } catch (e) {};

    try {
      await incrementDailyViewsDate();
    } catch (e) {
      Debug.print("PostCore -> timer incrementDailyViewsDate trapped.");
    };

    try {
      ignore checkViewsLast24Hours();
    } catch (e) {
      Debug.print("PostCore -> timer incrementDailyViewsDate trapped.");
    };

    Debug.print("PostCore -> Active bucket canister id: " # activeBucketCanisterId);
    if (activeBucketCanisterId == "") {
      try {
        switch (await createNewBucketCanister()) {
          case (#ok(result)) {
            Debug.print("PostCore -> createNewBucketCanister result: " # result);
          };
          case (#err(err)) {
            Debug.print("PostCore -> createNewBucketCanister error: " # err);
          };
        };
      } catch (e) {
        Debug.print("PostCore -> Error while creating the bucket canister. (1)");
      };
    } else {
      let bucketActor = CanisterDeclarations.getPostBucketCanister(activeBucketCanisterId);
      if (not (await bucketActor.isBucketCanisterActivePublic())) {
        try {
          ignore await createNewBucketCanister();
        } catch (e) {
          Debug.print("PostCore -> Error while creating the bucket canister. (2)");
        };
      };
    };

    let now = Time.now();
    lastTimerCalled := now;

    cyclesBalanceWhenTimerIsCalledLastTime := Cycles.balance();

    let next = Nat64.fromIntWrap(now) + 240_000_000_000;
    setGlobalTimer(next); // absolute time in nanoseconds
  };
};
