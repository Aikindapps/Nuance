const idlFactory = ({ IDL }) => {
  const SubscriptionTimeInterval = IDL.Variant({
    Annually: IDL.Null,
    LifeTime: IDL.Null,
    Monthly: IDL.Null,
    Weekly: IDL.Null,
  });
  const PaymentMethod = IDL.Variant({
    Token: IDL.Null,
    Fiat: IDL.Record({
      stripeSubscriptionId: IDL.Text,
      usdAmountCents: IDL.Text,
    }),
  });
  const SubscriptionEvent = IDL.Record({
    subscriptionEventId: IDL.Text,
    writerPrincipalId: IDL.Text,
    readerPrincipalId: IDL.Text,
    subscriptionTimeInterval: SubscriptionTimeInterval,
    paymentFee: IDL.Text,
    startTime: IDL.Int,
    endTime: IDL.Int,
    isWriterSubscriptionActive: IDL.Bool,
    paymentMethod: IDL.Opt(PaymentMethod),
    stripeCancelAtPeriodEnd: IDL.Opt(IDL.Bool),
  });
  const WriterSubscriptionDetails = IDL.Record({
    writerPrincipalId: IDL.Text,
    paymentReceiverPrincipalId: IDL.Text,
    weeklyFee: IDL.Opt(IDL.Text),
    monthlyFee: IDL.Opt(IDL.Text),
    annuallyFee: IDL.Opt(IDL.Text),
    lifeTimeFee: IDL.Opt(IDL.Text),
    isSubscriptionActive: IDL.Bool,
    writerSubscriptions: IDL.Vec(SubscriptionEvent),
    stripeAccountId: IDL.Opt(IDL.Text),
    stripeIsActive: IDL.Bool,
    stripePricing: IDL.Vec(IDL.Tuple(SubscriptionTimeInterval, IDL.Text, IDL.Text)),
  });
  const Result = IDL.Variant({
    ok: WriterSubscriptionDetails,
    err: IDL.Text,
  });
  const Result_ok = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  return IDL.Service({
    authorizeForProxy: IDL.Func([IDL.Text], [], []),
    checkProxyAuthorization: IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], ['query']),
    consumeProxyAuthorization: IDL.Func([IDL.Text], [], []),
    updateStripeAccount: IDL.Func([IDL.Text, IDL.Text], [Result], []),
    setStripeAccountActive: IDL.Func([IDL.Text, IDL.Bool], [Result], []),
    updateStripePriceTier: IDL.Func([IDL.Text, SubscriptionTimeInterval, IDL.Text, IDL.Text], [Result], []),
    deactivateStripeAccount: IDL.Func([IDL.Text], [Result], []),
    syncStripeSubscription: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, SubscriptionTimeInterval, IDL.Text, IDL.Text, IDL.Int, IDL.Text],
      [Result_ok],
      []
    ),
    cancelStripeSubscription: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
      [Result_ok],
      []
    ),
    setStripeSubscriptionCancelState: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Bool, IDL.Int],
      [Result_ok],
      []
    ),
    getStripeAccountId: IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
    getStripeCustomerId: IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
    isReaderSubscriber: IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], ['query']),
    setTrustedProxyPrincipal: IDL.Func([IDL.Text], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })], []),
    getTrustedProxyPrincipal: IDL.Func([], [IDL.Text], ['query']),
  });
};
module.exports = { idlFactory };
