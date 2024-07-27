import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Char "mo:base/Char";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Prelude "mo:base/Prelude";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Canistergeek "../canistergeek/canistergeek";
import Types "./types";
import U "../shared/utils";
import IC "mo:base/ExperimentalInternetComputer";
import Nat64 "mo:base/Nat64";
import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Blob "mo:base/Blob";
import Prim "mo:prim";
import Versions "../shared/versions";
import ENV "../shared/env";
import CanisterDeclarations "../shared/CanisterDeclarations";

actor User {
  let Unauthorized = "Unauthorized";
  let UserExists = "User already exists";
  let UserNotFound = "User not found";
  let HandleExists = "Handle exists";
  let InvalidHandle = "Invalid handle. Use only letters, digits and hyphens.";
  let MaxUsers = "Can not exceed maximum number of users";
  let MaxUsersDaily = "Can not exceed maximum number of users today";

  let canistergeekMonitor = Canistergeek.Monitor();

  type User = Types.User;
  type UserListItem = Types.UserListItem;
  type UserId = Types.UserId;
  type Followers = Types.Followers;
  type NuaBalanceResult = Result.Result<Text, Text>;
  type RegisterUserReturn = Types.RegisterUserReturn;
  type AddPublicationReturn = Types.AddPublicationReturn;
  type RemovePublicationReturn = Types.RemovePublicationReturn;
  type PublicationObject = Types.PublicationObject;
  type GetPrincipalByHandleReturn = Types.GetPrincipalByHandleReturn;
  type GetHandleByPrincipalReturn = Types.GetHandleByPrincipalReturn;
  type NftCanisterEntry = Types.NftCanisterEntry;
  type UserClaimInfo = Types.UserClaimInfo;
  type ReaderSubscriptionDetails = CanisterDeclarations.ReaderSubscriptionDetails;

  type List<T> = List.List<T>;

  var initCapacity = 0;

  stable var userCount : Nat = 0;
  stable var userId : Nat = 0;
  stable var users : [(Text, User)] = [];
  stable var MAX_DAILY_REGISTRATION = 100;
  stable var isClaimActive = false;
  stable var claimSubaccountIndex = 0;
  stable var maxClaimTokens = 5_001_000_000; //50.001 NUA tokens - including the fee
  stable var claimedTokensCounter = 0;

  stable var principalId : [(Text, Text)] = [];
  stable var handle : [(Text, Text)] = [];
  stable var handleReverse : [(Text, Text)] = [];
  stable var lowercaseHandle : [(Text, Text)] = [];
  stable var lowercaseHandleReverse : [(Text, Text)] = [];
  stable var displayName : [(Text, Text)] = [];
  stable var avatar : [(Text, Text)] = [];
  stable var bio : [(Text, Text)] = [];
  stable var accountCreatedStable : [(Text, Text)] = [];
  stable var followers : [(Text, Followers)] = [];
  stable var followersArray : [(Text, [Text])] = []; //the accounts that a user follows
  stable var followersCounts : [(Text, Text)] = [];
  stable var website : [(Text, Text)] = [];
  stable var socialChannels : [(Text, [Text])] = [];
  stable var publicationsArray : [(Text, [PublicationObject])] = [];
  stable var nuaTokens : [(Text, Float)] = [];
  stable var fontTypes : [(Text, Text)] = [];
  stable var myFollowers : [(Text, [Text])] = []; //who follows an account
  stable var lastLogins : [(Text, Int)] = [];
  stable var lastClaimDate : [(Text, Int)] = [];
  stable var lastClaimNotificationDate : [(Text, Int)] = [];
  stable var claimSubaccountIndexes : [(Text, Nat)] = [];
  stable var claimBlockedUsers : [(Text, Text)] = [];

  stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;

  func isEq(x : Text, y : Text) : Bool { x == y };

  var principalIdHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  var handleHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  var handleReverseHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  var lowercaseHandleHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  var lowercaseHandleReverseHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  var displayNameHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  var avatarHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  var bioHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  var accountCreatedHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  var followersHashMap = HashMap.HashMap<Text, Followers>(initCapacity, isEq, Text.hash);
  var followersArrayHashMap = HashMap.HashMap<Text, [Text]>(initCapacity, isEq, Text.hash);
  var followersCountsHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  var websiteHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  var socialChannelsHashMap = HashMap.HashMap<Text, [Text]>(initCapacity, isEq, Text.hash);
  var publicationsArrayHashMap = HashMap.HashMap<Text, [PublicationObject]>(initCapacity, isEq, Text.hash);
  var nuaTokensHashMap = HashMap.HashMap<Text, Float>(initCapacity, isEq, Text.hash);
  var fontTypesHashmap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  var myFollowersHashMap = HashMap.HashMap<Text, [Text]>(initCapacity, isEq, Text.hash);
  var lastLoginsHashMap = HashMap.HashMap<Text, Int>(initCapacity, isEq, Text.hash);
  var claimSubaccountIndexesHashMap = HashMap.HashMap<Text, Nat>(initCapacity, isEq, Text.hash);
  var lastClaimDateHashMap = HashMap.HashMap<Text, Int>(initCapacity, isEq, Text.hash);
  var lastClaimNotificationDateHashMap = HashMap.HashMap<Text, Int>(initCapacity, isEq, Text.hash);
  var claimBlockedUsersHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);
  //0th account-id of user's principal mapped to user's handle
  //key: account-id, value: handle
  stable var accountIdsToHandleEntries : [(Text, Text)] = [];
  var accountIdsToHandleHashMap = HashMap.HashMap<Text, Text>(initCapacity, isEq, Text.hash);

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
  stable var platformOperators : List.List<Text> = List.nil<Text>();
  stable var nuanceCanisters : List.List<Text> = List.nil<Text>();
  stable var cgusers : List.List<Text> = List.nil<Text>();

  func isAnonymous(caller : Principal) : Bool {
    Principal.equal(caller, Principal.fromText("2vxsx-fae"));
  };

  private func isAdmin(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    U.arrayContains(ENV.USER_CANISTER_ADMINS, c);
  };

  public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    #ok(ENV.USER_CANISTER_ADMINS);
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
    if (isAnonymous(caller)) {
      return #err("Anonymous cannot call this method");
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
      return #err("Anonymous cannot call this method");
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
      return #err("Anonymous cannot call this method");
    };

    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    cgusers := List.filter<Text>(cgusers, func(val : Text) : Bool { val != id });
    #ok();
  };

  public shared ({ caller }) func registerCanister(id : Text) : async Result.Result<(), Text> {

    if (isAnonymous(caller)) {
      return #err("Anonymous cannot call this method");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    if (not List.some<Text>(nuanceCanisters, func(val : Text) : Bool { val == id })) {
      nuanceCanisters := List.push<Text>(id, nuanceCanisters);
    };
    #ok();
  };

  public shared ({ caller }) func unregisterCanister(id : Text) : async Result.Result<(), Text> {

    if (isAnonymous(caller)) {
      return #err("Anonymous cannot call this method");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };
    nuanceCanisters := List.filter<Text>(nuanceCanisters, func(val : Text) : Bool { val != id });
    #ok();
  };

  //#endregion

  //#region User Management

  private func buildHandlesFromPrincipalIdsArray(principals: [Text]) : [Text] {
    let result = Buffer.Buffer<Text>(0);
    for(principal in principals.vals()){
      let handle = U.safeGet(handleHashMap, principal, "");
      if(handle != ""){
        result.add(handle);
      };
    };
    Buffer.toArray(result)
  };

  private func buildHandlesFromPrincipalIdsList(principals: List.List<Text>) : List.List<Text> {
    var result = List.nil<Text>();
    for(principal in List.toIter(principals)){
      let handle = U.safeGet(handleHashMap, principal, "");
      if(handle != ""){
        result := List.push<Text>(principal, result);
      };
    };
    result
  };

  private func getNullUser(principalId : Text) : User {
    {
      principalId = "";
      handle = "";
      displayName = "";
      avatar = "";
      bio = "";
      accountCreated = "0";
      followers = List.nil();
      followersPrincipals = List.nil();
      followersArray = [];
      publicationsArray = [];
      website = "";
      socialChannels = [];
      nuaTokens = 0.0;
      followersCount = 0;
      claimInfo = {
        isClaimActive;
        maxClaimableTokens = Nat.toText(maxClaimTokens);
        lastClaimDate = null;
        subaccount = null;
        isUserBlocked = false;
      };
    };
  };

  private func buildUser(userPrincipalId : Text) : User {
    var user : User = getNullUser(userPrincipalId);
    var principalId = U.safeGet(principalIdHashMap, userPrincipalId, "");
    let followersPrincipalsList = U.safeGet(followersHashMap, principalId, List.nil());
    let followersPrincipalsArray = U.safeGet(followersArrayHashMap, principalId, []);
    
    if (principalId != "") {
      user := {
        handle = U.safeGet(handleHashMap, principalId, "");
        displayName = U.safeGet(displayNameHashMap, principalId, "");
        avatar = U.safeGet(avatarHashMap, principalId, "");
        bio = U.safeGet(bioHashMap, principalId, "");
        accountCreated = U.safeGet(accountCreatedHashMap, principalId, "");
        followers = buildHandlesFromPrincipalIdsList(followersPrincipalsList);
        followersPrincipals = followersPrincipalsList;
        followersArray = buildHandlesFromPrincipalIdsArray(followersPrincipalsArray);
        publicationsArray = U.safeGet(publicationsArrayHashMap, principalId, []);
        website = U.safeGet(websiteHashMap, principalId, "");
        socialChannels = U.safeGet(socialChannelsHashMap, principalId, []);
        nuaTokens = U.safeGet(nuaTokensHashMap, principalId, 0.0);
        followersCount = Nat32.fromNat(U.safeGet(myFollowersHashMap, userPrincipalId, []).size());
        claimInfo = buildClaimInfo(principalId);
      };
    };
    user;
  };
  private func buildClaimInfo(principalId: Text) : UserClaimInfo {
    switch(claimSubaccountIndexesHashMap.get(principalId)) {
      case(?subaccountIndex) {
        switch(lastClaimDateHashMap.get(principalId)) {
          case(?lastClaimDate) {
            //there exists a lastClaimDate
            return {
              isClaimActive;
              maxClaimableTokens = Nat.toText(maxClaimTokens);
              lastClaimDate = ?Int.toText(lastClaimDate);
              subaccount = ?Blob.fromArray(U.natToSubAccount(subaccountIndex));
              isUserBlocked = claimBlockedUsersHashMap.get(principalId) != null;
            }
          };
          case(null) {
            //there is no lastClaimDate
            return {
              isClaimActive;
              maxClaimableTokens = Nat.toText(maxClaimTokens);
              lastClaimDate = null;
              subaccount = ?Blob.fromArray(U.natToSubAccount(subaccountIndex));
              isUserBlocked = claimBlockedUsersHashMap.get(principalId) != null;
            }
          };
        };
      };
      case(null) {
        //the user has not claimed any tokens yet
        return {
          isClaimActive;
          maxClaimableTokens = Nat.toText(maxClaimTokens);
          lastClaimDate = null;
          subaccount = null;
          isUserBlocked = claimBlockedUsersHashMap.get(principalId) != null;
        }
      };
    };
    
  };
  
  private func putUser(principalId : Text, user : User) {

    canistergeekMonitor.collectMetrics();
    Debug.print("User->putUser: Canistergeek metrics collected successfully");
    Debug.print("User->putUser: " # principalId);

    let handleTrimmed = U.trim(user.handle);
    let accountId = U.principalToAID(principalId);

    principalIdHashMap.put(principalId, principalId);
    handleHashMap.put(principalId, handleTrimmed);
    handleReverseHashMap.put(handleTrimmed, principalId);
    lowercaseHandleHashMap.put(principalId, U.lowerCase(handleTrimmed));
    lowercaseHandleReverseHashMap.put(U.lowerCase(handleTrimmed), principalId);
    displayNameHashMap.put(principalId, user.displayName);
    avatarHashMap.put(principalId, user.avatar);
    accountCreatedHashMap.put(principalId, user.accountCreated);
    followersHashMap.put(principalId, user.followers);
    followersArrayHashMap.put(principalId, user.followersArray);
    publicationsArrayHashMap.put(principalId, user.publicationsArray);
    websiteHashMap.put(principalId, user.website);
    socialChannelsHashMap.put(principalId, user.socialChannels);
    nuaTokensHashMap.put(principalId, user.nuaTokens);
    accountIdsToHandleHashMap.put(accountId, handleTrimmed);
  };

  private func isValidHandle(value : Text) : Bool {
    var seg = "";
    let cs = value.chars();
    var l : Nat = value.size();
    var i : Nat = 0;

    if (l > 32) {
      return false;
    };

    while (i < l) {
      switch (cs.next()) {
        case null {
          return false;
        };
        case (?c) {
          if (not Char.isAlphabetic(c) and not Char.isDigit(c) and c != '-') {
            return false;
          };
        };
      };
      i += 1;
    };

    true;
  };

  private func handleExists(handle : Text) : Bool {
    Debug.print("User->handleExists: " # handle);

    // Reverse hashmap allows for efficient lookups at scale.
    let handleTrimmed = U.trim(handle);

    // Canisters have reserved paths for /api and /_.
    // We also need the "assets" path for static images, js, css, etc.
    // index.js, index.html and favicon.ico are safe because of handle validation preventing periods.
    // Since the route for authors is /<author>, we can't let users register
    // a handle with the same name as a reserved path
    let reservedPaths : [Text] = ["api", "_", "assets", "share", "metrics"];
    if (null != Array.find<Text>(reservedPaths, func(p) { p == U.lowerCase(handleTrimmed) })) {
      return true;
    };

    var lowerCaseHandle = U.lowerCase(handleTrimmed);

    for ((existingHandle : Text, key : Text) in handleReverseHashMap.entries()) {
      if (lowerCaseHandle == U.lowerCase(existingHandle)) {
        Debug.print("User->handleExists - Existing Handle: " # existingHandle);
        return true;
      };
    };

    return false;
  };

  private func withinUserThreshold() : Bool {
    userCount < 1000000;
  };

  private func withinDailyUserThreshold() : Bool {
    let DAY : Int = 86400000000000 / 1000000;
    let oneDayAgo = Int.abs(U.epochTime() - DAY);
    var counter = 0;
    for (created in accountCreatedHashMap.vals()) {
      let createdTime = U.textToNat(created);
      if (createdTime > oneDayAgo) {
        counter += 1;
      };
    };
    MAX_DAILY_REGISTRATION > counter;
  };

  public shared ({ caller }) func setDailyMaxRegistration(newVal : Nat) : async Result.Result<Nat, Text> {
    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("setDailyMaxRegistration", Principal.toText(caller));

    MAX_DAILY_REGISTRATION := newVal;

    #ok(MAX_DAILY_REGISTRATION);
  };

  public shared query func getDailyMaxRegistration() : async Nat {
    MAX_DAILY_REGISTRATION;
  };

  public shared query func isRegistrationOpen() : async Bool {
    withinDailyUserThreshold();
  };

  public shared query func getRegistrationNumberLastDay() : async Nat {
    let DAY : Int = 86400000000000 / 1000000;
    let oneDayAgo = Int.abs(U.epochTime() - DAY);
    var counter = 0;
    for (created in accountCreatedHashMap.vals()) {
      let createdTime = U.textToNat(created);
      if (createdTime > oneDayAgo) {
        counter += 1;
      };
    };
    counter;
  };

  private func createNewUser(principalId : Text, handle : Text, displayName : Text, avatar : Text) : User {
    {
      principalId = principalId;
      handle = handle;
      displayName = displayName;
      avatar = avatar;
      bio = "";
      accountCreated = Int.toText(U.epochTime());
      followers = List.nil();
      followersPrincipals = List.nil();
      followersArray = [];
      publicationsArray = [];
      website = "";
      socialChannels = [];
      nuaTokens = 0.0;
      followersCount = 0;
      claimInfo = {
        isClaimActive;
        maxClaimableTokens = Nat.toText(maxClaimTokens);
        lastClaimDate = null;
        subaccount = null;
        isUserBlocked = false;
      };
    };
  };

  private func getNextUserId() : Text {
    userId += 1;
    Nat.toText(userId);
  };

  public shared ({ caller }) func registerUser(handle : Text, displayName : Text, avatar : Text) : async RegisterUserReturn {

    if (isAnonymous(caller)) {
      return #err("Anonymous cannot call this method");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    //validate input
    if (not U.isTextLengthValid(handle, 64) or not U.isTextLengthValid(displayName, 64) or not U.isTextLengthValid(avatar, 256)) //in this case the "avatar" is the url to the avatar
    {
      Debug.print("User->registerUser: Avatar length: " # debug_show (Text.size(avatar)));
      return #err("Text length exceeded");
    };

    Debug.print("lengths: handle: " # debug_show (Text.size(handle)) # " displayName: " # debug_show (Text.size(displayName)) # " avatar: " # debug_show (Text.size(avatar)));

    var principalId = Principal.toText(caller);

    if (principalIdHashMap.get(principalId) != null) {
      #err(UserExists);
    } else if (not isValidHandle(handle)) {
      #err(InvalidHandle);
    } else if (handleExists(handle)) {
      #err(HandleExists);
    } else if (not withinUserThreshold()) {
      #err(MaxUsers);
    } else if (not withinDailyUserThreshold()) {
      #err(MaxUsersDaily);
    } else {
      var user = createNewUser(principalId, Text.trimStart(handle, #char('@')), displayName, avatar);
      putUser(principalId, user);
      userCount += 1;
      #ok(buildUser(principalId));
    };
  };

  public shared ({ caller }) func updateHandle(existingHandle : Text, newHandle : Text, postCoreCanisterId : Text, publicationWritersEditorsPrincipals : ?[Text]) : async Result.Result<User, Text> {

    if (isAnonymous(caller)) {
      return #err("Anonymous cannot call this method");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    if (not isAdmin(caller) and not isNuanceCanister(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("updateHandle", Principal.toText(caller));

    if (not isValidHandle(newHandle)) {
      return #err(InvalidHandle);
    };

    if (handleExists(newHandle)) {
      return #err(HandleExists);
    };

    let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();

    switch (handleReverseHashMap.get(existingHandle)) {
      case (?principalId) {
        let handleTrimmed = U.trim(newHandle);
        let accountId = U.principalToAID(principalId);

        //if the Post canister update is not succesful, return the error and don't change the local state
        switch (await PostCoreCanister.updateHandle(principalId, handleTrimmed)) {
          case (#ok(val)) {};
          case (#err(val)) {
            return #err("PostCore canister returned this error while updating the handle of the given user: " # val);
          };
        };

        handleHashMap.put(principalId, handleTrimmed);
        handleReverseHashMap.delete(existingHandle);
        handleReverseHashMap.put(handleTrimmed, principalId);
        lowercaseHandleHashMap.put(principalId, U.lowerCase(handleTrimmed));
        lowercaseHandleReverseHashMap.delete(U.lowerCase(existingHandle));
        lowercaseHandleReverseHashMap.put(U.lowerCase(handleTrimmed), principalId);
        accountIdsToHandleHashMap.put(accountId, handleTrimmed);

        //if the argument is given, it's a publication handle change
        //loop through all the editors and writers and update the publicationObject arrays of each user
        switch (publicationWritersEditorsPrincipals) {
          case (?principalsArray) {
            for (principal in principalsArray.vals()) {
              let user = buildUser(principal);
              var userPublicationsBuffer = Buffer.fromArray<PublicationObject>(user.publicationsArray);

              var userPublicationObject : PublicationObject = {
                isEditor = false;
                publicationName = "";
              };
              //find the publication object corresponding to the given publication handle
              for (publicationObject in userPublicationsBuffer.vals()) {
                if (publicationObject.publicationName == existingHandle) {
                  userPublicationObject := publicationObject;
                };
              };

              if (userPublicationObject.publicationName != "" and user.handle != "") {
                //remove the publication object that corresponds the given handle
                userPublicationsBuffer.filterEntries(
                  func(index : Nat, pubObj : PublicationObject) : Bool {
                    return pubObj.publicationName != existingHandle;
                  }
                );

                userPublicationObject := {
                  isEditor = userPublicationObject.isEditor;
                  publicationName = handleTrimmed;
                };

                userPublicationsBuffer.add(userPublicationObject);
                // update the hashmap
                publicationsArrayHashMap.put(principal, Buffer.toArray(userPublicationsBuffer));
              };

            };

          };
          case (null) {};

        };

        //if the user is an editor or writer in a publication, inform that publication canister about the handle change
        let userPublicationsArray = U.safeGet(publicationsArrayHashMap, principalId, []);
        for (publicationObject in userPublicationsArray.vals()) {
          let publicationHandle = publicationObject.publicationName;
          let publicationCanisterId = U.safeGet(handleReverseHashMap, publicationHandle, "");
          if (publicationCanisterId != "") {
            let publicationActor = actor (publicationCanisterId) : actor {
              updateEditorOrWriterHandle : (existingHandle : Text, newHandle : Text) -> async ();
            };
            ignore publicationActor.updateEditorOrWriterHandle(existingHandle, newHandle);
          };
        };

        return #ok(buildUser(principalId));

      };
      case (null) {
        return #err(UserNotFound);
      };

    };

  };

  public shared ({ caller }) func updateBio(bio : Text) : async Result.Result<User, Text> {
    canistergeekMonitor.collectMetrics();

    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    //validate input
    if (not U.isTextLengthValid(bio, 160)) {
      return #err("Bio Text length exceeded");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    var principalId = Principal.toText(caller);

    if (principalIdHashMap.get(principalId) == null) {
      return #err(UserNotFound);
    };

    bioHashMap.put(principalId, bio);

    #ok(buildUser(principalId));
  };

  public shared ({ caller }) func updateDisplayName(displayName : Text) : async Result.Result<User, Text> {
    canistergeekMonitor.collectMetrics();

    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    //validate input
    if (not U.isTextLengthValid(displayName, 64)) {
      return #err("Display Name Text length exceeded");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    var principalId = Principal.toText(caller);

    if (principalIdHashMap.get(principalId) == null) {
      return #err(UserNotFound);
    };

    displayNameHashMap.put(principalId, displayName);

    #ok(buildUser(principalId));
  };

  public shared ({ caller }) func updateAvatar(avatarUrl : Text) : async Result.Result<User, Text> {
    canistergeekMonitor.collectMetrics();

    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    //validate input
    if (not U.isTextLengthValid(avatarUrl, 256)) {
      return #err("Avatar Url Text length exceeded");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    var principalId = Principal.toText(caller);
    if (principalIdHashMap.get(principalId) == null) {
      return #err(UserNotFound);
    };

    avatarHashMap.put(principalId, avatarUrl);
    #ok(buildUser(principalId));
  };

  public shared ({ caller }) func updateSocialLinks(websiteUrl : Text, socialChannelsUrls: [Text]) : async Result.Result<User, Text> {
    canistergeekMonitor.collectMetrics();

    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    //validate website url
    if (not U.isTextLengthValid(websiteUrl, 256)) {
      return #err("Avatar Url Text length exceeded");
    };

    for(socialChannelsUrl in socialChannelsUrls.vals()){
      if (not U.isTextLengthValid(socialChannelsUrl, 256)) {
        return #err("Social Channel Url Text length exceeded");
      };
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    var principalId = Principal.toText(caller);
    if (principalIdHashMap.get(principalId) == null) {
      return #err(UserNotFound);
    };

    websiteHashMap.put(principalId, websiteUrl);
    socialChannelsHashMap.put(principalId, socialChannelsUrls);
    #ok(buildUser(principalId));
  };

  public shared ({ caller }) func updateUserDetails(bio: Text, avatarUrl: Text, displayName: Text, websiteUrl : Text, socialChannelsUrls: [Text]) : async Result.Result<User, Text> {
    canistergeekMonitor.collectMetrics();

    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };
    //validate bio
    if (not U.isTextLengthValid(bio, 160)) {
      return #err("Bio Text length exceeded");
    };

    //validate avatar
    if (not U.isTextLengthValid(avatarUrl, 256)) {
      return #err("Avatar Url Text length exceeded");
    };

    //validate input
    if (not U.isTextLengthValid(displayName, 64)) {
      return #err("Display Name Text length exceeded");
    };

    //validate website url
    if (not U.isTextLengthValid(websiteUrl, 256)) {
      return #err("Avatar Url Text length exceeded");
    };
    //validate social channels
    for(socialChannelsUrl in socialChannelsUrls.vals()){
      if (not U.isTextLengthValid(socialChannelsUrl, 256)) {
        return #err("Social Channel Url Text length exceeded");
      };
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    var principalId = Principal.toText(caller);
    if (principalIdHashMap.get(principalId) == null) {
      return #err(UserNotFound);
    };

    //bio
    bioHashMap.put(principalId, bio);

    //avatar
    avatarHashMap.put(principalId, avatarUrl);

    //display name
    displayNameHashMap.put(principalId, displayName);

    //website
    websiteHashMap.put(principalId, websiteUrl);

    //social channels
    socialChannelsHashMap.put(principalId, socialChannelsUrls);
    
    #ok(buildUser(principalId));
  };

  public shared ({ caller }) func updateFontType(fontType : Text) : async Result.Result<User, Text> {
    canistergeekMonitor.collectMetrics();

    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    //validate input
    if (not U.isTextLengthValid(fontType, 64)) {
      return #err("Font Type Text length exceeded");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    var principalId = Principal.toText(caller);
    if (principalIdHashMap.get(principalId) == null) {
      return #err(UserNotFound);
    };

    fontTypesHashmap.put(principalId, fontType);
    #ok(buildUser(principalId));
  };

  // admin function which adds tokens to all users token balances
  public shared ({ caller }) func adminAirDrop(amount : Float) : async Result.Result<(Text), Text> {

    if (isAnonymous(caller)) {
      return #err("Anonymous cannot call this method");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    canistergeekMonitor.collectMetrics();

    if (isAdmin(caller)) {
      //loop through all users and add tokens specified in the amount
      for (userId in principalIdHashMap.keys()) {
        var user = buildUser(userId);
        var tokens = Float.add(user.nuaTokens, amount);
        nuaTokensHashMap.put(userId, tokens);
      };
    };
    #ok("airdropped " # Float.toText(amount) # " tokens to all users");
  };

  public shared ({ caller }) func followAuthor(author : Text) : async Result.Result<User, Text> {
    canistergeekMonitor.collectMetrics();

    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    //validate input
    if (not U.isTextLengthValid(author, 64)) {
      return #err("Author Text length exceeded");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    var principalId = Principal.toText(caller);
    if (principalIdHashMap.get(principalId) == null) {
      return #err(UserNotFound);
    };

    //check if the following handle exists
    let followingPrincipalId = U.safeGet(handleReverseHashMap, author, "");
    if(followingPrincipalId == ""){
      return #err(UserNotFound)
    };

    var user = buildUser(principalId);
    var followersPrincipals = user.followersPrincipals;
    var newFollowers = List.push(followingPrincipalId, followersPrincipals);

    let followersArray = List.toArray(newFollowers);

    let followersCountOld = U.safeGet(followersCountsHashMap, followingPrincipalId, "0");
    let followersCount = Nat.toText(Nat.add(U.textToNat(followersCountOld), 1));
    Debug.print("old " # followersCountOld);
    Debug.print("new " # followersCount);

    followersArrayHashMap.put(principalId, followersArray);

    followersHashMap.put(principalId, newFollowers);

    followersCountsHashMap.put(followingPrincipalId, followersCount);

    //add to the myFollowers array of the author
    let myFollowersArray = U.safeGet(myFollowersHashMap, followingPrincipalId, []);
    let myFollowersBuffer = Buffer.Buffer<Text>(0);
    for (follower in myFollowersArray.vals()) {
      if (null == Array.find<Text>(Buffer.toArray(myFollowersBuffer), func(p) { U.lowerCase(p) == U.lowerCase(follower) })) {
        myFollowersBuffer.add(follower);
        Debug.print("User->followAuthor: " # follower # " added to myFollowersBuffer: " # debug_show (myFollowersArray));
      };
    };
    if (null == Array.find<Text>(Buffer.toArray(myFollowersBuffer), func(p) { U.lowerCase(p) == U.lowerCase(user.handle) })) {
      myFollowersBuffer.add(principalId);
    };
    myFollowersHashMap.put(followingPrincipalId, Buffer.toArray(myFollowersBuffer));

    Debug.print("User->followAuthor:" # author);

    ignore U.createNotification(#NewFollower, #NewFollowerNotificationContent {
      followerUrl = "";
      authorPrincipal = Principal.fromText(followingPrincipalId);
      authorHandle = author;
      followerHandle = user.handle;
      followerPrincipal = Principal.fromText(principalId);
    });
    
    #ok(buildUser(principalId));
  };

  public shared query func getFollowersCount(handle : Text) : async Text {

    //validate input
    if (not U.isTextLengthValid(handle, 64)) {
      return "Author Text length exceeded";
    };

    Debug.print("Get Followers Count => " # handle);
    let principalId = U.safeGet(lowercaseHandleReverseHashMap, U.trim(handle), "");
    if (not Text.equal(principalId, "")) {
      return U.safeGet(followersCountsHashMap, principalId, "0");
    };
    return "0";
  };


  public shared ({ caller }) func clearAllMyFollowers() : async Text {
    if (isAnonymous(caller)) {
      return ("Anonymous cannot call this method");
    };

    if (not isAdmin(caller)) {
      return "Must be admin to call this function";
    };

    Debug.print("Clear All My Followers");
    for (userPrincipalId in myFollowersHashMap.keys()) {
      myFollowersHashMap.put(userPrincipalId, []);
    };
    return "ok";
  };

  func min(a : Nat, b : Nat) : Nat {
    if (a < b) {
      return a;
    };
    return b;
  };


  public shared query func getUserFollowers(handle : Text) : async [UserListItem] {
    Debug.print("Get User Followers => " # handle);
    //validate input
    if (not U.isTextLengthValid(handle, 64)) {
      return [];
    };

    var principalId = U.safeGet(lowercaseHandleReverseHashMap, U.lowerCase(U.trim(handle)), "");
    if (principalId == "") {
      return [];
    };

    let followers = U.safeGet(myFollowersHashMap, principalId, []);
    let users = Buffer.Buffer<UserListItem>(0);

    for (followerPrincipalId in followers.vals()) {
      let user : UserListItem = {
        handle = U.safeGet(handleHashMap, followerPrincipalId, "");
        avatar = U.safeGet(avatarHashMap, followerPrincipalId, "");
        displayName = U.safeGet(displayNameHashMap, followerPrincipalId, "");
        fontType = U.safeGet(fontTypesHashmap, followerPrincipalId, "");
        bio = U.safeGet(bioHashMap, followerPrincipalId, "");
        principal = followerPrincipalId;
        website = U.safeGet(websiteHashMap, followerPrincipalId, "");
        socialChannelsUrls = U.safeGet(socialChannelsHashMap, followerPrincipalId, []);
        followersCount = Nat.toText(U.safeGet(myFollowersHashMap, followerPrincipalId, []).size());
      };
      users.add(user);
    };
    Debug.print("Get User Followers => " # debug_show (Buffer.toArray(users)));
    Buffer.toArray(users);
  };


  public shared query ({ caller }) func getMyFollowers() : async Result.Result<[UserListItem], Text> {
    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };
    var userPrincipalId = Principal.toText(caller);

    if (principalIdHashMap.get(userPrincipalId) == null) {
      return #err("User not found");
    };

    let followers = U.safeGet(myFollowersHashMap, userPrincipalId, []);
    let users = Buffer.Buffer<UserListItem>(0);

    for (followerPrincipalId in followers.vals()) {
      let user : UserListItem = {
        handle = U.safeGet(handleHashMap, followerPrincipalId, "");
        avatar = U.safeGet(avatarHashMap, followerPrincipalId, "");
        displayName = U.safeGet(displayNameHashMap, followerPrincipalId, "");
        fontType = U.safeGet(fontTypesHashmap, followerPrincipalId, "");
        bio = U.safeGet(bioHashMap, followerPrincipalId, "");
        principal = followerPrincipalId;
        website = U.safeGet(websiteHashMap, followerPrincipalId, "");
        socialChannelsUrls = U.safeGet(socialChannelsHashMap, followerPrincipalId, []);
        followersCount = Nat.toText(U.safeGet(myFollowersHashMap, followerPrincipalId, []).size());
      };
      users.add(user);
    };
    Debug.print("Get User Followers => " # debug_show (Buffer.toArray(users)));
    #ok(Buffer.toArray(users))

  };

  public shared ({ caller }) func addPublication(publication : PublicationObject, callerId : Text) : async AddPublicationReturn {

    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    var principalId = callerId;

    if (principalIdHashMap.get(principalId) == null) {
      return #err(UserNotFound);
    };

    var publicationsList : List<PublicationObject> = List.nil<PublicationObject>();
    var user = buildUser(principalId);
    var publications = user.publicationsArray;

    //iter over publications and push each to new publications list
    for (loggedPublication in Iter.fromArray(publications)) {
      publicationsList := List.push<PublicationObject>(loggedPublication, publicationsList);
    };

    //These do not determine actual publication status (author or editor) but they serve as assists for the UI.
    for (loggedPublication in Iter.fromList(publicationsList)) {
      let status = switch (loggedPublication.isEditor) {
        case (true) " editor ";
        case (false) " author ";
      };

      if (loggedPublication == publication and publication.isEditor == true) {
        return #err("Publication already exists as editor");
      } else if (loggedPublication == publication and publication.isEditor == false) {
        return #err("Publication already exists as author");
      } else if (loggedPublication.publicationName == publication.publicationName) {
        return #err("user is already an" # status # "please remove, then update status");
      };

    };

    publicationsList := List.push<PublicationObject>(publication, publicationsList);
    let publicationsArray = List.toArray(publicationsList);
    publicationsArrayHashMap.put(principalId, publicationsArray);

    #ok(buildUser(principalId));
  };

  //get principal by handle
  public shared query ({ caller }) func getPrincipalByHandle(handle : Text) : async GetPrincipalByHandleReturn {

    //validate input
    if (not U.isTextLengthValid(handle, 64)) {
      return #err("Handle text length exceeded");
    };

    var principalId = lowercaseHandleReverseHashMap.get(handle);
    if (principalId == null) {
      return #err(UserNotFound);
    };
    #ok(principalId);
  };

  //get principals by handles

  public shared query ({ caller }) func getPrincipalsByHandles(handles : [Text]) : async [Text] {
    let resultBuffer = Buffer.Buffer<Text>(0);
    for (handle in handles.vals()) {
      //validate input
      if (not U.isTextLengthValid(handle, 64)) {
        return ["Handle text length exceeded"];
      };

      switch (lowercaseHandleReverseHashMap.get(handle)) {
        case (?principal) {
          resultBuffer.add(principal);
        };
        case (_) {};
      };
    };
    Buffer.toArray(resultBuffer);
  };

  //get handle by principal for publisher canister
  public shared query ({ caller }) func getHandleByPrincipal(principal : Text) : async GetHandleByPrincipalReturn {
    //validate input
    let principalFromText = Principal.fromText(principal);

    var handle = handleHashMap.get(principal);
    if (handle == null) {
      return #err(UserNotFound);
    };
    #ok(handle);
  };

  public shared ({ caller }) func removePublication(publication : PublicationObject, callerId : Text) : async RemovePublicationReturn {

    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    //ToDo: Add security to make sure only the publication is perfroming this action
    var principalId = callerId;

    if (principalIdHashMap.get(principalId) == null) {
      return #err(UserNotFound);
    };

    var publicationsList : List<PublicationObject> = List.nil<PublicationObject>();
    var user = buildUser(principalId);
    var publications = user.publicationsArray;

    //iter over publications and push each to new publications list
    for (loggedPublication in Iter.fromArray(publications)) {
      if (loggedPublication != publication) {
        publicationsList := List.push<PublicationObject>(loggedPublication, publicationsList);
      };
    };
    let publicationsArray = List.toArray(publicationsList);
    publicationsArrayHashMap.put(principalId, publicationsArray);
    #ok(buildUser(principalId));
  };

  public shared ({caller}) func migrateFollowersHashmapsFromHandlesToPrincipalIds() : async Result.Result<(Nat, Nat), Text>{
    if(not isPlatformOperator(caller)){
      return #err(Unauthorized)
    };
    
    var success = 0;
    var notFound = 0;

    for((principalId, handles) in followersHashMap.entries()){
      var principalIdsList = List.nil<Text>();
      for(handle in List.toIter(handles)){
        let principal = U.safeGet(lowercaseHandleReverseHashMap, U.lowerCase(handle), "");
        if(principal == ""){
          //principal not found, smth is wrong
          notFound += 1;
        }
        else{
          success += 1;
          principalIdsList := List.push<Text>(principal, principalIdsList);
        }
      };
      followersHashMap.delete(principalId);
      followersHashMap.put(principalId, principalIdsList);
    };

    for((principalId, handles) in followersArrayHashMap.entries()){
      var principalIdsBuffer = Buffer.Buffer<Text>(0);
      for(handle in handles.vals()){
        let principal = U.safeGet(lowercaseHandleReverseHashMap, U.lowerCase(handle), "");
        if(principal == ""){
          //principal not found, smth is wrong
          notFound += 1;
        }
        else{
          success += 1;
          principalIdsBuffer.add(principal)
        }
      };
      followersArrayHashMap.delete(principalId);
      followersArrayHashMap.put(principalId, Buffer.toArray(principalIdsBuffer));
    };

    for((principalId, handles) in myFollowersHashMap.entries()){
      var principalIdsBuffer = Buffer.Buffer<Text>(0);
      for(handle in handles.vals()){
        let principal = U.safeGet(lowercaseHandleReverseHashMap, U.lowerCase(handle), "");
        if(principal == ""){
          //principal not found, smth is wrong
          notFound += 1;
        }
        else{
          success += 1;
          principalIdsBuffer.add(principal)
        }
      };
      myFollowersHashMap.delete(principalId);
      myFollowersHashMap.put(principalId, Buffer.toArray(principalIdsBuffer));
    };

    for((principalId, publicationObjects) in publicationsArrayHashMap.entries()){
      //make sure that all the publicationObjects are using the correct handle
      //if not, just remove them
      let publicationObjectsBuffer = Buffer.Buffer<PublicationObject>(0);
      for(publicationObject in publicationObjects.vals()){
        let publicationHandle = publicationObject.publicationName;
        let publicationCanisterId = U.safeGet(lowercaseHandleReverseHashMap, U.lowerCase(publicationHandle), "");
        if(publicationCanisterId == ""){
          //canister id not found with the given handle
          //remove the publication object
          //don't add it to the buffer
        }
        else{
          publicationObjectsBuffer.add(publicationObject);
        }
      };
      publicationsArrayHashMap.put(principalId, Buffer.toArray(publicationObjectsBuffer));
    };

    #ok(success, notFound)
  };

  public shared ({ caller }) func unfollowAuthor(author : Text) : async Result.Result<User, Text> {
    canistergeekMonitor.collectMetrics();

    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    //validate input
    if (not U.isTextLengthValid(author, 64)) {
      return #err("Handle text length exceeded");
    };

    var principalId = Principal.toText(caller);
    if (principalIdHashMap.get(principalId) == null) {
      return #err(UserNotFound);
    };
    //get the principal id of the following author
    let followingPrincipalId = U.safeGet(handleReverseHashMap, author, "");
    if(followingPrincipalId == ""){
      return #err(UserNotFound);
    };
    

    var user = buildUser(principalId);
    var followersPrincipals = user.followersPrincipals;
    let filteredFollowers = List.filter<Text>(followersPrincipals, func(val : Text) : Bool { val != followingPrincipalId });
    let followersArray = List.toArray(filteredFollowers);

    //following author followers count
    let followersCountOld = U.safeGet(followersCountsHashMap, followingPrincipalId, "0");
    let followersCount = Nat.toText(Nat.sub(U.textToNat(followersCountOld), 1));
    Debug.print("old " # followersCountOld);
    Debug.print("new " # followersCount);

    followersArrayHashMap.put(principalId, followersArray);
    followersHashMap.put(principalId, filteredFollowers);
    followersCountsHashMap.put(followingPrincipalId, followersCount);
    Debug.print("User->unfollowAuthor: " # author);

    //remove from myFollowers array
    var myFollowers = U.safeGet(myFollowersHashMap, followingPrincipalId, []);
    let filteredArray = Array.filter<Text>(myFollowers, func(val : Text) : Bool { val != principalId });
    myFollowersHashMap.put(followingPrincipalId, filteredArray);

    #ok(buildUser(principalId));
  };
  public shared ({ caller }) func handleClap(postCaller : Text, handle : Text) : () {

    if (isAnonymous(caller)) {
      return;
    };

    if (not isThereEnoughMemoryPrivate()) {
      return;
    };

    // Checks to make sure Post canister is making the call.
    if (isNuanceCanister(caller)) {
      Debug.print("User->Nuance canister: " # Principal.toText(caller));

      addNuaBalance(handle);
      Debug.print("User->added nua balance for " # handle);

      spendNuaBalance(postCaller);
      Debug.print("User->spent nua balance for " # postCaller);
    };
  };

  public shared ({caller}) func setIsClaimActive(isActive: Bool) : async Result.Result<Bool, Text> {
    if(not isPlatformOperator(caller)){
      return #err(Unauthorized);
    };
    //set the value
    isClaimActive := isActive;
    //return the new value
    #ok(isClaimActive)
  };

  public shared ({caller}) func setMaxNumberOfClaimableTokens(amount: Nat) : async Result.Result<Nat, Text> {
    if(not isPlatformOperator(caller)){
      return #err(Unauthorized);
    };
    //set the value
    maxClaimTokens := amount;
    //return the new value
    #ok(maxClaimTokens)
  };

  //returns the handles of the blocked users
  public shared query ({caller}) func getUsersBlockedFromClaiming() : async Result.Result<[Text], Text> {
    if(not isPlatformOperator(caller)){
      return #err(Unauthorized);
    };
    let principals = Iter.toArray(claimBlockedUsersHashMap.vals());
    let handles = Buffer.Buffer<Text>(0);
    for(principal in principals.vals()){
      switch(handleHashMap.get(principal)) {
        case(?handle) {
          handles.add(handle)
        };
        case(null) {};
      };
    };
    #ok(Buffer.toArray(handles))
  };

  //block the given user from claiming restricted tokens
  public shared ({caller}) func blockUserFromClaiming(handle: Text) : async Result.Result<(), Text> {
    if(not isPlatformOperator(caller)){
      return #err(Unauthorized);
    };
    
    switch(handleReverseHashMap.get(handle)) {
      case(?principalId) {
        claimBlockedUsersHashMap.put(principalId, principalId);
        return #ok();
      };
      case(null) {
        //user not found
        return #err(UserNotFound)
      };
    };
  };
  //unblock the given user from claiming
  public shared ({caller}) func unblockUserFromClaiming(handle: Text) : async Result.Result<(), Text> {
    if(not isPlatformOperator(caller)){
      return #err(Unauthorized);
    };
    switch(handleReverseHashMap.get(handle)) {
      case(?principalId) {
        switch(claimBlockedUsersHashMap.get(principalId)) {
          case(?value) {
            claimBlockedUsersHashMap.delete(principalId);
            return #ok();
          };
          case(null) {
            return #err("The given user is not blocked from claiming restricted tokens!")
          };
        };
      };
      case(null) {
        //user not found
        return #err(UserNotFound)
      };
    };
  };

  //a query function to return the subaccount index of all the users (only for the users who claimed restricted tokens at least one time)
  public shared query ({caller}) func getAllClaimSubaccountIndexes() : async Result.Result<[(Text, Nat)], Text> {
    if(not isPlatformOperator(caller)){
      return #err(Unauthorized);
    };
    return #ok(Iter.toArray(claimSubaccountIndexesHashMap.entries()))
  };

  public shared query ({caller}) func getTotalNumberOfClaimedTokens() : async Nat {
    claimedTokensCounter
  };


  public shared ({caller}) func claimRestrictedTokens() : async Result.Result<User, Text> {
    if(not isClaimActive){
      return #err("Claim is not active.")
    };
    let principal = Principal.toText(caller);
    switch (handleHashMap.get(principal)) {
      case (?p) {
        //caller has an account
        //firstly, check if the caller has been blocked
        switch(claimBlockedUsersHashMap.get(principal)) {
          case(?value) {
            return #err("The caller is not allowed to claim any restricted tokens.")
          };
          case(null) {};
        };
        //check if it's the first time user claims the tokens
        var callerSubaccountIndex = 1;
        switch(claimSubaccountIndexesHashMap.get(principal)) {
          case(?subaccountIndex) {
            //caller already have an assigned subaccount
            callerSubaccountIndex := subaccountIndex;
          };
          case(null) {
            //it's the first time user tries to claim tokens
            //get a new index and map it with the user
            claimSubaccountIndex += 1;
            callerSubaccountIndex := claimSubaccountIndex;
            claimSubaccountIndexesHashMap.put(principal, claimSubaccountIndex);
          };
        };
        
        let WEEK : Int = 86400000000000 * 7;
        let now = Time.now();
        //check if at least one week has passed until the last time the user has claimed tokens
        switch(lastClaimDateHashMap.get(principal)) {
          case(?lastClaimDate) {
            //not the first time user claims
            //compare the values
            if(lastClaimDate + WEEK > now){
              return #err("Already claimed in last week.");
            };
          };
          case(null) {
            //it's the first time user try to claim
            //nothing to compare
          };
        };

        let NuaLedgerCanister = CanisterDeclarations.getIcrc1Canister(ENV.NUA_TOKEN_CANISTER_ID);
        let availableRestrictedTokenBalance = await NuaLedgerCanister.icrc1_balance_of({
          owner = Principal.fromActor(User);
          subaccount = ?Blob.fromArray(U.natToSubAccount(callerSubaccountIndex));
        });

        if(availableRestrictedTokenBalance >= maxClaimTokens){
          return #err("There is no available token to claim.")
        };

        let claimableAmount = Nat.sub(maxClaimTokens, availableRestrictedTokenBalance);

        //send the claimable tokens to the subaccount mapped to the caller
        let response = await NuaLedgerCanister.icrc1_transfer({
          amount = claimableAmount;
          created_at_time = null;
          fee = ?ENV.NUA_TOKEN_FEE;
          from_subaccount = null;
          memo = null;
          to = {
            owner = Principal.fromActor(User);
            subaccount = ?Blob.fromArray(U.natToSubAccount(callerSubaccountIndex));
          }
        });
        switch(response) {
          case(#Ok(value)) {
            //update the last claim date
            lastClaimDateHashMap.put(principal, now);
            //update the counter value
            claimedTokensCounter += claimableAmount;
            return #ok(buildUser(principal))
          };
          case(#Err(error)) {
            return #err("An error occured while sending the tokens.")
          };
        };
      };
      case (null) {
        //caller doesn't have an nuance account
        return #err("There is no Nuance account to claim the restricted tokens.")
      };
    };
  };

  public shared ({caller}) func checkMyClaimNotification() : async () {
    if(not isClaimActive){
      return
    };
    Debug.print("User: checkMyClaimNotification");
    let now = Time.now();
    let principal = Principal.toText(caller);
    switch (handleHashMap.get(principal)) {
      case (?p) {
        //caller has an account
        //firstly, check if the caller has been blocked
        switch(claimBlockedUsersHashMap.get(principal)) {
          case(?value) {
            return;
          };
          case(null) {};
        };

        //check if the user has claimed any tokens yet
        switch(lastClaimDateHashMap.get(principal)) {
          case(?lastClaimDate) {
            //check if the user is eligible to claim tokens
            //get the balance of the restricted tokens
            let userSubaccountIndex = U.safeGet(claimSubaccountIndexesHashMap, principal, 0);
            let NuaLedgerCanister = CanisterDeclarations.getIcrc1Canister(ENV.NUA_TOKEN_CANISTER_ID);
            let balance = await NuaLedgerCanister.icrc1_balance_of({
              owner = Principal.fromActor(User);
              subaccount = ?Blob.fromArray(U.natToSubAccount(userSubaccountIndex));
            });
            let WEEK : Int = 86400000000000 * 7;
            if(lastClaimDate < now - WEEK and balance < maxClaimTokens){
              //user is eligible to claim tokens
              //check if the user has been notified yet
              switch(lastClaimNotificationDateHashMap.get(principal)) {
                case(?lastNotificationDate) {
                  //check if the lastNotificationDate is after the lastClaimDate
                  if(lastNotificationDate > lastClaimDate){
                    //the user has already been notified
                    //don't send the notification again
                    return;
                  }
                  else{
                    //user has not been notified yet
                    //notify the user
                  }
                };
                case(null) {
                  //user has not been notified ever
                  //notify the user
                };
              };
            }
            else{
              //one week has not passed yet
              //don't send the notification
              return;
            }
          };
          case(null) {
            //user has not claimed any tokens yet
            //user is eligible to claim tokens
            //check if the user has been notified yet
            switch(lastClaimNotificationDateHashMap.get(principal)) {
              case(?value) {
                //user has already been notified
                //don't send the notification again
                return
              };
              case(null) {
                //user has not been notified ever
                //notify the user
              };
            };
          };
        };
      };
      case (null) {
        //caller doesn't have an nuance account
        return;
      };
    };
    //if here, send the notification
    lastClaimNotificationDateHashMap.put(principal, now);

    let user = buildUser(principal);
    //ToDo: send the notification to the user
    ignore U.createNotification(#FaucetClaimAvailable, #FaucetClaimAvailableNotificationContent{
      recieverPrincipal = Principal.fromText(principal);
      recieverHandle = user.handle;
      claimed = null;
    });
  };

  public shared ({caller}) func spendRestrictedTokensForTipping(bucketCanisterId: Text, postId: Text, amount: Nat) : async Result.Result<(), Text> {
    let principal = Principal.toText(caller);
    switch(claimSubaccountIndexesHashMap.get(principal)) {
      case(?subaccountIndex) {
        let PostBucketActor = CanisterDeclarations.getPostBucketCanister(bucketCanisterId);
        let post = await PostBucketActor.getPost(postId);
        switch(post) {
          case(#ok(postValue)) {
            if(postValue.postOwnerPrincipal == principal or postValue.creatorPrincipal == principal){
              return #err("You can not spend restricted tokens on your own articles.");
            };
            //if here, post is not related to caller
            //transfer the tokens to the subaccount
            let NuaLedgerCanister = CanisterDeclarations.getIcrc1Canister(ENV.NUA_TOKEN_CANISTER_ID);
            let transferResponse = await NuaLedgerCanister.icrc1_transfer({
              amount;
              created_at_time = null;
              fee = ?ENV.NUA_TOKEN_FEE;
              from_subaccount = ?Blob.fromArray(U.natToSubAccount(subaccountIndex));
              memo = null;
              to = {
                owner = Principal.fromText(bucketCanisterId);
                subaccount = ?Blob.fromArray(U.natToSubAccount(U.textToNat(postId)));
              }
            });
            switch(transferResponse) {
              case(#Ok(value)) {
                return #ok();
              };
              case(#Err(error)) {
                return #err("Transfer error.");
              };
            };
          };
          case(#err(error)) {
            return #err("Post not found.")
          };
        };
      };
      case(null) {
        //the user has not claimed any restricted tokens yet
        return #err("There is no restricted NUA tokens to spend.")
      };
    };
  };

  public shared ({caller}) func spendRestrictedTokensForSubscription(eventId: Text, amount: Nat) : async Result.Result<ReaderSubscriptionDetails, Text> {
    let principal = Principal.toText(caller);
    switch(claimSubaccountIndexesHashMap.get(principal)) {
      case(?subaccountIndex) {
        let SubscriptionCanister = CanisterDeclarations.getSubscriptionCanister();
        let subscriptionPaymentRequest = await SubscriptionCanister.getPaymentRequestBySubscriptionEventId(eventId);
        switch(subscriptionPaymentRequest) {
          case(#ok(paymentRequestDetails)) {
            if(paymentRequestDetails.writerPrincipalId == principal or paymentRequestDetails.readerPrincipalId != principal){
              return #err("Invalid subscription event.");
            };
            //if here, the given subscription payment request is valid
            //if the given amount value is bigger than the payment fee, return the error
            let paymentFee = U.textToNat(paymentRequestDetails.paymentFee);
            if(amount > paymentFee){
              return #err("Invalid amount to spend!");
            };
            //transfer the tokens to the subaccount
            let NuaLedgerCanister = CanisterDeclarations.getIcrc1Canister(ENV.NUA_TOKEN_CANISTER_ID);
            let transferResponse = await NuaLedgerCanister.icrc1_transfer({
              amount = amount;
              created_at_time = null;
              fee = ?ENV.NUA_TOKEN_FEE;
              from_subaccount = ?Blob.fromArray(U.natToSubAccount(subaccountIndex));
              memo = null;
              to = {
                owner = Principal.fromText(ENV.SUBSCRIPTION_CANISTER_ID);
                subaccount = ?paymentRequestDetails.subaccount;
              }
            });
            switch(transferResponse) {
              case(#Ok(value)) {
                //transfer is successful
                //complete the payment request
                let completeResponse = await SubscriptionCanister.completeSubscriptionEvent(eventId);
                return completeResponse;
              };
              case(#Err(error)) {
                return #err("Transfer error.");
              };
            };
          };
          case(#err(error)) {
            return #err("Payment request not found.")
          };
        };
      };
      case(null) {
        //the user has not claimed any restricted tokens yet
        return #err("There is no restricted NUA tokens to spend.")
      };
    };
  };

  public shared ({ caller }) func updateLastLogin() : () {
    if (isAnonymous(caller)) {
      return;
    };

    if (not isThereEnoughMemoryPrivate()) {
      return;
    };

    let principal = Principal.toText(caller);
    switch (handleHashMap.get(principal)) {
      case (?p) {
        lastLoginsHashMap.put(p, Time.now());
      };
      case (null) {
        //caller doesn't have an nuance account. ignore the call
      };
    };
  };

  public type Date = {
    year : Nat;
    month : Nat;
    day : Nat;
    hour : Nat;
  };

  public shared query func getActiveUsersByRange(date : Date) : async Nat {
    let YEAR : Int = 31557600000000000;
    let MONTH : Int = 2629800000000000;
    let DAY : Int = 86400000000000;
    let HOUR : Int = 3600000000000;
    let sum = YEAR * date.year + MONTH * date.month + DAY * date.day + HOUR * date.hour;
    let threshold = Time.now() - sum;
    var counter = 0;
    for (lastLogin in lastLoginsHashMap.vals()) {
      if (lastLogin > threshold) {
        counter += 1;
      };
    };
    counter;
  };

  public shared query func getNumberOfAllRegisteredUsers() : async Nat {
    principalIdHashMap.size();
  };

  public shared query func getNuaBalance(principalId : Text) : async NuaBalanceResult {

    //validate input
    let principalFromText = Principal.fromText(principalId);

    if (principalIdHashMap.get(principalId) == null) {
      return #err(UserNotFound);
    };

    let nuaTokens = U.safeGet(nuaTokensHashMap, principalId, 0.0);

    if (nuaTokens < 1.0) {
      return #err("insufficient NUA tokens");
    };

    #ok(Float.toText(nuaTokens));
  };

  //function which adds to the nua balance of the user, must be called by User canister
  //todo: add error handling
  public shared ({ caller }) func addNuaBalance(handle : Text) : () {
    //validate input
    if (not U.isTextLengthValid(handle, 64)) {
      return;
    };

    if (not isThereEnoughMemoryPrivate()) {
      return;
    };

    Debug.print("+1 token to user ID " # Principal.toText(caller));

    //ensures caller is User canister, from handleClap function
    if (isNuanceCanister(caller)) {
      let principalId = U.safeGet(handleReverseHashMap, U.trim(handle), "");
      let amount = 1.0;
      let nuaTokens = (U.safeGet(nuaTokensHashMap, principalId, 0.0));
      let newNuaTokens = Float.add(nuaTokens, amount);

      nuaTokensHashMap.put(principalId, newNuaTokens);
      //#ok(Float.toText(newNuaTokens));
    };
  };

  //todo: add error handling
  public shared ({ caller }) func spendNuaBalance(user : Text) : () {

    if (not isThereEnoughMemoryPrivate()) {
      return;
    };

    if (isNuanceCanister(caller)) {
      let amount = 1.0;
      if (U.safeGet(nuaTokensHashMap, user, 0.0) < 1) {
        return //#err("Not enough NUA tokens");
      };

      //validates principal
      if (isAnonymous(Principal.fromText(user))) {
        return //#err(Unauthorized);
      };

      var principalId = user;
      if (principalIdHashMap.get(principalId) == null) {
        return //#err(UserNotFound);
      };

      let nuaTokens = (U.safeGet(nuaTokensHashMap, principalId, 0.0));
      if (Float.greater(amount, nuaTokens)) {
        return //#err("Insufficient Funds");
      };

      let newNuaTokens = Float.sub(nuaTokens, amount);

      nuaTokensHashMap.put(principalId, newNuaTokens);
    };
    // #ok(Float.toText(newNuaTokens));
  };

  public shared query ({ caller }) func getUser() : async Result.Result<User, Text> {
    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    var userPrincipalId = Principal.toText(caller);

    if (principalIdHashMap.get(userPrincipalId) == null) {
      return #err("getUser User not found");
    };

    #ok(buildUser(userPrincipalId));
  };

  public shared query ({ caller }) func getUserByPrincipalId(userPrincipalId : Text) : async Result.Result<User, Text> {

    //validate input
    let principalFromText = Principal.fromText(userPrincipalId);

    if (principalIdHashMap.get(userPrincipalId) == null) {
      return #err(UserNotFound # " for PrincipalId " # userPrincipalId);
    };

    #ok(buildUser(userPrincipalId));
  };

  public shared query ({ caller }) func getMultipleUsersByPrincipalId(userPrincipalIds : [Text]) : async Result.Result<[User], Text> {

    //validate input
    for (userPrincipalId in userPrincipalIds.vals()) {
      let principalFromText = Principal.fromText(userPrincipalId);
    };

    var users = Buffer.Buffer<User>(0);

    for (userPrincipalId in userPrincipalIds.vals()) {
      if (principalIdHashMap.get(userPrincipalId) == null) {
        return #err(UserNotFound # " for PrincipalId " # userPrincipalId);
      };
      users.add(buildUser(userPrincipalId));
    };

    #ok(Buffer.toArray(users));
  };

  public shared query ({ caller }) func dumpUsers() : async Text {
    var userDetails : Text = "";
    if (not isAnonymous(caller)) {
      for ((userId, principalId) in principalIdHashMap.entries()) {
        var user : User = buildUser(principalId);
        userDetails := userDetails # " USER: principalId: " # principalId # ", DisplayName: "
        # user.displayName # ", Handle: " # user.handle # ", UserId: " # userId;
      };
    };
    userDetails;
  };

  public shared query func getUserByHandle(handle : Text) : async Result.Result<User, Text> {
    //validate input
    if (not U.isTextLengthValid(handle, 64)) {
      return #err("Invalid handle length");
    };

    let principalId = U.safeGet(lowercaseHandleReverseHashMap, U.trim(handle), "");

    if (principalId == "") {
      return #err(UserNotFound);
    };

    #ok(buildUser(principalId));
  };

  public shared query func getUserListItemByHandle(handle : Text) : async Result.Result<UserListItem, Text> {
    //validate input
    if (not U.isTextLengthValid(handle, 64)) {
      return #err("Invalid handle length");
    };

    let principalId = U.safeGet(lowercaseHandleReverseHashMap, U.trim(handle), "");

    if (principalId == "") {
      return #err(UserNotFound);
    };

    let user : UserListItem = {
      handle = U.safeGet(handleHashMap, principalId, "");
      avatar = U.safeGet(avatarHashMap, principalId, "");
      displayName = U.safeGet(displayNameHashMap, principalId, "");
      fontType = U.safeGet(fontTypesHashmap, principalId, "");
      bio = U.safeGet(bioHashMap, principalId, "");
      principal = principalId;
      website = U.safeGet(websiteHashMap, principalId, "");
      socialChannelsUrls = U.safeGet(socialChannelsHashMap, principalId, []);
      followersCount = Nat.toText(U.safeGet(myFollowersHashMap, principalId, []).size());
    };

    #ok(user);
  };

  public shared query func getUsersByHandles(handles : [Text]) : async [UserListItem] {

    var users : List.List<UserListItem> = List.nil<UserListItem>();

    for (handle in handles.vals()) {
      //validate input
      if (not U.isTextLengthValid(handle, 64)) {
        return [];
      };
      let principalId = U.safeGet(lowercaseHandleReverseHashMap, U.trim(handle), "");
      if (principalId != "") {
        let user : UserListItem = {
          handle = U.safeGet(handleHashMap, principalId, "");
          avatar = U.safeGet(avatarHashMap, principalId, "");
          displayName = U.safeGet(displayNameHashMap, principalId, "");
          fontType = U.safeGet(fontTypesHashmap, principalId, "");
          bio = U.safeGet(bioHashMap, principalId, "");
          principal = principalId;
          website = U.safeGet(websiteHashMap, principalId, "");
          socialChannelsUrls = U.safeGet(socialChannelsHashMap, principalId, []);
          followersCount = Nat.toText(U.safeGet(myFollowersHashMap, principalId, []).size());
        };
        users := List.push<UserListItem>(user, users);
      };
    };

    List.toArray(users);
  };

  public shared query func getUsersByPrincipals(principals : [Text]) : async [UserListItem] {
    var users : List.List<UserListItem> = List.nil<UserListItem>();
    for (principalId in principals.vals()) {
      //validate input
      if (not U.isTextLengthValid(principalId, 128)) {
        return [];
      };
      let user : UserListItem = {
        handle = U.safeGet(handleHashMap, principalId, "");
        avatar = U.safeGet(avatarHashMap, principalId, "");
        displayName = U.safeGet(displayNameHashMap, principalId, "");
        fontType = U.safeGet(fontTypesHashmap, principalId, "");
        bio = U.safeGet(bioHashMap, principalId, "");
        principal = principalId;
        website = U.safeGet(websiteHashMap, principalId, "");
        socialChannelsUrls = U.safeGet(socialChannelsHashMap, principalId, []);
        followersCount = Nat.toText(U.safeGet(myFollowersHashMap, principalId, []).size());
      };
      users := List.push<UserListItem>(user, users);
    };

    List.toArray(users);
  };

  public shared query func getAllHandles() : async [Text] {
    Iter.toArray(handleHashMap.vals());
  };

  public shared query func getHandlesByAccountIdentifiers(accountIds : [Text]) : async [Text] {
    var handlesBuffer = Buffer.Buffer<Text>(0);
    for (aid in accountIds.vals()) {
      handlesBuffer.add(U.safeGet(accountIdsToHandleHashMap, aid, ""));
    };
    Buffer.toArray(handlesBuffer);
  };

  public shared query func getHandlesByPrincipals(principals : [Text]) : async [Text] {
    var handlesBuffer = Buffer.Buffer<Text>(0);
    for (principalId in principals.vals()) {
      switch(handleHashMap.get(principalId)) {
        case(?value) {
          handlesBuffer.add(value)
        };
        case(null) {};
      };
    };
    Buffer.toArray(handlesBuffer);
  };

  public shared query ({ caller }) func getUserInternal(userPrincipalId : Text) : async ?User {

    //validate input
    let principalFromText = Principal.fromText(userPrincipalId);

    if (principalIdHashMap.get(userPrincipalId) == null) {
      return null;
    };

    ?buildUser(userPrincipalId);
  };

  public shared ({ caller }) func deleteUser(principalId : Text) : async Result.Result<Nat, Text> {
    if (isAnonymous(caller)) {
      return #err("Anonymous cannot call this method");
    };

    canistergeekMonitor.collectMetrics();

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("deleteUser", Principal.toText(caller));

    Debug.print("User->Delete for PrincipalId: " # principalId);

    principalIdHashMap.delete(principalId);
    let handle = U.safeGet(handleHashMap, principalId, "");
    Debug.print("User->Delete for Handle: " # handle);
    if (handle != "") {
      handleReverseHashMap.delete(handle);
      lowercaseHandleReverseHashMap.delete(U.lowerCase(handle));
    };
    handleHashMap.delete(principalId);
    lowercaseHandleHashMap.delete(principalId);
    displayNameHashMap.delete(principalId);
    avatarHashMap.delete(principalId);
    bioHashMap.delete(principalId);
    accountCreatedHashMap.delete(principalId);
    followersHashMap.delete(principalId);
    followersArrayHashMap.delete(principalId);
    publicationsArrayHashMap.delete(principalId);
    nuaTokensHashMap.delete(principalId);

    #ok(principalIdHashMap.size());
  };

  // public shared ({ caller }) func dumpUsers() : async Result.Result<(), Text> {
  //     Debug.print("User->DumpUsers" );

  //     if (not isAdmin(caller)) {
  //         return #err(Unauthorized);
  //     };

  //     for ((userId, principalId) in principalIdHashMap.entries()) {
  //         var user : User = buildUser(principalId);
  //         Debug.print("User->DumpUsers: userId: principalId: " # user.principalId # ", displayName: " # user.displayName);
  //     };

  //     #ok();
  // };

  //#endregion

  public shared ({ caller }) func generateAccountIds() : async () {
    if (isAnonymous(caller)) {
      return;
    };

    if (not isThereEnoughMemoryPrivate()) {
      return;
    };

    if (isAdmin(caller) or isPlatformOperator(caller)) {
      for (handleEntry in handleHashMap.entries()) {
        accountIdsToHandleHashMap.put(U.principalToAID(handleEntry.0), handleEntry.1);
      };
    };
  };

  //temp function to migrate to case insensitive urls
  public shared ({ caller }) func generateLowercaseHandles() : async (Text, [Text]) {
    if (not isThereEnoughMemoryPrivate() or not isAdmin(caller)) {
      assert false;
    };

    var counter = 0;
    var duplicateHandles = Buffer.Buffer<Text>(0);

    for ((principalId : Text, handle : Text) in handleHashMap.entries()) {
      let principalOfExistingDuplicateHandle = U.safeGet(lowercaseHandleReverseHashMap, U.lowerCase(handle), "");
      //if there's no duplicate handle, proceed normally
      if (principalOfExistingDuplicateHandle == "") {
        lowercaseHandleHashMap.put(principalId, U.lowerCase(handle));
        lowercaseHandleReverseHashMap.put(U.lowerCase(handle), principalId);
        counter += 1;
      } else {
        duplicateHandles.add(handle);
      };
    };

    (Nat.toText(counter), duplicateHandles.toArray());
  };

  //#region Canister Geek

  public shared query ({ caller }) func getCanisterMetrics(parameters : Canistergeek.GetMetricsParameters) : async ?Canistergeek.CanisterMetrics {

    if (not isCgUser(caller) and not isAdmin(caller) and not isPlatformOperator(caller)) {
      Prelude.unreachable();
    };
    Debug.print("User->getCanisterMetrics: The method getCanistermetrics was called from the UI successfully");
    canistergeekMonitor.getMetrics(parameters);
  };

  public shared ({ caller }) func collectCanisterMetrics() : async () {
    if (not isCgUser(caller) and not isAdmin(caller) and not isPlatformOperator(caller)) {
      Prelude.unreachable();
    };
    canistergeekMonitor.collectMetrics();
    Debug.print("User->collectCanisterMetrics: The method collectCanisterMetrics was called from the UI successfully");
  };

  public func acceptCycles() : async () {
    let available = Cycles.available();
    let accepted = Cycles.accept(available);
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
    Versions.USER_VERSION;
  };

  //#region System Hooks

  system func preupgrade() {
    Debug.print("User->preupgrade: hashmap size: " # Nat.toText(users.size()));
    _canistergeekMonitorUD := ?canistergeekMonitor.preupgrade();
    Debug.print("User->preupgrade: Inside Canistergeek preupgrade method");
    principalId := Iter.toArray(principalIdHashMap.entries());
    handle := Iter.toArray(handleHashMap.entries());
    handleReverse := Iter.toArray(handleReverseHashMap.entries());
    lowercaseHandle := Iter.toArray(lowercaseHandleHashMap.entries());
    lowercaseHandleReverse := Iter.toArray(lowercaseHandleReverseHashMap.entries());
    displayName := Iter.toArray(displayNameHashMap.entries());
    bio := Iter.toArray(bioHashMap.entries());
    avatar := Iter.toArray(avatarHashMap.entries());
    accountCreatedStable := Iter.toArray(accountCreatedHashMap.entries());
    followers := Iter.toArray(followersHashMap.entries());
    followersArray := Iter.toArray(followersArrayHashMap.entries());
    followersCounts := Iter.toArray(followersCountsHashMap.entries());
    publicationsArray := Iter.toArray(publicationsArrayHashMap.entries());
    website := Iter.toArray(websiteHashMap.entries());
    socialChannels := Iter.toArray(socialChannelsHashMap.entries());
    nuaTokens := Iter.toArray(nuaTokensHashMap.entries());
    fontTypes := Iter.toArray(fontTypesHashmap.entries());
    accountIdsToHandleEntries := Iter.toArray(accountIdsToHandleHashMap.entries());
    myFollowers := Iter.toArray(myFollowersHashMap.entries());
    lastLogins := Iter.toArray(lastLoginsHashMap.entries());
    lastClaimDate := Iter.toArray(lastClaimDateHashMap.entries());
    lastClaimNotificationDate := Iter.toArray(lastClaimNotificationDateHashMap.entries());
    claimBlockedUsers := Iter.toArray(claimBlockedUsersHashMap.entries());
    claimSubaccountIndexes := Iter.toArray(claimSubaccountIndexesHashMap.entries());

  };

  system func postupgrade() {
    Debug.print("User->postupgrade: hashmap size: " # Nat.toText(users.size()));
    canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
    _canistergeekMonitorUD := null;
    Debug.print("User->postupgrade: Inside Canistergeek postupgrade method");
    principalIdHashMap := HashMap.fromIter(principalId.vals(), initCapacity, isEq, Text.hash);
    handleHashMap := HashMap.fromIter(handle.vals(), initCapacity, isEq, Text.hash);
    handleReverseHashMap := HashMap.fromIter(handleReverse.vals(), initCapacity, isEq, Text.hash);
    lowercaseHandleHashMap := HashMap.fromIter(lowercaseHandle.vals(), initCapacity, isEq, Text.hash);
    lowercaseHandleReverseHashMap := HashMap.fromIter(lowercaseHandleReverse.vals(), initCapacity, isEq, Text.hash);
    displayNameHashMap := HashMap.fromIter(displayName.vals(), initCapacity, isEq, Text.hash);
    bioHashMap := HashMap.fromIter(bio.vals(), initCapacity, isEq, Text.hash);
    accountCreatedHashMap := HashMap.fromIter(accountCreatedStable.vals(), initCapacity, isEq, Text.hash);
    avatarHashMap := HashMap.fromIter(avatar.vals(), initCapacity, isEq, Text.hash);
    followersHashMap := HashMap.fromIter(followers.vals(), initCapacity, isEq, Text.hash);
    followersArrayHashMap := HashMap.fromIter(followersArray.vals(), initCapacity, isEq, Text.hash);
    followersCountsHashMap := HashMap.fromIter(followersCounts.vals(), initCapacity, isEq, Text.hash);
    publicationsArrayHashMap := HashMap.fromIter(publicationsArray.vals(), initCapacity, isEq, Text.hash);
    websiteHashMap := HashMap.fromIter(website.vals(), initCapacity, isEq, Text.hash);
    socialChannelsHashMap := HashMap.fromIter(socialChannels.vals(), initCapacity, isEq, Text.hash);
    nuaTokensHashMap := HashMap.fromIter(nuaTokens.vals(), initCapacity, isEq, Text.hash);
    fontTypesHashmap := HashMap.fromIter(fontTypes.vals(), initCapacity, isEq, Text.hash);
    accountIdsToHandleHashMap := HashMap.fromIter(accountIdsToHandleEntries.vals(), initCapacity, isEq, Text.hash);
    myFollowersHashMap := HashMap.fromIter(myFollowers.vals(), initCapacity, isEq, Text.hash);
    lastLoginsHashMap := HashMap.fromIter(lastLogins.vals(), initCapacity, isEq, Text.hash);
    lastClaimDateHashMap := HashMap.fromIter(lastClaimDate.vals(), initCapacity, isEq, Text.hash);
    lastClaimNotificationDateHashMap := HashMap.fromIter(lastClaimNotificationDate.vals(), initCapacity, isEq, Text.hash);
    claimBlockedUsersHashMap := HashMap.fromIter(claimBlockedUsers.vals(), initCapacity, isEq, Text.hash);
    claimSubaccountIndexesHashMap := HashMap.fromIter(claimSubaccountIndexes.vals(), initCapacity, isEq, Text.hash);

    principalId := [];
    handle := [];
    displayName := [];
    bio := [];
    avatar := [];
    accountCreatedStable := [];
    followers := [];
    followersArray := [];
    publicationsArray := [];
    nuaTokens := [];
    fontTypes := [];
    accountIdsToHandleEntries := [];
    lastLogins := [];
    lastClaimDate := [];
    lastClaimNotificationDate := [];
    claimBlockedUsers := [];
    claimSubaccountIndexes := [];
  };

  //#endregion

  //test region

  public shared ({ caller }) func testInstructionSize() : async Text {
    if (isAnonymous(caller)) {
      return ("Anonymous cannot call this method");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return "You are not authorized to run this method";
    };

    //👀👀👀 warning IC.countInstructions executes the functions passed to it
    let preupgradeCount = IC.countInstructions(func() { preupgrade() });
    let postupgradeCount = IC.countInstructions(func() { postupgrade() });

    // "the limit for a canister install and upgrade is 200 billion instructions."
    // "the limit for an update message is 20 billion instructions"

    return "Preupgrade Count: " # Nat64.toText(preupgradeCount) # "\n Postupgrade Count: " # Nat64.toText(postupgradeCount) # "\n Preupgrade remaining instructions: " # Nat64.toText(200000000000 - preupgradeCount) # "\n Postupgrade remaining instructions: " # Nat64.toText(200000000000 - postupgradeCount);

  };

};
