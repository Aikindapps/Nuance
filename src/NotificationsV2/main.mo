import Debug "mo:base/Debug";
import Bool "mo:base/Bool";
import Char "mo:base/Char";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import List "mo:base/List";
import HashMap "mo:base/HashMap";
import Map "mo:hashmap/Map"; 
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Prelude "mo:base/Prelude";
import U "../shared/utils";
import Types "./types";
import UserTypes "../User/types";
import Canistergeek "../canistergeek/canistergeek";
import PostTypes "../PostCore/types";
import Cycles "mo:base/ExperimentalCycles";
import Prim "mo:prim";
import CanisterDeclarations "../shared/CanisterDeclarations";
import Versions "../shared/versions";
import ENV "../shared/env";
import Time "mo:base/Time";
import Hash "mo:base/Hash";
import Int "mo:base/Int";
import Order "mo:base/Order";

actor Notifications {
  // local variables
  let canistergeekMonitor = Canistergeek.Monitor();

  // error messages
  let Unauthorized = "Unauthorized";
  let NotTrustedPrincipal = "Not a trusted principal, unauthorized";
  
  stable var MAX_MEMORY_SIZE = 380000000;


  //data type aliases
  type List<T> = List.List<T>;
  type UserNotificationSettings = Types.UserNotificationSettings;
  type NotificationType = Types.NotificationType;
  type Notifications = Types.Notifications;
  type NotificationContent = Types.NotificationContent;
  type UserListItem = UserTypes.UserListItem;

  let UserCanister = CanisterDeclarations.getUserCanister();
  
  // permanent in-memory state (data types are not lost during upgrades)
  stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
  stable var cgusers : List.List<Text> = List.nil<Text>();

  stable var notificationId = 0;


  // admin and canister functions

  stable var ANONYMOUS_PRINCIPAL = Principal.fromText("2vxsx-fae");
  
  private func isAnonymous(caller : Principal) : Bool {
    Principal.equal(caller, ANONYMOUS_PRINCIPAL);
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

  private func isAdmin(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    U.arrayContains(ENV.NOTIFICATIONS_CANISTER_ADMINS, c);
  };

  public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    #ok(ENV.NOTIFICATIONS_CANISTER_ADMINS);
  };

  private func isPlatformOperator(caller : Principal) : Bool {
    ENV.isPlatformOperator(caller)
  };

  public shared query func getPlatformOperators() : async List.List<Text> {
    List.fromArray(ENV.PLATFORM_OPERATORS);
  };

  func isCgUser(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    var exists = List.find<Text>(cgusers, func(val : Text) : Bool { val == c });
    exists != null;
  };

  
  //#region Canister Geek

  public shared query ({ caller }) func getCanisterMetrics(parameters : Canistergeek.GetMetricsParameters) : async ?Canistergeek.CanisterMetrics {

    if (not isCgUser(caller) and not isAdmin(caller)) {
      Prelude.unreachable();
    };
    canistergeekMonitor.getMetrics(parameters);
  };

  public shared ({ caller }) func collectCanisterMetrics() : async () {
    if (not isCgUser(caller) and not isAdmin(caller)) {
      Prelude.unreachable();
    };
    canistergeekMonitor.collectMetrics();
  };

  //#region memory management/ #Canister utils/ #Cycles management

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

 

  public func acceptCycles() : async () {
    let available = Cycles.available();
    let accepted = Cycles.accept(available);
    assert (accepted == available);
  };

  public shared query func availableCycles() : async Nat {
    Cycles.balance();
  };

  public shared query func getCanisterVersion() : async Text {
    Versions.NOTIFICATIONS_VERSION;
  };

   //#endregion


// #region Notifications

// key: principalId, value: UserNotificationSettings
stable var userNotificationSettings = Map.new<Principal, UserNotificationSettings>();

public shared query ({caller}) func getUserNotificationSettings() : async Result.Result<UserNotificationSettings, Text> {
    if (isAnonymous(caller)) {
        return #err("Cannot use this method anonymously.");
    };

    let settings = Map.get(userNotificationSettings, phash, caller);
    switch (settings) {
        case null {
            #ok({
                newCommentOnMyArticle = true;
                newCommentOnFollowedArticle = true;
                newArticleByFollowedWriter = true;
                newArticleByFollowedTag = true;
                newFollower = true;
                tipReceived = true;
                premiumArticleSold = true;
                authorGainsNewSubscriber = true;
                youSubscribedToAuthor = true;
                authorLosesSubscriber = true;
                youUnsubscribedFromAuthor = true;
                authorExpiredSubscription = true;
                readerExpiredSubscription = true;
                faucetClaimAvailable = true;
                expiredSubscription = true;
            });
        };
        case (?settings) {
            #ok(settings);
        };
    };
};

// notifications are direct or broadcast, both are stored in nested hashmaps, sorted by principalId

//Broadcasts will be added to seperate hashmaps for bulk distribution when we have a lot of users
// but the notification itself will be added to userbroadcastNotifications hashmap directly for now. 


//key: principalId, value: directnotifications hashmap per user (key: NotificationId, value: Notification)
type DirectNotifications = {
  notifications : Map.Map<Text, Notifications>;
};

 stable var userDirectNotifications = Map.new<Principal,DirectNotifications>();


//key principalId, value: broadcastNotifications hashmap per user (key: NotificationId, value: Notification)
type BroadcastNotifications = {
  notifications : Map.Map<Text, Notifications>;
};

type ClaimStatus = Types.ClaimStatus;


stable var userBroadcastNotifications = Map.new<Principal, BroadcastNotifications>();

//broadcasts
// key: articleId, value: array of principalIds who've commented on the article. 
stable var articleCommenters = Map.new<Text, [Principal]>();

//writer and tag followers are derived from the user canister and postcore canister respectively
//for single source of truth, we will not store them here. These notifications are also not time sensitive.


///////////////////////////////////////////events///////////////////////////////////////////
//events are singular actions that trigger multiple notifications, ex. an article creates multiple notifications for followers of the writer and tags

//event helpers
private func createNewNotificationObject(notificationType: NotificationType, content: ?NotificationContent) : Notifications {
    {
        id = Nat.toText(notificationId);
        notificationType = notificationType;
        content = content;
        timestamp = Int.toText(Time.now());
        read = false;
    }
};
// public type GetSpecificFieldResult = {
//   #text : Text;
//   #principal : Principal;
//   #array : [Text];
//   #bool : Bool;
//   #none : ?Text;
// };

