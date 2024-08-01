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
  let { ihash; nhash; thash; phash; calcHash } = Map;
  
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

// key: articleId, value: array of principalIds who've commented on the article. 
stable var articleCommenters = Map.new<Text, [Principal]>();

// key: principalId, value: array of notificationIds
stable var principalToNotificationId = Map.new<Principal, [Text]>();
// key: notificationId, value: notificationType
stable var notificationIdToNotificationType = Map.new<Text, NotificationType>();
// key: notificationId, value: timestamp
stable var notificationIdToTimestamp = Map.new<Text, Text>();
// key: notificationId, value: read
stable var notificationIdToRead = Map.new<Text, Bool>();
// key: notificationId, value: notificationContent
stable var NIDtoURL = Map.new<Text, Text>();
stable var NIDtoSenderPrincipal = Map.new<Text, Principal>();
stable var NIDtoReceiverPrincipal = Map.new<Text, Principal>();
stable var NIDtoTags = Map.new<Text, [Text]>();
stable var NIDtoArticleId = Map.new<Text, Text>();
stable var NIDtoArticleTitle = Map.new<Text, Text>();
stable var NIDtoAuthorPrincipal = Map.new<Text, Principal>();
stable var NIDtoIsAuthorPublication = Map.new<Text, Bool>();
stable var NIDtoComment = Map.new<Text, Text>();
stable var NIDtoIsReply = Map.new<Text, Bool>();
stable var NIDtoCommenterPrincipal = Map.new<Text, Principal>();
stable var NIDtoPurchaserPrincipal = Map.new<Text, Principal>();
// stable var NIDtoClaimed = Map.new<Text, ClaimStatus>();
stable var NIDtoFollowerUrl = Map.new<Text, Text>();
stable var NIDtoFollowerPrincipal = Map.new<Text, Principal>();
stable var NIDtoPostUrl = Map.new<Text, Text>();
stable var NIDtoRecieverIsPublication = Map.new<Text, Bool>();
stable var NIDtoTipAmount = Map.new<Text, Text>();
stable var NIDtoToken = Map.new<Text, Text>();
stable var NIDtoTime = Map.new<Text, Text>();
stable var NIDtoSubscriberPrincipal = Map.new<Text, Principal>();

// helper/utility funcs

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

private func createNewNotificationObject(notificationType: NotificationType, content: NotificationContent) : Notifications {
    {
        id = Nat.toText(notificationId);
        notificationType = notificationType;
        content = content;
        timestamp = Int.toText(Time.now());
        read = false;
    }
};



