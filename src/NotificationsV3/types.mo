import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Int "mo:base/Int";
import Result "mo:base/Result";

module {
 
  public type NotificationType = {
  #NewCommentOnMyArticle; //x
  #NewCommentOnFollowedArticle;//x
  #NewArticleByFollowedWriter;//x
  #NewArticleByFollowedTag;// x
  #NewFollower;//x
  #TipReceived;// ? ?
  #PremiumArticleSold;//
  #AuthorGainsNewSubscriber;//
  #AuthorLosesSubscriber;//
  #YouSubscribedToAuthor; // Reader subscribes to author, notification to reader
  #YouUnsubscribedFromAuthor; // Reader unsubscribes from author, notification to reader
  #AuthorExpiredSubscription; // Author loses subscriber
  #ReaderExpiredSubscription; // Reader loses subscription
  #FaucetClaimAvailable;// User can collect tokens from faucet x
  #UnknownNotificationType; //error x
};


public type Notifications = {
  id: Text;
  notificationType: NotificationType;
  content: NotificationContent;
  timestamp: Text;
  read: Bool;
};

public type NotificationsExtended = {
  id: Text;
  notificationType: NotificationType;
  content: NotificationContent;
  timestamp: Text;
  read: Bool;

  //additional fields that can be populated by other canisters
  senderHandle: Text;
  receiverHandle: Text;
};



public type NotificationContent =  {
  #PostNotificationContent : {
      url: Text;
      receiverPrincipal: Principal;
      tags: [Text];
      articleId: Text;
      articleTitle: Text;
      authorPrincipal: Principal;
      isAuthorPublication: Bool;
    };
    #PremiumArticleSoldNotificationContent : {
      url: Text;
      purchaserPrincipal: Principal;
      articleId: Text;
      articleTitle: Text;
      authorPrincipal: Principal;
      isAuthorPublication: Bool;
    };
    #CommentNotificationContent : {
      url: Text;
      articleId: Text;
      articleTitle: Text;
      authorPrincipal: Principal;
      isAuthorPublication: Bool;
      comment: Text;
      isReply: Bool;
      commenterPrincipal: Principal;
      tags: [Text];
    };
    #NewFollowerNotificationContent : {
      followerUrl: Text;
      followerPrincipal: Principal;
      authorPrincipal: Principal;
    };
    
    #NewArticleNotificationContent : {
      url: Text;
      articleId: Text;
      articleTitle: Text;
      authorPrincipal: Principal;
      isAuthorPublication: Bool;
      tags: [Text];
    
    };

    #TipRecievedNotificationContent : {
      postUrl: Text;
      articleId: Text;
      articleTitle: Text;
      receiverPrincipal: Principal;
      recieverIsPublication: Bool;
      senderPrincipal: Principal;
      tipAmount: Text;
      token: Text;
    };

    #AuthorGainsNewSubscriberNotificationContent : {
      authorPrincipal: Principal;
      subscriberPrincipal: Principal;
      time: Text;
    };

    #AuthorLosesSubscriberNotificationContent : {
      authorPrincipal: Principal;
      subscriberPrincipal: Principal;
      time: Text;
    };

    #YouSubscribedToAuthorNotificationContent : {
      authorPrincipal: Principal;
      subscriberPrincipal: Principal;
      time: Text;
    };

    #YouUnsubscribedFromAuthorNotificationContent : {
      authorPrincipal: Principal;
      subscriberPrincipal: Principal;
      time: Text;
    };
    
    #AuthorExpiredSubscriptionNotificationContent : {
      authorPrincipal: Principal;
      subscriberPrincipal: Principal;
      time: Text;
    };

    #ReaderExpiredSubscriptionNotificationContent : {
      authorPrincipal: Principal;
      subscriberPrincipal: Principal;
      time: Text;
    };

    #FaucetClaimAvailableNotificationContent : {
      receiverPrincipal: Principal;
      //claimed: ?ClaimStatus;
    };
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