// private func getSpecificField(content: NotificationContent, field: Text) : Result.Result<GetSpecificFieldResult, Text> {
//     switch (content) {
//         case (#PostNotificationContent(postNotificationContent)) {
//             switch (field) {
//                 case ("url") { return #ok(#text(postNotificationContent.url)); };
//                 case ("receiverHandle") { return #ok(#text(postNotificationContent.receiverHandle)); };
//                 case ("receiverPrincipal") { return #ok(#principal(postNotificationContent.receiverPrincipal)); };
//                 case ("tags") { return #ok(#array(postNotificationContent.tags)); };
//                 case ("articleId") { return #ok(#text(postNotificationContent.articleId)); };
//                 case ("articleTitle") { return #ok(#text(postNotificationContent.articleTitle)); };
//                 case ("authorPrincipal") { return #ok(#principal(postNotificationContent.authorPrincipal)); };
//                 case ("authorHandle") { return #ok(#text(postNotificationContent.authorHandle)); };
//                 case ("isPublication") { return #ok(#bool(postNotificationContent.isAuthorPublication)); };
//                 case _ { return #err("Invalid field name"); };
//             };
//         };
//         case (#PremiumArticleSoldNotificationContent(premiumArticleSoldNotificationContent)) {
//             switch (field) {
//                 case ("url") { return #ok(#text(premiumArticleSoldNotificationContent.url)); };
//                 case ("purchaserHandle") { return #ok(#text(premiumArticleSoldNotificationContent.purchaserHandle)); };
//                 case ("purchaserPrincipal") { return #ok(#principal(premiumArticleSoldNotificationContent.purchaserPrincipal)); };
//                 case ("articleId") { return #ok(#text(premiumArticleSoldNotificationContent.articleId)); };
//                 case ("articleTitle") { return #ok(#text(premiumArticleSoldNotificationContent.articleTitle)); };
//                 case ("authorPrincipal") { return #ok(#principal(premiumArticleSoldNotificationContent.authorPrincipal)); };
//                 case ("authorHandle") { return #ok(#text(premiumArticleSoldNotificationContent.authorHandle)); };
//                 case ("isPublication") { return #ok(#bool(premiumArticleSoldNotificationContent.isAuthorPublication)); };
//                 case _ { return #err("Invalid field name");
//             };
//         };
//         };
//         case (#NewCommentOnFollowedArticleNotificationContent(newCommentOnFollowedArticleNotificationContent)) {
//             switch (field) {
//                 case ("url") { return #ok(#text(newCommentOnFollowedArticleNotificationContent.url)); };
//                 case ("articleId") { return #ok(#text(newCommentOnFollowedArticleNotificationContent.articleId)); };
//                 case ("articleTitle") { return #ok(#text(newCommentOnFollowedArticleNotificationContent.articleTitle)); };
//                 case ("authorPrincipal") { return #ok(#principal(newCommentOnFollowedArticleNotificationContent.authorPrincipal)); };
//                 case ("authorHandle") { return #ok(#text(newCommentOnFollowedArticleNotificationContent.authorHandle)); };
//                 case ("isAuthorPublication") { return #ok(#bool(newCommentOnFollowedArticleNotificationContent.isAuthorPublication)); };
//                 case ("comment") { return #ok(#text(newCommentOnFollowedArticleNotificationContent.comment)); };
//                 case ("isReply") { return #ok(#bool(newCommentOnFollowedArticleNotificationContent.isReply)); };
//                 case ("commenterPrincipal") { return #ok(#principal(newCommentOnFollowedArticleNotificationContent.commenterPrincipal)); };
//                 case ("commenterHandle") { return #ok(#text(newCommentOnFollowedArticleNotificationContent.commenterHandle)); };
//                 case ("tags") { return #ok(#array(newCommentOnFollowedArticleNotificationContent.tags)); };
//                 case _ { return #err("Invalid field name");
//             };
//         };
//         };
//         case (#NewFollowerNotificationContent(newFollowerNotificationContent)) {
//             switch (field) {
//                 case ("followerUrl") { return #ok(#text(newFollowerNotificationContent.followerUrl)); };
//                 case ("followerPrincipal") { return #ok(#principal(newFollowerNotificationContent.followerPrincipal)); };
//                 case ("followerHandle") { return #ok(#text(newFollowerNotificationContent.followerHandle)); };
//                 case ("authorPrincipal") { return #ok(#principal(newFollowerNotificationContent.authorPrincipal)); };
//                 case ("authorHandle") { return #ok(#text(newFollowerNotificationContent.authorHandle)); };
//                 case _ { return #err("Invalid field name");
//             };
//         };
//         };
//         case (#FaucetClaimAvailableNotificationContent(faucetClaimAvailableNotificationContent)) {
//             switch (field) {
//                 case ("recieverPrincipal") { return #ok(#principal(faucetClaimAvailableNotificationContent.recieverPrincipal)); };
//                 case ("recieverHandle") { return #ok(#text(faucetClaimAvailableNotificationContent.recieverHandle)); };
//                 case ("claimed") { return #ok(#none(null)); };
//                 case _ { return #err("Invalid field name");
//             };
//         };
//         };
//         case (#NewArticleNotificationContent(newArticleNotificationContent)) {
//             switch (field) {
//                 case ("url") { return #ok(#text(newArticleNotificationContent.url)); };
//                 case ("articleId") { return #ok(#text(newArticleNotificationContent.articleId)); };
//                 case ("articleTitle") { return #ok(#text(newArticleNotificationContent.articleTitle)); };
//                 case ("authorPrincipal") { return #ok(#principal(newArticleNotificationContent.authorPrincipal)); };
//                 case ("authorHandle") { return #ok(#text(newArticleNotificationContent.authorHandle)); };
//                 case ("isAuthorPublication") { return #ok(#bool(newArticleNotificationContent.isAuthorPublication)); };
//                 case ("tags") { return #ok(#array(newArticleNotificationContent.tags)); };
//                 case _ { return #err("Invalid field name");
//             };
//         };
//         };
//         case (#TipRecievedNotificationContent(tipRecievedNotificationContent)) {
//             switch (field) {
//                 case ("postUrl") { return #ok(#text(tipRecievedNotificationContent.postUrl)); };
//                 case ("articleId") { return #ok(#text(tipRecievedNotificationContent.articleId)); };
//                 case ("articleTitle") { return #ok(#text(tipRecievedNotificationContent.articleTitle)); };
//                 case ("receiverHandle") { return #ok(#text(tipRecievedNotificationContent.receiverHandle)); };
//                 case ("receiverPrincipal") { return #ok(#principal(tipRecievedNotificationContent.receiverPrincipal)); };
//                 case ("recieverIsPublication") { return #ok(#bool(tipRecievedNotificationContent.recieverIsPublication)); };
//                 case ("senderHandle") { return #ok(#text(tipRecievedNotificationContent.senderHandle)); };
//                 case ("senderPrincipal") { return #ok(#principal(tipRecievedNotificationContent.senderPrincipal)); };
//                 case ("tipAmount") { return #ok(#text(tipRecievedNotificationContent.tipAmount)); };
//                 case ("token") { return #ok(#text(tipRecievedNotificationContent.token)); };
//                 case _ { return #err("Invalid field name");
//             };
//         };
//         };
//         case _ {
//             return #err("Invalid notification type passed to getSpecificField func");
//         };
//     };
// };



