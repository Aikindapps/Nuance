import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Int "mo:base/Int";
import Result "mo:base/Result";

module {

  public type NotificationTypeInternal = {
    #NewCommentOnMyArticle;
    #ReplyToMyComment;
    #NewArticleByFollowedWriter;
    #NewArticleByFollowedTag;
    #NewFollower;
    #TipReceived;
    #PremiumArticleSold;
    #AuthorGainsNewSubscriber;
    #AuthorLosesSubscriber;
    #YouSubscribedToAuthor;
    #YouUnsubscribedFromAuthor;
    #ReaderExpiredSubscription;
    #FaucetClaimAvailable;
  };

  public type GetUserNotificationsResponse = {
    notifications: [Notification];
    totalCount: Text;
  };

  public type Notification = {
    id: Text;
    notificationReceiverPrincipalId: Text;
    content: NotificationContent;
    timestamp: Text;
    read: Bool;
  };


  public type NotificationContent = {
    #NewCommentOnMyArticle : {
      postId: Text;
      bucketCanisterId: Text;
      postTitle: Text;
      commenterPrincipal: Text;
      commentContent: Text;
      commentId: Text;
      isReply: Bool;
    };
    #ReplyToMyComment: {
      postId: Text;
      bucketCanisterId: Text;
      postTitle: Text;
      postWriterPrincipal: Text;
      myCommentId: Text;
      myCommentContent: Text;
      replyCommentId: Text;
      replyCommentContent: Text;
      replyCommenterPrincipal: Text;
    };
    #NewArticleByFollowedWriter: {
      postId: Text;
      bucketCanisterId: Text;
      postTitle: Text;
      postWriterPrincipal: Text;
    };
    #NewArticleByFollowedTag: {
      postId: Text;
      bucketCanisterId: Text;
      postTitle: Text;
      postWriterPrincipal: Text;
      tagName: Text;
    };
    #NewFollower: {
      followerPrincipalId: Text;
    };
    #TipReceived: {
      postId: Text;
      bucketCanisterId: Text;
      postTitle: Text;
      publicationPrincipalId: ?Text; //if the tip is received for a publication canister, need to have this on frontend to build the url
      tipSenderPrincipal: Text;
      tippedTokenSymbol: Text;
      numberOfApplauds: Text;
      amountOfTokens: Text;
    };
    #PremiumArticleSold: {
      postId: Text;
      bucketCanisterId: Text;
      postTitle: Text;
      publicationPrincipalId: ?Text; //if the sold article was a publication article, need to have this on frontend to build the url
      purchaserPrincipal: Text;
      purchasedTokenSymbol: Text;
      amountOfTokens: Text;
    };
    #AuthorGainsNewSubscriber: {
      subscriberPrincipalId: Text;
      subscriptionTimeInterval: SubscriptionTimeInterval;
      amountOfTokens: Text;
      subscriptionStartTime: Text;
      subscriptionEndTime: Text;
    };
    #AuthorLosesSubscriber: {
      subscriberPrincipalId: Text;
      subscriptionTimeInterval: SubscriptionTimeInterval;
    };
    #YouSubscribedToAuthor: {
      subscribedWriterPrincipalId: Text;
      subscriptionTimeInterval: SubscriptionTimeInterval;
      subscriptionStartTime: Text;
      subscriptionEndTime: Text;
      amountOfTokens: Text;
      isPublication: Bool;
    };
    #YouUnsubscribedFromAuthor: {
      subscribedWriterPrincipalId: Text;
      subscriptionTimeInterval: SubscriptionTimeInterval;
      isPublication: Bool;
    };
    #ReaderExpiredSubscription: {
      subscribedWriterPrincipalId: Text;
      subscriptionTimeInterval: SubscriptionTimeInterval;
      subscriptionStartTime: Text;
      subscriptionEndTime: Text;
      amountOfTokens: Text;
      isPublication: Bool;
    };
    #FaucetClaimAvailable;
  };


  public type UserNotificationSettings = {
    newCommentOnMyArticle: Bool;
    replyToMyComment: Bool;
    newArticleByFollowedWriter: Bool;
    newArticleByFollowedTag: Bool;
    newFollower: Bool;
    tipReceived: Bool;
    premiumArticleSold: Bool;
    authorGainsNewSubscriber: Bool;
    authorLosesSubscriber: Bool;
    youSubscribedToAuthor: Bool;
    youUnsubscribedFromAuthor: Bool;
    readerExpiredSubscription: Bool;
    faucetClaimAvailable: Bool;
  };

  public type SubscriptionTimeInterval = {
    #Weekly;
    #Monthly;
    #Annually;
    #LifeTime;
  };
};