private func getTags(notification: NotificationContent) : [Text] {
    switch (notification) {
        case (#PostNotificationContent {tags = t}) { t };
        case (#CommentNotificationContent {tags = t}) { t };
        case (#NewArticleNotificationContent {tags = t}) { t };
        case _ { [] };
    }
};


private func getAuthorPrincipal(notification: NotificationContent) : Principal {
    switch (notification) {
        case (#PostNotificationContent {authorPrincipal = ap}) { ap };
        case (#PremiumArticleSoldNotificationContent {authorPrincipal = ap}) { ap };
        case (#CommentNotificationContent {authorPrincipal = ap}) { ap };
        case (#NewFollowerNotificationContent {authorPrincipal = ap}) { ap };
        case (#NewArticleNotificationContent {authorPrincipal = ap}) { ap };
        case (#TipRecievedNotificationContent {senderPrincipal = sp}) { sp };
        case _ { ANONYMOUS_PRINCIPAL };
    }
};


private func getSenderPrincipal(notification: NotificationContent) : Principal {
    switch (notification) {
        case (#PremiumArticleSoldNotificationContent {purchaserPrincipal = pp}) { pp };
        case (#CommentNotificationContent {commenterPrincipal = cp}) { cp };
        case (#NewFollowerNotificationContent {followerPrincipal = fp}) { fp };
        case (#NewArticleNotificationContent {authorPrincipal = ap}) { ap };
        case (#AuthorExpiredSubscriptionNotificationContent {subscriberPrincipal = sp}) { sp };
        case (#TipRecievedNotificationContent {senderPrincipal = sp}) { sp };
        case _ { ANONYMOUS_PRINCIPAL };
    }
};



private func modifyContent(content: NotificationContent, updatedFields: { 
    url: ?Text; 
    senderPrincipal: ?Principal; 
    receiverPrincipal: ?Principal; 
    tags: ?[Text]; 
    articleId: ?Text; 
    articleTitle: ?Text; 
    authorPrincipal: ?Principal; 
    isAuthorPublication: ?Bool;
    comment: ?Text;
    isReply: ?Bool;
    commenterPrincipal: ?Principal;
    purchaserPrincipal: ?Principal;
    // claimed: ?ClaimStatus; 
    followerUrl: ?Text;
    followerPrincipal: ?Principal;
    postUrl: ?Text;
    recieverIsPublication: ?Bool;
    tipAmount: ?Text;
    token: ?Text;
    time: ?Text;
    subscriberPrincipal: ?Principal;
}) : Result.Result<NotificationContent, Text> {

    func updateField<T>(original: T, updated: ?T) : T {
        switch (updated) {
            case (?value) { value };
            case null { original };
        }
    };

    switch (content) {
        case (#PostNotificationContent(postNotificationContent)) {
            return #ok(#PostNotificationContent{
                url = updateField(postNotificationContent.url, updatedFields.url);
                receiverPrincipal = updateField(postNotificationContent.receiverPrincipal, updatedFields.receiverPrincipal);
                tags = updateField(postNotificationContent.tags, updatedFields.tags);
                articleId = updateField(postNotificationContent.articleId, updatedFields.articleId);
                articleTitle = updateField(postNotificationContent.articleTitle, updatedFields.articleTitle);
                authorPrincipal = updateField(postNotificationContent.authorPrincipal, updatedFields.authorPrincipal);
                isAuthorPublication = updateField(postNotificationContent.isAuthorPublication, updatedFields.isAuthorPublication);
            });
        };
        case (#PremiumArticleSoldNotificationContent(premiumArticleSoldNotificationContent)) {
            return #ok(#PremiumArticleSoldNotificationContent{
                url = updateField(premiumArticleSoldNotificationContent.url, updatedFields.url);
                purchaserPrincipal = updateField(premiumArticleSoldNotificationContent.purchaserPrincipal, updatedFields.purchaserPrincipal);
                articleId = updateField(premiumArticleSoldNotificationContent.articleId, updatedFields.articleId);
                articleTitle = updateField(premiumArticleSoldNotificationContent.articleTitle, updatedFields.articleTitle);
                authorPrincipal = updateField(premiumArticleSoldNotificationContent.authorPrincipal, updatedFields.authorPrincipal);
                isAuthorPublication = updateField(premiumArticleSoldNotificationContent.isAuthorPublication, updatedFields.isAuthorPublication);
            });
        };
        case (#CommentNotificationContent(CommentNotificationContent)) {
            return #ok(#CommentNotificationContent{
                url = updateField(CommentNotificationContent.url, updatedFields.url);
                articleId = updateField(CommentNotificationContent.articleId, updatedFields.articleId);
                articleTitle = updateField(CommentNotificationContent.articleTitle, updatedFields.articleTitle);
                authorPrincipal = updateField(CommentNotificationContent.authorPrincipal, updatedFields.authorPrincipal);
                isAuthorPublication = updateField(CommentNotificationContent.isAuthorPublication, updatedFields.isAuthorPublication);
                comment = updateField(CommentNotificationContent.comment, updatedFields.comment);
                isReply = updateField(CommentNotificationContent.isReply, updatedFields.isReply);
                commenterPrincipal = updateField(CommentNotificationContent.commenterPrincipal, updatedFields.commenterPrincipal);
                tags = updateField(CommentNotificationContent.tags, updatedFields.tags);
            });
        };
        case (#NewFollowerNotificationContent(newFollowerNotificationContent)) {
            return #ok(#NewFollowerNotificationContent{
                followerUrl = updateField(newFollowerNotificationContent.followerUrl, updatedFields.followerUrl);
                followerPrincipal = updateField(newFollowerNotificationContent.followerPrincipal, updatedFields.followerPrincipal);
                authorPrincipal = updateField(newFollowerNotificationContent.authorPrincipal, updatedFields.authorPrincipal);
            });
        };
        case (#FaucetClaimAvailableNotificationContent(faucetClaimAvailableNotificationContent)) {
            return #ok(#FaucetClaimAvailableNotificationContent{
                receiverPrincipal = updateField(faucetClaimAvailableNotificationContent.receiverPrincipal, updatedFields.receiverPrincipal);
            });
        };
        case (#NewArticleNotificationContent(newArticleNotificationContent)) {
            return #ok(#NewArticleNotificationContent{
                url = updateField(newArticleNotificationContent.url, updatedFields.url);
                articleId = updateField(newArticleNotificationContent.articleId, updatedFields.articleId);
                articleTitle = updateField(newArticleNotificationContent.articleTitle, updatedFields.articleTitle);
                authorPrincipal = updateField(newArticleNotificationContent.authorPrincipal, updatedFields.authorPrincipal);
                isAuthorPublication = updateField(newArticleNotificationContent.isAuthorPublication, updatedFields.isAuthorPublication);
                tags = updateField(newArticleNotificationContent.tags, updatedFields.tags);
            });
        };
        case (#TipRecievedNotificationContent(tipRecievedNotificationContent)) {
            return #ok(#TipRecievedNotificationContent{
                postUrl = updateField(tipRecievedNotificationContent.postUrl, updatedFields.postUrl);
                articleId = updateField(tipRecievedNotificationContent.articleId, updatedFields.articleId);
                articleTitle = updateField(tipRecievedNotificationContent.articleTitle, updatedFields.articleTitle);
                receiverPrincipal = updateField(tipRecievedNotificationContent.receiverPrincipal, updatedFields.receiverPrincipal);
                recieverIsPublication = updateField(tipRecievedNotificationContent.recieverIsPublication, updatedFields.recieverIsPublication);
                senderPrincipal = updateField(tipRecievedNotificationContent.senderPrincipal, updatedFields.senderPrincipal);
                tipAmount = updateField(tipRecievedNotificationContent.tipAmount, updatedFields.tipAmount);
                token = updateField(tipRecievedNotificationContent.token, updatedFields.token);
            });
        };
        case (#AuthorExpiredSubscriptionNotificationContent(authorExpiredSubscriptionNotificationContent)) {
            return #ok(#AuthorExpiredSubscriptionNotificationContent{
                authorPrincipal = updateField(authorExpiredSubscriptionNotificationContent.authorPrincipal, updatedFields.authorPrincipal);
                subscriberPrincipal = updateField(authorExpiredSubscriptionNotificationContent.subscriberPrincipal, updatedFields.subscriberPrincipal);
                time = updateField(authorExpiredSubscriptionNotificationContent.time, updatedFields.time);
            });
        };
        case _ {
            return #err("Invalid notification type passed to modifyContent func");
        };
    };
};



//utility functions




func filterForNotificationSettings(n : ?NotificationType, caller: Principal) : Bool {

    let settings = Map.get(userNotificationSettings, phash, caller);
    
     switch (settings) {
        case null {
          return true;

        };
        case (?settings) {
     switch (n) {
        case (?#NewCommentOnMyArticle) {
          return settings.newCommentOnMyArticle;
        };
        case (?#NewCommentOnFollowedArticle) {
          return settings.newCommentOnFollowedArticle;
        };
        case (?#NewArticleByFollowedWriter) {
          return settings.newArticleByFollowedWriter;
        };
        case (?#NewArticleByFollowedTag) {
          return settings.newArticleByFollowedTag;
        };
        case (?#NewFollower) {
          return settings.newFollower;
        };
        case (?#TipReceived) {
         return settings.tipReceived;
        };
        case (?#PremiumArticleSold) {
          return settings.premiumArticleSold;
        };
        case (?#AuthorGainsNewSubscriber) {
          return settings.authorGainsNewSubscriber;
        };
        case (?#YouSubscribedToAuthor) {
          return settings.youSubscribedToAuthor;
        };
        case (?#AuthorLosesSubscriber) {
          return settings.authorLosesSubscriber;
        };
        case (?#YouUnsubscribedFromAuthor) {
          return settings.youUnsubscribedFromAuthor;
        };
        case (?#AuthorExpiredSubscription) {
          return settings.authorExpiredSubscription;
        };
        case (?#ReaderExpiredSubscription) {
          return settings.readerExpiredSubscription;
        };
        case (?#FaucetClaimAvailable){
          return settings.faucetClaimAvailable;
        };
        case _ {
          return false;
        };
     };
    };
  };
};

    func sortNotificationsById(a: Text, b: Text): Order.Order {
    if (U.textToNat(a) < U.textToNat(b)) {
      return #less;
    } else if (U.textToNat(a) > U.textToNat(b)) {
      return #greater;
    } else {
      return #equal;
    }
  };