private func getTags(notification: ?NotificationContent) : [Text] {
    switch (notification) {
        case (?#PostNotificationContent {tags = t}) { t };
        case (?#NewCommentOnFollowedArticleNotificationContent {tags = t}) { t };
        case (?#NewArticleNotificationContent {tags = t}) { t };
        case _ { [] };
    }
};

private func getAuthorHandle(notification: ?NotificationContent) : Text {
    switch (notification) {
        case (?#PostNotificationContent {authorHandle = ah}) { ah };
        case (?#PremiumArticleSoldNotificationContent {authorHandle = ah}) { ah };
        case (?#NewCommentOnFollowedArticleNotificationContent {authorHandle = ah}) { ah };
        case (?#NewFollowerNotificationContent {authorHandle = ah}) { ah };
        case (?#NewArticleNotificationContent {authorHandle = ah}) { ah };
        case (?#TipRecievedNotificationContent {senderHandle = sh}) { sh };
        case _ { "" };
    }
};

private func getAuthorPrincipal(notification: ?NotificationContent) : Principal {
    switch (notification) {
        case (?#PostNotificationContent {authorPrincipal = ap}) { ap };
        case (?#PremiumArticleSoldNotificationContent {authorPrincipal = ap}) { ap };
        case (?#NewCommentOnFollowedArticleNotificationContent {authorPrincipal = ap}) { ap };
        case (?#NewFollowerNotificationContent {authorPrincipal = ap}) { ap };
        case (?#NewArticleNotificationContent {authorPrincipal = ap}) { ap };
        case (?#TipRecievedNotificationContent {senderPrincipal = sp}) { sp };
        case _ { ANONYMOUS_PRINCIPAL };
    }
};



private func getSenderHandle(notification: ?NotificationContent) : Text {
    switch (notification) {
        case (?#PremiumArticleSoldNotificationContent {purchaserHandle = ph}) { ph };  
        case (?#NewCommentOnFollowedArticleNotificationContent {commenterHandle = ch}) { ch };
        case (?#NewFollowerNotificationContent {followerHandle = fh}) { fh };
        case (?#NewArticleNotificationContent {authorHandle = ah}) { ah };
        case (?#AuthorExpiredSubscriptionNotificationContent {subscriberHandle = sh}) { sh };
        case (?#TipRecievedNotificationContent {senderHandle = sh}) { sh };
        case _ { "" };
    }
};

private func getSenderPrincipal(notification: ?NotificationContent) : Principal {
    switch (notification) {
        case (?#PremiumArticleSoldNotificationContent {purchaserPrincipal = pp}) { pp };
        case (?#NewCommentOnFollowedArticleNotificationContent {commenterPrincipal = cp}) { cp };
        case (?#NewFollowerNotificationContent {followerPrincipal = fp}) { fp };
        case (?#NewArticleNotificationContent {authorPrincipal = ap}) { ap };
        case (?#AuthorExpiredSubscriptionNotificationContent {subscriberPrincipal = sp}) { sp };
        case (?#TipRecievedNotificationContent {senderPrincipal = sp}) { sp };
        case _ { ANONYMOUS_PRINCIPAL };
    }
};


private func generateContent(content: ?NotificationContent) : Result.Result<?NotificationContent, Text> {
    switch (content) {
        case (?#PostNotificationContent(postNotificationContent)) {
            return #ok( ?#PostNotificationContent postNotificationContent);
    };
        case (?#PremiumArticleSoldNotificationContent(premiumArticleSoldNotificationContent)) {
            return #ok( ?#PremiumArticleSoldNotificationContent premiumArticleSoldNotificationContent);
    };
        case (?#NewCommentOnFollowedArticleNotificationContent(newCommentOnFollowedArticleNotificationContent)) {
            return #ok( ?#NewCommentOnFollowedArticleNotificationContent newCommentOnFollowedArticleNotificationContent);
    };
        case (?#NewFollowerNotificationContent(newFollowerNotificationContent)) {
            return #ok( ?#NewFollowerNotificationContent newFollowerNotificationContent);
    };
        case (?#FaucetClaimAvailableNotificationContent(faucetClaimAvailableNotificationContent)) {
            return #ok( ?#FaucetClaimAvailableNotificationContent faucetClaimAvailableNotificationContent);
    };
        case (?#NewArticleNotificationContent(newArticleNotificationContent)) {
            return #ok( ?#NewArticleNotificationContent newArticleNotificationContent);
    };
        case (?#TipRecievedNotificationContent(tipRecievedNotificationContent)) {
            return #ok( ?#TipRecievedNotificationContent tipRecievedNotificationContent);
    };
        case _ {
            return #err("Invalid notification type passed to generateContent func");
    };
    };
};

private func modifyContent(content: NotificationContent, updatedFields: { 
    url: ?Text; 
    senderHandle: ?Text; 
    receiverHandle: ?Text; 
    senderPrincipal: ?Principal; 
    receiverPrincipal: ?Principal; 
    tags: ?[Text]; 
    articleId: ?Text; 
    articleTitle: ?Text; 
    authorPrincipal: ?Principal; 
    authorHandle: ?Text; 
    isAuthorPublication: ?Bool;
    comment: ?Text;
    isReply: ?Bool;
    commenterPrincipal: ?Principal;
    commenterHandle: ?Text;
    purchaserHandle: ?Text;
    purchaserPrincipal: ?Principal;
    claimed: ?ClaimStatus; 
    followerUrl: ?Text;
    followerPrincipal: ?Principal;
    followerHandle: ?Text;
    postUrl: ?Text;
    recieverIsPublication: ?Bool;
    tipAmount: ?Text;
    token: ?Text;
    time: ?Text;
    subscriberHandle: ?Text;
    subscriberPrincipal: ?Principal;
}) : Result.Result<?NotificationContent, Text> {

    func updateField<T>(original: T, updated: ?T) : T {
        switch (updated) {
            case (?value) { value };
            case null { original };
        }
    };

    switch (content) {
        case (#PostNotificationContent(postNotificationContent)) {
            return #ok(?#PostNotificationContent{
                url = updateField(postNotificationContent.url, updatedFields.url);
                receiverHandle = updateField(postNotificationContent.receiverHandle, updatedFields.receiverHandle);
                receiverPrincipal = updateField(postNotificationContent.receiverPrincipal, updatedFields.receiverPrincipal);
                tags = updateField(postNotificationContent.tags, updatedFields.tags);
                articleId = updateField(postNotificationContent.articleId, updatedFields.articleId);
                articleTitle = updateField(postNotificationContent.articleTitle, updatedFields.articleTitle);
                authorPrincipal = updateField(postNotificationContent.authorPrincipal, updatedFields.authorPrincipal);
                authorHandle = updateField(postNotificationContent.authorHandle, updatedFields.authorHandle);
                isAuthorPublication = updateField(postNotificationContent.isAuthorPublication, updatedFields.isAuthorPublication);
            });
        };
        case (#PremiumArticleSoldNotificationContent(premiumArticleSoldNotificationContent)) {
            return #ok(?#PremiumArticleSoldNotificationContent{
                url = updateField(premiumArticleSoldNotificationContent.url, updatedFields.url);
                purchaserHandle = updateField(premiumArticleSoldNotificationContent.purchaserHandle, updatedFields.purchaserHandle);
                purchaserPrincipal = updateField(premiumArticleSoldNotificationContent.purchaserPrincipal, updatedFields.purchaserPrincipal);
                articleId = updateField(premiumArticleSoldNotificationContent.articleId, updatedFields.articleId);
                articleTitle = updateField(premiumArticleSoldNotificationContent.articleTitle, updatedFields.articleTitle);
                authorPrincipal = updateField(premiumArticleSoldNotificationContent.authorPrincipal, updatedFields.authorPrincipal);
                authorHandle = updateField(premiumArticleSoldNotificationContent.authorHandle, updatedFields.authorHandle);
                isAuthorPublication = updateField(premiumArticleSoldNotificationContent.isAuthorPublication, updatedFields.isAuthorPublication);
            });
        };
        case (#NewCommentOnFollowedArticleNotificationContent(newCommentOnFollowedArticleNotificationContent)) {
            return #ok(?#NewCommentOnFollowedArticleNotificationContent{
                url = updateField(newCommentOnFollowedArticleNotificationContent.url, updatedFields.url);
                articleId = updateField(newCommentOnFollowedArticleNotificationContent.articleId, updatedFields.articleId);
                articleTitle = updateField(newCommentOnFollowedArticleNotificationContent.articleTitle, updatedFields.articleTitle);
                authorPrincipal = updateField(newCommentOnFollowedArticleNotificationContent.authorPrincipal, updatedFields.authorPrincipal);
                authorHandle = updateField(newCommentOnFollowedArticleNotificationContent.authorHandle, updatedFields.authorHandle);
                isAuthorPublication = updateField(newCommentOnFollowedArticleNotificationContent.isAuthorPublication, updatedFields.isAuthorPublication);
                comment = updateField(newCommentOnFollowedArticleNotificationContent.comment, updatedFields.comment);
                isReply = updateField(newCommentOnFollowedArticleNotificationContent.isReply, updatedFields.isReply);
                commenterPrincipal = updateField(newCommentOnFollowedArticleNotificationContent.commenterPrincipal, updatedFields.commenterPrincipal);
                commenterHandle = updateField(newCommentOnFollowedArticleNotificationContent.commenterHandle, updatedFields.commenterHandle);
                tags = updateField(newCommentOnFollowedArticleNotificationContent.tags, updatedFields.tags);
            });
        };
        case (#NewFollowerNotificationContent(newFollowerNotificationContent)) {
            return #ok(?#NewFollowerNotificationContent{
                followerUrl = updateField(newFollowerNotificationContent.followerUrl, updatedFields.followerUrl);
                followerPrincipal = updateField(newFollowerNotificationContent.followerPrincipal, updatedFields.followerPrincipal);
                followerHandle = updateField(newFollowerNotificationContent.followerHandle, updatedFields.followerHandle);
                authorPrincipal = updateField(newFollowerNotificationContent.authorPrincipal, updatedFields.authorPrincipal);
                authorHandle = updateField(newFollowerNotificationContent.authorHandle, updatedFields.authorHandle);
            });
        };
        case (#FaucetClaimAvailableNotificationContent(faucetClaimAvailableNotificationContent)) {
            return #ok(?#FaucetClaimAvailableNotificationContent{
                receiverPrincipal = updateField(faucetClaimAvailableNotificationContent.receiverPrincipal, updatedFields.receiverPrincipal);
                receiverHandle = updateField(faucetClaimAvailableNotificationContent.receiverHandle, updatedFields.receiverHandle);
                claimed = faucetClaimAvailableNotificationContent.claimed; //TODO: implement a claimed field maybe???
            });
        };
        case (#NewArticleNotificationContent(newArticleNotificationContent)) {
            return #ok(?#NewArticleNotificationContent{
                url = updateField(newArticleNotificationContent.url, updatedFields.url);
                articleId = updateField(newArticleNotificationContent.articleId, updatedFields.articleId);
                articleTitle = updateField(newArticleNotificationContent.articleTitle, updatedFields.articleTitle);
                authorPrincipal = updateField(newArticleNotificationContent.authorPrincipal, updatedFields.authorPrincipal);
                authorHandle = updateField(newArticleNotificationContent.authorHandle, updatedFields.authorHandle);
                isAuthorPublication = updateField(newArticleNotificationContent.isAuthorPublication, updatedFields.isAuthorPublication);
                tags = updateField(newArticleNotificationContent.tags, updatedFields.tags);
            });
        };
        case (#TipRecievedNotificationContent(tipRecievedNotificationContent)) {
            return #ok(?#TipRecievedNotificationContent{
                postUrl = updateField(tipRecievedNotificationContent.postUrl, updatedFields.postUrl);
                articleId = updateField(tipRecievedNotificationContent.articleId, updatedFields.articleId);
                articleTitle = updateField(tipRecievedNotificationContent.articleTitle, updatedFields.articleTitle);
                receiverHandle = updateField(tipRecievedNotificationContent.receiverHandle, updatedFields.receiverHandle);
                receiverPrincipal = updateField(tipRecievedNotificationContent.receiverPrincipal, updatedFields.receiverPrincipal);
                recieverIsPublication = updateField(tipRecievedNotificationContent.recieverIsPublication, updatedFields.recieverIsPublication);
                senderHandle = updateField(tipRecievedNotificationContent.senderHandle, updatedFields.senderHandle);
                senderPrincipal = updateField(tipRecievedNotificationContent.senderPrincipal, updatedFields.senderPrincipal);
                tipAmount = updateField(tipRecievedNotificationContent.tipAmount, updatedFields.tipAmount);
                token = updateField(tipRecievedNotificationContent.token, updatedFields.token);
            });
        };
        case (#AuthorExpiredSubscriptionNotificationContent(authorExpiredSubscriptionNotificationContent)) {
            return #ok(?#AuthorExpiredSubscriptionNotificationContent{
                authorHandle = updateField(authorExpiredSubscriptionNotificationContent.authorHandle, updatedFields.authorHandle);
                authorPrincipal = updateField(authorExpiredSubscriptionNotificationContent.authorPrincipal, updatedFields.authorPrincipal);
                subscriberPrincipal = updateField(authorExpiredSubscriptionNotificationContent.subscriberPrincipal, updatedFields.subscriberPrincipal);
                subscriberHandle = updateField(authorExpiredSubscriptionNotificationContent.subscriberHandle, updatedFields.subscriberHandle);
                time = updateField(authorExpiredSubscriptionNotificationContent.time, updatedFields.time);
            });
        };
    };
};


public shared ({caller}) func newArticle(notificationContents: NotificationContent) : async Result.Result<(), Text> {
    
    let generateNotificationContent = generateContent(?notificationContents);
    let notificationContent = switch (generateNotificationContent) {
        case (#ok(content)) { content };
        case (#err(err)) { return #err(err) };
    };

    // if (Result.isErr(notificationContent)) {
    //     return #err("Invalid notification type passed to -newArticle-");
    // };

    let author = getAuthorHandle(notificationContent);
    let userCanister = CanisterDeclarations.getUserCanister();
    let followers = await userCanister.getUserFollowers(U.lowerCase(author));
    let followersBuffer = Buffer.Buffer<Text>(0);

    // Process followers of the writer
    for (f in Iter.fromArray(followers)) {
        followersBuffer.add(f.principal);
        let receiver = f;
        let newNotification = createNewNotificationObject(#NewArticleByFollowedWriter, notificationContent);
        let updateResult = updateUserBroadcastNotification(Principal.fromText(receiver.principal), newNotification);
        //todo, check, does this call the function correctly? 
        if (Result.isErr(updateResult)) {
            Debug.print("newArticle: error: " # debug_show(updateResult));
            return updateResult;
        };
        notificationId += 1;
        Debug.print("newArticle: added notification to " # receiver.principal);
    };

    // Process followers of the tags
    let postCore = CanisterDeclarations.getPostCoreCanister();
    let tags = getTags(notificationContent);
    for (tag in Iter.fromArray(tags)) {
        let tagFollowersResult = await postCore.getTagFollowers(tag);
        switch (tagFollowersResult) {
            case (#ok(tagFollowers)) {
                for (f in Iter.fromArray(tagFollowers)) {
                    if (Buffer.contains<Text>(followersBuffer, f, Text.equal)) {
                        Debug.print("newArticle: duplicate found: " # f);
                    } else {
                        let receiver = f;
                        let newNotification = createNewNotificationObject(#NewArticleByFollowedTag, notificationContent);
                        if (Principal.fromText(receiver) != getAuthorPrincipal(notificationContent)) {
                            let updateResult = updateUserBroadcastNotification(Principal.fromText(receiver), newNotification);
                            if (Result.isErr(updateResult)) {
                                Debug.print("newArticle: error: " # debug_show(updateResult));
                                return updateResult;
                            };
                            notificationId += 1;
                            followersBuffer.add(receiver);
                        };
                    };
                };
            };
            case (#err(err)) {
                Debug.print("newArticle: error: " # debug_show(err));
                return #err(err);
            };
        };
    };

    return #ok();
};


//subscriptions
public shared ({caller}) func disperseBulkSubscriptionNotifications(subscriptions: [(NotificationType, NotificationContent)]) : async Result.Result<(), Text> {
  if(not Text.equal(ENV.SUBSCRIPTION_CANISTER_ID, Principal.toText(caller))){
    return #err("Unauthorized");
  };

  for(subscription in Iter.fromArray(subscriptions)){
    switch(subscription){
      case(subscription){
        createNotificationInternal(subscription.0, subscription.1);
      };
    };
  };

  #ok()
};




//utility functions

let { ihash; nhash; thash; phash; calcHash } = Map;



func filterForNotificationSettings(n : Notifications, caller: Principal) : Bool {

    let settings = Map.get(userNotificationSettings, phash, caller);
    
     switch (settings) {
        case null {
          return true;

        };
        case (?settings) {
     switch (n.notificationType) {
        case (#NewCommentOnMyArticle) {
          return settings.newCommentOnMyArticle;
        };
        case (#NewCommentOnFollowedArticle) {
          return settings.newCommentOnFollowedArticle;
        };
        case (#NewArticleByFollowedWriter) {
          return settings.newArticleByFollowedWriter;
        };
        case (#NewArticleByFollowedTag) {
          return settings.newArticleByFollowedTag;
        };
        case (#NewFollower) {
          return settings.newFollower;
        };
        case (#TipReceived) {
         return settings.tipReceived;
        };
        case (#PremiumArticleSold) {
          return settings.premiumArticleSold;
        };
        case (#AuthorGainsNewSubscriber) {
          return settings.authorGainsNewSubscriber;
        };
        case (#YouSubscribedToAuthor) {
          return settings.youSubscribedToAuthor;
        };
        case (#AuthorLosesSubscriber) {
          return settings.authorLosesSubscriber;
        };
        case (#YouUnsubscribedFromAuthor) {
          return settings.youUnsubscribedFromAuthor;
        };
        case (#AuthorExpiredSubscription) {
          return settings.authorExpiredSubscription;
        };
        case (#ReaderExpiredSubscription) {
          return settings.readerExpiredSubscription;
        };
        case (#FaucetClaimAvailable){
          return settings.faucetClaimAvailable;
        };
     };
    };
  };
};

    func sortNotificationsById(a: Notifications, b: Notifications): Order.Order {
    if (U.textToNat(a.id) < U.textToNat(b.id)) {
      return #less;
    } else if (U.textToNat(a.id) > U.textToNat(b.id)) {
      return #greater;
    } else {
      return #equal;
    }
  };






public shared query ({caller}) func getUserNotifications(from : Text, to : Text) : async Result.Result<([Notifications], Nat), Text> {
    // Check for anonymous callers
    if (isAnonymous(caller)) {
        return #err("Cannot use this method anonymously.");
    };

    // Collect metrics
    canistergeekMonitor.collectMetrics();

    // Attempt to get user's direct and broadcast notifications
    let directNotifications = Map.get(userDirectNotifications, phash, caller);
    let broadcastNotifications = Map.get(userBroadcastNotifications, phash, caller);

    // Initialize a buffer for notifications
    var notifications = Buffer.Buffer<Notifications>(0);
    
    // Process direct notifications
    switch (directNotifications) {
        case null {};
        case (?directNotifications) {
            for (n in (Map.vals(directNotifications.notifications))) {
                if (filterForNotificationSettings(n, caller)) {
                    notifications.add(n);
                };
            };
        };
    };

    // Process broadcast notifications
    switch (broadcastNotifications) {
        case null {};
        case (?broadcastNotifications) {
            for (n in (Map.vals(broadcastNotifications.notifications))) {
                if (filterForNotificationSettings(n, caller)) {
                    notifications.add(n);
                };  
            };
        };
    };

    // Sort notifications by ID
    notifications.sort(sortNotificationsById);
    let allNotifications = Array.reverse(Buffer.toArray(notifications));

    let fromIndex = U.textToNat(from);
    let toIndex = U.textToNat(to);

    var adjustedToIndex = toIndex;

    if (toIndex < Array.size(allNotifications)) {
        adjustedToIndex := toIndex + 1;
        Debug.print("adjustedToIndex: " # Nat.toText(adjustedToIndex));
    } else {
        adjustedToIndex := Array.size(allNotifications);
        Debug.print("adjustedToIndex: " # Nat.toText(adjustedToIndex));
    };

    let notificationsSlice = Iter.toArray(Array.slice(allNotifications, fromIndex, adjustedToIndex));


    switch(notificationsSlice) {
        case (notificationsSlice) {
            return #ok((notificationsSlice, Array.size(allNotifications)));
        };
    };
};



//mark notification as read
public shared ({caller}) func markNotificationAsRead( notificationIds : [Text]) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
        return #err("Cannot use this method anonymously.");
    };


    if (not isThereEnoughMemoryPrivate()) {
        return #err("Canister reached the maximum memory threshold. Please try again later.");
    };


  for (notificationId in Iter.fromArray(notificationIds)) {
    let directNotifications = Map.get(userDirectNotifications, phash, caller);
    switch (directNotifications) {
        case null {};
        case (?directNotifications) {
         
            switch (Map.remove(directNotifications.notifications, thash, notificationId)) {
                case null {};
                case (?notification) {
                  var n = notification;
                  n := {
                    id = n.id;
                    notificationType = n.notificationType;
                    content = n.content;
                    timestamp = n.timestamp;
                    read = true;
                  };

                  Map.set(directNotifications.notifications, thash, notificationId, n);
                };
            };
        };
    };

    let broadcastNotifications = Map.get(userBroadcastNotifications, phash, caller);
    switch (broadcastNotifications) {
        case null {};
        case (?broadcastNotifications) {
            switch (Map.remove(broadcastNotifications.notifications, thash, notificationId)) {
                case null {};
                case (?notification) {
                  var n = notification;
                  n := {
                    id = n.id;
                    notificationType = n.notificationType;
                    content = n.content;
                    timestamp = n.timestamp;
                    read = true;
                  };

                  Map.set(broadcastNotifications.notifications, thash, notificationId, n);
                };
            };
        };
    };
  };

    #ok();
};


public shared ({caller}) func updateUserNotificationSettings(notificationSettings : UserNotificationSettings) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
        return #err("Cannot use this method anonymously.");
    };

    if (not isThereEnoughMemoryPrivate()) {
        return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    canistergeekMonitor.collectMetrics();

   Map.set(userNotificationSettings, phash, caller, notificationSettings);

return #ok();
};

public shared ({caller}) func  createNotification(notificationType : NotificationType, content : NotificationContent) : async Result.Result<(), Text> {

    let isNuanceCanister = func(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        U.arrayContains(ENV.NOTIFICATIONS_CANISTER_ADMINS, c);
    };

    let postBuckets = await CanisterDeclarations.getPostCoreCanister().getBucketCanisters();

    let isPostBucket = func(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        for (bucket in Iter.fromArray(postBuckets)) {
            if (bucket.0 == c) {
                return true;
            };
        };
        return false;
    };

    let nft = await CanisterDeclarations.getNftFactoryCanister().getAllNftCanisterIds();

    let isNftCanister = func(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        for (canister in Iter.fromArray(nft)) {
            if (canister.1 == c) {
                return true;
            };
        };
        return false;
    };

    if (not isNuanceCanister(caller) and not isPostBucket(caller) and not isNftCanister(caller)) {
        return #err("Cannot use this method anonymously.");
    };

    if (isAnonymous(caller)) {
        return #err("Cannot use this method anonymously.");
    };

   

    if (not isThereEnoughMemoryPrivate()) {
        return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    let generateNotificationContent = generateContent(?content);
    let notificationContent = switch (generateNotificationContent) {
        case (#ok(content)) { content };
        case (#err(err)) { return #err(err) };
    };

    canistergeekMonitor.collectMetrics();

    var notification = {
        id = Nat.toText(notificationId);
        notificationType = notificationType;
        content : ?NotificationContent = notificationContent;
        timestamp = Int.toText(Time.now());
        read = false;
    };


    let senderHandle = getSenderHandle(?content);

    let senderPrincipal = getSenderPrincipal(?content);

    if (senderHandle == "") {

      let sender = await UserCanister.getUserByPrincipalId(Principal.toText(senderPrincipal));

      switch (sender) {
        case (#ok(user)) {
          let updatedContent = modifyContent(content, { url = null; senderHandle = ?user.handle; senderPrincipal = null; receiverHandle = null; receiverPrincipal = null; tags = null; articleId = null; articleTitle = null; authorPrincipal = null; authorHandle = null; isAuthorPublication = null; comment = null; isReply = null; commenterPrincipal = null; commenterHandle = null; purchaserHandle = null; purchaserPrincipal = null; claimed = null; followerUrl = null; followerPrincipal = null; followerHandle = null; postUrl = null; recieverIsPublication = null; tipAmount = null; token = null; subscriberHandle = null; subscriberPrincipal = null; time = null });
          switch (updatedContent) {
            case (#ok(content)) {
              notification := {
                id = Nat.toText(notificationId);
                notificationType = notificationType;
                content = content; 
                timestamp = Int.toText(Time.now());
                read = false;
              };
            };
            case (#err(err)) {
              return #err(err);
            };
        };
      };
        case (#err(err)) {
          return #err(err);
        };
     
    };

    };

    switch (notificationType) {
        case (#NewCommentOnMyArticle) {
            //shouldn't happen because it is handled in comment broadcast
            //direct
            createDirectNotificationInternal(notification);
        };

        case (#NewFollower) {
            //direct
            createDirectNotificationInternal(notification);
        };
        case (#TipReceived) {
            //direct
            createDirectNotificationInternal(notification);
        };
        case (#PremiumArticleSold) {
           
          //generate handles for frontend
            var authorHandle = getAuthorHandle(?content);
            var senderHandle = "";
            var authorPrincipal = getAuthorPrincipal(?content);

            switch (await UserCanister.getUserByPrincipalId(Principal.toText(authorPrincipal))) {
                case (#ok(user)) {
                 
                    authorHandle := user.handle;
                  };
                case (#err(err)) {
                  Debug.print("createNotification: error: " # debug_show(err));

                    return #err(err);
                };
            };

            //Comment when sender bug is solved in NFT canister
            //Currently the NFT canister sends its own address as the senderPrincipal
            // switch (await UserCanister.getUserByPrincipalId(Principal.toText(content.senderPrincipal))) {
            //     case (#ok(user)) {
            //         senderHandle := user.handle;
            //       };
            //     case (#err(err)) {
            //       Debug.print("createNotification: error: " # debug_show(err));

            //         return #err(err);
            //     };
            // };


          //get article details
            var url = "";
            var articleTitle = "";
            var tags = Buffer.Buffer<Text>(0);

            let articleId = switch (notification.content) {
            case (?#PremiumArticleSoldNotificationContent {articleId = ai}) { ai };
            case _ { "" };
        };

         let postCore = CanisterDeclarations.getPostCoreCanister();
         switch(await postCore.getPostKeyProperties(articleId)) {
            case(#ok(keyProperties)) {
              let PostBucketCanister = CanisterDeclarations.getPostBucketCanister(keyProperties.bucketCanisterId);
              switch(await PostBucketCanister.getPost(articleId)) {
                case(#ok(post)) {
                  
                  url := post.url;
                  articleTitle := post.title;
                  for (tag in Iter.fromArray(keyProperties.tags)) {
                    tags.add(tag.tagName);
                  };
                };
                case(#err(error)) {};
              };
            };
            case(#err(error)) {};
        };

            notification := {
                id = Nat.toText(notificationId);
                notificationType = notificationType;
                content = ?content; //todo ensure fields arent empty
                timestamp = Int.toText(Time.now());
                read = false;
            };


            createDirectNotificationInternal(notification);
        };
        case (#NewCommentOnFollowedArticle) {
        
            switch (await addBroadcast(notification)) {
                case (#ok()) {
                    switch (await createBroadcastNotification(notification)) {
                        case (#ok()) {
                            return #ok();
                        };
                        case (#err(err)) {

                            return #err("Distribution of notifications failed: " # err);
                        };
                    };
                };
                case (#err(err)) {

                    return #err( "Failed to addBroadcast event: " # err);
                };
            };

        };
        case (#NewArticleByFollowedWriter) {
            
            switch (await createBroadcastNotification(notification)) {
                case (#ok()) {
                    return #ok();
                };
                case (#err(err)) {

                    return #err(err);
                };
            };
        };
        case (#NewArticleByFollowedTag) {
            switch (await createBroadcastNotification(notification)) {
                case (#ok()) {
                    return #ok();
                };
                case (#err(err)) {

                    return #err(err);
                };
            };
        };
        case (#AuthorExpiredSubscription) {

          let subscriberHandle = switch (notification.content) {
            case (?#AuthorExpiredSubscriptionNotificationContent {subscriberHandle = sh}) { sh };
            case _ { "" };
        };

        let authorPrincipal = switch (notification.content) {
            case (?#AuthorExpiredSubscriptionNotificationContent {authorPrincipal = ap}) { ap };
            case _ { ANONYMOUS_PRINCIPAL };
        };

           if (senderHandle == "") {
        let author = await UserCanister.getUserByPrincipalId(Principal.toText(authorPrincipal));
        switch (author) {
            case (#ok(user)) {

              let updatedContent = modifyContent(content, { url = null; senderHandle = ?user.handle; senderPrincipal = null; receiverHandle = null; receiverPrincipal = null; tags = null; articleId = null; articleTitle = null; authorPrincipal = null; authorHandle = null; isAuthorPublication = null; comment = null; isReply = null; commenterPrincipal = null; commenterHandle = null; purchaserHandle = null; purchaserPrincipal = null; claimed = null; followerUrl = null; followerPrincipal = null; followerHandle = null; postUrl = null; recieverIsPublication = null; tipAmount = null; token = null; subscriberHandle = null; subscriberPrincipal = null; time = null });

            switch (updatedContent) {
            case (#ok(updatedContent)) {
              notification := {
                id = Nat.toText(notificationId);
                notificationType = notificationType;
                content = updatedContent;
                timestamp = Int.toText(Time.now());
                read = false;
              };
            };
            case (#err(err)) {
              return #err(err);
            };
            };  
            };


            case (#err(err)) {
            };
        };
           };
            createDirectNotificationInternal(notification)   

        };

        case (#FaucetClaimAvailable) {
            createDirectNotificationInternal(notification)
        };


        case (#ReaderExpiredSubscription) {
            createDirectNotificationInternal(notification)
        };

        case (#AuthorGainsNewSubscriber) {
            createDirectNotificationInternal(notification);
        };
        case (#YouSubscribedToAuthor) {
            createDirectNotificationInternal(notification);
        };

        case (#AuthorLosesSubscriber) {
            createDirectNotificationInternal(notification);
        };

        case (#YouUnsubscribedFromAuthor) {
            createDirectNotificationInternal(notification);
        };
    };

    #ok();
};



//it can only be called by Subscription canister for now
public shared ({caller}) func  createNotifications(input: [(NotificationType, NotificationContent)]) : async Result.Result<(), Text> {
  if(not Text.equal(ENV.SUBSCRIPTION_CANISTER_ID, Principal.toText(caller))){
    return #err("Unauthorized");
  };

  for(notificationInput in input.vals()){
    createNotificationInternal(notificationInput.0, notificationInput.1)
  };

  #ok()
};


private func createNotificationInternal(notificationType: NotificationType, content: NotificationContent) : () {
  var notification = {
        id = Nat.toText(notificationId);
        notificationType = notificationType;
        content = ?content;
        read = false;
        timestamp = Int.toText(Time.now());
    };

    switch (notificationType) {
        case (#AuthorGainsNewSubscriber) {
          createDirectNotificationInternal(notification);
        };
        case (#YouSubscribedToAuthor) {
          createDirectNotificationInternal(notification);
        };

        case (#AuthorLosesSubscriber) {
          createDirectNotificationInternal(notification);
        };

        case (#YouUnsubscribedFromAuthor) {
          createDirectNotificationInternal(notification);
        };
        case (_) {};
    };
};






////////////////////////direct notifications////////////////////////////////////
func createDirectNotificationInternal(notification : Notifications) : () {


    let receiver = switch (notification.content) {
        case (?#PostNotificationContent {receiverPrincipal = rp}) { rp };
        case (?#PremiumArticleSoldNotificationContent {authorPrincipal = ap}) { ap };
        case (?#NewFollowerNotificationContent {authorPrincipal = ap}) { ap };
        case (?#FaucetClaimAvailableNotificationContent {receiverPrincipal = rp}) { rp };
        case (?#TipRecievedNotificationContent {receiverPrincipal = rp}) { rp };
        case _ { ANONYMOUS_PRINCIPAL };
    };
    updateUserDirectNotification(receiver, notification);    
};

func updateUserDirectNotification(receiver : Principal, notification : Notifications) : () {
    
        let directNotifications = Map.get(userDirectNotifications, phash, receiver);
        switch (directNotifications) {
            case null {
                let newDirectNotificationHashmap = Map.new<Text, Notifications>();
                Map.set(newDirectNotificationHashmap, thash, Nat.toText(notificationId), notification);
                Map.set(userDirectNotifications, phash, receiver, {notifications = newDirectNotificationHashmap}); 
            };
            case (?directNotifications) {
               Map.set(directNotifications.notifications, thash, Nat.toText(notificationId), notification);
            };
        };
};










////////////////////////broadcast notifications////////////////////////////////////

func updateUserBroadcastNotification(receiver : Principal, notification : Notifications) : Result.Result<(), Text> {
    let broadcastNotifications = Map.get(userBroadcastNotifications, phash, receiver);
    switch (broadcastNotifications) {
        case null {
            let newBroadcastNotificationHashmap = Map.new<Text, Notifications>();
            Map.set(newBroadcastNotificationHashmap, thash, Nat.toText(notificationId), notification);
            Map.set(userBroadcastNotifications, phash, receiver, {notifications = newBroadcastNotificationHashmap});
        };
        case (?broadcastNotifications) {
            Map.set(broadcastNotifications.notifications, thash, Nat.toText(notificationId), notification);
        };
    };
    #ok();
};

//Adds to internal hashmap for bulk distribution
func addBroadcast (notification : Notifications) : async Result.Result<(), Text> {
  switch (notification.notificationType) {
    case (#NewCommentOnFollowedArticle) {
    //add sender to articleCommenters hashmap
    let articleId = switch (notification.content) {
        case (?#NewCommentOnFollowedArticleNotificationContent  {articleId = ai}) { ai };
        case _ { "" };
    };
    let sender = switch (notification.content) {
        case (?#NewCommentOnFollowedArticleNotificationContent  {commenterPrincipal = cp}) { cp };
        case _ { ANONYMOUS_PRINCIPAL };
    };

    let author = switch (notification.content) {
        case (?#NewCommentOnFollowedArticleNotificationContent  {authorPrincipal = ap}) { ap };
        case _ { ANONYMOUS_PRINCIPAL };
    };

    let commenters = Map.get(articleCommenters, thash, articleId);
    switch (commenters) {
        case null {
          if (sender != author) {
            Map.set(articleCommenters, thash, articleId, [sender]);
           };
        };
        case (?commenters) {
            let commentersBuffer = Buffer.Buffer<Principal>(0);
            for (c in Iter.fromArray(commenters)) {
              //prevent double notifications to author or previous sender
              if (c != sender and c != author) {
                commentersBuffer.add(c);
              } else {
               return #ok();
              };
            };
            commentersBuffer.add(sender);
            Map.set(articleCommenters, thash, articleId, Buffer.toArray(commentersBuffer));
        };
    };
     return #ok();
    };
    case (#NewArticleByFollowedWriter) {      
      let author = getAuthorHandle(notification.content);

      // get user canister to update followers
      let userCanister = CanisterDeclarations.getUserCanister();
      let followers = await userCanister.getUserFollowers(author);
     

      switch (followers) {
          case (followers) {
              for (f in Iter.fromArray(followers)) {
                  let receiver = f;
                  let newNotification = {
                      id = Nat.toText(notificationId);
                      notificationType = notification.notificationType;
                      content = notification.content;
                      timestamp = Int.toText(Time.now());
                      read = false;
                  };
                  switch (updateUserBroadcastNotification(Principal.fromText(receiver.principal), newNotification)) {
                      case (#err(err)) {
                          return #err(err);
                      };
                      case (#ok()) {
                  notificationId += 1;
                  };
              };
          };
      };
    };
    return #ok();
    };
    case (#NewArticleByFollowedTag) {

      let postCore = CanisterDeclarations.getPostCoreCanister();
      let tags = getTags(notification.content);

      for (tag in Iter.fromArray(tags)) {
      let  followers = await postCore.getTagFollowers(tag);
      switch (followers) {
         
          case (#ok(followers)) {
              for (f in Iter.fromArray(followers)) {
                  let receiver = f;
                  let newNotification = {
                      id = Nat.toText(notificationId);
                      notificationType = notification.notificationType;
                      content = notification.content;
                      timestamp = Int.toText(Time.now());
                      read = false;
                  };
                  switch (updateUserBroadcastNotification(Principal.fromText(receiver), newNotification)) {
                      case (#err(err)) {
                          return #err(err);
                      };
                      case (#ok()) {
                  notificationId += 1;
                  };

              };
          };
      };
      case (#err(err)) {
          return #err(err);
      };
    };
      };
    return #ok();
    };
  case (_) {
    return #err("Broadcast notifications are not supported for this notification type");
  };
  };
};

func createBroadcastNotification (notification : Notifications) : async Result.Result<(), Text> {
  switch (notification.notificationType) {
    case (#NewCommentOnFollowedArticle) {
  let articleId = switch (notification.content) {
      case (?#NewCommentOnFollowedArticleNotificationContent  {articleId = ai}) { ai };
      case _ { "" };
  };

  let commenters = Map.get(articleCommenters, thash, articleId);
  switch (commenters) {
      case null {};
      case (?commenters) {
          for (c in Iter.fromArray(commenters)) {
              let receiver = c;
              let newNotification = {
                  id = Nat.toText(notificationId);
                  notificationType = notification.notificationType;
                  content = notification.content;
                  timestamp = Int.toText(Time.now());
                  read = false;
              };
              let senderPrincipal = switch (notification.content) {
              case (?#NewCommentOnFollowedArticleNotificationContent {commenterPrincipal = cp}) { cp };
              case _ { ANONYMOUS_PRINCIPAL};
          };

          let authorPrincipal = switch (notification.content) {
              case (?#NewCommentOnFollowedArticleNotificationContent  {authorPrincipal = ap}) { ap };
              case _ { ANONYMOUS_PRINCIPAL };
          };


              if (receiver != senderPrincipal and receiver != authorPrincipal) {
              switch (updateUserBroadcastNotification(receiver, newNotification)) {
                  case (#err(err)) {
                      return #err(err);
                  };
                  case (#ok()) {
              notificationId += 1;
        };
       };
              };
      };  

    
          let authorPrincipal = getAuthorPrincipal(notification.content);

          let commenterPrincipal = switch (notification.content) {
              case (?#NewCommentOnFollowedArticleNotificationContent { commenterPrincipal = cp }) { cp }; 
              case _ { ANONYMOUS_PRINCIPAL };
          };

            //special cases, for when a broadcast is also a direct notification
            //give the author a direct notification but only if they are not the sender
            if (authorPrincipal != commenterPrincipal) {
            switch (generateContent(notification.content)) {
                case (#ok(content)) {
                    let notificationContent : ?NotificationContent = content;
                    let newNotification : Notifications = {
                        id = Nat.toText(notificationId);
                        notificationType = #NewCommentOnMyArticle;
                        content = notificationContent;
                        timestamp = Int.toText(Time.now());
                        read = false;
                    };
                    createDirectNotificationInternal(newNotification);
                    };
           case (#err(err)) {
                return #err(err);
            };
            };
            };
    };

  };
  return #ok();
    };
    case (#NewArticleByFollowedWriter) {

      let author = getAuthorHandle(notification.content);
      
      let userCanister = CanisterDeclarations.getUserCanister();
      let followers = await userCanister.getUserFollowers(author);

      switch (followers) {
          case (followers) {
              for (f in Iter.fromArray(followers)) {
                  let receiver = f;
                  let newNotification = {
                      id = Nat.toText(notificationId);
                      notificationType = notification.notificationType;
                      content = notification.content;
                      timestamp = Int.toText(Time.now());
                      read = false;
                  };
                  switch (updateUserBroadcastNotification(Principal.fromText(receiver.principal), newNotification)) {
                      case (#err(err)) {
                          return #err(err);
                      };
                      case (#ok()) {
                  notificationId += 1;
                  };
              };
          };
      };
    };
    return #ok();
    };
    case (#NewArticleByFollowedTag) {

      let postCore = CanisterDeclarations.getPostCoreCanister();
      

      let tags = getTags(notification.content);

      for (tag in Iter.fromArray(tags)) {
      let  followers = await postCore.getTagFollowers(tag);
      switch (followers) {
          case (#ok(followers)) {
              for (f in Iter.fromArray(followers)) {
                  let receiver = f;
                  let newNotification = {
                      id = Nat.toText(notificationId);
                      notificationType = notification.notificationType;
                      content = notification.content;
                      timestamp = Int.toText(Time.now());
                      read = false;
                  };
                  switch (updateUserBroadcastNotification(Principal.fromText(receiver), newNotification)) {
                      case (#err(err)) {
                          return #err(err);
                      };
                      case (#ok()) {
                  notificationId += 1;
                  };
              };
          };
      };
      case (#err(err)) {
          return #err(err);
      };
      };
      };
      return #ok();
      
    };
  case (_) {
    return #err("Broadcast notifications are not supported for this notification type");
  };
  };
};






// #endregion
system func preupgrade() {};
system func postupgrade() {};
            
            
            
  };

