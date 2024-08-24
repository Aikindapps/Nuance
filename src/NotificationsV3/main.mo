import Debug "mo:base/Debug";
import Bool "mo:base/Bool";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Map "mo:hashmap/Map"; 
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Prelude "mo:base/Prelude";
import U "../shared/utils";
import Types "./types";
import UserTypes "../User/types";
import Canistergeek "../canistergeek/canistergeek";
import Cycles "mo:base/ExperimentalCycles";
import Prim "mo:prim";
import CanisterDeclarations "../shared/CanisterDeclarations";
import Versions "../shared/versions";
import ENV "../shared/env";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Order "mo:base/Order";
import Option "mo:base/Option";

actor Notifications {
  
  //data type aliases
  type UserNotificationSettings = Types.UserNotificationSettings;
  type Notification = Types.Notification;
  type NotificationTypeInternal = Types.NotificationTypeInternal;
  type NotificationContent = Types.NotificationContent;
  type GetUserNotificationsResponse = Types.GetUserNotificationsResponse;
  type UserListItem = UserTypes.UserListItem;
  type SubscriptionTimeInterval = Types.SubscriptionTimeInterval;
  let {thash; phash } = Map;

  // #region Notifications
  stable var notificationId = 0;

  //user notification settings
  //key: user principal id, value: bool value for each notification type in all maps
  stable var notificationSettingsNewCommentOnMyArticle = Map.new<Text, Bool>();
  stable var notificationSettingsReplyToMyComment = Map.new<Text, Bool>();
  stable var notificationSettingsNewArticleByFollowedWriter = Map.new<Text, Bool>();
  stable var notificationSettingsNewArticleByFollowedTag = Map.new<Text, Bool>();
  stable var notificationSettingsNewFollower = Map.new<Text, Bool>();
  stable var notificationSettingsTipReceived = Map.new<Text, Bool>();
  stable var notificationSettingsPremiumArticleSold = Map.new<Text, Bool>();
  stable var notificationSettingsAuthorGainsNewSubscriber = Map.new<Text, Bool>();
  stable var notificationSettingsAuthorLosesSubscriber = Map.new<Text, Bool>();
  stable var notificationSettingsYouSubscribedToAuthor = Map.new<Text, Bool>();
  stable var notificationSettingsYouUnsubscribedFromAuthor = Map.new<Text, Bool>();
  stable var notificationSettingsReaderExpiredSubscription = Map.new<Text, Bool>();
  stable var notificationSettingsFaucetClaimAvailable = Map.new<Text, Bool>();
    
  //a map to store the notification ids as an array mapped to the principal ids of the users
  // key: principalId, value: array of notificationIds
  stable var principalToNotificationIds = Map.new<Text, [Text]>();

  //the maps to store the content of the notifications
    
  //fields used in all notificaitons
  // key: notificationId, value: notification receiver principal Id
  stable var notificationIdToNotificationReceiverPrincipalId = Map.new<Text, Text>();
  // key: notificationId, value: Text
  stable var notificationIdToNotificationType = Map.new<Text, Text>();
  // key: notificationId, value: timestamp
  stable var notificationIdToTimestamp = Map.new<Text, Text>();
  // key: notificationId, value: read
  stable var notificationIdToRead = Map.new<Text, Bool>();

  //article related fields
  // key: notificationId, value: postId
  stable var notificationIdToPostId = Map.new<Text, Text>();
  // key: notificationId, value: post writer principal d
  stable var notificationIdToPostWriterPrincipalId = Map.new<Text, Text>();
  // key: notificationId, value: bucket canister id
  stable var notificationIdToBucketCanisterId = Map.new<Text, Text>();
  // key: notificationId, value: post title
  stable var notificationIdToPostTitle = Map.new<Text, Text>();
  // key: notificationId, value: tag name 
  stable var notificationIdToTagName = Map.new<Text, Text>();

  //comment related fields
  // key: notificationId, value: principal id of the commenter
  stable var notificationIdToCommenterPrincipalId = Map.new<Text, Text>();
  // key: notificationId, value: content of the comment
  stable var notificationIdToCommentContent = Map.new<Text, Text>();
  // key: notificationId, value: content of the comment
  stable var notificationIdToCommentId = Map.new<Text, Text>();
  // key: notificationId, value: principal id of the commenter (used for the replies)
  stable var notificationIdToReplyCommenterPrincipalId = Map.new<Text, Text>();
  // key: notificationId, value: content of the comment (used for the replies)
  stable var notificationIdToReplyCommentContent = Map.new<Text, Text>();
  // key: notificationId, value: content of the comment (used for the replies)
  stable var notificationIdToReplyCommentId = Map.new<Text, Text>();
  // key: notificationId, value: whether if the comment is a reply or not
  stable var notificationIdToIsReply = Map.new<Text, Bool>();
    
  //following related fields
  // key: notificationId, value: follower principal Id
  stable var notificationIdToFollowerPrincipalId = Map.new<Text, Text>();

  //tipping & premium article related fields
  // key: notificationId, value: tip sender principal Id
  stable var notificationIdToTipSenderPrincipalId = Map.new<Text, Text>();
  // key: notificationId, value: publication principal id
  stable var notificationIdToPublicationPrincipalId = Map.new<Text, Text>();
  // key: notificationId, value: tipped token symbol
  stable var notificationIdToTippedTokenSymbol = Map.new<Text, Text>();
  // key: notificationId, value: number of applauds
  stable var notificationIdToNumberOfApplauds = Map.new<Text, Text>();
  // key: notificationId, value: amount of tokens
  stable var notificationIdToAmountOfTokens = Map.new<Text, Text>();
  // key: notificationId, value: premium article purchaser principal id
  stable var notificationIdToPurchaserPrincipalId = Map.new<Text, Text>();
  // key: notificationId, value: symbol of the token used in the NFT article purchase
  stable var notificationIdToPurchasedTokenSymbol = Map.new<Text, Text>();

  //subscription related fields
  // key: notificationId, value: subscriber principal id
  stable var notificationIdToSubscriberPrincipalId = Map.new<Text, Text>();
  // key: notificationId, value: subscribed writer principal id
  stable var notificationIdToSubscribedWriterPrincipalId = Map.new<Text, Text>();
  // key: notificationId, value: subscription time interval
  stable var notificationIdToSubscriptionTimeInterval = Map.new<Text, Text>();
  // key: notificationId, value: subscription start time
  stable var notificationIdToSubscriptionStartTime = Map.new<Text, Text>();
  // key: notificationId, value: subscription end time
  stable var notificationIdToSubscriptionEndTime = Map.new<Text, Text>();
  // key: notificationId, value: isPublication
  stable var notificationIdToIsPublication = Map.new<Text, Bool>();

  //public update functions

  //creates the notification after the authorization
  public shared ({caller}) func createNotification(notificationReceiverPrincipalId: Text, content: NotificationContent) : async () {
    if(not isAdmin(caller)){
      //if here, not an admin
      if(not (await isAllowedToSendNotifications(caller))){
        //if here, caller is not an admin and not a bucket canister
        //just return without doing anything
        Debug.print("Not allowed to send notifications.");
        return;
      }
    };
    if(not isThereEnoughMemoryPrivate()){
      return;
    };
    //after the authorization, just create the notification by calling the internal func
    createNotificationInternal(notificationReceiverPrincipalId, content);
  };

  //creates the notifications after the authorization
  public shared ({caller}) func createNotifications(notifications: [(notificationReceiverPrincipalId: Text, content: NotificationContent)]) : async () {
    if(not isAdmin(caller)){
      //if here, not an admin
      if(not (await isAllowedToSendNotifications(caller))){
        //if here, caller is not an admin and not a bucket canister
        //just return without doing anything
        return;
      }
    };
    if(not isThereEnoughMemoryPrivate()){
      return;
    };
    //after the authorization, just create the notifications by calling the internal func for each input
    for((notificationReceiverPrincipalId, content) in notifications.vals()){
      createNotificationInternal(notificationReceiverPrincipalId, content);
    };
  };

  //updates the notification settings of the user
  public shared ({caller}) func updateNotificationSettings(newNotificationSettings: UserNotificationSettings) : async Result.Result<UserNotificationSettings, Text> {
    if(not isThereEnoughMemoryPrivate()){
      return #err("There is not enough memory to proceed.");
    };
    //firstly check if the caller is a Nuance user
    let callerPrincipalId = Principal.toText(caller);
    let UserCanister = CanisterDeclarations.getUserCanister();
    switch(await UserCanister.getUserByPrincipalId(callerPrincipalId)) {
      case(#ok(_)) {
        //user exists
        //just update the internal values
        Map.set(notificationSettingsNewCommentOnMyArticle, thash, callerPrincipalId, newNotificationSettings.newCommentOnMyArticle);
        Map.set(notificationSettingsReplyToMyComment, thash, callerPrincipalId, newNotificationSettings.replyToMyComment);
        Map.set(notificationSettingsNewArticleByFollowedWriter, thash, callerPrincipalId, newNotificationSettings.newArticleByFollowedWriter);
        Map.set(notificationSettingsNewArticleByFollowedTag, thash, callerPrincipalId, newNotificationSettings.newArticleByFollowedTag);
        Map.set(notificationSettingsNewFollower, thash, callerPrincipalId, newNotificationSettings.newFollower);
        Map.set(notificationSettingsTipReceived, thash, callerPrincipalId, newNotificationSettings.tipReceived);
        Map.set(notificationSettingsPremiumArticleSold, thash, callerPrincipalId, newNotificationSettings.premiumArticleSold);
        Map.set(notificationSettingsAuthorGainsNewSubscriber, thash, callerPrincipalId, newNotificationSettings.authorGainsNewSubscriber);
        Map.set(notificationSettingsAuthorLosesSubscriber, thash, callerPrincipalId, newNotificationSettings.authorLosesSubscriber);
        Map.set(notificationSettingsYouSubscribedToAuthor, thash, callerPrincipalId, newNotificationSettings.youSubscribedToAuthor);
        Map.set(notificationSettingsYouUnsubscribedFromAuthor, thash, callerPrincipalId, newNotificationSettings.youUnsubscribedFromAuthor);
        Map.set(notificationSettingsReaderExpiredSubscription, thash, callerPrincipalId, newNotificationSettings.readerExpiredSubscription);
        Map.set(notificationSettingsFaucetClaimAvailable, thash, callerPrincipalId, newNotificationSettings.faucetClaimAvailable);
        //return the UserNotificationSettings object
        #ok(buildUserNotificationSettings(callerPrincipalId))
      };
      case(#err(err)) {
        return #err(err)
      };
    };
  };

  public shared ({caller}) func markNotificationsAsRead(notificationIds: [Text]) : async () {
    if(not isThereEnoughMemoryPrivate()){
      return;
    };
    let callerPrincipalId = Principal.toText(caller);
    for(givenNotificationId in notificationIds.vals()){
      let notificationReceiver = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, givenNotificationId), "");
      if(notificationReceiver == callerPrincipalId){
        //if here, caller is authorized to read the notification
        //set the value to true
        Map.set(notificationIdToRead, thash, givenNotificationId, true);
      }
    };
  };

  //public query functions
  //get the notifications of the caller
  public shared query ({caller}) func getUserNotifications(from: Text, to: Text) : async GetUserNotificationsResponse {
    let callerPrincipalId = Principal.toText(caller);
    switch(Map.get(principalToNotificationIds, thash, callerPrincipalId)) {
      case(?callerNotificationIdsArray) {
        //sort the ids by reversing the array
        let callerNotificationIdsArraySorted = Array.reverse(callerNotificationIdsArray);
        //filter the ids by the UserNotificationSettings values
        let callerNotificationIdsArrayFiltered = Array.filter<Text>(callerNotificationIdsArraySorted, func(id: Text) : Bool {
          includeNotification(id, callerPrincipalId)
        });
        let indexFrom = U.textToNat(from);
        let indexTo = U.textToNat(to);
        // prevent underflow error
        let l : Nat = callerNotificationIdsArrayFiltered.size();

        let lastIndex : Nat = l - 1;

        let indexStart = indexFrom;
        if (indexStart > lastIndex) {
          return {
            totalCount = "0";
            notifications = [];
          };
        };

        var indexEnd = indexTo - 1;
        if (indexEnd > lastIndex) {
          indexEnd := lastIndex;
        };
        
        let notifications = Buffer.Buffer<Notification>(0);
        for (i in Iter.range(indexStart, indexEnd)) {
          let notification = buildNotification(callerNotificationIdsArrayFiltered[i]);
          notifications.add(notification);
        };
        return {
          totalCount = Nat.toText(callerNotificationIdsArrayFiltered.size());
          notifications = Buffer.toArray(notifications);
        }
      };
      case(null) {
        //no notification found
        {
          totalCount = "0";
          notifications = []
        }
      };
    };
  };

  //get the user notification settings
  public shared query ({caller}) func getUserNotificationSettings() : async UserNotificationSettings {
    let callerPrincipalId = Principal.toText(caller);
    buildUserNotificationSettings(callerPrincipalId);
  };

  //private functions to manage the notifications internally
  //private func to just get the NotificationTypeInternal value from the Text value
  private func getNotificationTypeInternal(notificationTypeText: Text) : NotificationTypeInternal{
    switch(notificationTypeText) {
      case("newCommentOnMyArticle") {
        #NewCommentOnMyArticle
      };
      case("replyToMyComment") {
        #ReplyToMyComment
      };
      case("newArticleByFollowedWriter") {
        #NewArticleByFollowedWriter
      };
      case("newArticleByFollowedTag") {
        #NewArticleByFollowedTag
      };
      case("newFollower") {
        #NewFollower
      };
      case("tipReceived") {
        #TipReceived
      };
      case("premiumArticleSold") {
        #PremiumArticleSold
      };
      case("authorGainsNewSubscriber") {
        #AuthorGainsNewSubscriber
      };
      case("authorLosesSubscriber") {
        #AuthorLosesSubscriber
      };
      case("youSubscribedToAuthor") {
        #YouSubscribedToAuthor
      };
      case("youUnsubscribedFromAuthor") {
        #YouUnsubscribedFromAuthor
      };
      case("readerExpiredSubscription") {
        #ReaderExpiredSubscription
      };
      case("faucetClaimAvailable") {
        #FaucetClaimAvailable
      };
      case(_) {
        //not possible to reach here
        getNotificationTypeInternal("<some-funny-joke-here>");
      };
    };
  }; 

  private func getTextFromNotificationType(notificationType: NotificationTypeInternal) : Text {
    switch(notificationType) {
      case(#NewCommentOnMyArticle) {
        return "newCommentOnMyArticle"
      };
      case(#ReplyToMyComment) {
        return "replyToMyComment"
      };
      case(#NewArticleByFollowedWriter) {
        return "newArticleByFollowedWriter"
      };
      case(#NewArticleByFollowedTag) {
        return "newArticleByFollowedTag"
      };
      case(#NewFollower) {
        return "newFollower"
      };
      case(#TipReceived) {
        return "tipReceived"
      };
      case(#PremiumArticleSold) {
        return "premiumArticleSold"
      };
      case(#AuthorGainsNewSubscriber) {
        return "authorGainsNewSubscriber"
      };
      case(#AuthorLosesSubscriber) {
        return "authorLosesSubscriber"
      };
      case(#YouSubscribedToAuthor) {
        return "youSubscribedToAuthor"
      };
      case(#YouUnsubscribedFromAuthor) {
        return "youUnsubscribedFromAuthor"
      };
      case(#ReaderExpiredSubscription) {
        return "readerExpiredSubscription"
      };
      case(#FaucetClaimAvailable) {
        return "faucetClaimAvailable"
      };
    };
  };

  //increase the notificationId stable var and return the new val
  private func getNextNotificationId() : Text {
    notificationId += 1;
    Nat.toText(notificationId)
  };
  //puts the related data into all maps
  private func createNotificationInternal(userPrincipalId: Text, notificationContent: NotificationContent) : () {
    let id = getNextNotificationId();
    let existingNotificationIdsArray = Option.get(Map.get(principalToNotificationIds, thash, userPrincipalId), []);
    let existingNotificationIdsBuffer = Buffer.fromArray<Text>(existingNotificationIdsArray);
    existingNotificationIdsBuffer.add(id);
    Map.set(principalToNotificationIds, thash, userPrincipalId, Buffer.toArray(existingNotificationIdsBuffer));
    Map.set(notificationIdToNotificationReceiverPrincipalId, thash, id, userPrincipalId);
    Map.set(notificationIdToTimestamp, thash, id, Int.toText(U.epochTime()));
    switch(notificationContent) {
      case(#NewCommentOnMyArticle(content)) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#NewCommentOnMyArticle));
        Map.set(notificationIdToPostId, thash, id, content.postId);
        Map.set(notificationIdToBucketCanisterId, thash, id, content.bucketCanisterId);
        Map.set(notificationIdToPostTitle, thash, id, content.postTitle);
        Map.set(notificationIdToCommentContent, thash, id, content.commentContent);
        Map.set(notificationIdToCommentId, thash, id, content.commentId);
        Map.set(notificationIdToCommenterPrincipalId, thash, id, content.commenterPrincipal);
        Map.set(notificationIdToIsReply, thash, id, content.isReply);
      };
      case(#ReplyToMyComment(content)) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#ReplyToMyComment));
        Map.set(notificationIdToPostId, thash, id, content.postId);
        Map.set(notificationIdToPostWriterPrincipalId, thash, id, content.postWriterPrincipal);
        Map.set(notificationIdToBucketCanisterId, thash, id, content.bucketCanisterId);
        Map.set(notificationIdToPostTitle, thash, id, content.postTitle);
        Map.set(notificationIdToCommentContent, thash, id, content.myCommentContent);
        Map.set(notificationIdToCommentId, thash, id, content.myCommentId);
        Map.set(notificationIdToReplyCommentContent, thash, id, content.replyCommentContent);
        Map.set(notificationIdToReplyCommentId, thash, id, content.replyCommentId);
        Map.set(notificationIdToReplyCommenterPrincipalId, thash, id, content.replyCommenterPrincipal);
      };
      case(#NewArticleByFollowedWriter(content)) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#NewArticleByFollowedWriter));
        Map.set(notificationIdToPostId, thash, id, content.postId);
        Map.set(notificationIdToPostWriterPrincipalId, thash, id, content.postWriterPrincipal);
        Map.set(notificationIdToBucketCanisterId, thash, id, content.bucketCanisterId);
        Map.set(notificationIdToPostTitle, thash, id, content.postTitle);
      };
      case(#NewArticleByFollowedTag(content)) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#NewArticleByFollowedTag));
        Map.set(notificationIdToPostId, thash, id, content.postId);
        Map.set(notificationIdToPostWriterPrincipalId, thash, id, content.postWriterPrincipal);
        Map.set(notificationIdToBucketCanisterId, thash, id, content.bucketCanisterId);
        Map.set(notificationIdToPostTitle, thash, id, content.postTitle);
        Map.set(notificationIdToTagName, thash, id, content.tagName);
      };
      case(#NewFollower(content)) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#NewFollower));
        Map.set(notificationIdToFollowerPrincipalId, thash, id, content.followerPrincipalId);
      };
      case(#TipReceived(content)) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#TipReceived));
        Map.set(notificationIdToPostId, thash, id, content.postId);
        Map.set(notificationIdToBucketCanisterId, thash, id, content.bucketCanisterId);
        Map.set(notificationIdToPostTitle, thash, id, content.postTitle);
        Map.set(notificationIdToTipSenderPrincipalId, thash, id, content.tipSenderPrincipal);
        Map.set(notificationIdToTippedTokenSymbol, thash, id, content.tippedTokenSymbol);
        Map.set(notificationIdToAmountOfTokens, thash, id, content.amountOfTokens);
        Map.set(notificationIdToNumberOfApplauds, thash, id, content.numberOfApplauds);
        switch(content.publicationPrincipalId) {
          case(?publicationPrincipalId) {
            Map.set(notificationIdToPublicationPrincipalId, thash, id, publicationPrincipalId);
          };
          case(_) {};
        };
      };
      case(#PremiumArticleSold(content)) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#PremiumArticleSold));
        Map.set(notificationIdToPostId, thash, id, content.postId);
        Map.set(notificationIdToBucketCanisterId, thash, id, content.bucketCanisterId);
        Map.set(notificationIdToPostTitle, thash, id, content.postTitle);
        Map.set(notificationIdToPurchaserPrincipalId, thash, id, content.purchaserPrincipal);
        Map.set(notificationIdToPurchasedTokenSymbol, thash, id, content.purchasedTokenSymbol);
        Map.set(notificationIdToAmountOfTokens, thash, id, content.amountOfTokens);
        switch(content.publicationPrincipalId) {
          case(?publicationPrincipalId) {
            Map.set(notificationIdToPublicationPrincipalId, thash, id, publicationPrincipalId);
          };
          case(_) {};
        };
      };
      case(#AuthorGainsNewSubscriber(content)) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#AuthorGainsNewSubscriber));
        Map.set(notificationIdToSubscriberPrincipalId, thash, id, content.subscriberPrincipalId);
        Map.set(notificationIdToSubscriptionTimeInterval, thash, id, U.getTextFromSubscriptionTimeInterval(content.subscriptionTimeInterval));
        Map.set(notificationIdToSubscriptionStartTime, thash, id, content.subscriptionStartTime);
        Map.set(notificationIdToSubscriptionEndTime, thash, id, content.subscriptionEndTime);
        Map.set(notificationIdToAmountOfTokens, thash, id, content.amountOfTokens);
      };
      case(#AuthorLosesSubscriber(content)) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#AuthorLosesSubscriber));
        Map.set(notificationIdToSubscriberPrincipalId, thash, id, content.subscriberPrincipalId);
        Map.set(notificationIdToSubscriptionTimeInterval, thash, id, U.getTextFromSubscriptionTimeInterval(content.subscriptionTimeInterval));
      };
      case(#YouSubscribedToAuthor(content)) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#YouSubscribedToAuthor));
        Map.set(notificationIdToSubscribedWriterPrincipalId, thash, id, content.subscribedWriterPrincipalId);
        Map.set(notificationIdToSubscriptionTimeInterval, thash, id, U.getTextFromSubscriptionTimeInterval(content.subscriptionTimeInterval));
        Map.set(notificationIdToSubscriptionStartTime, thash, id, content.subscriptionStartTime);
        Map.set(notificationIdToSubscriptionEndTime, thash, id, content.subscriptionEndTime);
        Map.set(notificationIdToAmountOfTokens, thash, id, content.amountOfTokens);
        Map.set(notificationIdToIsPublication, thash, id, content.isPublication);
      };
      case(#YouUnsubscribedFromAuthor(content)) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#YouUnsubscribedFromAuthor));
        Map.set(notificationIdToSubscribedWriterPrincipalId, thash, id, content.subscribedWriterPrincipalId);
        Map.set(notificationIdToSubscriptionTimeInterval, thash, id, U.getTextFromSubscriptionTimeInterval(content.subscriptionTimeInterval));
        Map.set(notificationIdToIsPublication, thash, id, content.isPublication);
      };
      case(#ReaderExpiredSubscription(content)) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#ReaderExpiredSubscription));
        Map.set(notificationIdToSubscribedWriterPrincipalId, thash, id, content.subscribedWriterPrincipalId);
        Map.set(notificationIdToSubscriptionTimeInterval, thash, id, U.getTextFromSubscriptionTimeInterval(content.subscriptionTimeInterval));
        Map.set(notificationIdToSubscriptionStartTime, thash, id, content.subscriptionStartTime);
        Map.set(notificationIdToSubscriptionEndTime, thash, id, content.subscriptionEndTime);
        Map.set(notificationIdToAmountOfTokens, thash, id, content.amountOfTokens);
        Map.set(notificationIdToIsPublication, thash, id, content.isPublication);
      };
      case(#FaucetClaimAvailable) {
        Map.set(notificationIdToNotificationType, thash, id, getTextFromNotificationType(#FaucetClaimAvailable));
      };
    };
  };
  //builds the Notification object by the id
  private func buildNotification(id: Text) : Notification {
    let notificationType = getNotificationTypeInternal(Option.get(Map.get(notificationIdToNotificationType, thash, id), ""));
    switch(notificationType) {
      case(#NewCommentOnMyArticle) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #NewCommentOnMyArticle({
            postId = Option.get(Map.get(notificationIdToPostId, thash, id), "");
            bucketCanisterId = Option.get(Map.get(notificationIdToBucketCanisterId, thash, id), "");
            postTitle = Option.get(Map.get(notificationIdToPostTitle, thash, id), "");
            commentContent = Option.get(Map.get(notificationIdToCommentContent, thash, id), "");
            commentId = Option.get(Map.get(notificationIdToCommentId, thash, id), "");
            commenterPrincipal = Option.get(Map.get(notificationIdToCommenterPrincipalId, thash, id), "");
            isReply = Option.get(Map.get(notificationIdToIsReply, thash, id), false);
          })
        }
      };
      case(#ReplyToMyComment) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #ReplyToMyComment({
            postId = Option.get(Map.get(notificationIdToPostId, thash, id), "");
            postWriterPrincipal = Option.get(Map.get(notificationIdToPostWriterPrincipalId, thash, id), "");
            bucketCanisterId = Option.get(Map.get(notificationIdToBucketCanisterId, thash, id), "");
            postTitle = Option.get(Map.get(notificationIdToPostTitle, thash, id), "");
            myCommentContent = Option.get(Map.get(notificationIdToCommentContent, thash, id), "");
            myCommentId = Option.get(Map.get(notificationIdToCommentId, thash, id), "");
            replyCommentContent = Option.get(Map.get(notificationIdToReplyCommentContent, thash, id), "");
            replyCommentId = Option.get(Map.get(notificationIdToReplyCommentId, thash, id), "");
            replyCommenterPrincipal = Option.get(Map.get(notificationIdToReplyCommenterPrincipalId, thash, id), "");
          })
        }
      };
      case(#NewArticleByFollowedWriter) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #NewArticleByFollowedWriter({
            postId = Option.get(Map.get(notificationIdToPostId, thash, id), "");
            postWriterPrincipal = Option.get(Map.get(notificationIdToPostWriterPrincipalId, thash, id), "");
            bucketCanisterId = Option.get(Map.get(notificationIdToBucketCanisterId, thash, id), "");
            postTitle = Option.get(Map.get(notificationIdToPostTitle, thash, id), "");
          })
        }
      };
      case(#NewArticleByFollowedTag) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #NewArticleByFollowedTag({
            postId = Option.get(Map.get(notificationIdToPostId, thash, id), "");
            postWriterPrincipal = Option.get(Map.get(notificationIdToPostWriterPrincipalId, thash, id), "");
            bucketCanisterId = Option.get(Map.get(notificationIdToBucketCanisterId, thash, id), "");
            postTitle = Option.get(Map.get(notificationIdToPostTitle, thash, id), "");
            tagName = Option.get(Map.get(notificationIdToTagName, thash, id), "");
          })
        }
      };
      case(#NewFollower) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #NewFollower({
            followerPrincipalId = Option.get(Map.get(notificationIdToFollowerPrincipalId, thash, id), "");
          })
        }
      };
      case(#TipReceived) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #TipReceived({
            postId = Option.get(Map.get(notificationIdToPostId, thash, id), "");
            bucketCanisterId = Option.get(Map.get(notificationIdToBucketCanisterId, thash, id), "");
            postTitle = Option.get(Map.get(notificationIdToPostTitle, thash, id), "");
            tipSenderPrincipal = Option.get(Map.get(notificationIdToTipSenderPrincipalId, thash, id), "");
            tippedTokenSymbol = Option.get(Map.get(notificationIdToTippedTokenSymbol, thash, id), "");
            amountOfTokens = Option.get(Map.get(notificationIdToAmountOfTokens, thash, id), "");
            numberOfApplauds = Option.get(Map.get(notificationIdToNumberOfApplauds, thash, id), "");
            publicationPrincipalId = Map.get(notificationIdToPublicationPrincipalId, thash, id)
          })
        }
      };
      case(#PremiumArticleSold) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #PremiumArticleSold({
            postId = Option.get(Map.get(notificationIdToPostId, thash, id), "");
            bucketCanisterId = Option.get(Map.get(notificationIdToBucketCanisterId, thash, id), "");
            postTitle = Option.get(Map.get(notificationIdToPostTitle, thash, id), "");
            purchaserPrincipal = Option.get(Map.get(notificationIdToPurchaserPrincipalId, thash, id), "");
            purchasedTokenSymbol = Option.get(Map.get(notificationIdToPurchasedTokenSymbol, thash, id), "");
            amountOfTokens = Option.get(Map.get(notificationIdToAmountOfTokens, thash, id), "");
            publicationPrincipalId = Map.get(notificationIdToPublicationPrincipalId, thash, id)
          })
        }
      };
      case(#AuthorGainsNewSubscriber) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #AuthorGainsNewSubscriber({
            subscriberPrincipalId = Option.get(Map.get(notificationIdToSubscriberPrincipalId, thash, id), "");
            amountOfTokens = Option.get(Map.get(notificationIdToAmountOfTokens, thash, id), "");
            subscriptionTimeInterval = U.getSubscriptionTimeIntervalFromText(Option.get(Map.get(notificationIdToSubscriptionTimeInterval, thash, id), ""));
            subscriptionStartTime = Option.get(Map.get(notificationIdToSubscriptionStartTime, thash, id), "");
            subscriptionEndTime = Option.get(Map.get(notificationIdToSubscriptionEndTime, thash, id), "");
          })
        }
      };
      case(#AuthorLosesSubscriber) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #AuthorLosesSubscriber({
            subscriberPrincipalId = Option.get(Map.get(notificationIdToSubscriberPrincipalId, thash, id), "");
            subscriptionTimeInterval = U.getSubscriptionTimeIntervalFromText(Option.get(Map.get(notificationIdToSubscriptionTimeInterval, thash, id), ""));
          })
        }
      };
      case(#YouSubscribedToAuthor) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #YouSubscribedToAuthor({
            subscribedWriterPrincipalId = Option.get(Map.get(notificationIdToSubscribedWriterPrincipalId, thash, id), "");
            amountOfTokens = Option.get(Map.get(notificationIdToAmountOfTokens, thash, id), "");
            subscriptionTimeInterval = U.getSubscriptionTimeIntervalFromText(Option.get(Map.get(notificationIdToSubscriptionTimeInterval, thash, id), ""));
            subscriptionStartTime = Option.get(Map.get(notificationIdToSubscriptionStartTime, thash, id), "");
            subscriptionEndTime = Option.get(Map.get(notificationIdToSubscriptionEndTime, thash, id), "");
            isPublication = Option.get(Map.get(notificationIdToIsPublication, thash, id), false);
          })
        }
      };
      case(#YouUnsubscribedFromAuthor) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #YouUnsubscribedFromAuthor({
            subscribedWriterPrincipalId = Option.get(Map.get(notificationIdToSubscribedWriterPrincipalId, thash, id), "");
            subscriptionTimeInterval = U.getSubscriptionTimeIntervalFromText(Option.get(Map.get(notificationIdToSubscriptionTimeInterval, thash, id), ""));
            isPublication = Option.get(Map.get(notificationIdToIsPublication, thash, id), false);
          })
        }
      };
      case(#ReaderExpiredSubscription) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #ReaderExpiredSubscription({
            subscribedWriterPrincipalId = Option.get(Map.get(notificationIdToSubscribedWriterPrincipalId, thash, id), "");
            amountOfTokens = Option.get(Map.get(notificationIdToAmountOfTokens, thash, id), "");
            subscriptionTimeInterval = U.getSubscriptionTimeIntervalFromText(Option.get(Map.get(notificationIdToSubscriptionTimeInterval, thash, id), ""));
            subscriptionStartTime = Option.get(Map.get(notificationIdToSubscriptionStartTime, thash, id), "");
            subscriptionEndTime = Option.get(Map.get(notificationIdToSubscriptionEndTime, thash, id), "");
            isPublication = Option.get(Map.get(notificationIdToIsPublication, thash, id), false);
          })
        }
      };
      case(#FaucetClaimAvailable) {
        return {
          id;
          read = Option.get(Map.get(notificationIdToRead, thash, id), false);
          timestamp = Option.get(Map.get(notificationIdToTimestamp, thash, id), "");
          notificationReceiverPrincipalId = Option.get(Map.get(notificationIdToNotificationReceiverPrincipalId, thash, id), "");
          content = #FaucetClaimAvailable;
        }
      };
    };
  };
  //builds the UserNotificationSettings using the principal id
  private func buildUserNotificationSettings(userPrincipalId: Text) : UserNotificationSettings {
    {
      newCommentOnMyArticle = Option.get(Map.get(notificationSettingsNewCommentOnMyArticle, thash, userPrincipalId), true);
      replyToMyComment = Option.get(Map.get(notificationSettingsReplyToMyComment, thash, userPrincipalId), true);
      newArticleByFollowedWriter = Option.get(Map.get(notificationSettingsNewArticleByFollowedWriter, thash, userPrincipalId), true);
      newArticleByFollowedTag = Option.get(Map.get(notificationSettingsNewArticleByFollowedTag, thash, userPrincipalId), true);
      newFollower = Option.get(Map.get(notificationSettingsNewFollower, thash, userPrincipalId), true);
      tipReceived = Option.get(Map.get(notificationSettingsTipReceived, thash, userPrincipalId), true);
      premiumArticleSold = Option.get(Map.get(notificationSettingsPremiumArticleSold, thash, userPrincipalId), true);
      authorGainsNewSubscriber = Option.get(Map.get(notificationSettingsAuthorGainsNewSubscriber, thash, userPrincipalId), true);
      authorLosesSubscriber = Option.get(Map.get(notificationSettingsAuthorLosesSubscriber, thash, userPrincipalId), true);
      youSubscribedToAuthor = Option.get(Map.get(notificationSettingsYouSubscribedToAuthor, thash, userPrincipalId), true);
      youUnsubscribedFromAuthor = Option.get(Map.get(notificationSettingsYouUnsubscribedFromAuthor, thash, userPrincipalId), true);
      readerExpiredSubscription = Option.get(Map.get(notificationSettingsReaderExpiredSubscription, thash, userPrincipalId), true);
      faucetClaimAvailable = Option.get(Map.get(notificationSettingsFaucetClaimAvailable, thash, userPrincipalId), true);
    }
  };

  private func includeNotification(id: Text, userPrincipalId: Text) : Bool {
    let userNotificationSettings = buildUserNotificationSettings(userPrincipalId);
    let notificationTypeText = Option.get(Map.get(notificationIdToNotificationType, thash, id), "");
    let notificationType = getNotificationTypeInternal(notificationTypeText);
    switch(notificationType) {
      case(#NewCommentOnMyArticle) {
        userNotificationSettings.newCommentOnMyArticle
      };
      case(#ReplyToMyComment) {
        userNotificationSettings.replyToMyComment
      };
      case(#NewArticleByFollowedWriter) {
        userNotificationSettings.newArticleByFollowedWriter
      };
      case(#NewArticleByFollowedTag) {
        userNotificationSettings.newArticleByFollowedTag
      };
      case(#NewFollower) {
        userNotificationSettings.newFollower
      };
      case(#TipReceived) {
        userNotificationSettings.tipReceived
      };
      case(#PremiumArticleSold) {
        userNotificationSettings.premiumArticleSold
      };
      case(#AuthorGainsNewSubscriber) {
        userNotificationSettings.authorGainsNewSubscriber
      };
      case(#AuthorLosesSubscriber) {
        userNotificationSettings.authorLosesSubscriber
      };
      case(#YouSubscribedToAuthor) {
        userNotificationSettings.youSubscribedToAuthor
      };
      case(#YouUnsubscribedFromAuthor) {
        userNotificationSettings.youUnsubscribedFromAuthor
      };
      case(#ReaderExpiredSubscription) {
        userNotificationSettings.readerExpiredSubscription
      };
      case(#FaucetClaimAvailable) {
        userNotificationSettings.faucetClaimAvailable
      };
    };
  };

  

  //generic functions needs to be implemented in every canister
  public func acceptCycles() : async () {
    let available = Cycles.available();
    let accepted = Cycles.accept<system>(available);
    assert (accepted == available);
  };

  public shared query func availableCycles() : async Nat {
    Cycles.balance();
  };

  private func isPlatformOperator(caller: Principal) : Bool {
    ENV.isPlatformOperator(caller)
  };

  private func isAdmin(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    U.arrayContains(ENV.NOTIFICATIONS_CANISTER_ADMINS, c);
  };

  //the canister ids which are allowed to push notifications
  stable var nuanceCanisters = Map.new<Text, Text>();

  //this function will be 
  private func isAllowedToSendNotifications(caller: Principal) : async Bool {
    let callerPrincipalId = Principal.toText(caller);
    //firstly check if the caller is added to the nuanceCanisters map
    switch(Map.get(nuanceCanisters, thash, callerPrincipalId)) {
      case(?_) {
        return true;
      };
      case(null) {
        //do inter canister calls to check if it's really not unauthorized
      };
    };
    //check if it's a PostBucket canister
    let postCoreCanister = CanisterDeclarations.getPostCoreCanister();
    let bucketCanisterIds = Array.map(await postCoreCanister.getBucketCanisters(), func(bucketCanisterEntry: (Text, Text)) : Text {
      bucketCanisterEntry.0
    });
    //add all the bucketCanisterId values into nuanceCanisters map to not need any inter-canister call next time
    for(bucketCanisterId in bucketCanisterIds.vals()){
      Map.set(nuanceCanisters, thash, bucketCanisterId, bucketCanisterId);
    };
    if(U.arrayContainsGeneric(bucketCanisterIds, callerPrincipalId, Text.equal)){
      return true;
    };
      
    //check if it's an NFT canister
    let nftFactoryCanister = CanisterDeclarations.getNftFactoryCanister();
    let nftCanisterIds = Array.map(await nftFactoryCanister.getAllNftCanisterIds(), func(nftCanisterEntry: (Text, Text)) : Text {
      nftCanisterEntry.1
    });
    //add all the nftCanisterId values into nuanceCanisters map to not need any inter-canister call next time
    for(nftCanisterId in nftCanisterIds.vals()){
      Map.set(nuanceCanisters, thash, nftCanisterId, nftCanisterId);
    };
    if(U.arrayContainsGeneric(nftCanisterIds, callerPrincipalId, Text.equal)){
      return true;
    };
    false
  };

  //memory management
  //2GB default
  stable var MAX_MEMORY_SIZE = 2000000000;

  public shared ({ caller }) func setMaxMemorySize(newValue : Nat) : async Result.Result<Nat, Text> {
    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err("Unauthorized");
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
    Versions.NOTIFICATIONS_VERSION;
  };
}; 