private func buildContent(notificationId: Text): NotificationContent {
    // First check notification type
    let notificationType = switch (Map.get(notificationIdToNotificationType, thash, notificationId)) {
        case (?value) { value };
        case null { #UnknownNotificationType };
    };
    
    // Then build content based on notification type
    switch (notificationType : NotificationType) {
        case (#NewArticleByFollowedWriter) {
            let url = Map.get(NIDtoURL, thash, notificationId);
            let receiverPrincipal = Map.get(NIDtoReceiverPrincipal, thash, notificationId);
            let tags = Map.get(NIDtoTags, thash, notificationId);
            let articleId = Map.get(NIDtoArticleId, thash, notificationId);
            let articleTitle = Map.get(NIDtoArticleTitle, thash, notificationId);
            let authorPrincipal = Map.get(NIDtoAuthorPrincipal, thash, notificationId);
            let isAuthorPublication = Map.get(NIDtoIsAuthorPublication, thash, notificationId);
            #PostNotificationContent{
                url = switch (url) {
                    case (?value) { value };
                    case null { "" };
                };
                receiverPrincipal = switch (receiverPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                tags = switch (tags) {
                    case (?value) { value };
                    case null { [] };
                };
                articleId = switch (articleId) {
                    case (?value) { value };
                    case null { "" };
                };
                articleTitle = switch (articleTitle) {
                    case (?value) { value };
                    case null { "" };
                };
                authorPrincipal = switch (authorPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                isAuthorPublication = switch (isAuthorPublication) {
                    case (?value) { value };
                    case null { false };
                };
            };
        };
       case (#NewCommentOnMyArticle) {
            let url = Map.get(NIDtoURL, thash, notificationId);
            let receiverPrincipal = Map.get(NIDtoReceiverPrincipal, thash, notificationId);
            let tags = Map.get(NIDtoTags, thash, notificationId);
            let articleId = Map.get(NIDtoArticleId, thash, notificationId);
            let articleTitle = Map.get(NIDtoArticleTitle, thash, notificationId);
            let authorPrincipal = Map.get(NIDtoAuthorPrincipal, thash, notificationId);
            let isAuthorPublication = Map.get(NIDtoIsAuthorPublication, thash, notificationId);
            let comment = Map.get(NIDtoComment, thash, notificationId);
            let isReply = Map.get(NIDtoIsReply, thash, notificationId);
            let commenterPrincipal = Map.get(NIDtoCommenterPrincipal, thash, notificationId);
            #CommentNotificationContent{
                url = switch (url) {
                    case (?value) { value };
                    case null { "" };
                };
                articleId = switch (articleId) {
                    case (?value) { value };
                    case null { "" };
                };
                articleTitle = switch (articleTitle) {
                    case (?value) { value };
                    case null { "" };
                };
                authorPrincipal = switch (authorPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                isAuthorPublication = switch (isAuthorPublication) {
                    case (?value) { value };
                    case null { false };
                };
                comment = switch (comment) {
                    case (?value) { value };
                    case null { "" };
                };
                isReply = switch (isReply) {
                    case (?value) { value };
                    case null { false };
                };
                commenterPrincipal = switch (commenterPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                tags = switch (tags) {
                    case (?value) { value };
                    case null { [] };
                };
            };
        };
        case (#NewCommentOnFollowedArticle) { 
            let url = Map.get(NIDtoURL, thash, notificationId);
            let receiverPrincipal = Map.get(NIDtoReceiverPrincipal, thash, notificationId);
            let tags = Map.get(NIDtoTags, thash, notificationId);
            let articleId = Map.get(NIDtoArticleId, thash, notificationId);
            let articleTitle = Map.get(NIDtoArticleTitle, thash, notificationId);
            let authorPrincipal = Map.get(NIDtoAuthorPrincipal, thash, notificationId);
            let isAuthorPublication = Map.get(NIDtoIsAuthorPublication, thash, notificationId);
            let comment = Map.get(NIDtoComment, thash, notificationId);
            let isReply = Map.get(NIDtoIsReply, thash, notificationId);
            let commenterPrincipal = Map.get(NIDtoCommenterPrincipal, thash, notificationId);
            #CommentNotificationContent{
                url = switch (url) {
                    case (?value) { value };
                    case null { "" };
                };
                articleId = switch (articleId) {
                    case (?value) { value };
                    case null { "" };
                };
                articleTitle = switch (articleTitle) {
                    case (?value) { value };
                    case null { "" };
                };
                authorPrincipal = switch (authorPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                isAuthorPublication = switch (isAuthorPublication) {
                    case (?value) { value };
                    case null { false };
                };
                comment = switch (comment) {
                    case (?value) { value };
                    case null { "" };
                };
                isReply = switch (isReply) {
                    case (?value) { value };
                    case null { false };
                };
                commenterPrincipal = switch (commenterPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                tags = switch (tags) {
                    case (?value) { value };
                    case null { [] };
                };
            };
        };
        case (#NewArticleByFollowedTag) {
            let url = Map.get(NIDtoURL, thash, notificationId);
            let receiverPrincipal = Map.get(NIDtoReceiverPrincipal, thash, notificationId);
            let tags = Map.get(NIDtoTags, thash, notificationId);
            let articleId = Map.get(NIDtoArticleId, thash, notificationId);
            let articleTitle = Map.get(NIDtoArticleTitle, thash, notificationId);
            let authorPrincipal = Map.get(NIDtoAuthorPrincipal, thash, notificationId);
            let isAuthorPublication = Map.get(NIDtoIsAuthorPublication, thash, notificationId);
            #PostNotificationContent{
                url = switch (url) {
                    case (?value) { value };
                    case null { "" };
                };
                receiverPrincipal = switch (receiverPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                tags = switch (tags) {
                    case (?value) { value };
                    case null { [] };
                };
                articleId = switch (articleId) {
                    case (?value) { value };
                    case null { "" };
                };
                articleTitle = switch (articleTitle) {
                    case (?value) { value };
                    case null { "" };
                };
                authorPrincipal = switch (authorPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                isAuthorPublication = switch (isAuthorPublication) {
                    case (?value) { value };
                    case null { false };
                };
            };
        };
        case (#NewFollower) {
            let followerUrl = Map.get(NIDtoFollowerUrl, thash, notificationId);
            let followerPrincipal = Map.get(NIDtoFollowerPrincipal, thash, notificationId);
            let authorPrincipal = Map.get(NIDtoAuthorPrincipal, thash, notificationId);
            #NewFollowerNotificationContent{
                followerUrl = switch (followerUrl) {
                    case (?value) { value };
                    case null { "" };
                };
                followerPrincipal = switch (followerPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                authorPrincipal = switch (authorPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
            };
        };
        case (#TipReceived) {
            let postUrl = Map.get(NIDtoPostUrl, thash, notificationId);
            let articleId = Map.get(NIDtoArticleId, thash, notificationId);
            let articleTitle = Map.get(NIDtoArticleTitle, thash, notificationId);
            let receiverPrincipal = Map.get(NIDtoReceiverPrincipal, thash, notificationId);
            let recieverIsPublication = Map.get(NIDtoRecieverIsPublication, thash, notificationId);
            let senderPrincipal = Map.get(NIDtoSenderPrincipal, thash, notificationId);
            let tipAmount = Map.get(NIDtoTipAmount, thash, notificationId);
            let token = Map.get(NIDtoToken, thash, notificationId);
            #TipRecievedNotificationContent{
                postUrl = switch (postUrl) {
                    case (?value) { value };
                    case null { "" };
                };
                articleId = switch (articleId) {
                    case (?value) { value };
                    case null { "" };
                };
                articleTitle = switch (articleTitle) {
                    case (?value) { value };
                    case null { "" };
                };
                receiverPrincipal = switch (receiverPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                recieverIsPublication = switch (recieverIsPublication) {
                    case (?value) { value };
                    case null { false };
                };
                senderPrincipal = switch (senderPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                tipAmount = switch (tipAmount) {
                    case (?value) { value };
                    case null { "" };
                };
                token = switch (token) {
                    case (?value) { value };
                    case null { "" };
                };
            };
        };
        case (#PremiumArticleSold) {
            let url = Map.get(NIDtoURL, thash, notificationId);
            let purchaserPrincipal = Map.get(NIDtoPurchaserPrincipal, thash, notificationId);
            let articleId = Map.get(NIDtoArticleId, thash, notificationId);
            let articleTitle = Map.get(NIDtoArticleTitle, thash, notificationId);
            let authorPrincipal = Map.get(NIDtoAuthorPrincipal, thash, notificationId);
            let isAuthorPublication = Map.get(NIDtoIsAuthorPublication, thash, notificationId);
            #PremiumArticleSoldNotificationContent{
                url = switch (url) {
                    case (?value) { value };
                    case null { "" };
                };
                purchaserPrincipal = switch (purchaserPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                articleId = switch (articleId) {
                    case (?value) { value };
                    case null { "" };
                };
                articleTitle = switch (articleTitle) {
                    case (?value) { value };
                    case null { "" };
                };
                authorPrincipal = switch (authorPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                isAuthorPublication = switch (isAuthorPublication) {
                    case (?value) { value };
                    case null { false };
                };
            };
        };
        case (#AuthorGainsNewSubscriber) {
            let authorPrincipal = Map.get(NIDtoAuthorPrincipal, thash, notificationId);
            let subscriberPrincipal = Map.get(NIDtoSubscriberPrincipal, thash, notificationId);
            let time = Map.get(NIDtoTime, thash, notificationId);
            #AuthorGainsNewSubscriberNotificationContent{
             
                authorPrincipal = switch (authorPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                subscriberPrincipal = switch (subscriberPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                time = switch (time) {
                    case (?value) { value };
                    case null { "" };
                };
            };
        };
        case (#AuthorLosesSubscriber) {
            let authorPrincipal = Map.get(NIDtoAuthorPrincipal, thash, notificationId);
            let subscriberPrincipal = Map.get(NIDtoSubscriberPrincipal, thash, notificationId);
            let time = Map.get(NIDtoTime, thash, notificationId);
            #AuthorLosesSubscriberNotificationContent{
               
                authorPrincipal = switch (authorPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                subscriberPrincipal = switch (subscriberPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
              
                time = switch (time) {
                    case (?value) { value };
                    case null { "" };
                };
            };
        };
        case (#YouSubscribedToAuthor) {
            let authorPrincipal = Map.get(NIDtoAuthorPrincipal, thash, notificationId);
            let subscriberPrincipal = Map.get(NIDtoSubscriberPrincipal, thash, notificationId);
            let time = Map.get(NIDtoTime, thash, notificationId);
            #YouSubscribedToAuthorNotificationContent{
               
              
                authorPrincipal = switch (authorPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                subscriberPrincipal = switch (subscriberPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
               
                time = switch (time) {
                    case (?value) { value };
                    case null { "" };
                };
            };
        };

        case (#YouUnsubscribedFromAuthor) {
            let authorPrincipal = Map.get(NIDtoAuthorPrincipal, thash, notificationId);
            let subscriberPrincipal = Map.get(NIDtoSubscriberPrincipal, thash, notificationId);
            let time = Map.get(NIDtoTime, thash, notificationId);
            #YouUnsubscribedFromAuthorNotificationContent{
               
                authorPrincipal = switch (authorPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                subscriberPrincipal = switch (subscriberPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                
                time = switch (time) {
                    case (?value) { value };
                    case null { "" };
                };
            };
        };

        case (#AuthorExpiredSubscription) {
            let authorPrincipal = Map.get(NIDtoAuthorPrincipal, thash, notificationId);
            let subscriberPrincipal = Map.get(NIDtoSubscriberPrincipal, thash, notificationId);
            let time = Map.get(NIDtoTime, thash, notificationId);
            #AuthorExpiredSubscriptionNotificationContent{
                
                authorPrincipal = switch (authorPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                subscriberPrincipal = switch (subscriberPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                
                time = switch (time) {
                    case (?value) { value };
                    case null { "" };
                };
            };
        };

        case (#ReaderExpiredSubscription) {
            let authorPrincipal = Map.get(NIDtoAuthorPrincipal, thash, notificationId);
            let subscriberPrincipal = Map.get(NIDtoSubscriberPrincipal, thash, notificationId);
            let time = Map.get(NIDtoTime, thash, notificationId);
            #ReaderExpiredSubscriptionNotificationContent{
              
                authorPrincipal = switch (authorPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
                subscriberPrincipal = switch (subscriberPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
               
                time = switch (time) {
                    case (?value) { value };
                    case null { "" };
                };
            };
        };

        case (#FaucetClaimAvailable) {
            let receiverPrincipal = Map.get(NIDtoReceiverPrincipal, thash, notificationId);
            #FaucetClaimAvailableNotificationContent{
                receiverPrincipal = switch (receiverPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };
               
            };
        };
        case _ {
          let receiverPrincipal = Map.get(NIDtoReceiverPrincipal, thash, notificationId);
            #FaucetClaimAvailableNotificationContent{
                receiverPrincipal = switch (receiverPrincipal) {
                    case (?value) { value };
                    case null { ANONYMOUS_PRINCIPAL };
                };

        };
    };
};
};


private func generateContent(notificationContent: NotificationContent): NotificationContent {
        switch (notificationContent) {
            case (#PostNotificationContent(content)) {
                #PostNotificationContent {
                    url = content.url;
                    receiverPrincipal = content.receiverPrincipal;
                    tags = content.tags;
                    articleId = content.articleId;
                    articleTitle = content.articleTitle;
                    authorPrincipal = content.authorPrincipal;
                    isAuthorPublication = content.isAuthorPublication;
                };
            };
            case (#CommentNotificationContent(content)) {
                #CommentNotificationContent {
                    url = content.url;
                    articleId = content.articleId;
                    articleTitle = content.articleTitle;
                    authorPrincipal = content.authorPrincipal;
                    isAuthorPublication = content.isAuthorPublication;
                    comment = content.comment;
                    isReply = content.isReply;
                    commenterPrincipal = content.commenterPrincipal;
                    tags = content.tags;
                };
            };
            case (#NewFollowerNotificationContent(content)) {
                #NewFollowerNotificationContent {
                    followerUrl = content.followerUrl;
                    followerPrincipal = content.followerPrincipal;
                    authorPrincipal = content.authorPrincipal;
                };
            };
            case (#FaucetClaimAvailableNotificationContent(content)) {
                #FaucetClaimAvailableNotificationContent {
                    receiverPrincipal = content.receiverPrincipal;
                   
                };
            };
            case (#TipRecievedNotificationContent(content)) {
                #TipRecievedNotificationContent {
                    postUrl = content.postUrl;
                    articleId = content.articleId;
                    articleTitle = content.articleTitle;
                    receiverPrincipal = content.receiverPrincipal;
                    recieverIsPublication = content.recieverIsPublication;
                    senderPrincipal = content.senderPrincipal;
                    tipAmount = content.tipAmount;
                    token = content.token;
                };
            };
            case (#PremiumArticleSoldNotificationContent(content)) {
                #PremiumArticleSoldNotificationContent {
                    url = content.url;
                    purchaserPrincipal = content.purchaserPrincipal;
                    articleId = content.articleId;
                    articleTitle = content.articleTitle;
                    authorPrincipal = content.authorPrincipal;
                    isAuthorPublication = content.isAuthorPublication;
                };
            };
            case (#AuthorGainsNewSubscriberNotificationContent(content)) {
                #AuthorGainsNewSubscriberNotificationContent {
                    authorPrincipal = content.authorPrincipal;
                    subscriberPrincipal = content.subscriberPrincipal;
                    time = content.time;
                };
            };
            case (#AuthorLosesSubscriberNotificationContent(content)) {
                #AuthorLosesSubscriberNotificationContent {
                    authorPrincipal = content.authorPrincipal;
                    subscriberPrincipal = content.subscriberPrincipal;
                    time = content.time;
                };
            };
            case (#YouSubscribedToAuthorNotificationContent(content)) {
                #YouSubscribedToAuthorNotificationContent {
                    authorPrincipal = content.authorPrincipal;
                    subscriberPrincipal = content.subscriberPrincipal;
                    time = content.time;
                };
            };
            case (#YouUnsubscribedFromAuthorNotificationContent(content)) {
                #YouUnsubscribedFromAuthorNotificationContent {
                    authorPrincipal = content.authorPrincipal;
                    subscriberPrincipal = content.subscriberPrincipal;
                    time = content.time;
                };
            };
            
            case (#AuthorExpiredSubscriptionNotificationContent(content)) {
                #AuthorExpiredSubscriptionNotificationContent {
                    authorPrincipal = content.authorPrincipal;
                    subscriberPrincipal = content.subscriberPrincipal;
                    time = content.time;
                };
            };
            case (#ReaderExpiredSubscriptionNotificationContent(content)) {
                #ReaderExpiredSubscriptionNotificationContent {
                    authorPrincipal = content.authorPrincipal;
                    subscriberPrincipal = content.subscriberPrincipal;
                    time = content.time;
                };
            };
            case _ {
                notificationContent;
            };
        }
    };

    private func getReciever(notification: Notifications) : Principal {
      let receiver = switch (notification.content) {
        case (#PostNotificationContent {receiverPrincipal = rp}) { rp };
        case (#PremiumArticleSoldNotificationContent {authorPrincipal = ap}) { ap };
        case (#NewFollowerNotificationContent {authorPrincipal = ap}) { ap };
        case (#FaucetClaimAvailableNotificationContent {receiverPrincipal = rp}) { rp };
        case (#TipRecievedNotificationContent {receiverPrincipal = rp}) { rp };
        case (#CommentNotificationContent {authorPrincipal = ap}) {switch (notification.notificationType) {
          case (#NewCommentOnMyArticle) { ap };
          case (#NewCommentOnFollowedArticle) { ANONYMOUS_PRINCIPAL }; // should be handled with commentBroadcast
          case _ {return ANONYMOUS_PRINCIPAL; };//should be a comment type
        };};
        
        case (#AuthorGainsNewSubscriberNotificationContent {authorPrincipal = ap}) { ap };
        case (#YouSubscribedToAuthorNotificationContent {subscriberPrincipal = sp}) { sp };
        case (#AuthorLosesSubscriberNotificationContent {authorPrincipal = ap}) { ap };
        case (#YouUnsubscribedFromAuthorNotificationContent {subscriberPrincipal = sp}) { sp };
        case (#AuthorExpiredSubscriptionNotificationContent {authorPrincipal = ap}) { ap };
        case (#ReaderExpiredSubscriptionNotificationContent {subscriberPrincipal = sp}) { sp };
        case (#NewArticleNotificationContent {} ) {return ANONYMOUS_PRINCIPAL; };
      };
    };


    private func saveNotification(notification: Notifications, receiverPID: Principal) {
      
      var receiver = receiverPID;

      if (receiver == ANONYMOUS_PRINCIPAL) {
       receiver := getReciever(notification);
      };

      notificationId := notificationId + 1;

      func saveIdsToPrincipal (notificationId: Text) {
          let currentNotificationIds = switch (Map.get(principalToNotificationId, phash, receiver)) {
              case (?value) { value };
              case null { [] };
          };

          let notificationIdsBuffer = Buffer.Buffer<Text>(0);
          for (notificationId in Iter.fromArray(currentNotificationIds)) {
              if (notificationId != notification.id){
              notificationIdsBuffer.add(notificationId);
              };
          };

          notificationIdsBuffer.add(notification.id);
          Map.set(principalToNotificationId, phash, receiver, Buffer.toArray(notificationIdsBuffer));
      };



     //save id, type, timestamp, read
     Map.set(notificationIdToNotificationType, thash, notification.id, notification.notificationType);
     Map.set(notificationIdToTimestamp, thash, notification.id, notification.timestamp);
     Map.set(notificationIdToRead, thash, notification.id, notification.read);
     saveIdsToPrincipal(notification.id);


      //save content
      let content = generateContent(notification.content);

      switch (content) {
          case (#PostNotificationContent(content)) {
             Map.set(NIDtoURL, thash, notification.id, content.url);
             Map.set(NIDtoReceiverPrincipal, thash, notification.id, content.receiverPrincipal);
             Map.set(NIDtoTags, thash, notification.id, content.tags);
             Map.set(NIDtoArticleId, thash, notification.id, content.articleId);
             Map.set(NIDtoArticleTitle, thash, notification.id, content.articleTitle);
             Map.set(NIDtoAuthorPrincipal, thash, notification.id, content.authorPrincipal);
             Map.set(NIDtoIsAuthorPublication, thash, notification.id, content.isAuthorPublication);
          };
          case (#CommentNotificationContent(content)) {
             Map.set(NIDtoURL, thash, notification.id, content.url);
             Map.set(NIDtoArticleId, thash, notification.id, content.articleId);
             Map.set(NIDtoArticleTitle, thash, notification.id, content.articleTitle);
             Map.set(NIDtoAuthorPrincipal, thash, notification.id, content.authorPrincipal);
             Map.set(NIDtoIsAuthorPublication, thash, notification.id, content.isAuthorPublication);
             Map.set(NIDtoComment, thash, notification.id, content.comment);
             Map.set(NIDtoIsReply, thash, notification.id, content.isReply);
             Map.set(NIDtoCommenterPrincipal, thash, notification.id, content.commenterPrincipal);
             Map.set(NIDtoTags, thash, notification.id, content.tags);
                      };
          case (#NewFollowerNotificationContent(content)) {
             Map.set(NIDtoFollowerUrl, thash, notification.id, content.followerUrl);
             Map.set(NIDtoFollowerPrincipal, thash, notification.id, content.followerPrincipal);
             Map.set(NIDtoAuthorPrincipal, thash, notification.id, content.authorPrincipal);
            
          };
          case (#FaucetClaimAvailableNotificationContent(content)) {
             Map.set(NIDtoReceiverPrincipal, thash, notification.id, content.receiverPrincipal);

          };
          case (#TipRecievedNotificationContent(content)) {
             Map.set(NIDtoPostUrl, thash, notification.id, content.postUrl);
             Map.set(NIDtoArticleId, thash, notification.id, content.articleId);
             Map.set(NIDtoArticleTitle,thash, notification.id, content.articleTitle);
             Map.set(NIDtoReceiverPrincipal, thash, notification.id, content.receiverPrincipal);
             Map.set(NIDtoRecieverIsPublication, thash, notification.id, content.recieverIsPublication);
             Map.set(NIDtoSenderPrincipal, thash, notification.id, content.senderPrincipal);
             Map.set(NIDtoTipAmount, thash, notification.id, content.tipAmount);
             Map.set(NIDtoToken, thash, notification.id, content.token);

          };
          case (#PremiumArticleSoldNotificationContent(content)) {
             Map.set(NIDtoURL, thash, notification.id, content.url);
             Map.set(NIDtoPurchaserPrincipal, thash, notification.id, content.purchaserPrincipal);
             Map.set(NIDtoArticleId, thash, notification.id, content.articleId);
             Map.set(NIDtoArticleTitle, thash, notification.id, content.articleTitle);
             Map.set(NIDtoAuthorPrincipal, thash, notification.id, content.authorPrincipal);
             Map.set(NIDtoIsAuthorPublication, thash, notification.id, content.isAuthorPublication);

          };
          case (#AuthorGainsNewSubscriberNotificationContent(content)) {
             Map.set(NIDtoAuthorPrincipal, thash, notification.id, content.authorPrincipal);
             Map.set(NIDtoSubscriberPrincipal, thash, notification.id, content.subscriberPrincipal);
             Map.set(NIDtoTime, thash, notification.id, content.time);

          };
          case (#AuthorLosesSubscriberNotificationContent(content)) {
             Map.set(NIDtoAuthorPrincipal, thash, notification.id, content.authorPrincipal);
             Map.set(NIDtoSubscriberPrincipal, thash, notification.id, content.subscriberPrincipal);
             Map.set(NIDtoTime, thash, notification.id, content.time);

          };
          case (#YouSubscribedToAuthorNotificationContent(content)) {
             Map.set(NIDtoAuthorPrincipal, thash, notification.id, content.authorPrincipal);
             Map.set(NIDtoSubscriberPrincipal, thash, notification.id, content.subscriberPrincipal);
             Map.set(NIDtoTime, thash, notification.id, content.time);

          };
          case (#YouUnsubscribedFromAuthorNotificationContent(content)) {
             Map.set(NIDtoAuthorPrincipal, thash, notification.id, content.authorPrincipal);
             Map.set(NIDtoSubscriberPrincipal, thash, notification.id, content.subscriberPrincipal);
             Map.set(NIDtoTime, thash, notification.id, content.time);

          };
          case (#AuthorExpiredSubscriptionNotificationContent(content)) {
             Map.set(NIDtoAuthorPrincipal, thash, notification.id, content.authorPrincipal);
             Map.set(NIDtoSubscriberPrincipal, thash, notification.id, content.subscriberPrincipal);
             Map.set(NIDtoTime, thash, notification.id, content.time);

          };
          case (#ReaderExpiredSubscriptionNotificationContent(content)) {
             Map.set(NIDtoAuthorPrincipal, thash, notification.id, content.authorPrincipal);
             Map.set(NIDtoSubscriberPrincipal, thash, notification.id, content.subscriberPrincipal);
             Map.set(NIDtoTime, thash, notification.id, content.time);

          };
          case _ {};
      };
  };




///////////////////////////////////////////events///////////////////////////////////////////
//events are singular external/internal actions that trigger multiple notifications, ex. an article creates multiple notifications for followers of the writer and tags

//article events 
//todo make new article an event, rather than an external func
public shared ({caller}) func newArticle(notificationContents: NotificationContent) : async Result.Result<(), Text> {
    
    let notificationContent = generateContent(notificationContents);


    let authorPrincipal = getAuthorPrincipal(notificationContent);
    let userCanister = CanisterDeclarations.getUserCanister();
    let followers = await userCanister.getFollowersByPrincipalId(authorPrincipal);
    let followersBuffer = Buffer.Buffer<Text>(0);

    // Process followers of the writer
    for (f in Iter.fromArray(followers)) {
        followersBuffer.add(f.principal);
        let receiver = f;
        let newNotification = createNewNotificationObject(#NewArticleByFollowedWriter, notificationContent);
        
        saveNotification(newNotification, Principal.fromText(receiver.principal));
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
                    } else {
                        let receiver = f;
                        let newNotification = createNewNotificationObject(#NewArticleByFollowedTag, notificationContent);
                        if (Principal.fromText(receiver) != getAuthorPrincipal(notificationContent)) {
                           
                           saveNotification(newNotification, Principal.fromText(receiver));
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


//comment events 

func addCommentBroadcast (notification : Notifications) : async Result.Result<(), Text> {
  switch (notification.notificationType) {
    case (#NewCommentOnFollowedArticle) {
    
    
    //add sender to articleCommenters hashmap
    let articleId = switch (notification.content) {
        case (#CommentNotificationContent  {articleId = ai}) { ai };
        case _ { "" };
    };
    let sender = switch (notification.content) {
        case (#CommentNotificationContent  {commenterPrincipal = cp}) { cp };
        case _ { ANONYMOUS_PRINCIPAL };
    };

    let author = switch (notification.content) {
        case (#CommentNotificationContent  {authorPrincipal = ap}) { ap };
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
   
  case (_) {
    return #err("Comment broadcast notifications only supported for NewCommentOnFollowedArticle");
  };
  };
};

func distributeCommentNotification (notification : Notifications) : async Result.Result<(), Text> {
  switch (notification.notificationType) {
    case (#NewCommentOnFollowedArticle) {

  let articleId = switch (notification.content) {
      case (#CommentNotificationContent  {articleId = ai}) { ai };
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
              case (#CommentNotificationContent {commenterPrincipal = cp}) { cp };
              case _ { ANONYMOUS_PRINCIPAL};
          };

          let authorPrincipal = switch (notification.content) {
              case (#CommentNotificationContent  {authorPrincipal = ap}) { ap };
              case _ { ANONYMOUS_PRINCIPAL };
          };


              if (receiver != senderPrincipal and receiver != authorPrincipal) {
            saveNotification(newNotification,receiver);
              };
      };  

    
          let authorPrincipal = getAuthorPrincipal(notification.content);

          let commenterPrincipal = switch (notification.content) {
              case (#CommentNotificationContent { commenterPrincipal = cp }) { cp }; 
              case _ { ANONYMOUS_PRINCIPAL };
          };

            //special case
            //give the author a direct notification but only if they are not the sender
            if (authorPrincipal != commenterPrincipal) {
            switch (generateContent(notification.content)) {
                case (content) {
                    let notificationContent : NotificationContent = content;
                    let newNotification : Notifications = {
                        id = Nat.toText(notificationId);
                        notificationType = #NewCommentOnMyArticle;
                        content = notificationContent;
                        timestamp = Int.toText(Time.now());
                        read = false;
                    };
                     saveNotification(newNotification, getReciever(newNotification));
                    };
            };
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



//subscription events
public shared ({caller}) func disperseBulkSubscriptionNotifications(subscriptions: [(NotificationType, NotificationContent)]) : async Result.Result<(), Text> {
  if(not Text.equal(ENV.SUBSCRIPTION_CANISTER_ID, Principal.toText(caller))){
    Debug.print("disperseBulkSubscriptionNotifications: Unauthorized caller");
    return #err("Unauthorized");
  };

  for(subscription in Iter.fromArray(subscriptions)){
    Debug.print("disperseBulkSubscriptionNotifications: Processing subscription" # debug_show(subscription));
    switch(subscription){
      case(subscription){
       
     switch (createNotification(subscription.0, subscription.1)) {
      case (result) {};
     };
      };
    };
  };

  #ok()
};




public shared query ({caller}) func getUserNotifications(from : Text, to : Text) : async Result.Result<([Notifications], Nat), Text> {
    // Check for anonymous callers
    if (isAnonymous(caller)) {
        return #err("Cannot use this method anonymously.");
    };

    // Collect metrics
    canistergeekMonitor.collectMetrics();

    // Attempt to get user's notifications
    let notificationsArray = Map.get(principalToNotificationId, phash, caller);

    // Initialize a buffer for notifications
    var notificationIds = Buffer.Buffer<Text>(0);
    var notifications = Buffer.Buffer<Notifications>(0);
    
    // Process notifications
    switch (notificationsArray) {
        case null {};
        case (?notificationsArray) {
            for (n in Iter.fromArray(notificationsArray)) {
              // get notification type, then check if it is enabled in the user's settings //id to type map
                let notificationType = Map.get(notificationIdToNotificationType, thash, n);
                if (filterForNotificationSettings(notificationType, caller)) {
                  
                    notificationIds.add(n);
                };
            };
        };
    };

    // Sort notifications by ID
    notificationIds.sort(sortNotificationsById);
    let allNotifications = Array.reverse(Buffer.toArray(notificationIds));

    let fromIndex = U.textToNat(from);
    let toIndex = U.textToNat(to);

    var adjustedToIndex = toIndex;

    if (toIndex < Array.size(allNotifications)) {
        adjustedToIndex := toIndex + 1;
    } else {
        adjustedToIndex := Array.size(allNotifications);
    };

    let notificationsSlice = Iter.toArray(Array.slice(allNotifications, fromIndex, adjustedToIndex));

    func getNotificatonType(n : Text) : NotificationType {
        let notificationType = Map.get(notificationIdToNotificationType, thash, n);
        switch (notificationType) {
            case (?#NewCommentOnMyArticle) { return #NewCommentOnMyArticle };
            case (?#NewCommentOnFollowedArticle) { return #NewCommentOnFollowedArticle };
            case (?#NewArticleByFollowedWriter) { return #NewArticleByFollowedWriter };
            case (?#NewArticleByFollowedTag) { return #NewArticleByFollowedTag };
            case (?#NewFollower) { return #NewFollower };
            case (?#TipReceived) { return #TipReceived };
            case (?#PremiumArticleSold) { return #PremiumArticleSold };
            case (?#AuthorGainsNewSubscriber) { return #AuthorGainsNewSubscriber };
            case (?#YouSubscribedToAuthor) { return #YouSubscribedToAuthor };
            case (?#AuthorLosesSubscriber) { return #AuthorLosesSubscriber };
            case (?#YouUnsubscribedFromAuthor) { return #YouUnsubscribedFromAuthor };
            case (?#AuthorExpiredSubscription) { return #AuthorExpiredSubscription };
            case (?#ReaderExpiredSubscription) { return #ReaderExpiredSubscription };
            case (?#FaucetClaimAvailable) { return #FaucetClaimAvailable };
            case _ { return #UnknownNotificationType };
        };
    };

    func getNotificationTimestamp(n : Text) : Text {
        let notificationTimestamp = Map.get(notificationIdToTimestamp, thash, n);
        switch (notificationTimestamp) {
            case (?value) { value };
            case null { "" };
        };
    };

    func getNotificationIsRead(n : Text) : Bool {
        let notificationRead = Map.get(notificationIdToRead, thash, n);
        switch (notificationRead) {
            case (?value) { value };
            case null { false };
        };
    };

    //build notifications
    for (n in Iter.fromArray(notificationsSlice)) {
        let notificationType = getNotificatonType(n);
        let notificationContent = buildContent(n);
        let notificationTimestamp = getNotificationTimestamp(n);
        let notificationRead = getNotificationIsRead(n);
        let notification = {
            id = n;
            notificationType = notificationType;
            content = notificationContent;
            timestamp = notificationTimestamp;
            read = notificationRead;
        };
        notifications.add(notification);
    };

    
            return #ok((Buffer.toArray(notifications), Array.size(allNotifications)));
    
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
    switch (Map.put(notificationIdToRead, thash, notificationId, true)) {
        case (?value) {};
        case null {};
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

    let notificationContent = generateContent(content);

    canistergeekMonitor.collectMetrics();

    var notification = {
        id = Nat.toText(notificationId);
        notificationType = notificationType;
        content : NotificationContent = notificationContent;
        timestamp = Int.toText(Time.now());
        read = false;
    };
  

    switch (notificationType) {
        case (#NewCommentOnMyArticle) {saveNotification(notification, getReciever(notification));};
        case (#NewFollower) {saveNotification(notification, getReciever(notification));};
        case (#TipReceived) {saveNotification(notification, getReciever(notification));};
        case (#AuthorExpiredSubscription) {saveNotification(notification, getReciever(notification));};
        case (#FaucetClaimAvailable) {saveNotification(notification, getReciever(notification));};
        case (#ReaderExpiredSubscription) {saveNotification(notification, getReciever(notification));};
        case (#AuthorGainsNewSubscriber) {saveNotification(notification, getReciever(notification));};
        case (#YouSubscribedToAuthor) {saveNotification(notification, getReciever(notification));};
        case (#AuthorLosesSubscriber) {saveNotification(notification, getReciever(notification));};
        case (#YouUnsubscribedFromAuthor) {saveNotification(notification, getReciever(notification));};
        case (#UnknownNotificationType) {return #err("Unknown notification type");};
        case (#PremiumArticleSold) {
          //Currently the NFT canister sends its own canister address as the senderPrincipal
          //Handles cannot be generated from the sender principal until this is solved
       
          //get article details
            var url = "";
            var articleTitle = "";
            var tags = Buffer.Buffer<Text>(0);

            let articleId = switch (notification.content) {
            case (#PremiumArticleSoldNotificationContent {articleId = ai}) { ai };
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

            let updatedContent = modifyContent(content, { url = ?url; senderPrincipal = null; receiverPrincipal = null; tags = ?Buffer.toArray(tags); articleId = ?articleId; articleTitle = ?articleTitle; authorPrincipal = null; isAuthorPublication = null; comment = null; isReply = null; commenterPrincipal = null;  purchaserPrincipal = null; claimed = null; followerUrl = null; followerPrincipal = null; postUrl = null; recieverIsPublication = null; tipAmount = null; token = null; subscriberPrincipal = null; time = null });

            notification := {
                id = Nat.toText(notificationId);
                notificationType = notificationType;
                content = switch (updatedContent) {
                    case (#ok(content)) { content };
                    case (#err(err)) { return #err(err) };
                };
                timestamp = Int.toText(Time.now());
                read = false;
            };


           saveNotification(notification, getReciever(notification));
        };
        case (#NewCommentOnFollowedArticle) {
        
            switch (await addCommentBroadcast(notification)) {
                case (#ok()) {

                    switch (await distributeCommentNotification(notification)) {
                        case (#ok()) {
                            return #ok();
                        };
                        case (#err(err)) {

                            return #err("Distribution of notifications failed: " # err);
                        };
                    };
                };
                case (#err(err)) {

                    return #err( "Failed to addCommentBroadcast event: " # err);
                };
            };

        };
        case (#NewArticleByFollowedWriter) { return #err("use newArticle function for this notification type");};
        case (#NewArticleByFollowedTag) { return  #err("use newArticle function for this notification type");};
    };

    #ok();
};


//it can only be called by Subscription canister for now
public shared ({caller}) func  createNotifications(input: [(NotificationType, NotificationContent)]) : async Result.Result<(), Text> {
  if(not Text.equal(ENV.SUBSCRIPTION_CANISTER_ID, Principal.toText(caller))){
    return #err("Unauthorized");
  };
  for(notificationInput in input.vals()){
    switch (createNotification(notificationInput.0, notificationInput.1)) {
      case (result) {};
  };
  };

  #ok()
};

// #endregion
system func preupgrade() {};
system func postupgrade() {};
            
            
            
  };

