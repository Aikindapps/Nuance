export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const NotificationType__1 = IDL.Variant({
    'FaucetClaimAvailable' : IDL.Null,
    'TipReceived' : IDL.Null,
    'NewArticleByFollowedWriter' : IDL.Null,
    'AuthorLosesSubscriber' : IDL.Null,
    'YouSubscribedToAuthor' : IDL.Null,
    'AuthorExpiredSubscription' : IDL.Null,
    'NewCommentOnMyArticle' : IDL.Null,
    'YouUnsubscribedFromAuthor' : IDL.Null,
    'NewFollower' : IDL.Null,
    'ReaderExpiredSubscription' : IDL.Null,
    'PremiumArticleSold' : IDL.Null,
    'NewCommentOnFollowedArticle' : IDL.Null,
    'NewArticleByFollowedTag' : IDL.Null,
    'AuthorGainsNewSubscriber' : IDL.Null,
  });
  const NotificationContent = IDL.Record({
    'url' : IDL.Text,
    'token' : IDL.Text,
    'tipAmount' : IDL.Text,
    'tags' : IDL.Vec(IDL.Text),
    'senderHandle' : IDL.Text,
    'receiverPrincipal' : IDL.Principal,
    'comment' : IDL.Text,
    'articleId' : IDL.Text,
    'isReply' : IDL.Bool,
    'senderPrincipal' : IDL.Principal,
    'receiverHandle' : IDL.Text,
    'articleTitle' : IDL.Text,
    'authorHandle' : IDL.Text,
    'authorPrincipal' : IDL.Principal,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_4 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Text), 'err' : IDL.Text });
  const MetricsGranularity = IDL.Variant({
    'hourly' : IDL.Null,
    'daily' : IDL.Null,
  });
  const GetMetricsParameters = IDL.Record({
    'dateToMillis' : IDL.Nat,
    'granularity' : MetricsGranularity,
    'dateFromMillis' : IDL.Nat,
  });
  const UpdateCallsAggregatedData = IDL.Vec(IDL.Nat64);
  const CanisterHeapMemoryAggregatedData = IDL.Vec(IDL.Nat64);
  const CanisterCyclesAggregatedData = IDL.Vec(IDL.Nat64);
  const CanisterMemoryAggregatedData = IDL.Vec(IDL.Nat64);
  const HourlyMetricsData = IDL.Record({
    'updateCalls' : UpdateCallsAggregatedData,
    'canisterHeapMemorySize' : CanisterHeapMemoryAggregatedData,
    'canisterCycles' : CanisterCyclesAggregatedData,
    'canisterMemorySize' : CanisterMemoryAggregatedData,
    'timeMillis' : IDL.Int,
  });
  const NumericEntity = IDL.Record({
    'avg' : IDL.Nat64,
    'max' : IDL.Nat64,
    'min' : IDL.Nat64,
    'first' : IDL.Nat64,
    'last' : IDL.Nat64,
  });
  const DailyMetricsData = IDL.Record({
    'updateCalls' : IDL.Nat64,
    'canisterHeapMemorySize' : NumericEntity,
    'canisterCycles' : NumericEntity,
    'canisterMemorySize' : NumericEntity,
    'timeMillis' : IDL.Int,
  });
  const CanisterMetricsData = IDL.Variant({
    'hourly' : IDL.Vec(HourlyMetricsData),
    'daily' : IDL.Vec(DailyMetricsData),
  });
  const CanisterMetrics = IDL.Record({ 'data' : CanisterMetricsData });
  List.fill(IDL.Opt(IDL.Tuple(IDL.Text, List)));
  const UserNotificationSettings = IDL.Record({
    'premiumArticleSold' : IDL.Bool,
    'tipReceived' : IDL.Bool,
    'authorGainsNewSubscriber' : IDL.Bool,
    'authorExpiredSubscription' : IDL.Bool,
    'authorLosesSubscriber' : IDL.Bool,
    'newCommentOnFollowedArticle' : IDL.Bool,
    'youSubscribedToAuthor' : IDL.Bool,
    'newCommentOnMyArticle' : IDL.Bool,
    'youUnsubscribedFromAuthor' : IDL.Bool,
    'newFollower' : IDL.Bool,
    'readerExpiredSubscription' : IDL.Bool,
    'newArticleByFollowedWriter' : IDL.Bool,
    'newArticleByFollowedTag' : IDL.Bool,
    'faucetClaimAvailable' : IDL.Bool,
    'expiredSubscription' : IDL.Bool,
  });
  const Result_3 = IDL.Variant({
    'ok' : UserNotificationSettings,
    'err' : IDL.Text,
  });
  const NotificationContent__1 = IDL.Record({
    'url' : IDL.Text,
    'token' : IDL.Text,
    'tipAmount' : IDL.Text,
    'tags' : IDL.Vec(IDL.Text),
    'senderHandle' : IDL.Text,
    'receiverPrincipal' : IDL.Principal,
    'comment' : IDL.Text,
    'articleId' : IDL.Text,
    'isReply' : IDL.Bool,
    'senderPrincipal' : IDL.Principal,
    'receiverHandle' : IDL.Text,
    'articleTitle' : IDL.Text,
    'authorHandle' : IDL.Text,
    'authorPrincipal' : IDL.Principal,
  });
  const NotificationType = IDL.Variant({
    'FaucetClaimAvailable' : IDL.Null,
    'TipReceived' : IDL.Null,
    'NewArticleByFollowedWriter' : IDL.Null,
    'AuthorLosesSubscriber' : IDL.Null,
    'YouSubscribedToAuthor' : IDL.Null,
    'AuthorExpiredSubscription' : IDL.Null,
    'NewCommentOnMyArticle' : IDL.Null,
    'YouUnsubscribedFromAuthor' : IDL.Null,
    'NewFollower' : IDL.Null,
    'ReaderExpiredSubscription' : IDL.Null,
    'PremiumArticleSold' : IDL.Null,
    'NewCommentOnFollowedArticle' : IDL.Null,
    'NewArticleByFollowedTag' : IDL.Null,
    'AuthorGainsNewSubscriber' : IDL.Null,
  });
  const Notifications = IDL.Record({
    'id' : IDL.Text,
    'content' : NotificationContent__1,
    'notificationType' : NotificationType,
    'read' : IDL.Bool,
    'timestamp' : IDL.Text,
  });
  const Result_2 = IDL.Variant({
    'ok' : IDL.Tuple(IDL.Vec(Notifications), IDL.Nat),
    'err' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'collectCanisterMetrics' : IDL.Func([], [], []),
    'createNotification' : IDL.Func(
        [NotificationType__1, NotificationContent],
        [Result],
        [],
      ),
    'createNotifications' : IDL.Func(
        [IDL.Vec(IDL.Tuple(NotificationType__1, NotificationContent))],
        [Result],
        [],
      ),
    'disperseBulkSubscriptionNotifications' : IDL.Func(
        [IDL.Vec(IDL.Tuple(NotificationType__1, NotificationContent))],
        [Result],
        [],
      ),
    'getAdmins' : IDL.Func([], [Result_4], ['query']),
    'getCanisterMetrics' : IDL.Func(
        [GetMetricsParameters],
        [IDL.Opt(CanisterMetrics)],
        ['query'],
      ),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getCgUsers' : IDL.Func([], [Result_4], ['query']),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getPlatformOperators' : IDL.Func([], [List], ['query']),
    'getUserNotificationSettings' : IDL.Func([], [Result_3], ['query']),
    'getUserNotifications' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_2],
        ['query'],
      ),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'markNotificationAsRead' : IDL.Func([IDL.Vec(IDL.Text)], [Result], []),
    'newArticle' : IDL.Func([NotificationContent], [Result], []),
    'registerCgUser' : IDL.Func([IDL.Text], [Result], []),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_1], []),
    'unregisterCgUser' : IDL.Func([IDL.Text], [Result], []),
    'updateUserNotificationSettings' : IDL.Func(
        [UserNotificationSettings],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
