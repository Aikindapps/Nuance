import Canistergeek "../canistergeek/canistergeek";
import List "mo:base/List";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Prim "mo:prim";
import Types "types";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import U "../shared/utils";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";
import Array "mo:base/Array";
import Nat32 "mo:base/Nat32";
import Bool "mo:base/Bool";
import IC "../PostCore/IC";
import Nat64 "mo:base/Nat64";
import Prelude "mo:base/Prelude";
import Cycles "mo:base/ExperimentalCycles";
import Float "mo:base/Float";
import Blob "mo:base/Blob";
import Time "mo:base/Time";
import CanisterDeclarations "../shared/CanisterDeclarations";
import Versions "../shared/versions";
import ENV "../shared/env";
import Sonic "../shared/sonic";
import TypesStandards "../shared/TypesStandards";

actor class PostBucket() = this {
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
  let NotPublicationPost = "It's not a publication post.";
  let ArticleNotEditable = "Premium article. Can not edit.";
  let NotPremium = "Post is not premium.";

  // data type aliases
  type List<T> = List.List<T>;
  type User = CanisterDeclarations.User;
  type PostBucketType = CanisterDeclarations.PostBucketType;
  type Post = CanisterDeclarations.Post;
  type UserPostCounts = Types.UserPostCounts;
  type PostSaveModel = CanisterDeclarations.PostSaveModelBucket;
  type ToDo = CanisterDeclarations.PostBucketType;
  type Tag = Types.Tag;
  type TagModel = Types.TagModel;
  type PostTag = Types.PostTag;
  type PostTagModel = Types.PostTagModel;
  type PostModerationStatus = Types.PostModerationStatus;
  type GetPostsByFollowers = Types.GetPostsByFollowers;
  type SaveResult = Types.SaveResult;
  type PremiumArticleOwnersReturn = Types.PremiumArticleOwnersReturn;
  type PremiumArticleOwnerObject = Types.PremiumArticleOwnerObject;
  type RecallOptions = Types.RecallOptions;
  type DayOfWeek = Types.DayOfWeek;
  type MonthOfYear = Types.MonthOfYear;
  type DateTimeParts = Types.DateTimeParts;

  type Publication = Types.Publication;

  type FastblocksPost = Types.FastblocksPost;

  type NftCanisterEntry = Types.NftCanisterEntry;

  type Order = { #less; #equal; #greater };

  //ext metadata types
  type Metadata = Types.Metadata;
  type MetadataValue = Types.MetadataValue;
  type MetadataContainer = Types.MetadataContainer;

  //asset canister types
  type Key = Types.Key;

  //comment types
  type Comment = Types.Comment;
  type SaveCommentModel = Types.SaveCommentModel;
  type CommentsReturnType = Types.CommentsReturnType;

  //applaud types
  type Applaud = Types.Applaud;

  //icrc standards types
  type SupportedStandard = TypesStandards.SupportedStandard;
  type Icrc28TrustedOriginsResponse = TypesStandards.Icrc28TrustedOriginsResponse;

  // permanent in-memory state (data types are not lost during upgrades)
  stable var admins : List.List<Text> = List.nil<Text>();
  stable var platformOperators : List.List<Text> = List.nil<Text>();
  stable var cgusers : List.List<Text> = List.nil<Text>();
  stable var nuanceCanisters : List.List<Text> = List.nil<Text>();
  stable var tagIdCounter : Nat = 0;
  stable var MAX_BUCKET_CANISTER_MEMORY = 380000000;
  stable var isStoreSEOcalled = false;
  stable var isActive = true;
  stable var commentId = 0;
  stable var applaudId = 0;
  

  // in-memory state swap (holds hashmap entries between preupgrade and postupgrade) then is cleared
  stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
  stable var handleEntries : [(Text, Text)] = [];
  stable var handleReverseEntries : [(Text, Text)] = [];
  stable var lowercaseHandleEntries : [(Text, Text)] = [];
  stable var lowercaseHandleReverseEntries : [(Text, Text)] = [];
  stable var accountIdsToHandleEntries : [(Text, Text)] = [];
  stable var userPostsEntries : [(Text, List.List<Text>)] = [];
  stable var principalIdEntries : [(Text, Text)] = [];
  stable var titleEntries : [(Text, Text)] = [];
  stable var subtitleEntries : [(Text, Text)] = [];
  stable var headerImageEntries : [(Text, Text)] = [];
  stable var contentEntries : [(Text, Text)] = [];
  stable var isDraftEntries : [(Text, Bool)] = [];
  stable var createdEntries : [(Text, Int)] = [];
  stable var modifiedEntries : [(Text, Int)] = [];
  stable var publishedDateEntries : [(Text, Int)] = [];
  stable var creatorEntries : [(Text, Text)] = [];
  stable var isPublicationEntries : [(Text, Bool)] = [];
  stable var categoryEntries : [(Text, Text)] = [];
  stable var wordCountsEntries : [(Text, Nat)] = [];
  stable var isPremiumEntries : [(Text, Bool)] = [];
  stable var isMembersOnlyEntries : [(Text, Bool)] = [];
  stable var nftCanisterIdEntries : [(Text, Text)] = [];
  stable var tagNamesEntries : [(Text, [Text])] = [];
  stable var testEntries : [(Text, Text)] = [];
  stable var rejectedByModclubPostIdsEntries : [(Text, Text)] = [];

  //comment data
  stable var postIdToCommentIdsEntries : [(Text, [Text])] = [];
  stable var postIdToNumberOfCommentsEntries : [(Text, Nat)] = [];
  stable var commentIdToPostIdEntries : [(Text, Text)] = [];
  stable var commentIdToUserPrincipalIdEntries : [(Text, Text)] = [];
  stable var commentIdToContentEntries : [(Text, Text)] = [];
  stable var commentIdToCreatedAtEntries : [(Text, Int)] = [];
  stable var commentIdToEditedAtEntries : [(Text, Int)] = [];
  stable var commentIdToUpvotedPrincipalIdsEntries : [(Text, [Text])] = [];
  stable var commentIdToDownvotedPrincipalIdsEntries : [(Text, [Text])] = [];
  stable var commentIdToReplyCommentIdsEntries : [(Text, [Text])] = [];
  stable var replyCommentIdToCommentIdEntries : [(Text, Text)] = [];
  stable var isCensoredEntries : [(Text, Bool)] = [];
  stable var reportCommentQueue : [Text] = [];


  //applaud data
  stable var postIdToApplaudIdsEntries : [(Text, [Text])] = [];
  stable var principalIdToApplaudIdsEntries : [(Text, [Text])] = [];
  stable var applaudIdToSenderEntries : [(Text, Text)] = [];
  stable var applaudIdToReceiverEntries : [(Text, Text)] = [];
  stable var applaudIdToPostIdEntries : [(Text, Text)] = [];
  stable var applaudIdToCurrencyEntries : [(Text, Text)] = [];
  stable var applaudIdToTokenAmountEntries : [(Text, Nat)] = [];
  stable var applaudIdToReceivedTokenAmountEntries : [(Text, Nat)] = [];
  stable var applaudIdToNumberOfApplaudsEntries : [(Text, Nat)] = [];
  stable var applaudIdToDateEntries : [(Text, Int)] = [];

  // in-memory state (holds object field data) - hashmaps must match entires in above stable vars and in preupgrade and postupgrade
  // HashMaps with one entry per user
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
  //key: account-id, value: handle
  var accountIdsToHandleHashMap = HashMap.fromIter<Text, Text>(accountIdsToHandleEntries.vals(), initCapacity, Text.equal, Text.hash);

  // HashMaps with one entry per post (key: postId)
  var principalIdHashMap = HashMap.fromIter<Text, Text>(principalIdEntries.vals(), initCapacity, Text.equal, Text.hash);
  var titleHashMap = HashMap.fromIter<Text, Text>(titleEntries.vals(), initCapacity, Text.equal, Text.hash);
  var subtitleHashMap = HashMap.fromIter<Text, Text>(subtitleEntries.vals(), initCapacity, Text.equal, Text.hash);
  var headerImageHashMap = HashMap.fromIter<Text, Text>(headerImageEntries.vals(), initCapacity, Text.equal, Text.hash);
  var contentHashMap = HashMap.fromIter<Text, Text>(contentEntries.vals(), initCapacity, Text.equal, Text.hash);
  var isDraftHashMap = HashMap.fromIter<Text, Bool>(isDraftEntries.vals(), initCapacity, Text.equal, Text.hash);
  var createdHashMap = HashMap.fromIter<Text, Int>(createdEntries.vals(), initCapacity, Text.equal, Text.hash);
  var modifiedHashMap = HashMap.fromIter<Text, Int>(modifiedEntries.vals(), initCapacity, Text.equal, Text.hash);
  var publishedDateHashMap = HashMap.fromIter<Text, Int>(publishedDateEntries.vals(), initCapacity, Text.equal, Text.hash);
  var creatorHashMap = HashMap.fromIter<Text, Text>(creatorEntries.vals(), initCapacity, Text.equal, Text.hash);
  var isPublicationHashMap = HashMap.fromIter<Text, Bool>(isPublicationEntries.vals(), initCapacity, Text.equal, Text.hash);
  var categoryHashMap = HashMap.fromIter<Text, Text>(categoryEntries.vals(), initCapacity, Text.equal, Text.hash);
  var wordCountsHashmap = HashMap.fromIter<Text, Nat>(wordCountsEntries.vals(), initCapacity, Text.equal, Text.hash);
  var isPremiumHashMap = HashMap.fromIter<Text, Bool>(isPremiumEntries.vals(), initCapacity, Text.equal, Text.hash);
  var isMembersOnlyHashMap = HashMap.fromIter<Text, Bool>(isMembersOnlyEntries.vals(), initCapacity, Text.equal, Text.hash);
  var nftCanisterIdHashMap = HashMap.fromIter<Text, Text>(nftCanisterIdEntries.vals(), initCapacity, Text.equal, Text.hash);
  var tagNamesHashMap = HashMap.fromIter<Text, [Text]>(tagNamesEntries.vals(), initCapacity, Text.equal, Text.hash);
  var rejectedByModclubPostIdsHashmap = HashMap.fromIter<Text, Text>(rejectedByModclubPostIdsEntries.vals(), initCapacity, Text.equal, Text.hash);

  //comment hashmaps

  //key: postId, value: [commentId]
  var postIdToCommentIdsHashMap = HashMap.fromIter<Text, [Text]>(postIdToCommentIdsEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: postId, value: numberOfComments
  var postIdToNumberOfCommentsHashMap = HashMap.fromIter<Text, Nat>(postIdToNumberOfCommentsEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: commentId, value: postId
  var commentIdToPostIdHashMap = HashMap.fromIter<Text, Text>(commentIdToPostIdEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: commentId, value: principalId
  var commentIdToUserPrincipalIdHashMap = HashMap.fromIter<Text, Text>(commentIdToUserPrincipalIdEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: commentId, value: content
  var commentIdToContentHashMap = HashMap.fromIter<Text, Text>(commentIdToContentEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: commentId, value: createdAt
  var commentIdToCreatedAtHashMap = HashMap.fromIter<Text, Int>(commentIdToCreatedAtEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: commentId, value: EditedAt
  var commentIdToEditedAtHashMap = HashMap.fromIter<Text, Int>(commentIdToEditedAtEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: commentId, value: [upvotedPrincipalId]
  var commentIdToUpvotedPrincipalIdsHashMap = HashMap.fromIter<Text, [Text]>(commentIdToUpvotedPrincipalIdsEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: commentId, value: [downvotedPrincipalId]
  var commentIdToDownvotedPrincipalIdsHashMap = HashMap.fromIter<Text, [Text]>(commentIdToDownvotedPrincipalIdsEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: commentId, value: [replyCommentId] -> The replies will not be added to postIdToCommentIdsHashmap. They are mapped to the ancestor commentId
  var commentIdToReplyCommentIdsHashMap = HashMap.fromIter<Text, [Text]>(commentIdToReplyCommentIdsEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: replyCommentId, value: commentId
  var replyCommentIdToCommentIdHashMap = HashMap.fromIter<Text, Text>(replyCommentIdToCommentIdEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: commentId, value: isCensored bool
  var isCensoredHashMap = HashMap.fromIter<Text, Bool>(isCensoredEntries.vals(), initCapacity, Text.equal, Text.hash);

  //applaud hashmaps
  //key: postId, value: [applaudId]
  var postIdToApplaudIdsHashMap = HashMap.fromIter<Text, [Text]>(postIdToApplaudIdsEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: principalId, value: [applaudId]
  var principalIdToApplaudIdsHashMap = HashMap.fromIter<Text, [Text]>(principalIdToApplaudIdsEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: applaudId, value: principalId
  var applaudIdToSenderHashMap = HashMap.fromIter<Text, Text>(applaudIdToSenderEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: applaudId, value: principalId
  var applaudIdToReceiverHashMap = HashMap.fromIter<Text, Text>(applaudIdToReceiverEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: applaudId, value: postId
  var applaudIdToPostIdHashMap = HashMap.fromIter<Text, Text>(applaudIdToPostIdEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: applaudId, value: currency (NUA, ICP, ckBTC)
  var applaudIdToCurrencyHashMap = HashMap.fromIter<Text, Text>(applaudIdToCurrencyEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: applaudId, value: tokenAmount (e8s)
  var applaudIdToTokenAmountHashMap = HashMap.fromIter<Text, Nat>(applaudIdToTokenAmountEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: applaudId, value: receivedTokenAmount (e8s)
  var applaudIdToReceivedTokenAmountHashMap = HashMap.fromIter<Text, Nat>(applaudIdToReceivedTokenAmountEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: applaudId, value: number of applauds
  var applaudIdToNumberOfApplaudsHashMap = HashMap.fromIter<Text, Nat>(applaudIdToNumberOfApplaudsEntries.vals(), initCapacity, Text.equal, Text.hash);
  //key: applaudId, value: date
  var applaudIdToDateHashMap = HashMap.fromIter<Text, Int>(applaudIdToDateEntries.vals(), initCapacity, Text.equal, Text.hash);

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

  private func isCallerOwner(p : Principal) : async Bool {
    try {
      let statusCanister = await IC.IC.canister_status({
        canister_id = Principal.fromActor(this);
      });
      let controllers = statusCanister.settings.controllers;
      let controllers_text = Array.map<Principal, Text>(controllers, func x = Principal.toText(x));
      switch (Array.find<Principal>(controllers, func x = p == x)) {
        case (?_) { return true };
        case null { return false };
      };
    } catch (e) {
      return false;
    };
  };

  public shared ({ caller }) func initializeBucketCanister(nuanceCanistersInitial : [Text], cgUsersInitial : [Text], initPostCoreCanisterId : Text) : async Result.Result<Text, Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot initialize bucket canister");
    };
    let _isCallerOwner = await isCallerOwner(caller);
    Debug.print("PostBucket -> initializeBucketCanister");
    Debug.print("isCallerOwner-> " # Bool.toText(_isCallerOwner));
    if (_isCallerOwner or isAdmin(caller)) {
      if (List.size(admins) == 0) {
        cgusers := List.fromArray(cgUsersInitial);
        nuanceCanisters := List.push(initPostCoreCanisterId, List.fromArray(nuanceCanistersInitial));
        return #ok(Principal.toText(Principal.fromActor(this)));
      };
      return #err("Already initialized.");
    } else {
      return #err("You are not authorized to run this method");
    };

  };
  //deprecated function
  public shared ({ caller }) func initializeCanister(postIndexCai : Text, userCai : Text) : async Result.Result<Text, Text> {
    #err("Deprecated function.");
  };

  public shared query func getFrontendCanisterId() : async Text {
    ENV.NUANCE_ASSETS_CANISTER_ID;
  };

  public shared query func getPostCoreCanisterId() : async Text {
    ENV.POST_CORE_CANISTER_ID;
  };

  public shared query func getBucketCanisterVersion() : async Text {
    //retired
    Versions.POSTBUCKET_VERSION;
  };

  //memory management
  public shared ({ caller }) func testInstructionSize<system>() : async Text {

    if (isAnonymous(caller)) {
      return "Anonymous user cannot run this method";
    };

    if (isAdmin(caller) != true) {
      return "You are not authorized to run this method";
    };

    //👀👀👀 warning IC.countInstructions executes the functions passed to it
    //let preupgradeCount = ICexp.countInstructions(func() { preupgrade() });
    //let postupgradeCount = ICexp.countInstructions(func() { postupgrade() });

    // "the limit for a canister install and upgrade is 200 billion instructions."
    // "the limit for an update message is 20 billion instructions"

    return "Retired for now."

  };

  public shared ({ caller }) func setMaxMemorySize(newValue : Nat) : async Result.Result<Nat, Text> {

    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("setMaxMemorySize", Principal.toText(caller));

    MAX_BUCKET_CANISTER_MEMORY := newValue;

    #ok(MAX_BUCKET_CANISTER_MEMORY);
  };

  public shared query func getMaxMemorySize() : async Nat {
    MAX_BUCKET_CANISTER_MEMORY;
  };

  public shared query func isBucketCanisterActivePublic() : async Bool {
    isBucketCanisterActive();
  };

  private func isBucketCanisterActive() : Bool {
    MAX_BUCKET_CANISTER_MEMORY > getMemorySizePrivate() and isActive;
  };

  private func isThereEnoughMemoryPrivate() : Bool {
    MAX_BUCKET_CANISTER_MEMORY > getMemorySizePrivate();
  };

  public shared ({ caller }) func makeBucketCanisterNonActive() : async Result.Result<Bool, Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };
    isActive := false;
    return #ok(isActive);
  };

  public shared query func getMemorySize() : async Nat {
    getMemorySizePrivate();
  };

  private func getMemorySizePrivate() : Nat {
    Prim.rts_memory_size();
  };

  public func acceptCycles() : async () {
    let available = Cycles.available();
    let accepted = Cycles.accept<system>(available);
    assert (accepted == available);
  };

  public shared query func availableCycles() : async Nat {
    Cycles.balance();
  };

  //#region Security Management

  private func idInternal() : Principal {
    Principal.fromActor(this);
  };

  private func isAnonymous(caller : Principal) : Bool {
    Principal.equal(caller, Principal.fromText("2vxsx-fae"));
  };

  private func isAuthor(caller : Principal, postId : Text) : Bool {
    ?Principal.toText(caller) == principalIdHashMap.get(postId);
  };

  private func isAdmin(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    U.arrayContains(ENV.POSTBUCKET_CANISTER_ADMINS, c);
  };

  public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    #ok(ENV.POSTBUCKET_CANISTER_ADMINS);
  };

  private func isPlatformOperator(caller : Principal) : Bool {
    ENV.isPlatformOperator(caller);
  };

  public shared query func getPlatformOperators() : async List.List<Text> {
    List.fromArray(ENV.PLATFORM_OPERATORS);
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
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    #ok(List.toArray(cgusers));
  };

  public shared ({ caller }) func registerCanister(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    //validate input
    let canisterIdToPrincipalType = Principal.fromText(id);

    if (not List.some<Text>(nuanceCanisters, func(val : Text) : Bool { val == id })) {
      nuanceCanisters := List.push<Text>(id, nuanceCanisters);
    };
    #ok();
  };

  public shared ({ caller }) func unregisterCanister(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err(Unauthorized);
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
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    //validate input
    let principalFromText = Principal.fromText(id);

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
      return #err(Unauthorized);
    };

    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    cgusers := List.filter<Text>(cgusers, func(val : Text) : Bool { val != id });
    #ok();
  };

  public shared query ({ caller }) func getPostUrls() : async Result.Result<Text, Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };
    var postUrls : Text = "";

    for ((postId, title) in titleHashMap.entries()) {
      var post : PostBucketType = buildPost(postId);
      postUrls := postUrls # post.url # "\n";
    };

    #ok(postUrls);
  };

  public shared ({ caller }) func updateHandle(principalId : Text, newHandle : Text) : async Result.Result<Text, Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    if (not isAdmin(caller) and not isNuanceCanister(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("updateHandle", Principal.toText(caller));
    switch (handleHashMap.get(principalId)) {
      case (?existingHandle) {

        handleHashMap.put(principalId, newHandle);
        handleReverseHashMap.delete(existingHandle);
        handleReverseHashMap.put(newHandle, principalId);
        lowercaseHandleHashMap.put(principalId, U.lowerCase(newHandle));
        lowercaseHandleReverseHashMap.delete(U.lowerCase(existingHandle));
        lowercaseHandleReverseHashMap.put(U.lowerCase(newHandle), principalId);
        accountIdsToHandleHashMap.put(U.principalToAID(principalId), newHandle);

        //reindex all the posts of the user by chunks
        switch (userPostsHashMap.get(principalId)) {
          case (?postIds) {
            let postIdsArray = List.toArray(postIds);
            let size = postIdsArray.size();
            let chunkCount = size / 20 + 1;
            var iter = 0;
            let PostRelationsCanister = CanisterDeclarations.getPostRelationsCanister();
            var indexingArguments = Buffer.Buffer<CanisterDeclarations.IndexPostModel>(0);
            while (iter < chunkCount) {
              let chunkPostIds = U.filterArrayByIndexes(iter * 20, (iter + 1) * 20, postIdsArray);
              for (postId in chunkPostIds.vals()) {
                let post = buildPost(postId);
                let tags = U.safeGet(tagNamesHashMap, postId, []);
                indexingArguments.add({
                  postId = postId;
                  content = post.content;
                  title = post.title;
                  subtitle = post.subtitle;
                  tags;
                });
              };
              await PostRelationsCanister.indexPosts(Buffer.toArray(indexingArguments));
              indexingArguments.clear();
              iter += 1;
            };

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

  //#region Post management

  private func buildPostUrl(postId : Text, handle : Text, title : Text) : Text {
    let canisterId = Principal.toText(idInternal());

    "/" # U.lowerCase(handle) # "/" # postId # "-" # canisterId # "/" # U.textToUrlSegment(title);
  };

  public shared query ({ caller }) func getKinicList() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isNuanceCanister(caller)) {
      return #err(NotNuanceCanister);
    };

    //using the latest post id loop through and get a URL for each post and put in an array
    var i : Nat = 0;
    var count = principalIdHashMap.size();
    var kinicList = List.nil<Text>();

    for (postId in principalIdHashMap.keys()) {
      i += 1;
      var principalId = U.safeGet(principalIdHashMap, postId, "");
      var handle = U.safeGet(handleHashMap, principalId, "");
      var title = U.safeGet(titleHashMap, postId, "");
      var url = "nuance.xyz" # buildPostUrl(postId, handle, title);
      kinicList := List.push<Text>(url, kinicList);

    };

    #ok(List.toArray(kinicList));
  };

  private func buildPost(postId : Text) : PostBucketType {
    Debug.print("PostBucket-buildPost: " # postId);

    // posts are not saved as single objects
    // the fields are fragmented across multiple hashtables (1 per field)
    // this allows us to change the schema without losing data during upgrades
    let principalId = U.safeGet(principalIdHashMap, postId, "");
    let handle = U.safeGet(handleHashMap, principalId, "");
    let title = U.safeGet(titleHashMap, postId, "");
    var creatorHandle = "";
    let creatorPrincipal = U.safeGet(creatorHashMap, postId, "");
    if(creatorPrincipal != ""){
      creatorHandle := U.safeGet(handleHashMap, creatorPrincipal, "");
    };

    {
      postId = postId;
      handle = handle;
      postOwnerPrincipal = principalId;
      url = buildPostUrl(postId, handle, title);
      title = title;
      subtitle = U.safeGet(subtitleHashMap, postId, "");
      headerImage = U.safeGet(headerImageHashMap, postId, "");
      content = U.safeGet(contentHashMap, postId, "");
      isDraft = U.safeGet(isDraftHashMap, postId, true);
      created = Int.toText(U.safeGet(createdHashMap, postId, 0));
      modified = Int.toText(U.safeGet(modifiedHashMap, postId, 0));
      publishedDate = Int.toText(U.safeGet(publishedDateHashMap, postId, 0));
      creatorPrincipal = creatorPrincipal;
      creatorHandle = creatorHandle;
      isPublication = U.safeGet(isPublicationHashMap, postId, false);
      category = U.safeGet(categoryHashMap, postId, "");
      isPremium = nftCanisterIdHashMap.get(postId) != null;
      isMembersOnly = U.safeGet(isMembersOnlyHashMap, postId, false);
      nftCanisterId = nftCanisterIdHashMap.get(postId);
      wordCount = Nat.toText(U.safeGet(wordCountsHashmap, postId, 0));
      bucketCanisterId = Principal.toText(Principal.fromActor(this));
    };
  };

  private func buildPostListItem(postId : Text) : PostBucketType {
    Debug.print("PostBucket-buildPostListItem: " # postId);

    // Use this function to build a post when displaying partial information
    // in a list like latest posts, or search results.
    // It will reduce the payload when returning multiple posts, so it doesn't
    // exceed the max size of a message on the IC. It will also increase performance.
    let principalId = U.safeGet(principalIdHashMap, postId, "");
    let handle = U.safeGet(handleHashMap, principalId, "");
    var title = U.safeGet(titleHashMap, postId, "");
    var url = buildPostUrl(postId, handle, title);
    var subTitle = U.safeGet(subtitleHashMap, postId, "");

    // only display the first 60 characters of title
    if (title.size() > 60) {
      title := U.subText(title, 0, 60) # "...";
    };

    // only display the first 200 characters of the intro (subtitle)
    if (subTitle.size() > 200) {
      subTitle := U.subText(subTitle, 0, 200) # "...";
    };

    var creatorHandle = "";
    let creatorPrincipal = U.safeGet(creatorHashMap, postId, "");
    if(creatorPrincipal != ""){
      creatorHandle := U.safeGet(handleHashMap, creatorPrincipal, "");
    };

    {
      postId = postId;
      handle = U.safeGet(handleHashMap, principalId, "");
      postOwnerPrincipal = principalId;
      url = url;
      title = title;
      subtitle = subTitle;
      headerImage = U.safeGet(headerImageHashMap, postId, "");
      content = ""; // lists do not display article content
      isDraft = U.safeGet(isDraftHashMap, postId, true);
      created = Int.toText(U.safeGet(createdHashMap, postId, 0));
      publishedDate = Int.toText(U.safeGet(publishedDateHashMap, postId, 0));
      modified = Int.toText(U.safeGet(modifiedHashMap, postId, 0));
      creatorPrincipal = creatorPrincipal;
      creatorHandle = creatorHandle;
      isPublication = U.safeGet(isPublicationHashMap, postId, false);
      category = U.safeGet(categoryHashMap, postId, "");
      isPremium = nftCanisterIdHashMap.get(postId) != null;
      isMembersOnly = U.safeGet(isMembersOnlyHashMap, postId, false);
      nftCanisterId = nftCanisterIdHashMap.get(postId);
      wordCount = Nat.toText(U.safeGet(wordCountsHashmap, postId, 0));
      bucketCanisterId = Principal.toText(Principal.fromActor(this));
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

  private func addOrUpdatePost(
    isNew : Bool,
    postId : Text,
    principalId : Text,
    title : Text,
    subtitle : Text,
    headerImage : Text,
    content : Text,
    isDraft : Bool,
    tagNames : [Text],
    creatorPrincipal : Text,
    isPublication : Bool,
    category : Text,
    isMembersOnly: Bool,
    scheduledPublishedDate: ?Int
  ) : () {

    // posts are not saved as single objects
    // the fields are fragmented across multiple hashtables (1 per field)
    // this allows us to change the schema without losing data during upgrades


    let now = U.epochTime();
    principalIdHashMap.put(postId, principalId);
    titleHashMap.put(postId, title);
    subtitleHashMap.put(postId, subtitle);
    headerImageHashMap.put(postId, headerImage);
    contentHashMap.put(postId, content);
    isDraftHashMap.put(postId, isDraft);
    modifiedHashMap.put(postId, now);
    isPublicationHashMap.put(postId, isPublication);
    if (isNew) {
      createdHashMap.put(postId, now);
      if(creatorPrincipal != ""){
        creatorHashMap.put(postId, creatorPrincipal);
      }
    };
    let post = buildPost(postId);

    if(isDraft){
      publishedDateHashMap.delete(postId);
    }
    else {
      switch(scheduledPublishedDate) {
        case(?scheduledPublishedDate) {
          publishedDateHashMap.put(postId, scheduledPublishedDate);
        };
        case(null) {
          if(post.publishedDate == "0"){
            publishedDateHashMap.put(postId, now);
          }
        };
      };
    };

    addOrUpdatePostCategory(postId, category);
    tagNamesHashMap.put(postId, tagNames);

    let wordCount = U.calculate_total_word_count(content);
    wordCountsHashmap.put(postId, wordCount);

    if(not isDraft and isMembersOnly){
      isMembersOnlyHashMap.put(postId, true);
    }
    else{
      isMembersOnlyHashMap.delete(postId);
    };
  };

  private func addOrUpdatePostCategory(postId : Text, category : Text) : () {
    let updatingPost = buildPost(postId);
    if (updatingPost.isPublication) {
      categoryHashMap.put(postId, category);
    };
  };
  //only returns the post stored in this bucket
  public shared query ({ caller }) func getPost(postId : Text) : async Result.Result<PostBucketType, Text> {
    Debug.print("PostBucket->Get: " # postId);

    //only the author can retrieve own drafts
    let isDraft = isDraftOrFutureArticle(postId);
    if (isDraft and not isAuthor(caller, postId) and not isAdmin(caller) and not isNuanceCanister(caller)) {
      return #err(Unauthorized);
    };

    if (rejectedByModClub(postId) and not isNuanceCanister(caller)) {
      return #err(RejectedByModerators);
    };

    if (principalIdHashMap.get(postId) == null) {
      return #err(ArticleNotFound);
    };

    var post = buildPost(postId);

    if (post.isPremium or post.isMembersOnly) {
      post := {
        postId = post.postId;
        handle = post.handle;
        postOwnerPrincipal = post.postOwnerPrincipal;
        url = post.url;
        title = post.title;
        subtitle = post.subtitle;
        headerImage = post.headerImage;
        content = "";
        isDraft = post.isDraft;
        created = post.created;
        modified = post.modified;
        publishedDate = post.publishedDate;
        creatorHandle = post.creatorHandle;
        creatorPrincipal = post.creatorPrincipal;
        isPublication = post.isPublication;
        category = post.category;
        isPremium = post.isPremium;
        isMembersOnly = post.isMembersOnly;
        nftCanisterId = post.nftCanisterId;
        wordCount = post.wordCount;
        bucketCanisterId = Principal.toText(Principal.fromActor(this));
      };
      #ok(post);
    } else {
      #ok(post);
    };

  };

  //only returns the post stored in this bucket
  public shared composite query ({ caller }) func getPostCompositeQuery(postId : Text) : async Result.Result<PostBucketType, Text> {
    Debug.print("PostBucket->getPostCompositeQuery: " # postId);
    //only the author can retrieve own drafts
    let isDraft = isDraftOrFutureArticle(postId);
    if (isDraft and not isAuthor(caller, postId) and not isAdmin(caller) and not isNuanceCanister(caller)) {
      if(U.safeGet(isPublicationHashMap, postId, false)){
        //publication post
        //if the caller is the creator, allow caller to see the post
        let callerPrincipalId = Principal.toText(caller);
        let callerPostIds = U.safeGet(userPostsHashMap, callerPrincipalId, List.nil());
        if(not U.arrayContains(List.toArray(callerPostIds), postId)){
          //caller is not the creator, check if the caller is an editor
          let publicationCanisterId = U.safeGet(principalIdHashMap, postId, "");
          let postCoreCanister = CanisterDeclarations.getPostCoreCanister();
          if(not (await postCoreCanister.isEditorPublic(publicationCanisterId, caller))){
            //caller is not an editor either
            return #err(Unauthorized)
          };
        };
      }
      else{
        return #err(Unauthorized);
      };
      
    };

    if (rejectedByModClub(postId) and not isNuanceCanister(caller) and not isPlatformOperator(caller)) {
      return #err(RejectedByModerators);
    };

    if (principalIdHashMap.get(postId) == null) {
      return #err(ArticleNotFound);
    };

    var post = buildPost(postId);

    let callerPrincipalText = Principal.toText(caller);
    let isReaderAuthor = callerPrincipalText == post.creatorPrincipal or isAuthor(caller, postId);

    switch(post.nftCanisterId) {
      case(?nftCanisterId) {
        //premium post
        //check whether the caller ownd any nft in the canister
        let extCanister = CanisterDeclarations.getExtCanister(nftCanisterId);
        switch(await extCanister.tokens_ext(U.fromPrincipal(caller, null))) {
          case(#ok(value)) {
            if (value.size() > 0) {
              //owns a token, return the full post
              return #ok(post);
            } else {
              //doesn't own any token, return the post with empty content
              post := {
              postId = post.postId;
              handle = post.handle;
              postOwnerPrincipal = post.postOwnerPrincipal;
              url = post.url;
              title = post.title;
              subtitle = post.subtitle;
              headerImage = post.headerImage;
              content = "";
              isDraft = post.isDraft;
              created = post.created;
              modified = post.modified;
              publishedDate = post.publishedDate;
              creatorHandle = post.creatorHandle;
              creatorPrincipal = post.creatorPrincipal;
              isPublication = post.isPublication;
              category = post.category;
              isPremium = post.isPremium;
              isMembersOnly = post.isMembersOnly;
              nftCanisterId = post.nftCanisterId;
              wordCount = post.wordCount;
              bucketCanisterId = Principal.toText(Principal.fromActor(this));
              };
              return #ok(post);
            }
          };
          case(#err(error)) {
            //doesn't own any token in the canister
            post := {
              postId = post.postId;
              handle = post.handle;
              postOwnerPrincipal = post.postOwnerPrincipal;
              url = post.url;
              title = post.title;
              subtitle = post.subtitle;
              headerImage = post.headerImage;
              content = "";
              isDraft = post.isDraft;
              created = post.created;
              modified = post.modified;
              publishedDate = post.publishedDate;
              creatorHandle = post.creatorHandle;
              creatorPrincipal = post.creatorPrincipal;
              isPublication = post.isPublication;
              category = post.category;
              isPremium = post.isPremium;
              isMembersOnly = post.isMembersOnly;
              nftCanisterId = post.nftCanisterId;
              wordCount = post.wordCount;
              bucketCanisterId = Principal.toText(Principal.fromActor(this));
            };
            #ok(post);
          };
        };
      };
      case(null) {
        if(post.isMembersOnly){
          //check if the caller is the author
          if(isReaderAuthor) {
            //caller is the author
            //return the full post
            return #ok(post);
          };
          //members only post
          //check if the caller is a subscriber
          let SubscriptionCanister = CanisterDeclarations.getSubscriptionCanister();
          let isReaderSubscriber = await SubscriptionCanister.isReaderSubscriber(post.postOwnerPrincipal, Principal.toText(caller));

          if(isReaderSubscriber){
            //caller is a subscriber
            //return the full post
            return #ok(post);
          }
          else{
            //caller is not a subscriber
            //make the content empty
            post := {
              postId = post.postId;
              handle = post.handle;
              postOwnerPrincipal = post.postOwnerPrincipal;
              url = post.url;
              title = post.title;
              subtitle = post.subtitle;
              headerImage = post.headerImage;
              content = "";
              isDraft = post.isDraft;
              created = post.created;
              modified = post.modified;
              publishedDate = post.publishedDate;
              creatorHandle = post.creatorHandle;
              creatorPrincipal = post.creatorPrincipal;
              isPublication = post.isPublication;
              category = post.category;
              isPremium = post.isPremium;
              isMembersOnly = post.isMembersOnly;
              nftCanisterId = post.nftCanisterId;
              wordCount = post.wordCount;
              bucketCanisterId = Principal.toText(Principal.fromActor(this));
            };
            #ok(post);
          }
        }
        else{
          return #ok(post);
        }
      };
    };
  };

  //returns the post list items of given postIds
  public shared query func getList(postIds : [Text]) : async [PostBucketType] {
    Debug.print("PostBucket->getList: size=" # Nat.toText(postIds.size()));

    var posts : Buffer.Buffer<PostBucketType> = Buffer.Buffer<PostBucketType>(10);
    label l for (postId in Iter.fromArray(postIds)) {
      if (postId != "" and not rejectedByModClub(postId)) {
        posts.add(buildPostListItem(postId));
      };
      if (posts.size() == 20) {
        break l;
      };
    };

    Buffer.toArray(posts);
  };
  //returns the total post count stored in bucket canister
  public shared query func getTotalPostCount() : async Nat {
    Debug.print("PostBucket->Count");
    principalIdHashMap.size();
  };

  //deletes all the posts of the given principal id in the bucket canister
  //PostCore canister will call this method for each bucket canister when deleting the posts of a user
  public shared ({ caller }) func deleteUserPosts(principalId : Text) : async Result.Result<Nat, Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };
    //validate input
    let principalFromText = Principal.fromText(principalId);

    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller) and not isNuanceCanister(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("deleteUserPosts", Principal.toText(caller));

    Debug.print("PostBucket->deleteUserPosts for PrincipalId: " # principalId);

    let userPosts = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());
    for (postId in List.toArray(userPosts).vals()) {
      ignore await delete(postId);
    };

    #ok(principalIdHashMap.size());
  };
  //deletes a post by postId. Can be called by a nuance canister, admin or writer's itself
  public shared ({ caller }) func delete(postId : Text) : async Result.Result<Nat, Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
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

    //Author can not delete a premium article but admin can delete.
    if (isAuthor(caller, postId) and U.safeGet(isPremiumHashMap, postId, false)) {
      return #err(ArticleNotEditable);
    };

    Debug.print("PostBucket->Delete: " # postId);

    let principalId = U.safeGet(principalIdHashMap, postId, "");
    if (principalId != "") {
      principalIdHashMap.delete(postId);

      // remove postId from the user's posts
      removePostIdFromUser(principalId, postId);

      // remove postId from the writer's posts if post is not draft
      if (U.safeGet(isPublicationHashMap, postId, true)) {
        let writerPrincipalId = U.safeGet(creatorHashMap, postId, "");
        if (writerPrincipalId != "") {
          removePostIdFromUser(writerPrincipalId, postId);
        };
      };

    };

    titleHashMap.delete(postId);
    subtitleHashMap.delete(postId);
    headerImageHashMap.delete(postId);
    contentHashMap.delete(postId);
    isDraftHashMap.delete(postId);
    createdHashMap.delete(postId);
    publishedDateHashMap.delete(postId);
    modifiedHashMap.delete(postId);
    creatorHashMap.delete(postId);
    isPublicationHashMap.delete(postId);
    categoryHashMap.delete(postId);
    wordCountsHashmap.delete(postId);

    #ok(principalIdHashMap.size());
  };

  //This function allows writers to migrate their draft posts to publication
  public shared ({ caller }) func migratePostToPublication(postId : Text, publicationHandle : Text, isDraft : Bool) : async Result.Result<Post, Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };
    //validate input
    if (not U.isTextLengthValid(postId, 20)) {
      return #err("Invalid postId");
    };
    if (not U.isTextLengthValid(publicationHandle, 64)) {
      return #err("Invalid publicationHandle");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    canistergeekMonitor.collectMetrics();

    //writer is not allowed to migrate his/her premium post to publication.
    if (U.safeGet(isPremiumHashMap, postId, false)) {
      return #err(ArticleNotEditable);
    };
    let UserCanister = CanisterDeclarations.getUserCanister();
    let user = await UserCanister.getUserByPrincipalId(Principal.toText(caller));
    var userHandle = "";
    var isEditor = false;
    var isWriter = false;
    switch user {
      case (#ok(user)) {
        userHandle := user.handle;
        for (userPublicationObject in user.publicationsArray.vals()) {
          if (Text.equal(userPublicationObject.publicationName, publicationHandle)) {
            if (userPublicationObject.isEditor) {
              isEditor := true;
            } else {
              isWriter := true;
            };
          };
        };
      };
      case (#err(error)) { return #err(UserNotFound) };
    };

    let wasDraft = U.safeGet(isDraftHashMap, postId, false);

    //authorization
    if ((not ((isEditor or isWriter) and (isAuthor(caller, postId)) and wasDraft)) or (not isDraft and not isEditor)) {
      return #err(Unauthorized);
    };

    Debug.print("PostBucket->MigratePostToPublication: " # postId);
    let postCoreActor = CanisterDeclarations.getPostCoreCanister();
    //make the post publication post in PostCore canister
    let now = U.epochTime();
    await postCoreActor.makePostPublication(postId, publicationHandle, userHandle, isDraft, now);
    await makePostPublication(postId, publicationHandle, userHandle, isDraft, now);

    let keyProperties = await postCoreActor.updatePostDraft(postId, isDraft, U.epochTime(), Principal.toText(caller));

    Debug.print("PostBucket -> building full post.");
    let postBucketType = buildPost(postId);
    #ok({
      bucketCanisterId = keyProperties.bucketCanisterId;
      category = postBucketType.category;
      claps = keyProperties.claps;
      content = postBucketType.content;
      created = postBucketType.created;
      creatorHandle = postBucketType.creatorHandle;
      creatorPrincipal = postBucketType.creatorPrincipal;
      handle = postBucketType.handle;
      headerImage = postBucketType.headerImage;
      isDraft = postBucketType.isDraft;
      isPremium = postBucketType.isPremium;
      isPublication = postBucketType.isPublication;
      modified = postBucketType.modified;
      postId = postBucketType.postId;
      publishedDate = postBucketType.publishedDate;
      subtitle = postBucketType.subtitle;
      tags = keyProperties.tags;
      title = postBucketType.title;
      url = postBucketType.url;
      views = keyProperties.views;
      wordCount = postBucketType.wordCount;
      isMembersOnly = postBucketType.isMembersOnly;
      nftCanisterId = postBucketType.nftCanisterId;
    });
  };


  //a private method that makes a draft post a publication post
  private func makePostPublication(postId : Text, publicationHandle : Text, userHandle : Text, isDraft : Bool, now : Int) : async () {
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
              accountIdsToHandleHashMap.put(U.principalToAID(publicationPrincipalId), publicationHandle);
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
      isPublicationHashMap.put(postId, true);
      creatorHashMap.put(postId, userPrincipalId);
      //add postId to publication's posts
      addPostIdToUser(publicationPrincipalId, postId);
      isDraftHashMap.put(postId, isDraft);
      if (isDraft) {
        publishedDateHashMap.delete(postId);
      } else {
        publishedDateHashMap.put(postId, now);
      };
      modifiedHashMap.put(postId, now);
    };
  };


  //save method can only be called from PostCore canister. Users will call the save method in PostCore and it'll do the rest.
  //Reject all the other callers if they're not admin or a nuance canister.
  //indexing, postVersion management and modclub verification will also be handled by PostCore canister.
  public shared (msg) func save(postModel : PostSaveModel) : async SaveResult {
    Debug.print("PostBucket save input: " # debug_show(postModel));
    if (isAnonymous(msg.caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isNuanceCanister(msg.caller) and not isAdmin(msg.caller)) {
      Debug.print("PostBucket-> " # Unauthorized);
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    let caller = postModel.caller;
    let postOwnerPrincipalId = postModel.postOwnerPrincipalId;
    let postIdTrimmed = U.trim(postModel.postId);
    let isNew = (postIdTrimmed == "");
    let isPublication = postModel.isPublication;

    //if category is not empty, ensure it's a publication post
    if (not Text.equal(postModel.category, "") and not isPublication) {
      return #err(NotPublicationPost);
    };

    //if not isNew, and members-only article, don't allow it to be premium
    if((not isNew) and U.safeGet(isMembersOnlyHashMap, postIdTrimmed, false)){
      //existing members only article
      //if postModel.premium is not null, return an error
      if(postModel.premium != null){
        return #err("You can not make a members only article premium!");
      }
    };

    //if the creator field is not empty and it's not a publication post, return an error
    if (not isPublication and postModel.creatorHandle != "") {
      return #err(Unauthorized);
    };
    let postCoreActor = CanisterDeclarations.getPostCoreCanister();

    var savedCreatedDate : Int = 0;
    var postId = "";
    //if it's a new post, get the new postId from core canister
    if (isNew) {
      switch (await postCoreActor.getNextPostId()) {
        case (#ok(value)) { postId := value };
        case (#err(err)) {
          return #err(err);
        };
      };
    } else {
      postId := postIdTrimmed;
    };

    var isPremiumAlready : Bool = if (U.safeGet(isPremiumHashMap, postId, false)) {
      true;
    } else {false};

    //if it's already a premium post and not a new article, give an error if it's not a category change
    if (not isNew and isPremiumAlready and not U.safeGet(isDraftHashMap, postId, true)) {
      let category = U.safeGet(categoryHashMap, postId, "");
      if (postModel.category != category) {
        //assume that it's just a category change
        //ignore the other changes if there's
        addOrUpdatePostCategory(postId, postModel.category);
        return #ok(buildPost(postId));
      };
      return #err(ArticleNotEditable);
    };

    // retrieve user handle if it's not already mapped to the principalId
    var userHandle = U.safeGet(handleHashMap, postOwnerPrincipalId, "");
    if (userHandle == "") {
      let UserCanister = CanisterDeclarations.getUserCanister();
      var user : ?User = await UserCanister.getUserInternal(postOwnerPrincipalId);
      switch (user) {
        case (null) return #err("cross canister User not found");
        case (?value) {
          userHandle := value.handle;

          handleHashMap.put(postOwnerPrincipalId, value.handle);
          handleReverseHashMap.put(value.handle, postOwnerPrincipalId);
          lowercaseHandleHashMap.put(postOwnerPrincipalId, U.lowerCase(value.handle));
          lowercaseHandleReverseHashMap.put(U.lowerCase(value.handle), postOwnerPrincipalId);
          accountIdsToHandleHashMap.put(U.principalToAID(postOwnerPrincipalId), value.handle);
        };
      };
    };
    //check if the given creator is valid - only for publication posts
    var creatorHandle = postModel.creatorHandle;
    var creatorPrincipal = U.safeGet(handleReverseHashMap, creatorHandle, "");
    if (creatorPrincipal == "" and isPublication) {
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
          accountIdsToHandleHashMap.put(U.principalToAID(value.principal), value.handle);
        };
      };
    };

    //if premium post, call NftFactory canister to create new EXT NFT canister and map the canister id to the post id.
    switch(postModel.premium) {
      case(?premiumData) {
        //check if the article is a members-only article
        //if yes, return an error
        let writerAddress = U.fromText(creatorPrincipal, null);
        var initialMintingAddresses = Buffer.Buffer<Text>(0);
        initialMintingAddresses.add(writerAddress);
        for(editorPrincipal in premiumData.editorPrincipals.vals()) {
          if(editorPrincipal != creatorPrincipal){
            initialMintingAddresses.add(U.fromText(editorPrincipal, null));
          }
        };
        let initData : CanisterDeclarations.InitNftCanisterData = {
          admins = [
            Principal.fromText(ENV.SNS_GOVERNANCE_CANISTER),
            Principal.fromText(ENV.NFT_FACTORY_CANISTER_ID),
            Principal.fromText(ENV.POST_CORE_CANISTER_ID),
            Principal.fromActor(this)
          ];
          collectionName = postModel.title;
          initialMintingAddresses = Buffer.toArray(initialMintingAddresses);
          marketplaceOpen = Time.now();
          metadata = #nonfungible({
            asset = "nuance-article-" # postId;
            thumbnail = "nuance-article-" # postId;
            name = "nuance-article-" # postId;
            metadata = null;
          });
          royalty = [
            (ENV.SNS_GOVERNANCE_IC_ACCOUNT, 10_000),
            (writerAddress, 5_000)
          ];
          thumbnail = premiumData.thumbnail;
          maxSupply = premiumData.maxSupply;
          icpPrice = premiumData.icpPrice;
          postId = postId;
          writerPrincipal = Principal.fromText(creatorPrincipal);
        };
        let nftFactoryCanister = CanisterDeclarations.getNftFactoryCanister();
        switch(await nftFactoryCanister.createNftCanister(initData)) {
          case(#ok(canisterId)) {
            //put the canister id value to the hashmap
            nftCanisterIdHashMap.put(postId, canisterId);
            isPremiumHashMap.put(postId, true);
          };
          case(#err(error)) {
            //nftFactory returned an error
            //return the same error
            return #err(error);
          };
        };
      };
      case(null) {
        //not a premium post
        //nothing to do
      };
    };


    addOrUpdatePost(
      isNew,
      postId,
      postOwnerPrincipalId,
      postModel.title,
      postModel.subtitle,
      postModel.headerImage,
      postModel.content,
      postModel.isDraft,
      postModel.tagNames,
      creatorPrincipal,
      isPublication,
      postModel.category,
      postModel.isMembersOnly,
      postModel.scheduledPublishedDate
    );

    // add this postId to the user's posts if not already added
    addPostIdToUser(postOwnerPrincipalId, postId);

    // if it's a publication post add this postId to the writer's posts if not already added
    if (isPublication) {
      addPostIdToUser(creatorPrincipal, postId);
    };

    #ok(buildPost(postId));
  };

  public shared (msg) func saveMultiple(postModels : [PostSaveModel]) : async [SaveResult] {
    Debug.print("PostBucket saveMultiple input: " # debug_show(postModels));

    if (not isNuanceCanister(msg.caller) and not isAdmin(msg.caller)) {
      Debug.print("PostBucket-> " # Unauthorized);
      return [#err(Unauthorized)];
    };

    if (not isThereEnoughMemoryPrivate()) {
      return [#err("Canister reached the maximum memory threshold. Please try again later.")];
    };
    let postCoreActor = CanisterDeclarations.getPostCoreCanister();
    var postIdsStart = 0;
    switch(await postCoreActor.getNextPostIdsDebug(postModels.size())) {
      case(#ok(value)) {
        postIdsStart := U.textToNat(value);
      };
      case(#err(error)) {
        return [#err(error)]
      };
    };

    var counter = 0;
    let results = Buffer.Buffer<SaveResult>(0);
    for(postModel in postModels.vals()){

      let caller = postModel.caller;
      let postOwnerPrincipalId = postModel.postOwnerPrincipalId;

      var savedCreatedDate : Int = 0;
      var postId = Nat.toText(postIdsStart + counter);

      let a = addOrUpdatePost(
        true,
        postId,
        postOwnerPrincipalId,
        postModel.title,
        postModel.subtitle,
        postModel.headerImage,
        postModel.content,
        postModel.isDraft,
        postModel.tagNames,
        "",
        false,
        postModel.category,
        postModel.isMembersOnly,
        postModel.scheduledPublishedDate
      );
      // add this postId to the user's posts if not already added
      addPostIdToUser(postOwnerPrincipalId, postId);

      results.add(#ok(buildPost(postId)));
      counter += 1;
    };
    Buffer.toArray(results)
  };

  //premium articles migration functions
  public shared query func getNotMigratedPremiumArticlePostIds() : async [Text] {
    let resultBuffer = Buffer.Buffer<Text>(0);
    for((premiumArticlePostId, isPremiumValue) in isPremiumHashMap.entries()){
      if(isPremiumValue){
       switch(nftCanisterIdHashMap.get(premiumArticlePostId)) {
        case(?value) {
          //already migrated or a new premium post
          //nothing to do
        };
        case(null) {
          //premium article but doesn't have any nft canister id associated
          //not migrated yet
          resultBuffer.add(premiumArticlePostId);
        };
       }; 
      }
    };
    Buffer.toArray(resultBuffer)
  };

  //migration from handle to principal for creatorHashMap
  public shared ({caller}) func migrateCreatorsFromHandlesToPrincipals() : async Result.Result<(Nat, [Text]), Text> {
    if(not isPlatformOperator(caller)){
      return #err(Unauthorized)
    };

    var creatorHandleToPrincipalIdsHashMap = HashMap.HashMap<Text, Text>(initCapacity, Text.equal, Text.hash);
    let notFoundHandlesBuffer = Buffer.Buffer<Text>(0);
    for((postId, creatorHandle) in creatorHashMap.entries()){
      switch(handleReverseHashMap.get(creatorHandle)) {
        case(?principalId) {
          creatorHandleToPrincipalIdsHashMap.put(creatorHandle, principalId);
        };
        case(null) {
          notFoundHandlesBuffer.add(creatorHandle)
        };
      };
    };

    //get the principal ids that doesn't exist in this canister
    let UserCanister = CanisterDeclarations.getUserCanister();
    let userListItems = await UserCanister.getUsersByHandles(Buffer.toArray(notFoundHandlesBuffer));
    for(userListItem in userListItems.vals()){
      creatorHandleToPrincipalIdsHashMap.put(userListItem.handle, userListItem.principal);
    };

    var success = 0;
    var stillNotFoundHandlesBuffer = Buffer.Buffer<Text>(0);
    //creatorHandleToPrincipalIdsHashMap should now hold all the creator handle-principal pairs needed 
    for((postId, creatorHandle) in creatorHashMap.entries()){
      //delete the value first
      creatorHashMap.delete(postId);
      switch(creatorHandleToPrincipalIdsHashMap.get(creatorHandle)) {
        case(?principalId) {
          //principal id found, use it
          creatorHashMap.put(postId, principalId);
          success += 1;
        };
        case(null) {
          //principal id not found
          //log the post id of not found handles in an array so that we can mannually fix those
          if(U.safeGet(isPublicationHashMap, postId, false)){
            stillNotFoundHandlesBuffer.add(postId);
          };
        };
      };
    };
    #ok(success, Buffer.toArray(stillNotFoundHandlesBuffer))
  };
  //will check all the posts of the given publication principal id and use the assigningWriterPrincipalId value as the creator
  //will also add the postId to the writer's post ids by calling the addPostIdToUser function
  public shared ({caller}) func fixEmptyCreatorFields(publicationPrincipalId: Text, assigningWriterPrincipalId: Text) : async Result.Result<Nat, Text> {
    if(not isPlatformOperator(caller)){
      return #err("Unauthorized");
    };
    var counter = 0;
    let publicationPostIds = U.safeGet(userPostsHashMap, publicationPrincipalId, List.nil<Text>());
    for(postId in List.toIter(publicationPostIds)) {
      let isPublication = U.safeGet(isPublicationHashMap, postId, false);
      let creator = U.safeGet(creatorHashMap, postId, "");
      if(isPublication and creator == ""){
        //post is a publication post and the creator field is empty
        //use the given principal id
        creatorHashMap.put(postId, assigningWriterPrincipalId);
        //add the post id to the given writer's principal ids
        addPostIdToUser(assigningWriterPrincipalId, postId);
        counter += 1;
      };
    };

    #ok(counter)
  };

  // debug function to remove 'isMembersOnly = true' status of existing draft articles
  public shared ({ caller }) func debugMembersOnlyStatusOfExistingDraftArticles() : async Result.Result<[Text], Text> {
    if(not isAdmin(caller)){
      return #err("Unauthorized");
    };

    let debuggedPostIds = Buffer.Buffer<Text>(isMembersOnlyHashMap.size());

    // if the article is a draft remove it from isMembersOnlyHashMap
    for (postId in isMembersOnlyHashMap.keys()) {
        // check if the corresponding post is marked as a draft
        switch (isDraftHashMap.get(postId)) {
          case (?true) {
            // if it's a draft remove it from the isMembersOnlyHashMap
            isMembersOnlyHashMap.delete(postId);
            debuggedPostIds.add(postId);
          };
          case (_) {};
        };
    };
    return #ok(Buffer.toArray(debuggedPostIds));
  };

  //returns the not migrated postIds
  //once the debug is done, it should return an empty array
  public shared query ({caller}) func getAllNotMigratedCreatorFields() : async [Text] {
    if(not isPlatformOperator(caller)){
      return []
    };

    let result = Buffer.Buffer<Text>(0);

    for((postId, isPublication) in isPublicationHashMap.entries()){
      if(isPublication){
        let creator = U.safeGet(creatorHashMap, postId, "");
        if(creator == ""){
          result.add(postId);
        };
      }
    };

    Buffer.toArray(result)
  };
  //a debug function to set the creator field of a post individually
  //hopefully, we won't need to use it
  public shared ({caller}) func debugSetCreatorFieldAndAddPostIdToUser(postId: Text, creatorPrincipal: Text) : async Result.Result<PostBucketType, Text> {
    if(not isPlatformOperator(caller)){
      return #err("Unauthorized");
    };

    let isPublication = U.safeGet(isPublicationHashMap, postId, false);
    if(isPublication){
      //use the given principal id
      creatorHashMap.put(postId, creatorPrincipal);
      //add the post id to the given writer's principal ids
      addPostIdToUser(creatorPrincipal, postId);
      return #ok(buildPost(postId));
    }
    else{
      return #err("Post is not a publication post.");
    }

  };

  public shared ({caller}) func migratePremiumArticleFromOldArch(postId: Text, price: ?Nat) : async Result.Result<Text, Text> {
    if(not (isPlatformOperator(caller) or isAdmin(caller))){
      return #err("Unauthorized.");
    };
    switch(isPremiumHashMap.get(postId)) {
      case(?isPremiumValue) {
        if(isPremiumValue){
          //check if any nftCanisterId value exists for the given post
          switch(nftCanisterIdHashMap.get(postId)) {
            case(?cai) {
              //already migrated
              return #err("Already migrated.")
            };
            case(null) {
              //not migrated yet
              //migrate it
              //get the publication canister id first
              switch(principalIdHashMap.get(postId)) {
                case(?publicationCanisterId) {
                  //get the premium article information from the publication canister
                  //the publication canisters shouldn't be upgraded before completing the migration of all premium articles
                  type GetPremiumArticleInfoReturn = {
                    totalSupply : Text;
                    nftCanisterId : Text;
                    postId : Text;
                    tokenIndexStart : Text;
                    sellerAccount : Text;
                    writerHandle : Text;
                  };
                  type PublicationCanisterInterfaceOld = actor {
                    getPremiumArticleInfo : query (postId : Text) -> async Result.Result<GetPremiumArticleInfoReturn, Text>;
                  };
                  let publicationCanister : PublicationCanisterInterfaceOld = actor(publicationCanisterId);
                  switch(await publicationCanister.getPremiumArticleInfo(postId)) {
                    case(#ok(premiumArticleInformation)) {
                      let extCanister = CanisterDeclarations.getExtCanister(premiumArticleInformation.nftCanisterId);
                      //set the thumbnail
                      let thumbnailBlob = await extCanister.http_request_streaming_callback({
                        content_encoding = "";
                        index = 0;
                        key = postId;
                        sha256 = null;
                      });
                      let thumbnailText = switch(Text.decodeUtf8(thumbnailBlob.body)) {
                        case(?value) {
                          value;
                        };
                        case(null) {
                          ""
                        };
                      };
                      if(thumbnailText == ""){
                        return #err("Thumbnail not found.")
                      };
                      //find the holders
                      let registry = await extCanister.getRegistry();
                      let initialMintingAddressesBuffer = Buffer.Buffer<Text>(0);
                      let sellerAccount = premiumArticleInformation.sellerAccount;
                      let tokenIndexStart = U.textToNat(premiumArticleInformation.tokenIndexStart);
                      let tokenIndexEnd = tokenIndexStart + U.textToNat(premiumArticleInformation.totalSupply);
                      for(registryEl in registry.vals()){
                        let tokenIndex = Nat32.toNat(registryEl.0);
                        if(tokenIndex >= tokenIndexStart and tokenIndex < tokenIndexEnd and registryEl.1 != sellerAccount){
                          initialMintingAddressesBuffer.add(registryEl.1);
                        };
                      };
                      //populate the initData
                      //writer address & principal id
                      let post = buildPost(postId);
                      let writerHandle = post.creatorHandle;
                      let writerPrincipalId = U.safeGet(handleReverseHashMap, writerHandle, "");
                      let writerAddress = U.fromText(writerPrincipalId, null);
                      //find the selling price
                      var icpPrice = 0;
                      switch(await extCanister.tokens_ext(sellerAccount)) {
                        case(#ok(ownedTokens)) {
                          switch(ownedTokens[0].1) {
                            case(?listingValue) {
                              icpPrice := Nat64.toNat(listingValue.price);
                            };
                            case(null) {
                              //not possible
                              return #err("Not able to find the selling price from NFT canister. Please provide a selling price.");
                            };
                          };
                        };
                        case(#err(error)) {
                          //not possible unless any article is sold out
                          switch(price) {
                            case(?givenPriceFromAnPlatformOperator) {
                              icpPrice := givenPriceFromAnPlatformOperator;
                            };
                            case(null) {
                              //article is sold out
                              return #err("Article is sold out. Please provide a price in arguments")
                            };
                          };
                        };
                      };
                      
                      let initData : CanisterDeclarations.InitNftCanisterData = {
                        admins = [
                          Principal.fromText(ENV.SNS_GOVERNANCE_CANISTER),
                          Principal.fromText(ENV.NFT_FACTORY_CANISTER_ID),
                          Principal.fromText(ENV.POST_CORE_CANISTER_ID),
                          Principal.fromActor(this)
                        ];
                        collectionName = post.title;
                        initialMintingAddresses = Buffer.toArray(initialMintingAddressesBuffer);
                        marketplaceOpen = Time.now();
                        metadata = #nonfungible({
                          asset = "nuance-article-" # postId;
                          thumbnail = "nuance-article-" # postId;
                          name = "nuance-article-" # postId;
                          metadata = null;
                        });
                        royalty = [
                          (ENV.SNS_GOVERNANCE_IC_ACCOUNT, 10_000),
                          (writerAddress, 5_000)
                        ];
                        thumbnail = thumbnailText;
                        maxSupply = U.textToNat(premiumArticleInformation.totalSupply);
                        icpPrice = icpPrice;
                        postId = postId;
                        writerPrincipal = Principal.fromText(writerPrincipalId);
                      };
                      let nftFactoryCanister = CanisterDeclarations.getNftFactoryCanister();
                      switch(await nftFactoryCanister.createNftCanister(initData)) {
                        case(#ok(canisterId)) {
                          //put the canister id value to the hashmap
                          nftCanisterIdHashMap.put(postId, canisterId);
                          isPremiumHashMap.put(postId, true);
                          return #ok(canisterId);
                        };
                        case(#err(error)) {
                          //nftFactory returned an error
                          //return the same error
                          return #err(error);
                        };
                      };
                    };
                    case(#err(error)) {
                      //not possible
                      return #err("Error from publication canister while calling getPremiumArticleInfo: " # error);
                    };
                  };
                };
                case(null) {
                  //article doesn't exist
                  //not possible to be here
                  return #err("Article not found.")
                };
              };
            };
          };
        }
        else{
          #err("Given post is not a premium article.")
        }
      };
      case(null) {
        //not a premium article
        //return an error
        #err("Given post is not a premium article.")
      };
    };
  };

  public shared query func getUserPostIds(principalId: Text) : async [Text] {
    List.toArray(U.safeGet(userPostsHashMap, principalId, List.nil<Text>()));
  };

  //added the includeDraft method to allow users to get their draft articles by this method
  public shared query ({ caller }) func getUserPosts(handle : Text, includeDraft : Bool) : async [PostBucketType] {
    Debug.print("PostBucket->GetUserPosts: " # handle);

    var postsBuffer : Buffer.Buffer<PostBucketType> = Buffer.Buffer<PostBucketType>(userPostsHashMap.size());
    //validate input
    if (not U.isTextLengthValid(handle, 64)) {
      return Buffer.toArray(postsBuffer);
    };

    let trimmedHandle = U.trim(handle);
    let callerPrincipalId = Principal.toText(caller);
    let authorPrincipalId = U.safeGet(lowercaseHandleReverseHashMap, trimmedHandle, "");

    if (authorPrincipalId != "") {
      let userPostIds = U.safeGet(userPostsHashMap, authorPrincipalId, List.nil<Text>());

      List.iterate(
        userPostIds,
        func(postId : Text) : () {
          let isDraft = isDraftOrFutureArticle(postId);

          if (not isDraft and not rejectedByModClub(postId)) {
            let postListItem = buildPostListItem(postId);
            postsBuffer.add(postListItem);
          } else if (isDraft and not rejectedByModClub(postId) and includeDraft and authorPrincipalId == callerPrincipalId) {
            let postListItem = buildPostListItem(postId);
            postsBuffer.add(postListItem);
          };
        },
      );
    };

    Buffer.toArray(postsBuffer);
  };

  //only callable by editors
  public shared composite query ({caller}) func getPublicationPosts(postIds: [Text], publicationHandle: Text) : async [PostBucketType] {
    let publicationCanisterId = U.safeGet(handleReverseHashMap, publicationHandle, "");
    let postCoreCanister = CanisterDeclarations.getPostCoreCanister();
    if(not (await postCoreCanister.isEditorPublic(publicationCanisterId, caller))){
      //caller is not an editor
      //return an empty array
      return [];
    };
    let resultBuffer = Buffer.Buffer<PostBucketType>(0);
    for(postId in postIds.vals()){
      switch(principalIdHashMap.get(postId)) {
        case(?postOwnerPrincipalId) {
          if(publicationCanisterId == postOwnerPrincipalId){
            //if the owner is the publication canister, add the post to the resultBuffer
            resultBuffer.add(buildPost(postId))
          }
          else{
            //owner is not the given publication
            //do nothing
          }
        };
        case(null) {
          //there's no post with that id
          //do nothing
        };
      };
    };
    Buffer.toArray(resultBuffer)
  };


  //Allows getting posts by postIds including drafts
  public shared query ({ caller }) func getPostsByPostIds(postIds : [Text], includeDraft : Bool) : async [PostBucketType] {
    Debug.print("PostBucket->GetPostsByPostIds");

    var postsBuffer : Buffer.Buffer<PostBucketType> = Buffer.Buffer<PostBucketType>(userPostsHashMap.size());

    let callerPrincipalId = Principal.toText(caller);
    let givenPostIds = List.fromArray(postIds);

    List.iterate(
      givenPostIds,
      func(postId : Text) : () {
        let isDraft = isDraftOrFutureArticle(postId);
        let authorPrincipalId = U.safeGet(principalIdHashMap, postId, "");
        //only for publication posts
        let callerPostIds = U.safeGet(userPostsHashMap, callerPrincipalId, List.nil<Text>());
        let isWriter = U.arrayContains(List.toArray(callerPostIds), postId);
        if (not isDraft and not (rejectedByModClub(postId) and not isPlatformOperator(caller))) {
          let postListItem = buildPostListItem(postId);
          postsBuffer.add(postListItem);
        } else if (isDraft and not (rejectedByModClub(postId) and not isPlatformOperator(caller)) and includeDraft and (authorPrincipalId == callerPrincipalId or isWriter)) {
          let postListItem = buildPostListItem(postId);
          postsBuffer.add(postListItem);
        };
      },
    );

    Buffer.toArray(postsBuffer);
  };

  //Allows getting posts by postIds
  //only accessible to platform operators
  //returns the full posts
  public shared query ({ caller }) func getPostsByPostIdsMigration(postIds : [Text]) : async [PostBucketType] {
    Debug.print("PostBucket->getPostsByPostIdsMigration");
    if(not isPlatformOperator(caller)){
      return [];
    };

    var postsBuffer : Buffer.Buffer<PostBucketType> = Buffer.Buffer<PostBucketType>(userPostsHashMap.size());
    let givenPostIds = List.fromArray(postIds);

    List.iterate(
      givenPostIds,
      func(postId : Text) : () {
        let isDraft = U.safeGet(isDraftHashMap, postId, false);
        if (not isDraft and not rejectedByModClub(postId)) {
          let post = buildPost(postId);
          postsBuffer.add(post);
        };
      },
    );

    Buffer.toArray(postsBuffer);
  };

  public shared ({ caller }) func generatePublishedDates() : async () {
    if (not isThereEnoughMemoryPrivate() or not isAdmin(caller)) {
      assert false;
    };

    let now = U.epochTime();
    for (postId in isDraftHashMap.keys()) {
      let isDraft = U.safeGet(isDraftHashMap, postId, true);
      if (not isDraft) {
        let publishedDate = U.safeGet(publishedDateHashMap, postId, 0);
        if (Int.equal(publishedDate, 0)) {
          publishedDateHashMap.put(postId, now);
        };
      };

    };
  };

  public shared ({ caller }) func removePostCategory(postId : Text) : async Result.Result<PostBucketType, Text> {

    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    //validate input
    if (not U.isTextLengthValid(postId, 20)) {
      return #err("Invalid postId");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    let updatingPost = buildPost(postId);

    if (not isAuthor(caller, postId)) {
      return #err(Unauthorized);
    };

    if (not Bool.equal(updatingPost.isPublication, true)) {
      return #err(NotPublicationPost);
    };

    let now = U.epochTime();
    modifiedHashMap.put(postId, now);

    categoryHashMap.delete(postId);
    let postCoreActor = CanisterDeclarations.getPostCoreCanister();
    //removes the post category from the PostCore canister
    await postCoreActor.addPostCategory(postId, "", now);
    #ok(buildPost(postId));
  };

  public shared ({ caller }) func addPostCategory(postId : Text, category : Text) : async Result.Result<PostBucketType, Text> {

    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    //validate input
    if (not U.isTextLengthValid(postId, 20)) {
      return #err("Invalid postId");
    };
    if (not U.isTextLengthValid(category, 64)) {
      return #err("Invalid category");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    let updatingPost = buildPost(postId);

    if (not isAuthor(caller, postId)) {
      return #err(Unauthorized);
    };

    if (not Bool.equal(updatingPost.isPublication, true)) {
      return #err(NotPublicationPost);
    };

    let now = U.epochTime();
    modifiedHashMap.put(postId, now);

    categoryHashMap.put(postId, category);
    let postCoreActor = CanisterDeclarations.getPostCoreCanister();
    //add the post category in the PostCore canister
    await postCoreActor.addPostCategory(postId, category, now);

    #ok(buildPost(postId));
  };

  public shared ({ caller }) func updatePostDraft(postId : Text, isDraft : Bool) : async Result.Result<Post, Text> {

    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    //validate input
    if (not U.isTextLengthValid(postId, 20)) {
      return #err("Invalid postId");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    let updatingPost = buildPost(postId);

    if (not isAuthor(caller, postId)) {
      return #err(Unauthorized);
    };

    if (not Bool.equal(updatingPost.isPublication, true)) {
      return #err(NotPublicationPost);
    };

    //restrict editing the premium articles
    if (U.safeGet(isPremiumHashMap, postId, false) and not updatingPost.isDraft) {
      return #err(ArticleNotEditable);
    };

    let now = U.epochTime();
    modifiedHashMap.put(postId, now);
    isDraftHashMap.put(postId, isDraft);
    if(isDraft){
      publishedDateHashMap.delete(postId);
    };
    let postCoreActor = CanisterDeclarations.getPostCoreCanister();
    let writerHandle = updatingPost.creatorHandle;
    let writerPrincipalId = U.safeGet(handleReverseHashMap, writerHandle, "");
    let keyProperties = await postCoreActor.updatePostDraft(postId, isDraft, now, writerPrincipalId);

    let postBucketType = buildPost(postId);
    #ok({
      bucketCanisterId = keyProperties.bucketCanisterId;
      category = postBucketType.category;
      claps = keyProperties.claps;
      content = postBucketType.content;
      created = postBucketType.created;
      creatorHandle = postBucketType.creatorHandle;
      creatorPrincipal = postBucketType.creatorPrincipal;
      handle = postBucketType.handle;
      headerImage = postBucketType.headerImage;
      isDraft = postBucketType.isDraft;
      isPremium = postBucketType.isPremium;
      isPublication = postBucketType.isPublication;
      modified = postBucketType.modified;
      postId = postBucketType.postId;
      publishedDate = postBucketType.publishedDate;
      subtitle = postBucketType.subtitle;
      tags = keyProperties.tags;
      title = postBucketType.title;
      url = postBucketType.url;
      views = keyProperties.views;
      wordCount = postBucketType.wordCount;
      isMembersOnly = postBucketType.isMembersOnly;
      nftCanisterId = postBucketType.nftCanisterId;
    });
  };


  //gets the handles and principals of the users that created at least 1 post as argument and stores them in the handle hashmaps - migration method
  public shared (msg) func storeHandlesAndPrincipals(handlesAndPrincipalIds : [(Text, Text)]) : async Result.Result<Text, Text> {
    if (isAnonymous(msg.caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isNuanceCanister(msg.caller) and not isAdmin(msg.caller)) {
      Debug.print("PostBucket-> " # Unauthorized);
      return #err(Unauthorized);
    };
    for ((handle, principalId) in handlesAndPrincipalIds.vals()) {
      handleHashMap.put(principalId, handle);
      handleReverseHashMap.put(handle, principalId);
      lowercaseHandleHashMap.put(principalId, U.lowerCase(handle));
      lowercaseHandleReverseHashMap.put(U.lowerCase(handle), principalId);
      accountIdsToHandleHashMap.put(U.principalToAID(principalId), handle);
    };
    return #ok(Nat.toText(handleHashMap.size()));
  };

  //#region indexing
  public shared ({ caller }) func reindex() : async Result.Result<Text, Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    // loop through each post and call indexPost function
    /*
    var i : Nat = 0;
    var count = principalIdHashMap.size();
    for (postId in principalIdHashMap.keys()) {
      i += 1;
      Debug.print("Indexing postId " # postId # " (" # Nat.toText(i) # " of " # Nat.toText(count) # ")");

      let handle = U.safeGet(handleHashMap, postId, "");
      let title = U.safeGet(titleHashMap, postId, "");
      let subtitle = U.safeGet(subtitleHashMap, postId, "");
      let content = U.safeGet(contentHashMap, postId, "");
      let current = handle # " " # title # " " # subtitle;
      let tags = U.safeGet(tagNamesHashMap, postId, []);
      let PostIndexCanister = CanisterDeclarations.getPostIndexCanister();
      ignore PostIndexCanister.indexPost(postId, "", current, [], tags);

    };

    #ok(Nat.toText(count));
    */
    //retired for now
    #ok("Retired.")
  };

  //#region dump
  public shared ({ caller }) func dumpIds() : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    Debug.print("PostBucket->DumpIds");
    for ((postId, principalId) in principalIdHashMap.entries()) {
      Debug.print("PostBucket->DumpIds: " # postId);
    };

    #ok();
  };

  public shared ({ caller }) func dumpUserIds() : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    Debug.print("PostBucket->DumpUserIds");
    for ((postId, principalId) in principalIdHashMap.entries()) {
      Debug.print("PostBucket->DumpUserIds: " # principalId);
    };

    #ok();
  };

  public shared ({ caller }) func dumpPosts() : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    Debug.print("PostBucket->DumpPosts");
    for ((postId, principalId) in principalIdHashMap.entries()) {
      var post : PostBucketType = buildPost(postId);
      Debug.print("PostBucket->DumpUserIds: postId -> " # postId);
      Debug.print("PostBucket->DumpUserIds: principalId -> " # principalId);
      Debug.print("PostBucket->DumpUserIds: title -> " # post.title);
      Debug.print("PostBucket->DumpUserIds: content -> " # post.content);
    };

    #ok();
  };



  //#region Bucket canister modclub management
  private func rejectedByModClub(postId : Text) : Bool {
    switch (rejectedByModclubPostIdsHashmap.get(postId)) {
      case (?value) {
        return true;
      };
      case (null) {
        return false;
      };
    };
  };
  //returns true if the post is draft or it's a scheduled post which was scheduled for future
  private func isDraftOrFutureArticle(postId: Text) : Bool {
    let now = U.epochTime();
    let isDraft = U.safeGet(isDraftHashMap, postId, true);
    let publishedDate = U.safeGet(publishedDateHashMap, postId, now);
    publishedDate > now or isDraft
  };

  //returns all the rejected postIds
  public shared query func getAllRejected() : async [(Text, Text)] {
    return Iter.toArray(rejectedByModclubPostIdsHashmap.entries());
  };

  //can only be called by PostCore or admins
  public shared ({ caller }) func rejectPostByModclub(postId : Text) : () {
    if (isAnonymous(caller)) {
      return;
    };

    if (not isAdmin(caller) and not isNuanceCanister(caller)) {
      Prelude.unreachable();
    };

    rejectedByModclubPostIdsHashmap.put(postId, postId);
  };

  //can only be called by PostCore or admins
  public shared ({ caller }) func unRejectPostByModclub(postId : Text) : () {
    if (isAnonymous(caller)) {
      return;
    };

    if (not isAdmin(caller) and not isNuanceCanister(caller)) {
      Prelude.unreachable();
    };
    rejectedByModclubPostIdsHashmap.delete(postId);
  };

  public shared query func getCanisterVersion() : async Text {
    Versions.POSTBUCKET_VERSION;
  };

  //#region commenting
  private func getNextCommentId() : Text {
    commentId += 1;
    Nat.toText(commentId);
  };

public type CommentQueueAction = {
    #add;
    #remove;
};

//When a comment is reported, it's added to the queue. When a comment is reviewed, it's removed from the queue.
private func updateCommentQueue(commentId : Text, action : CommentQueueAction) : Result.Result<(), Text> {
    var newCommentQueue = Buffer.Buffer<Text>(0);

    // Whether the commentId is found in the queue
    var isCommentIdFound = false;

  
    for (reportedCommentId in reportCommentQueue.vals()) {
        if (Text.equal(reportedCommentId, commentId)) {
            isCommentIdFound := true;

            //comment reviewed
            if (action == #remove) {
             Debug.print("Skip, commentId is removed from the queue");
            };
            //if action is add, do nothing since the commentId is already in the queue
            } else {
            newCommentQueue.add(reportedCommentId);
        };
       
    };

   // comment reported
    if (action == #add) {
        if (isCommentIdFound) {
            return #err("Comment already reported");
        };
        newCommentQueue.add(commentId);
    };

    reportCommentQueue := Buffer.toArray(newCommentQueue);
    return #ok();
};



  private func isCensored(commentId : Text) : Bool {
    switch (isCensoredHashMap.get(commentId)) {
      case (?value) {
        Debug.print("isCensoredHashMap.get(" # commentId # ") -> " # Bool.toText(value));
        if (value) {
          
          return true;
        } else {
          return false;
        };
      };
      case (null) {
        return false;
      };
    };
  };

  
  public shared func reportComment(commentId : Text) : async Result.Result<Text, Text> {
    if (not U.isTextLengthValid(commentId, 20)) {
      return #err("Invalid commentId");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

   switch (updateCommentQueue(commentId, #add)) {
      case (#ok) {
        return #ok("Comment reported");
      };
      case (#err(err)) {
        return #err(err);
      };
    };
    
  };

  //returns all the reported commentIds that need to be reviewed
  public shared ({ caller }) func getReportedCommentIds() : async [Text] {
    if (isAnonymous(caller) and not isAdmin(caller) and not isPlatformOperator(caller)) {
      return ["not authorized"];
    };

    return reportCommentQueue;
  };

//returns all the reported comments that need to be reviewed
  public shared query ({caller}) func getReportedComments() : async Result.Result<[Comment], Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };


    var reportedComments = Buffer.Buffer<Comment>(0);
    for (reportedCommentId in reportCommentQueue.vals()) {
      let comment = buildComment(reportedCommentId);
      reportedComments.add(comment);
    };

    return #ok(Buffer.toArray(reportedComments));
  };

  public shared ({ caller }) func reviewComment(commentId : Text, censor : Bool) : async Result.Result<Comment, Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    
    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    //validate input
    if (not U.isTextLengthValid(commentId, 20)) {
      return #err("Invalid commentId");
    };

    let comment = buildComment(commentId);

    
    switch (updateCommentQueue(commentId, #remove)) {
      case (#ok) {
        isCensoredHashMap.put(commentId, censor);
        return #ok(comment);
      };
      case (#err(err)) {
        return #err(err);
      };
    };
  };

  let censoredMessage= "<p><em>
    This comment was removed due to 
    <a href=\"https://wiki.nuance.xyz/nuance/content-rules\" target=\"_blank\">content rules</a>. 
    Please play nice. </em></p>";

  //build a comment by commentId
  private func buildComment(commentId : Text) : Comment {
    let editedAt : ?Text = switch (commentIdToEditedAtHashMap.get(commentId)) {
      case (?val) {
        ?Int.toText(val);
      };
      case (null) {
        null;
      };
    };
    //since the posts are limited with 100 comments and each comment is maximum 400 chars, each Comment object directly
    //contains the replies. Once we need more scalability, we can return the commentIds instead of the whole Comment object
    var replies = Buffer.Buffer<Comment>(0);
    for (replyCommentId in U.safeGet(commentIdToReplyCommentIdsHashMap, commentId, []).vals()) {
      replies.add(buildComment(replyCommentId));
    };

    let censored = isCensored(commentId);
    return {
      commentId = commentId;
      handle = "";
      avatar = ""; //doesn't need to be set or stored, but its useful to have so the frontend can populate the avatar
      content = if (censored) { censoredMessage  } else { U.safeGet(commentIdToContentHashMap, commentId, "")};
      postId = U.safeGet(commentIdToPostIdHashMap, commentId, "");
      bucketCanisterId = Principal.toText(Principal.fromActor(this));
      upVotes = U.safeGet(commentIdToUpvotedPrincipalIdsHashMap, commentId, []);
      downVotes = U.safeGet(commentIdToDownvotedPrincipalIdsHashMap, commentId, []);
      createdAt = Int.toText(U.safeGet(commentIdToCreatedAtHashMap, commentId, 0));
      editedAt = editedAt;
      creator = U.safeGet(commentIdToUserPrincipalIdHashMap, commentId, "");
      replies = Buffer.toArray(replies);
      repliedCommentId = replyCommentIdToCommentIdHashMap.get(commentId);
      isCensored = censored;
      isVerified = false; //doesn't need to be set or stored, but its useful to have so the frontend can populate the avatar
    };
  };

  //returns the array of coments of the post
  private func buildPostComments(postId : Text) : CommentsReturnType {
    let commentIds = U.safeGet(postIdToCommentIdsHashMap, postId, []);
    var comments = Buffer.Buffer<Comment>(0);
    for (commentId in commentIds.vals()) {
      comments.add(buildComment(commentId));
    };
    return {
      comments = Buffer.toArray(comments);
      totalNumberOfComments = Nat.toText(U.safeGet(postIdToNumberOfCommentsHashMap, postId, 0));
    };
  };

  public shared query func buildCommentUrl(commentId : Text) : async Text {
    let postId = U.safeGet(commentIdToPostIdHashMap, commentId, "");
    let post = buildPost(postId);
    let postUrl = post.url;
    let commentUrl = postUrl # "?comment=" # commentId;
    return commentUrl;
  };

  //returns the comment by a commentId
  public shared query func getComment(commentId : Text) : async Result.Result<Comment, Text> {
    switch (commentIdToUserPrincipalIdHashMap.get(commentId)) {
      case (?val) {
        return #ok(buildComment(commentId));
      };
      case (null) {
        #err("Comment not found.");
      };
    };
  };
  //returns all the comments of the given postId (replies included, no pagination)
  public shared query func getPostComments(postId : Text) : async Result.Result<CommentsReturnType, Text> {
    switch (principalIdHashMap.get(postId)) {
      case (?val) {
        //post exists
        return #ok(buildPostComments(postId));
      };
      case (null) {
        return #err(ArticleNotFound);
      };
    };
  };

  //enables editing & creating comments
  //postId -> use the postId you want to comment
  //commentId -> if you want to edit an existing comment, use this argument to specify the comment you're editing. if not an edit, pass null
  //content -> content of the comment
  //replytoCommentId -> if this is a reply to another comment, use this arg to specify the comment you're replying. if not a reply, pass null
  public shared ({ caller }) func saveComment(input : SaveCommentModel) : async Result.Result<CommentsReturnType, Text> {
    let { postId; commentId; content; replyToCommentId } = input;
    switch (principalIdHashMap.get(postId)) {
      case (?val) {
        //post exists
        let post = buildPost(postId);

        //check if caller has a nuance account
        let userPrincipalId = Principal.toText(caller);
        let UserCanister = CanisterDeclarations.getUserCanister();
        var user : ?User = await UserCanister.getUserInternal(userPrincipalId);
        switch (user) {
          case (?val) {
            //user exists- nothing to check
          };
          case (null) {
            //user doesn't exist, return an error
            return #err("You don't have an Nuance account to comment!");
          };
        };

        //this number will be used later
        let numberOfComments = U.safeGet(postIdToNumberOfCommentsHashMap, postId, 0);

        //check the canister memory threshold
        if (not isThereEnoughMemoryPrivate()) {
          return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        //check the length of content
        if (not U.isTextLengthValid(content, 400)) {
          return #err("Your comment is too long. It can be maximum of 400 characters!");
        };

        //check if the content is empty
        if (U.isTextEmpty(content)) {
          return #err("Comment can not be empty!");
        };

        //if caller claims that this is an edit, check if the editing comment exists
        //also check if the caller is authorized
        switch (commentId) {
          case (?editingCommentId) {
            //caller claims that this is an edit. check if the editing comment exists & user is allowed to edit the comment
            switch (commentIdToUserPrincipalIdHashMap.get(editingCommentId)) {
              case (?commentOwner) {
                //editing comment id exists
                //if the caller is not the owner, return an error
                if (userPrincipalId != commentOwner) {
                  return #err(Unauthorized);
                };
              };
              case (null) {
                //given comment id doesn't exist
                //return an error
                return #err("The editing comment doesn't exist!");
              };
            };
          };
          case (null) {
            //not an edit, check the number of comments
            //check the number of comments in the post
            if (numberOfComments > 99) {
              return #err("An article can have maximum of 100 comments!");
            };
          };
        };

        //if this is a reply, check if the replying comment exists
        switch (replyToCommentId) {
          case (?replyingCommentId) {
            //this is a reply. check if the replying comment exists
            switch (commentIdToUserPrincipalIdHashMap.get(replyingCommentId)) {
              case (?val) {
                //replying comment exists -> keep going
              };
              case (null) {
                //replying comment id doesn't exist
                //return an error
                return #err("The replying comment doesn't exist!");
              };
            };
          };
          case (null) {
            //not a reply, nothing to check
          };
        };

        //verify the given 4 arguments are correct for all 4 scenarios
        switch (commentId) {
          case (?editingCommentId) {
            //edit request
            switch (replyToCommentId) {
              case (?givenCommentIdToReply) {
                //edit & reply

                //check if the editingCommentId exists in the replies of the givenCommentIdToReply
                let existingReplies = U.safeGet(commentIdToReplyCommentIdsHashMap, givenCommentIdToReply, []);
                if (not U.arrayContains(existingReplies, editingCommentId)) {
                  return #err("Invalid comment id to reply!");
                };

                //check if the mapped post ids of the givenCommentIdToReply, editingCommentId and postId(argument) are same
                let editingCommentPostId = U.safeGet(commentIdToPostIdHashMap, editingCommentId, "");
                let replyingCommentPostId = U.safeGet(commentIdToPostIdHashMap, givenCommentIdToReply, "");
                if (not (editingCommentPostId == replyingCommentPostId and postId == replyingCommentPostId and editingCommentPostId == postId)) {
                  return #err("Post ids in the arguments doesn't match!");
                };

              };
              case (null) {
                //edit a non-reply

                //check if the given postId value and the mapped post id to the existing comment matches
                let editingCommentPostId = U.safeGet(commentIdToPostIdHashMap, editingCommentId, "");
                if (editingCommentPostId != postId) {
                  return #err("Post ids in the arguments doesn't match.");
                };
              };
            };
          };
          case (null) {
            //create a new comment request
            switch (replyToCommentId) {
              case (?givenCommentIdToReply) {
                //new reply
                //check if the given postId in the arguments and the mapped post id of the replying comment matches
                let replyingCommentPostId = U.safeGet(commentIdToPostIdHashMap, givenCommentIdToReply, "");
                if (postId != replyingCommentPostId) {
                  return #err("Post ids in the arguments doesn't match.");
                };
              };
              case (null) {
                //new non-reply
                //nothing to check here
              };
            };
          };
        };

        //verify draft
        if (isDraftOrFutureArticle(post.postId)) {
          return #err(Unauthorized);
        };

        //if here, everything is ok
        //store the values in the hashmaps
        let validCommentId = switch (commentId) {
          case (?val) { val };
          case (null) { getNextCommentId() };
        };
        let isEdit = switch (commentId) {
          case (?val) { true };
          case (null) { false };
        };
        let validReplyingCommentId = switch (replyToCommentId) {
          case (?val) { val };
          case (null) { "" };
        };
        let isReply = switch (replyToCommentId) {
          case (?val) { true };
          case (null) { false };
        };

        //increment the number of comments counter
        postIdToNumberOfCommentsHashMap.put(postId, numberOfComments + 1);
        //map the comment with the post
        commentIdToPostIdHashMap.put(validCommentId, postId);
        //map the comment with the caller
        commentIdToUserPrincipalIdHashMap.put(validCommentId, userPrincipalId);
        //map the comment with the content
        commentIdToContentHashMap.put(validCommentId, content);

        let now = U.epochTime();
        if (isReply) {
          if (isEdit) {
            //edit & reply to an another comment
            //update the editedAt field
            commentIdToEditedAtHashMap.put(validCommentId, now);
          } else {
            //new reply to an another comment
            commentIdToCreatedAtHashMap.put(validCommentId, now);
            //put the comment id to the replying comment's replies list
            let existingReplies = List.fromArray(U.safeGet(commentIdToReplyCommentIdsHashMap, validReplyingCommentId, []));
            let newReplies = List.push(validCommentId, existingReplies);
            commentIdToReplyCommentIdsHashMap.put(validReplyingCommentId, List.toArray(newReplies));
            replyCommentIdToCommentIdHashMap.put(validCommentId, validReplyingCommentId);

          };
        } else {
          if (isEdit) {
            //editing a comment which is not a reply
            //edit the editedAt field
            commentIdToEditedAtHashMap.put(validCommentId, now);
          } else {
            //creating a new simple comment
            //put the comment id to the list of comment ids corresponds to the post
            let existingComments = List.fromArray(U.safeGet(postIdToCommentIdsHashMap, postId, []));
            let newComments = List.push(validCommentId, existingComments);
            postIdToCommentIdsHashMap.put(postId, List.toArray(newComments));
            //put the createdAt field
            commentIdToCreatedAtHashMap.put(validCommentId, now);
          };
        };

        //send notification for new comments only
        if (not isEdit) {
          ignore sendNewCommentNotification(validCommentId);
        };

        return #ok(buildPostComments(postId));

      };
      case (null) {
        return #err(ArticleNotFound);
      };
    };
  };

  public shared ({caller}) func sendNewCommentNotification(commentId: Text) : async () {
    if(not Principal.equal(caller, Principal.fromActor(this))){
      return;
    };
    let comment = buildComment(commentId);
    switch(comment.repliedCommentId) {
      case(?repliedCommentId) {
        //this is a reply
        //send the notification to both the writer and the creator of the replied comment
        let notifications = Buffer.Buffer<(Text, CanisterDeclarations.NotificationContent)>(0);

        
        switch(principalIdHashMap.get(comment.postId)) {
          case(?writerPrincipalId) {
            //add the writer notification first
            //If the commenter is the writer of the post, don't send notification to the writer
            if(writerPrincipalId != comment.creator){
              notifications.add(writerPrincipalId, #NewCommentOnMyArticle({
                postId = comment.postId;
                bucketCanisterId = comment.bucketCanisterId;
                postTitle = U.safeGet(titleHashMap, comment.postId, "");
                commenterPrincipal = comment.creator;
                commentContent = comment.content;
                commentId = comment.commentId;
                isReply = true;
              }));
            };
            

            //add the notification for the creator of the replied comment
            let repliedComment = buildComment(repliedCommentId);
            notifications.add(repliedComment.creator, #ReplyToMyComment({
              postId = comment.postId;
              bucketCanisterId = comment.bucketCanisterId;
              postTitle = U.safeGet(titleHashMap, comment.postId, "");
              postWriterPrincipal = writerPrincipalId;
              myCommentId = repliedComment.commentId;
              myCommentContent = repliedComment.content;
              replyCommentId = comment.commentId;
              replyCommentContent = comment.content;
              replyCommenterPrincipal = comment.creator;
            }));

            let NotificationsCanister = CanisterDeclarations.getNotificationCanister();
            await NotificationsCanister.createNotifications(Buffer.toArray(notifications));
          };
          case(null) {
            //shouldn't happen
          };
        };        
      };
      case(null) {
        //this comment is not a reply
        //just send the notification to the writer of the post
        switch(principalIdHashMap.get(comment.postId)) {
          case(?writerPrincipalId) {
            //If the commenter is the writer of the post, don't send notification to the writer
            if(writerPrincipalId != comment.creator){
              let NotificationsCanister = CanisterDeclarations.getNotificationCanister();
              await NotificationsCanister.createNotification(writerPrincipalId, #NewCommentOnMyArticle({
                postId = comment.postId;
                bucketCanisterId = comment.bucketCanisterId;
                postTitle = U.safeGet(titleHashMap, comment.postId, "");
                commenterPrincipal = comment.creator;
                commentContent = comment.content;
                commentId = comment.commentId;
                isReply = false;
              }));
            };
          };
          case(null) {
            //shouldn't happen
          };
        };
        
      };
    };
  };

  //private function to add the principal id to the comment upvotes
  private func addCommentUpvote(commentId : Text, userPrincipalId : Text) : () {
    //add the principal id to the array if it doesn't already exist
    var upvotes = U.safeGet(commentIdToUpvotedPrincipalIdsHashMap, commentId, []);
    if (not U.arrayContains(upvotes, userPrincipalId)) {
      let upvotesList = List.fromArray(upvotes);
      upvotes := List.toArray(List.push(userPrincipalId, upvotesList));
    };
    commentIdToUpvotedPrincipalIdsHashMap.put(commentId, upvotes);
  };

  //private function to remove the principal id from the comment upvotes
  private func removeCommentUpvote(commentId : Text, userPrincipalId : Text) : () {
    //remove the caller's principal id from the upVotes if it exists
    let upvotes = U.safeGet(commentIdToUpvotedPrincipalIdsHashMap, commentId, []);
    let upvotesFiltered = Array.filter<Text>(
      upvotes,
      func(upvoter : Text) {
        return upvoter != userPrincipalId;
      },
    );
    commentIdToUpvotedPrincipalIdsHashMap.put(commentId, upvotesFiltered);
  };

  //private function to add the principal id to the comment downvotes
  private func addCommentDownvote(commentId : Text, userPrincipalId : Text) : () {
    //add the principal id to the array if it doesn't already exist
    var downvotes = U.safeGet(commentIdToDownvotedPrincipalIdsHashMap, commentId, []);
    if (not U.arrayContains(downvotes, userPrincipalId)) {
      let downvotesList = List.fromArray(downvotes);
      downvotes := List.toArray(List.push(userPrincipalId, downvotesList));
    };
    commentIdToDownvotedPrincipalIdsHashMap.put(commentId, downvotes);
  };

  //private function to remove the principal id from the comment downvotes
  private func removeCommentDownvote(commentId : Text, userPrincipalId : Text) : () {
    //remove the caller's principal id from the downVotes if it exists
    let downvotes = U.safeGet(commentIdToDownvotedPrincipalIdsHashMap, commentId, []);
    let downvotesFiltered = Array.filter<Text>(
      downvotes,
      func(downvoter : Text) {
        return downvoter != userPrincipalId;
      },
    );
    commentIdToDownvotedPrincipalIdsHashMap.put(commentId, downvotesFiltered);
  };

  //upvote a comment by a commentId
  public shared ({ caller }) func upvoteComment(commentId : Text) : async Result.Result<CommentsReturnType, Text> {
    switch (commentIdToPostIdHashMap.get(commentId)) {
      case (?postId) {
        //check if caller has a nuance account
        let userPrincipalId = Principal.toText(caller);
        let UserCanister = CanisterDeclarations.getUserCanister();
        var user : ?User = await UserCanister.getUserInternal(userPrincipalId);
        switch (user) {
          case (?val) {
            //user exists
            //add the caller's principal id to upvotes list if it's not added already
            addCommentUpvote(commentId, userPrincipalId);

            //remove the caller's principal id from the downVotes if it exists
            removeCommentDownvote(commentId, userPrincipalId);

            //return all the comments of the post to refresh the UI
            return #ok(buildPostComments(postId));
          };
          case (null) {
            //user doesn't exist, return an error
            return #err("You don't have an Nuance account to upvote a comment!");
          };
        };
      };
      case (null) {
        return #err("Comment not found.");
      };
    };
  };

  //downvote a comment by a commentId
  public shared ({ caller }) func downvoteComment(commentId : Text) : async Result.Result<CommentsReturnType, Text> {
    switch (commentIdToPostIdHashMap.get(commentId)) {
      case (?postId) {
        //check if caller has a nuance account
        let userPrincipalId = Principal.toText(caller);
        let UserCanister = CanisterDeclarations.getUserCanister();
        var user : ?User = await UserCanister.getUserInternal(userPrincipalId);
        switch (user) {
          case (?val) {
            //user exists
            //add the caller's principal id to downvotes list if it's not added already
            addCommentDownvote(commentId, userPrincipalId);

            //remove the caller's principal id from the upVotes if it exists
            removeCommentUpvote(commentId, userPrincipalId);

            //return all the comments of the post to refresh the UI
            return #ok(buildPostComments(postId));
          };
          case (null) {
            //user doesn't exist, return an error
            return #err("You don't have an Nuance account to downvote a comment!");
          };
        };
      };
      case (null) {
        return #err("Comment not found.");
      };
    };
  };

  //remove both the upvote and downvote of the comment
  public shared ({ caller }) func removeCommentVote(commentId : Text) : async Result.Result<CommentsReturnType, Text> {
    switch (commentIdToPostIdHashMap.get(commentId)) {
      case (?postId) {
        //check if caller has a nuance account
        let userPrincipalId = Principal.toText(caller);
        let UserCanister = CanisterDeclarations.getUserCanister();
        var user : ?User = await UserCanister.getUserInternal(userPrincipalId);
        switch (user) {
          case (?val) {
            //user exists
            //remove the caller's principal id from the downVotes if it exists
            removeCommentDownvote(commentId, userPrincipalId);

            //remove the caller's principal id from the upVotes if it exists
            removeCommentUpvote(commentId, userPrincipalId);

            //return all the comments of the post to refresh the UI
            return #ok(buildPostComments(postId));
          };
          case (null) {
            //user doesn't exist, return an error
            return #err("You don't have an Nuance account to vote on a comment!");
          };
        };
      };
      case (null) {
        return #err("Comment not found.");
      };
    };
  };

  //Just deletes the content of the comment to not break anything -> admin function for now
  public shared ({ caller }) func deleteComment(commentId : Text) : async Result.Result<Comment, Text> {
    switch (commentIdToUserPrincipalIdHashMap.get(commentId)) {
      case (?commentOwner) {
        //check if the caller is admin
        if (not isAdmin(caller)) {
          return #err(Unauthorized);
        };
        //in order to not break anything, just delete the content of the article and put a warning on frontend
        commentIdToContentHashMap.delete(commentId);

        return #ok(buildComment(commentId));

      };
      case (null) {
        return #err("Comment not found.");
      };
    };
  };


  //#region tipping

  private func getNextApplaudId() : Text {
    applaudId += 1;
    Nat.toText(applaudId);
  };

  private func buildApplaud(applaudId: Text) : Applaud {
    return {
      applaudId = applaudId;
      bucketCanisterId = Principal.toText(Principal.fromActor(this));
      currency = U.safeGet(applaudIdToCurrencyHashMap, applaudId, "NUA");
      date = Int.toText(U.safeGet(applaudIdToDateHashMap, applaudId, 0));
      numberOfApplauds = U.safeGet(applaudIdToNumberOfApplaudsHashMap, applaudId, 0);
      postId = U.safeGet(applaudIdToPostIdHashMap, applaudId, "");
      receiver = U.safeGet(applaudIdToReceiverHashMap, applaudId, "");
      sender = U.safeGet(applaudIdToSenderHashMap, applaudId, "");
      tokenAmount = U.safeGet(applaudIdToTokenAmountHashMap, applaudId, 0);
      receivedTokenAmount = U.safeGet(applaudIdToReceivedTokenAmountHashMap, applaudId, 0);
    }
  };

  private func putApplaud(currency: Text, tokenAmount: Nat, receivedTokenAmount: Nat, numberOfApplauds: Nat, postId: Text, receiver: Text, sender: Text) : Text {
    let applaudId = getNextApplaudId();
    applaudIdToCurrencyHashMap.put(applaudId, currency);
    applaudIdToDateHashMap.put(applaudId, U.epochTime());
    applaudIdToNumberOfApplaudsHashMap.put(applaudId, numberOfApplauds);
    applaudIdToTokenAmountHashMap.put(applaudId, tokenAmount);
    applaudIdToReceivedTokenAmountHashMap.put(applaudId, receivedTokenAmount);
  
    //map the applaudId to postId
    applaudIdToPostIdHashMap.put(applaudId, postId);
    let existingApplaudIdsBuffer = Buffer.fromArray<Text>(U.safeGet(postIdToApplaudIdsHashMap, postId, []));
    existingApplaudIdsBuffer.add(applaudId);
    postIdToApplaudIdsHashMap.put(postId, Buffer.toArray(existingApplaudIdsBuffer));

    //map the applaudId to receiver principal Id
    applaudIdToReceiverHashMap.put(applaudId, receiver);
    let existingApplaudIdsBufferReceiver = Buffer.fromArray<Text>(U.safeGet(principalIdToApplaudIdsHashMap, receiver, []));
    existingApplaudIdsBufferReceiver.add(applaudId);
    principalIdToApplaudIdsHashMap.put(receiver, Buffer.toArray(existingApplaudIdsBufferReceiver));

    //map the applaudId to sender principal id
    applaudIdToSenderHashMap.put(applaudId, sender);
    //if sender == receiver, it means that writer's itself called the checkTipping function
    //don't update the principalIdToApplaudIdsHashMap for sender in that case
    if(sender != receiver){
      let existingApplaudIdsBufferSender = Buffer.fromArray<Text>(U.safeGet(principalIdToApplaudIdsHashMap, sender, []));
      existingApplaudIdsBufferSender.add(applaudId);
      principalIdToApplaudIdsHashMap.put(sender, Buffer.toArray(existingApplaudIdsBufferSender));
    };

    return applaudId;
    
  };

  //query function to get the details of an applaud by the id
  public shared query func getApplaudById(applaudId: Text) : async Result.Result<Applaud, Text>{
    switch(applaudIdToPostIdHashMap.get(applaudId)) {
      case(?postId) {
        //applaud exists
        //return the applaud
        return #ok(buildApplaud(applaudId));
      };
      case(null) {
        //doesn't exist
        //return an error
        return #err("Applaud not found!");
      };
    };
  };

  public shared query func getAllApplauds() : async [Applaud] {
    let result = Buffer.Buffer<Applaud>(0);

    for(id in applaudIdToPostIdHashMap.keys()){
      result.add(buildApplaud(id));
    };

    return Buffer.toArray(result)
  };

  //query function to get all the applauds of a post by postId
  public shared query func getPostApplauds(postId: Text) : async [Applaud]{
    switch(postIdToApplaudIdsHashMap.get(postId)) {
      case(?applaudIds) {
        //there're some applauds with the given postId
        //build the applauds and return it
        var applauds = Buffer.Buffer<Applaud>(0);
        for(applaudId in applaudIds.vals()){
          applauds.add(buildApplaud(applaudId))
        };
        Buffer.toArray(applauds)
      };
      case(null) {
        //given postId doesn't exist or there's no applauds yet
        //return an empty array
        []
      };
    };
  };

  //query function to get all the applauds of a user by principalId
  public shared query func getUserApplaudsByPrincipal(principalId: Text) : async [Applaud]{
    switch(principalIdToApplaudIdsHashMap.get(principalId)) {
      case(?applaudIds) {
        //there're some applauds with the given principalId
        //build the applauds and return it
        var applauds = Buffer.Buffer<Applaud>(0);
        for(applaudId in applaudIds.vals()){
          applauds.add(buildApplaud(applaudId))
        };
        Buffer.toArray(applauds)
      };
      case(null) {
        //given principalId doesn't exist or there's no applauds yet
        //return an empty array
        []
      };
    };
  };

  //query function to get all the applauds of the caller
  public shared query ({caller}) func getMyApplauds() : async [Applaud]{
    let principalId = Principal.toText(caller);
    switch(principalIdToApplaudIdsHashMap.get(principalId)) {
      case(?applaudIds) {
        //there're some applauds with the caller's principalId
        //build the applauds and return it
        var applauds = Buffer.Buffer<Applaud>(0);
        for(applaudId in applaudIds.vals()){
          applauds.add(buildApplaud(applaudId))
        };
        Buffer.toArray(applauds)
      };
      case(null) {
        //principalId doesn't exist or there's no applauds yet
        //return an empty array
        []
      };
    };
  };


  //user transfers the tokens to the subaccount of the postId and calls this method to complete the tipping
  public shared ({caller}) func checkTipping(postId: Text) : async (){
    //check if the post exists
    switch (principalIdHashMap.get(postId)) {
      case (?val) {
        //article exists, continue
      };
      case (null) {
        //article doesn't exist - do nothing and return
        return;
      };
    };
    for(symbol in ENV.TIPPING_TOKENS.vals()){
      ignore checkTippingByTokenSymbol(postId, symbol, Principal.toText(caller))
    }
  };

  public shared ({caller}) func checkTippingByTokenSymbol(postId: Text, symbol: Text, senderPrincipal: Text) : async Result.Result<Applaud, Text> {
    //if the caller is the canister's itself, trust the argument senderPrincipal
    //if not, use the caller instead of the argument
    let sender = if(caller == Principal.fromActor(this)){senderPrincipal}else{Principal.toText(caller)};

    switch (principalIdHashMap.get(postId)) {
      case (?val) {
        //article exists, continue
      };
      case (null) {
        //article doesn't exist - do nothing and return 0
        Debug.print("checkTippingByTokenSymbol -> Error: " # "Article doesn't exist.");
        return #err(ArticleNotFound);
      };
    };

    if(not U.arrayContains(ENV.TIPPING_TOKENS, symbol)){
      //given token symbol is not whitelisted
      //do nothing and return
      Debug.print("checkTippingByTokenSymbol -> Error: " # "Given symbol doesn't exist.");
      return #err("Given token symbol doesn't exist.");
    };

    let tippingToken = ENV.getTippingTokenBySymbol(symbol);
    let tokenCanister = CanisterDeclarations.getIcrc1Canister(tippingToken.canisterId);
    let balance = await tokenCanister.icrc1_balance_of({
      owner = Principal.fromActor(this);
      subaccount = ?Blob.fromArray(U.natToSubAccount(U.textToNat(postId)))
    });

    //if the amount of tokens locked in the subaccount is less then 2 fees, don't do anything
    if(not (balance > tippingToken.fee * 2 + 10)){
      Debug.print("checkTippingByTokenSymbol -> Error: " # "Too less tokens to proceed.");
      return #err("Too less tokens to proceed.");
    };

    //if here, the amount of tokens locked in the subaccount is enough
    //determine the principal id that will receive the tokens
    var receiverPrincipalId = U.safeGet(principalIdHashMap, postId, "");

    //if it's a publication post, set the receiver as the writer
    let post = buildPost(postId);
    if(post.isPublication){
      let writerPrincipalId = post.creatorPrincipal;
      if(writerPrincipalId == ""){
        //check if the principal id of the writer exists in the User canister
        let userCanister = CanisterDeclarations.getUserCanister();
        let userCanisterReturn = await userCanister.getUsersByHandles([U.lowerCase(post.creatorHandle)]);
        if(userCanisterReturn.size() == 0){
          //the writer doesn't exist in the user canister either
          //do nothing -> return 0
          Debug.print("checkTippingByTokenSymbol -> Error: " # "Writer doesn't exist");
          return #err("Writer doesn't exist");
        };
        receiverPrincipalId := userCanisterReturn[0].principal;
      }
      else{
        receiverPrincipalId := writerPrincipalId;
      }
    };

    //calculate the NUA equivalent of the tipped tokens
    var nuaEquivalent = 0;
    if(symbol != "NUA"){
      switch(await Sonic.getNuaEquivalentOfTippingToken(symbol, balance)) {
        case(#ok(value)) {
          nuaEquivalent := value;
        };
        case(#err(error)) {
          //an error occured while fetching the data from sonic
          //print the error
          //return 0
          Debug.print("checkTippingByTokenSymbol -> Error: " # error);
          return #err("Failed to fetch the data from sonic.")
        };
      };
    }
    else{
      nuaEquivalent := balance;
    };
    
    //all the needed data fetched so far
    //transfer the tokens and complete the tipping
    let tippingFeeFloat = (ENV.TIP_FEE_AMOUNT / 100.0) * Float.fromInt(balance);
    let tippingFee = Nat.sub(Int.abs(Float.toInt(tippingFeeFloat)), tippingToken.fee);
    let writerShare = Nat.sub(Nat.sub(balance, tippingFee), 2*tippingToken.fee);

    //transfer the tippingFee to the Nuance DAO first
    try{
      switch(await tokenCanister.icrc1_transfer({
        amount = tippingFee;
        created_at_time = null;
        fee = ?tippingToken.fee;
        from_subaccount = ?Blob.fromArray(U.natToSubAccount(U.textToNat(postId)));
        memo = null;
        to = {
          owner = Principal.fromText(ENV.TIP_FEE_RECEIVER_PRINCIPAL_ID);
          subaccount = ?Blob.fromArray(ENV.TIP_FEE_RECEIVER_SUBACCOUNT);
        }
      })) {
        case(#Ok(value)) {
          //transfer worked fine - continue
        };
        case(#Err(error)) {
          //transfer returned an error -> this should never happen
          Debug.print("checkTippingByTokenSymbol -> Error: " # "Transferring tokens to the Nuance DAO returned an error.");
          return #err("Transferring tokens to the Nuance DAO returned an error.");
        };
      };
    }
    catch(e){
      //the inter-canister call failed
      Debug.print("checkTippingByTokenSymbol -> Error: " # "Transferring tokens to the Nuance DAO failed.");
      return #err("Transferring tokens to the Nuance DAO failed.");
    };

    //if here, the tipping fee transferred succesfully
    //transfer the remaining tokens to the writer
    try{
      switch(await tokenCanister.icrc1_transfer({
        amount = writerShare;
        created_at_time = null;
        fee = ?tippingToken.fee;
        from_subaccount = ?Blob.fromArray(U.natToSubAccount(U.textToNat(postId)));
        memo = null;
        to = {
          owner = Principal.fromText(receiverPrincipalId);
          subaccount = null;
        }
      })) {
        case(#Ok(value)) {
          //transfer worked fine - continue
        };
        case(#Err(error)) {
          //transfer returned an error -> this should never happen
          Debug.print("checkTippingByTokenSymbol -> Error: " # "Transferring tokens to the writer returned an error.");
          return #err("Transferring tokens to the writer returned an error.");
        };
      };
    }
    catch(e){
      //the inter-canister call failed
      Debug.print("checkTippingByTokenSymbol -> Error: " # "Transferring tokens to the writer failed.");
      return #err("Transferring tokens to the writer failed.");
    };

    //if here, everything worked fine
    //update the local hashmaps first
    let applaudId = putApplaud(symbol, balance, writerShare, nuaEquivalent, postId, receiverPrincipalId, sender);
    
    //increment the number of applauds in the PostCore canister to effect the popularity
    try{
      let postCoreCanister = CanisterDeclarations.getPostCoreCanister();
      await postCoreCanister.incrementApplauds(postId, nuaEquivalent);
    }
    catch(e){
      //inter-canister call failed
      //if needed, we can create a function to get the info from the bucket canisters and refill the hashmap in the PostCore canister
      return #err("Incrementing the number of applauds failed.");
    };
    let NotificationsCanister = CanisterDeclarations.getNotificationCanister();
    ignore NotificationsCanister.createNotification(receiverPrincipalId,#TipReceived({
      postId;
      bucketCanisterId = Principal.toText(Principal.fromActor(this));
      postTitle = U.safeGet(titleHashMap, postId, "");
      publicationPrincipalId = ?""; //if the tip is received for a publication canister, need to have this on frontend to build the url
      tipSenderPrincipal = sender;
      tippedTokenSymbol = symbol;
      numberOfApplauds = Nat.toText(nuaEquivalent);
      amountOfTokens = Nat.toText(balance);
    }));

    return #ok(buildApplaud(applaudId));
  };

  //#region trusted origin

  public query func icrc10_supported_standards() : async [SupportedStandard] {
    return ENV.supportedStandards;
  };

  public shared func icrc28_trusted_origins() : async Icrc28TrustedOriginsResponse{
    return {
      trusted_origins= ENV.getTrustedOrigins();
    }
  };

  // #endregion

  //#region System Hooks

  system func preupgrade() {

    // transfer canister state to swap variables so data is not lost during upgrade
    Debug.print("PostBucket->preupgrade: hashmap size: " # Nat.toText(titleHashMap.size()));
    _canistergeekMonitorUD := ?canistergeekMonitor.preupgrade();
    Debug.print("PostBucket->preupgrade:Inside Canistergeek preupgrade method");
    principalIdEntries := Iter.toArray(principalIdHashMap.entries());
    userPostsEntries := Iter.toArray(userPostsHashMap.entries());
    handleEntries := Iter.toArray(handleHashMap.entries());
    handleReverseEntries := Iter.toArray(handleReverseHashMap.entries());
    lowercaseHandleEntries := Iter.toArray(lowercaseHandleHashMap.entries());
    lowercaseHandleReverseEntries := Iter.toArray(lowercaseHandleReverseHashMap.entries());
    titleEntries := Iter.toArray(titleHashMap.entries());
    subtitleEntries := Iter.toArray(subtitleHashMap.entries());
    headerImageEntries := Iter.toArray(headerImageHashMap.entries());
    contentEntries := Iter.toArray(contentHashMap.entries());
    isDraftEntries := Iter.toArray(isDraftHashMap.entries());
    createdEntries := Iter.toArray(createdHashMap.entries());
    publishedDateEntries := Iter.toArray(publishedDateHashMap.entries());
    modifiedEntries := Iter.toArray(modifiedHashMap.entries());
    creatorEntries := Iter.toArray(creatorHashMap.entries());
    isPublicationEntries := Iter.toArray(isPublicationHashMap.entries());
    categoryEntries := Iter.toArray(categoryHashMap.entries());
    wordCountsEntries := Iter.toArray(wordCountsHashmap.entries());
    isPremiumEntries := Iter.toArray(isPremiumHashMap.entries());
    isMembersOnlyEntries := Iter.toArray(isMembersOnlyHashMap.entries());
    nftCanisterIdEntries := Iter.toArray(nftCanisterIdHashMap.entries());
    tagNamesEntries := Iter.toArray(tagNamesHashMap.entries());
    accountIdsToHandleEntries := Iter.toArray(accountIdsToHandleHashMap.entries());
    rejectedByModclubPostIdsEntries := Iter.toArray(rejectedByModclubPostIdsHashmap.entries());
    postIdToCommentIdsEntries := Iter.toArray(postIdToCommentIdsHashMap.entries());
    postIdToNumberOfCommentsEntries := Iter.toArray(postIdToNumberOfCommentsHashMap.entries());
    commentIdToPostIdEntries := Iter.toArray(commentIdToPostIdHashMap.entries());
    commentIdToUserPrincipalIdEntries := Iter.toArray(commentIdToUserPrincipalIdHashMap.entries());
    commentIdToContentEntries := Iter.toArray(commentIdToContentHashMap.entries());
    commentIdToCreatedAtEntries := Iter.toArray(commentIdToCreatedAtHashMap.entries());
    commentIdToEditedAtEntries := Iter.toArray(commentIdToEditedAtHashMap.entries());
    commentIdToUpvotedPrincipalIdsEntries := Iter.toArray(commentIdToUpvotedPrincipalIdsHashMap.entries());
    commentIdToDownvotedPrincipalIdsEntries := Iter.toArray(commentIdToDownvotedPrincipalIdsHashMap.entries());
    commentIdToReplyCommentIdsEntries := Iter.toArray(commentIdToReplyCommentIdsHashMap.entries());
    replyCommentIdToCommentIdEntries := Iter.toArray(replyCommentIdToCommentIdHashMap.entries());
    isCensoredEntries := Iter.toArray(isCensoredHashMap.entries());

    //applaud
    postIdToApplaudIdsEntries := Iter.toArray(postIdToApplaudIdsHashMap.entries());
    principalIdToApplaudIdsEntries := Iter.toArray(principalIdToApplaudIdsHashMap.entries());
    applaudIdToSenderEntries := Iter.toArray(applaudIdToSenderHashMap.entries());
    applaudIdToReceiverEntries := Iter.toArray(applaudIdToReceiverHashMap.entries());
    applaudIdToPostIdEntries := Iter.toArray(applaudIdToPostIdHashMap.entries());
    applaudIdToCurrencyEntries := Iter.toArray(applaudIdToCurrencyHashMap.entries());
    applaudIdToTokenAmountEntries := Iter.toArray(applaudIdToTokenAmountHashMap.entries());
    applaudIdToReceivedTokenAmountEntries := Iter.toArray(applaudIdToReceivedTokenAmountHashMap.entries());
    applaudIdToNumberOfApplaudsEntries := Iter.toArray(applaudIdToNumberOfApplaudsHashMap.entries());
    applaudIdToDateEntries := Iter.toArray(applaudIdToDateHashMap.entries());
    
  };

  system func postupgrade() {
    // invoke canister geek postupgrade logic
    Debug.print(debug_show ("PostBucket->postupgrade: hashmap size: " # Nat.toText(titleHashMap.size())));
    canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
    Debug.print("PostBucket->postupgrade:Inside Canistergeek postupgrade method");

    // clear in-memory state swap variables after upgrade
    _canistergeekMonitorUD := null;
    principalIdEntries := [];
    userPostsEntries := [];
    handleEntries := [];
    handleReverseEntries := [];
    lowercaseHandleEntries := [];
    lowercaseHandleReverseEntries := [];
    titleEntries := [];
    subtitleEntries := [];
    headerImageEntries := [];
    contentEntries := [];
    isDraftEntries := [];
    createdEntries := [];
    publishedDateEntries := [];
    modifiedEntries := [];
    creatorEntries := [];
    isPublicationEntries := [];
    categoryEntries := [];
    wordCountsEntries := [];
    isPremiumEntries := [];
    isMembersOnlyEntries := [];
    nftCanisterIdEntries := [];
    tagNamesEntries := [];
    accountIdsToHandleEntries := [];
    rejectedByModclubPostIdsEntries := [];
    isStoreSEOcalled := false;

    postIdToCommentIdsEntries := [];
    postIdToNumberOfCommentsEntries := [];
    commentIdToPostIdEntries := [];
    commentIdToUserPrincipalIdEntries := [];
    commentIdToContentEntries := [];
    commentIdToCreatedAtEntries := [];
    commentIdToEditedAtEntries := [];
    commentIdToUpvotedPrincipalIdsEntries := [];
    commentIdToDownvotedPrincipalIdsEntries := [];
    commentIdToReplyCommentIdsEntries := [];
    replyCommentIdToCommentIdEntries := [];
    isCensoredEntries := [];

    postIdToApplaudIdsEntries := [];
    principalIdToApplaudIdsEntries := [];
    applaudIdToSenderEntries := [];
    applaudIdToReceiverEntries := [];
    applaudIdToPostIdEntries := [];
    applaudIdToCurrencyEntries := [];
    applaudIdToTokenAmountEntries := [];
    applaudIdToReceivedTokenAmountEntries := [];
    applaudIdToNumberOfApplaudsEntries := [];
    applaudIdToDateEntries := [];

  };
};