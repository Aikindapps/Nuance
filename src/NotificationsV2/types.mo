import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Int "mo:base/Int";
import Result "mo:base/Result";

module {
 
  public type NotificationType = {
  #NewCommentOnMyArticle;
  #NewCommentOnFollowedArticle;
  #NewArticleByFollowedWriter;
  #NewArticleByFollowedTag;
  #NewFollower;
  #TipReceived;
  #PremiumArticleSold;
  #AuthorGainsNewSubscriber;
  #AuthorLosesSubscriber;
  #YouSubscribedToAuthor; // Reader subscribes to author, notification to reader
  #YouUnsubscribedFromAuthor; // Reader unsubscribes from author, notification to reader
  #AuthorExpiredSubscription; // Author loses subscriber
  #ReaderExpiredSubscription; // Reader loses subscription
  #FaucetClaimAvailable;// User can collect tokens from faucet
};

public type Notifications = {
  id: Text;
  notificationType: NotificationType;
  content: ?NotificationContent;
  timestamp: Text;
  read: Bool;
};


//2. update all the notification types in the notification canister, and specify the content type where needed
//3. migration functions - should be a handful of hashmaps to bring across w/ a test to confirm
//4. update frontend interfaces
//5. test upgradeability/composability


public type NotificationContent = {
  #PostNotificationContent : {
      url: Text;
      receiverHandle: Text;
      receiverPrincipal: Principal;
      tags: [Text];
      articleId: Text;
      articleTitle: Text;
      authorPrincipal: Principal;
      authorHandle: Text;
      isAuthorPublication: Bool;
    };
    #PremiumArticleSoldNotificationContent : {
      url: Text;
      purchaserHandle: Text;
      purchaserPrincipal: Principal;
      articleId: Text;
      articleTitle: Text;
      authorPrincipal: Principal;
      authorHandle: Text;
      isAuthorPublication: Bool;
    };
    #NewCommentOnFollowedArticleNotificationContent : {
      url: Text;
      articleId: Text;
      articleTitle: Text;
      authorPrincipal: Principal;
      authorHandle: Text;
      isAuthorPublication: Bool;
      comment: Text;
      isReply: Bool;
      commenterPrincipal: Principal;
      commenterHandle: Text;
      tags: [Text];
    };
    #NewFollowerNotificationContent : {
      followerUrl: Text;
      followerPrincipal: Principal;
      followerHandle: Text;
      authorPrincipal: Principal;
      authorHandle: Text;
    };
    #FaucetClaimAvailableNotificationContent : {
      receiverPrincipal: Principal;
      receiverHandle: Text;
      claimed: ?ClaimStatus;
    };
    #NewArticleNotificationContent : {
      url: Text;
      articleId: Text;
      articleTitle: Text;
      authorPrincipal: Principal;
      authorHandle: Text;
      isAuthorPublication: Bool;
      tags: [Text];
    
    };

    #TipRecievedNotificationContent : {
      postUrl: Text;
      articleId: Text;
      articleTitle: Text;
      receiverHandle: Text;
      receiverPrincipal: Principal;
      recieverIsPublication: Bool;
      senderHandle: Text;
      senderPrincipal: Principal;
      tipAmount: Text;
      token: Text;
    };

    #AuthorExpiredSubscriptionNotificationContent : {
      authorPrincipal: Principal;
      authorHandle: Text;
      subscriberPrincipal: Principal;
      subscriberHandle: Text;
      time: Text;
    };
    // #DefaultContent : { //Just in case legacy notifications are still in the system?
    //   url: Text;
    //   senderHandle: Text;
    //   receiverHandle: Text;
    //   senderPrincipal: Principal;
    //   receiverPrincipal: Principal;
    //   tags: [Text];
    //   articleId: Text;
    //   articleTitle: Text;
    //   authorPrincipal: Principal;
    //   authorHandle: Text;
    //   isAuthorPublication: Bool;
    //   comment: Text;
    //   isReply: Bool;
    //   tipAmount: Text;
    //   token: Text;
    // };
};

public type ClaimStatus = {
  #Claimed : {
    claimTime: Text;
    amount: Int;
  };
  #NotClaimed;
};



public type UserNotificationSettings = {
  newCommentOnMyArticle: Bool;
  newCommentOnFollowedArticle: Bool;
  newArticleByFollowedWriter: Bool;
  newArticleByFollowedTag: Bool;
  newFollower: Bool;
  tipReceived: Bool;
  premiumArticleSold: Bool;
  authorGainsNewSubscriber: Bool;
  authorLosesSubscriber: Bool;
  youSubscribedToAuthor: Bool;
  youUnsubscribedFromAuthor: Bool;
  expiredSubscription: Bool;
  authorExpiredSubscription: Bool;
  readerExpiredSubscription: Bool;
  faucetClaimAvailable: Bool;
};



  
};
