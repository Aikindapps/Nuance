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
  content: NotificationContent;
  timestamp: Text;
  read: Bool;
};

public type NotificationContent = {
  url: Text;
  senderHandle: Text;
  receiverHandle: Text;
  senderPrincipal: Principal;
  receiverPrincipal: Principal;
  tags: [Text];
  articleId: Text;
  articleTitle: Text;
  authorPrincipal: Principal;
  authorHandle: Text;
  comment: Text;
  isReply: Bool;
  tipAmount: Text;
  token: Text;
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
