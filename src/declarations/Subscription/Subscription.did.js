export const idlFactory = ({ IDL }) => {
  const SubscriptionTimeInterval = IDL.Variant({
    'LifeTime' : IDL.Null,
    'Weekly' : IDL.Null,
    'Monthly' : IDL.Null,
    'Annually' : IDL.Null,
  });
  const SubscriptionEvent = IDL.Record({
    'startTime' : IDL.Int,
    'subscriptionEventId' : IDL.Text,
    'endTime' : IDL.Int,
    'subscriptionTimeInterval' : SubscriptionTimeInterval,
    'writerPrincipalId' : IDL.Text,
    'paymentFee' : IDL.Nat32,
    'readerPrincipalId' : IDL.Text,
  });
  const WriterSubscriptionDetails = IDL.Record({
    'writerSubscriptions' : IDL.Vec(SubscriptionEvent),
    'weeklyFee' : IDL.Opt(IDL.Nat32),
    'writerPrincipalId' : IDL.Text,
    'lifeTimeFee' : IDL.Opt(IDL.Nat32),
    'isSubscriptionActive' : IDL.Bool,
    'annuallyFee' : IDL.Opt(IDL.Nat32),
    'monthlyFee' : IDL.Opt(IDL.Nat32),
  });
  const ReaderSubscriptionDetails = IDL.Record({
    'readerSubscriptions' : IDL.Vec(SubscriptionEvent),
    'readerNotStoppedSubscriptionsWriters' : IDL.Vec(WriterSubscriptionDetails),
    'readerPrincipalId' : IDL.Text,
  });
  const Result_1 = IDL.Variant({
    'ok' : ReaderSubscriptionDetails,
    'err' : IDL.Text,
  });
  const PaymentRequest = IDL.Record({
    'subscriptionEventId' : IDL.Text,
    'subaccount' : IDL.Vec(IDL.Nat8),
    'subscriptionTimeInterval' : SubscriptionTimeInterval,
    'writerPrincipalId' : IDL.Text,
    'expirationDate' : IDL.Int,
    'paymentFee' : IDL.Nat32,
    'readerPrincipalId' : IDL.Text,
  });
  const Result_3 = IDL.Variant({ 'ok' : PaymentRequest, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result = IDL.Variant({
    'ok' : WriterSubscriptionDetails,
    'err' : IDL.Text,
  });
  const UpdateSubscriptionDetailsModel = IDL.Record({
    'weeklyFee' : IDL.Opt(IDL.Nat32),
    'lifeTimeFee' : IDL.Opt(IDL.Nat32),
    'annuallyFee' : IDL.Opt(IDL.Nat32),
    'monthlyFee' : IDL.Opt(IDL.Nat32),
    'publicationInformation' : IDL.Opt(IDL.Tuple(IDL.Principal, IDL.Text)),
  });
  return IDL.Service({
    'checkMyExpiredSubscriptionsNotifications' : IDL.Func([], [], []),
    'completeSubscriptionEvent' : IDL.Func([IDL.Text], [Result_1], []),
    'createPaymentRequestAsReader' : IDL.Func(
        [IDL.Text, SubscriptionTimeInterval, IDL.Nat32],
        [Result_3],
        [],
      ),
    'disperseTokensForSuccessfulSubscription' : IDL.Func(
        [IDL.Text],
        [Result_2],
        [],
      ),
    'expiredNotificationsHeartbeatExternal' : IDL.Func([], [], []),
    'getLatestTimerCall' : IDL.Func([], [IDL.Text, IDL.Text], ['query']),
    'getReaderSubscriptionDetails' : IDL.Func([], [Result_1], ['query']),
    'getWriterSubscriptionDetails' : IDL.Func(
        [IDL.Opt(IDL.Text)],
        [Result],
        ['composite_query'],
      ),
    'getWriterSubscriptionDetailsByPrincipalId' : IDL.Func(
        [IDL.Text],
        [Result],
        ['query'],
      ),
    'isReaderSubscriber' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Bool],
        ['query'],
      ),
    'isWriterActivatedSubscription' : IDL.Func(
        [IDL.Text],
        [IDL.Bool],
        ['query'],
      ),
    'pendingStuckTokensHeartbeatExternal' : IDL.Func([], [], []),
    'pendingTokensHeartbeatExternal' : IDL.Func([], [], []),
    'stopSubscription' : IDL.Func([IDL.Text], [Result_1], []),
    'updateSubscriptionDetails' : IDL.Func(
        [UpdateSubscriptionDetailsModel],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
