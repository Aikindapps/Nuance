export const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const PaymentMethod = IDL.Variant({
    'Fiat' : IDL.Record({
      'stripeSubscriptionId' : IDL.Text,
      'usdAmountCents' : IDL.Text,
    }),
    'Token' : IDL.Null,
  });
  const SubscriptionTimeInterval = IDL.Variant({
    'LifeTime' : IDL.Null,
    'Weekly' : IDL.Null,
    'Monthly' : IDL.Null,
    'Annually' : IDL.Null,
  });
  const SubscriptionEvent = IDL.Record({
    'startTime' : IDL.Int,
    'subscriptionEventId' : IDL.Text,
    'paymentMethod' : IDL.Opt(PaymentMethod),
    'endTime' : IDL.Int,
    'subscriptionTimeInterval' : SubscriptionTimeInterval,
    'stripeCancelAtPeriodEnd' : IDL.Opt(IDL.Bool),
    'writerPrincipalId' : IDL.Text,
    'paymentFee' : IDL.Text,
    'isWriterSubscriptionActive' : IDL.Bool,
    'readerPrincipalId' : IDL.Text,
  });
  const WriterSubscriptionDetails = IDL.Record({
    'stripeAccountId' : IDL.Opt(IDL.Text),
    'writerSubscriptions' : IDL.Vec(SubscriptionEvent),
    'weeklyFee' : IDL.Opt(IDL.Text),
    'paymentReceiverPrincipalId' : IDL.Text,
    'writerPrincipalId' : IDL.Text,
    'lifeTimeFee' : IDL.Opt(IDL.Text),
    'stripePricing' : IDL.Vec(
      IDL.Tuple(SubscriptionTimeInterval, IDL.Text, IDL.Text)
    ),
    'isSubscriptionActive' : IDL.Bool,
    'annuallyFee' : IDL.Opt(IDL.Text),
    'stripeIsActive' : IDL.Bool,
    'monthlyFee' : IDL.Opt(IDL.Text),
  });
  const ReaderSubscriptionDetails = IDL.Record({
    'readerSubscriptions' : IDL.Vec(SubscriptionEvent),
    'readerNotStoppedSubscriptionsWriters' : IDL.Vec(WriterSubscriptionDetails),
    'readerPrincipalId' : IDL.Text,
  });
  const Result_2 = IDL.Variant({
    'ok' : ReaderSubscriptionDetails,
    'err' : IDL.Text,
  });
  const PaymentRequest = IDL.Record({
    'subscriptionEventId' : IDL.Text,
    'subaccount' : IDL.Vec(IDL.Nat8),
    'subscriptionTimeInterval' : SubscriptionTimeInterval,
    'writerPrincipalId' : IDL.Text,
    'expirationDate' : IDL.Int,
    'paymentFee' : IDL.Text,
    'readerPrincipalId' : IDL.Text,
  });
  const Result_5 = IDL.Variant({ 'ok' : PaymentRequest, 'err' : IDL.Text });
  const Result = IDL.Variant({
    'ok' : WriterSubscriptionDetails,
    'err' : IDL.Text,
  });
  const SupportedStandard = IDL.Record({ 'url' : IDL.Text, 'name' : IDL.Text });
  const Icrc28TrustedOriginsResponse = IDL.Record({
    'trusted_origins' : IDL.Vec(IDL.Text),
  });
  const Result_4 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const UpdateSubscriptionDetailsModel = IDL.Record({
    'weeklyFee' : IDL.Opt(IDL.Nat),
    'lifeTimeFee' : IDL.Opt(IDL.Nat),
    'annuallyFee' : IDL.Opt(IDL.Nat),
    'monthlyFee' : IDL.Opt(IDL.Nat),
    'publicationInformation' : IDL.Opt(IDL.Tuple(IDL.Principal, IDL.Text)),
  });
  return IDL.Service({
    'acceptCycles' : IDL.Func([], [], []),
    'authorizeForProxy' : IDL.Func([IDL.Text], [], []),
    'authorizeForProxyAsEditor' : IDL.Func(
        [IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
    'availableCycles' : IDL.Func([], [IDL.Nat], ['query']),
    'cancelStripeSubscription' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [Result_1],
        [],
      ),
    'checkMyExpiredSubscriptionsNotifications' : IDL.Func([], [], []),
    'checkProxyAuthorization' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Bool],
        ['query'],
      ),
    'completeSubscriptionEvent' : IDL.Func([IDL.Text], [Result_2], []),
    'consumeProxyAuthorization' : IDL.Func([IDL.Text], [], []),
    'createPaymentRequestAsReader' : IDL.Func(
        [IDL.Text, SubscriptionTimeInterval, IDL.Nat],
        [Result_5],
        [],
      ),
    'deactivateStripeAccount' : IDL.Func([IDL.Text], [Result], []),
    'disperseTokensForSuccessfulSubscription' : IDL.Func(
        [IDL.Text],
        [Result_1],
        [],
      ),
    'expiredNotificationsHeartbeatExternal' : IDL.Func([], [], []),
    'getAuthorActivePaidSubscriberPrincipalIds' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(IDL.Text)],
        ['query'],
      ),
    'getCanisterVersion' : IDL.Func([], [IDL.Text], ['query']),
    'getLatestTimerCall' : IDL.Func([], [IDL.Text, IDL.Text], ['query']),
    'getMaxMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getMemorySize' : IDL.Func([], [IDL.Nat], ['query']),
    'getPaymentRequestBySubscriptionEventId' : IDL.Func(
        [IDL.Text],
        [Result_5],
        ['query'],
      ),
    'getReaderSubscriptionDetails' : IDL.Func([], [Result_2], ['query']),
    'getStripeAccountId' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
    'getStripeCustomerId' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(IDL.Text)],
        ['query'],
      ),
    'getTrustedProxyPrincipal' : IDL.Func([], [IDL.Text], ['query']),
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
    'icrc10_supported_standards' : IDL.Func(
        [],
        [IDL.Vec(SupportedStandard)],
        ['query'],
      ),
    'icrc28_trusted_origins' : IDL.Func([], [Icrc28TrustedOriginsResponse], []),
    'isReaderSubscriber' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Bool],
        ['query'],
      ),
    'isThereEnoughMemory' : IDL.Func([], [IDL.Bool], ['query']),
    'isWriterActivatedSubscription' : IDL.Func(
        [IDL.Text],
        [IDL.Bool],
        ['query'],
      ),
    'pendingStuckTokensHeartbeatExternal' : IDL.Func([], [], []),
    'pendingTokensHeartbeatExternal' : IDL.Func([], [], []),
    'sendNewSubscriptionNotifications' : IDL.Func([SubscriptionEvent], [], []),
    'sendStopSubscriptionNotification' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'setMaxMemorySize' : IDL.Func([IDL.Nat], [Result_4], []),
    'setStripeAccountActive' : IDL.Func([IDL.Text, IDL.Bool], [Result], []),
    'setStripeSubscriptionCancelState' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Bool, IDL.Int],
        [Result_1],
        [],
      ),
    'setTrustedProxyPrincipal' : IDL.Func([IDL.Text], [Result_3], []),
    'stopSubscription' : IDL.Func([IDL.Text], [Result_2], []),
    'syncStripeSubscription' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          SubscriptionTimeInterval,
          IDL.Text,
          IDL.Text,
          IDL.Int,
          IDL.Text,
        ],
        [Result_1],
        [],
      ),
    'updateStripeAccount' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'updateStripePriceTier' : IDL.Func(
        [IDL.Text, SubscriptionTimeInterval, IDL.Text, IDL.Text],
        [Result],
        [],
      ),
    'updateSubscriptionDetails' : IDL.Func(
        [UpdateSubscriptionDetailsModel],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
