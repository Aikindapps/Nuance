import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getSubscriptionActor,
  getUserActor,
  getIcrc1Actor,
  getPostCoreActor,
} from '../services/actorService';
import { SubscriptionHistoryItem, UserListItem } from '../types/types';
import {
  ReaderSubscriptionDetails,
  SubscriptionEvent,
  SubscriptionTimeInterval,
  WriterSubscriptionDetails,
} from '../../declarations/Subscription/Subscription.did';
import { Principal } from '@dfinity/principal';
import { toastError } from '../services/toastService';
import { getErrorType } from '../services/errorService';
import { NUA_CANISTER_ID } from '../shared/constants';
import { Toast } from 'react-bootstrap';
import { useAuthStore } from './authStore';
import { User } from '../services/ext-service/ext_v2.did';
import { Agent } from '@dfinity/agent';
import {
  onboardWriter,
  createPriceTier,
  createCheckoutSession,
  createBillingPortalSession,
} from '../services/stripeProxyService';

const SUBSCRIPTION_CANISTER_ID = process.env.SUBSCRIPTION_CANISTER_ID || '';


// how a subscription was paid; drives the currency/units of fee fields below
export type PaymentMethodKind = 'nua' | 'stripe';

export type SubscribedWriterItem = {
  userListItem: UserListItem;
  subscriptionStartDate: number;
  subscriptionEndDate: number;
  period: string;
  feePerPeriod: number; // e8s when paymentMethod is 'nua', USD cents when 'stripe'
  totalFees: number; // same unit as feePerPeriod
  isPublication: boolean;
  isSubscriptionActive: boolean;
  paymentMethod: PaymentMethodKind;
  stripeCancelAtPeriodEnd: boolean; // only meaningful for 'stripe'
};

export type ExpiredSubscriptionItem = {
  userListItem: UserListItem;
  subscriptionStartDate: number;
  subscriptionEndDate: number;
  period: string;
  feePerPeriod: number; // e8s when paymentMethod is 'nua', USD cents when 'stripe'
  totalFees: number; // same unit as feePerPeriod
  isPublication: boolean;
  isSubscriptionActive: boolean;
  paymentMethod: PaymentMethodKind;
};

export type ReaderSubscriptionDetailsConverted = {
  activeSubscriptions: SubscribedWriterItem[];
  expiredSubscriptions: ExpiredSubscriptionItem[];
};

// full details of a reader's latest membership to a given writer, for the Manage Membership modal
export type MembershipDetails = {
  paymentMethod: 'stripe' | 'nua';
  subscriptionTimeInterval: SubscriptionTimeInterval;
  startDate: number; // milliseconds
  endDate: number; // milliseconds
  isActive: boolean; // now < endDate
  stripeCancelAtPeriodEnd: boolean; // only meaningful for Stripe memberships
};

export type SubscribedReaderItem = {
  userListItem: UserListItem;
  subscriptionStartDate: number;
  period: string;
  feePerPeriod: number; // e8s when paymentMethod is 'nua', USD cents when 'stripe'
  totalFees: number; // same unit as feePerPeriod
  paymentMethod: PaymentMethodKind;
};

export type WriterSubscriptionDetailsConverted = {
  subscribedReaders: SubscribedReaderItem[];
  numberOfSubscribersHistoricalData: [number, number][];
  subscribersCount: number;
  totalNuaEarned: number; // e8s, NUA-paid subscriptions only
  totalUsdEarned: number; // USD cents, Stripe-paid subscriptions only
  lastWeekNewSubscribers: number;
  writerPaymentInfo: WriterSubscriptionDetails;
};

// Determines how a single subscription event was paid and the amount in that
// method's native unit (NUA e8s, or USD cents for Stripe).
const getEventPayment = (
  event: SubscriptionEvent
): { method: PaymentMethodKind; amount: number } => {
  const pm = event.paymentMethod[0];
  if (pm && 'Fiat' in pm) {
    return { method: 'stripe', amount: Number(pm.Fiat.usdAmountCents) };
  }
  return { method: 'nua', amount: Number(event.paymentFee) };
};

export const getPeriodBySubscriptionTimeInterval = (
  timeInterval: SubscriptionTimeInterval
) => {
  if ('LifeTime' in timeInterval) {
    return 'Life time';
  } else if ('Weekly' in timeInterval) {
    return 'Week';
  } else if ('Monthly' in timeInterval) {
    return 'Month';
  } else {
    return 'Annual';
  }
};

const convertReaderSubscriptionDetails = async (
  details: ReaderSubscriptionDetails
): Promise<ReaderSubscriptionDetailsConverted> => {
  let userActor = await getUserActor();
  let postCoreActor = await getPostCoreActor();
  //firstly, fetch all the user list items from the user canister
  let userListItemsMap = new Map<string, UserListItem>();
  let allPrincipalIdsIncludingDuplicates = details.readerSubscriptions.map(
    (event) => event.writerPrincipalId
  );
  let allPrincipalIds = [...new Set(allPrincipalIdsIncludingDuplicates)];
  let [allUserListItems, allPublications] = await Promise.all([
    userActor.getUsersByPrincipals(allPrincipalIds),
    postCoreActor.getPublicationCanisters(),
  ]);
  //put all the user list items mapped to the principal ids
  for (const userListItem of allUserListItems) {
    userListItemsMap.set(userListItem.principal, userListItem);
  }
  const activeSet = new Set(
    details.readerNotStoppedSubscriptionsWriters.map((val) => val.writerPrincipalId)
  );
  const publicationIds = new Set(allPublications.map((val) => val[1]));

  //group the reader's events by writer so each writer becomes a single row
  const eventsByWriter = new Map<string, SubscriptionEvent[]>();
  for (const event of details.readerSubscriptions) {
    const arr = eventsByWriter.get(event.writerPrincipalId) ?? [];
    arr.push(event);
    eventsByWriter.set(event.writerPrincipalId, arr);
  }

  const activeSubscriptions: SubscribedWriterItem[] = [];
  const expiredSubscriptions: ExpiredSubscriptionItem[] = [];

  for (const [writerPrincipalId, events] of eventsByWriter) {
    const writerUserListItem = userListItemsMap.get(writerPrincipalId) as UserListItem;
    //the most recent event determines the current payment method and fee
    const latest = events.reduce((a, b) =>
      Number(b.startTime) > Number(a.startTime) ? b : a
    );
    const latestPayment = getEventPayment(latest);
    //sum only the events paid with the same method, to avoid mixing NUA and USD
    const totalFees = events.reduce((sum, event) => {
      const payment = getEventPayment(event);
      return payment.method === latestPayment.method ? sum + payment.amount : sum;
    }, 0);
    const isPublication = publicationIds.has(writerPrincipalId);

    if (activeSet.has(writerPrincipalId)) {
      activeSubscriptions.push({
        userListItem: writerUserListItem,
        subscriptionStartDate: Number(latest.startTime),
        subscriptionEndDate: Number(latest.endTime),
        period: getPeriodBySubscriptionTimeInterval(latest.subscriptionTimeInterval),
        feePerPeriod: latestPayment.amount,
        totalFees,
        isPublication,
        isSubscriptionActive: latest.isWriterSubscriptionActive,
        paymentMethod: latestPayment.method,
        stripeCancelAtPeriodEnd: latest.stripeCancelAtPeriodEnd[0] ?? false,
      });
    } else {
      expiredSubscriptions.push({
        userListItem: writerUserListItem,
        subscriptionStartDate: Number(latest.startTime),
        subscriptionEndDate: Number(latest.endTime),
        period: getPeriodBySubscriptionTimeInterval(latest.subscriptionTimeInterval),
        feePerPeriod: latestPayment.amount,
        totalFees,
        isPublication,
        isSubscriptionActive: latest.isWriterSubscriptionActive,
        paymentMethod: latestPayment.method,
      });
    }
  }

  return {
    activeSubscriptions,
    expiredSubscriptions,
  };
};

const convertWriterSubscriptionDetails = async (
  details: WriterSubscriptionDetails
): Promise<WriterSubscriptionDetailsConverted> => {
  let userActor = await getUserActor();
  let now = new Date().getTime();
  let activeSubscribersPrincipalIds = details.writerSubscriptions
    .filter((event) => {
      return event.endTime > now;
    })
    .map((event) => event.readerPrincipalId);
  let subscribedUserListItems = await userActor.getUsersByPrincipals(
    activeSubscribersPrincipalIds
  );
  //key: reader principal id, value: UserListItem
  let subscribedUserListItemsMap = new Map<string, UserListItem>();
  subscribedUserListItems.forEach((userListItem) => {
    subscribedUserListItemsMap.set(userListItem.principal, userListItem);
  });

  const activeSet = new Set(activeSubscribersPrincipalIds);

  //group active subscribers' events by reader so each reader becomes a single row
  const eventsByReader = new Map<string, SubscriptionEvent[]>();
  for (const event of details.writerSubscriptions) {
    if (!activeSet.has(event.readerPrincipalId)) {
      continue;
    }
    const arr = eventsByReader.get(event.readerPrincipalId) ?? [];
    arr.push(event);
    eventsByReader.set(event.readerPrincipalId, arr);
  }

  const subscribedReaders: SubscribedReaderItem[] = [];
  for (const [readerPrincipalId, events] of eventsByReader) {
    const readerUserListItem = subscribedUserListItemsMap.get(
      readerPrincipalId
    ) as UserListItem;
    const latest = events.reduce((a, b) =>
      Number(b.startTime) > Number(a.startTime) ? b : a
    );
    const latestPayment = getEventPayment(latest);
    const totalFees = events.reduce((sum, event) => {
      const payment = getEventPayment(event);
      return payment.method === latestPayment.method ? sum + payment.amount : sum;
    }, 0);
    subscribedReaders.push({
      userListItem: readerUserListItem,
      subscriptionStartDate: Number(latest.startTime),
      period: getPeriodBySubscriptionTimeInterval(latest.subscriptionTimeInterval),
      feePerPeriod: latestPayment.amount,
      totalFees,
      paymentMethod: latestPayment.method,
    });
  }

  //earnings, split by currency (NUA vs USD), across all events
  var totalNuaEarned = 0; // e8s
  var totalUsdEarned = 0; // USD cents
  //calculate the number of subscribers 1 week ago
  let oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  let oneWeekAgoSubscribersCounter = 0;
  //historical data for number of subscribers
  let breakPoints = new Map<number, number>();
  details.writerSubscriptions.forEach((subscriptionEvent) => {
    breakPoints.set(Number(subscriptionEvent.startTime), 0);
    breakPoints.set(Number(subscriptionEvent.endTime), 0);
  });
  breakPoints.set(new Date().getTime(), 0);

  for (const subscriptionEvent of details.writerSubscriptions) {
    const payment = getEventPayment(subscriptionEvent);
    if (payment.method === 'stripe') {
      totalUsdEarned += payment.amount;
    } else {
      totalNuaEarned += payment.amount;
    }
    for (const breakPoint of breakPoints) {
      if (
        breakPoint[0] >= Number(subscriptionEvent.startTime) &&
        breakPoint[0] <= Number(subscriptionEvent.endTime)
      ) {
        breakPoints.set(breakPoint[0], breakPoint[1] + 1);
      }
    }
    if (
      oneWeekAgo >= Number(subscriptionEvent.startTime) &&
      oneWeekAgo <= Number(subscriptionEvent.endTime)
    ) {
      oneWeekAgoSubscribersCounter += 1;
    }
  }

  return {
    subscribedReaders,
    numberOfSubscribersHistoricalData: Array.from(breakPoints),
    subscribersCount: subscribedReaders.length,
    totalNuaEarned,
    totalUsdEarned,
    lastWeekNewSubscribers: subscribedReaders.length - oneWeekAgoSubscribersCounter,
    writerPaymentInfo: { ...details, writerSubscriptions: [] },
  };
};

const handleError = (err: any, preText?: string) => {
  const errorType = getErrorType(err);
  toastError(err, preText);
};

const isLocal: boolean =
  window.location.origin.includes('localhost') ||
  window.location.origin.includes('127.0.0.1');
export interface SubscriptionStore {
  getMySubscriptionHistoryAsReader: () => Promise<ReaderSubscriptionDetailsConverted | void>;
  getMySubscriptionDetailsAsWriter: () => Promise<WriterSubscriptionDetailsConverted | void>;
  getPublicationSubscriptionDetailsAsEditor: (
    publicationCanisterId: string
  ) => Promise<WriterSubscriptionDetailsConverted | void>;
  getWriterSubscriptionDetailsByPrincipalId: (
    principal: string,
    agent?: Agent
  ) => Promise<WriterSubscriptionDetails | void>;
  getMySubscriptionTransactions: (agent?: Agent) => Promise<SubscriptionHistoryItem[]>;
  updateSubscriptionDetails: (
    agent?: Agent,
    weeklyFee?: number,
    monthlyFee?: number,
    annuallyFee?: number,
    lifeTimeFee?: number,
    publicationInformation?: {
      paymentReceiverPrincipal: Principal;
      publicationCanisterId: string;
    }
  ) => Promise<WriterSubscriptionDetailsConverted | void>;
  stopSubscriptionAsReader: (
    writerPrincipalId: string
  ) => Promise<ReaderSubscriptionDetailsConverted | void>;
  subscribeWriter: (
    writerPrincipalId: string,
    subscriptionTimeInterval: SubscriptionTimeInterval,
    amount: number
  ) => Promise<ReaderSubscriptionDetailsConverted | void>;
  // Stripe — writer connects a Stripe account; returns the onboarding URL to redirect to.
  // For publications, pass publicationCanisterId (== writerPrincipalId) to use the editor auth flow.
  activateStripeForWriter: (
    writerPrincipalId: string,
    agent?: Agent,
    publicationCanisterId?: string
  ) => Promise<string | void>;
  // Stripe — writer creates/updates a price tier for an interval (USD cents as string)
  createStripePriceTier: (
    writerPrincipalId: string,
    interval: 'Weekly' | 'Monthly' | 'Annually' | 'LifeTime',
    usdAmountCents: string,
    agent?: Agent,
    publicationCanisterId?: string
  ) => Promise<boolean>;
  // Stripe — reader starts a checkout session; returns the Stripe Checkout URL to redirect to
  subscribeWriterWithStripe: (
    priceId: string,
    writerPrincipalId: string,
    readerPrincipalId: string,
    agent?: Agent
  ) => Promise<string | void>;
  // Stripe — reader opens the billing portal; returns the portal URL to redirect to
  openStripeBillingPortal: (
    readerPrincipalId: string,
    agent?: Agent
  ) => Promise<string | void>;
  // returns how the reader's currently-active subscription to a writer is paid
  getActiveSubscriptionPaymentMethod: (
    writerPrincipalId: string
  ) => Promise<'stripe' | 'nua' | 'none'>;
  // returns full details of the reader's latest membership to a writer (for Manage Membership)
  getMembershipDetailsForWriter: (
    writerPrincipalId: string
  ) => Promise<MembershipDetails | null>;
}

// Encapsulates and abstracts AuthClient
// identity has a value when authenticated, otherwise it's undefined
// to get the principal, use identity?.getPrincipal()
const createSubscriptionStore:
  | StateCreator<SubscriptionStore>
  | StoreApi<SubscriptionStore> = (set, get) => ({
    //returns the subscription history of the reader
    getMySubscriptionHistoryAsReader:
      async (): Promise<ReaderSubscriptionDetailsConverted | void> => {
        try {
          let subscriptionActor = await getSubscriptionActor();
          let details = await subscriptionActor.getReaderSubscriptionDetails();
          if ('ok' in details) {
            return await convertReaderSubscriptionDetails(details.ok);
          }
        } catch (error) {
          handleError(error, 'Unexpected error: ');
        }
      },
    //returns the subscription details of the writer by the principal id
    getWriterSubscriptionDetailsByPrincipalId: async (
      principal: string,
      agent?: Agent
    ): Promise<WriterSubscriptionDetails | void> => {
      try {
        let subscriptionActor = await getSubscriptionActor(agent);
        let writerDetails =
          await subscriptionActor.getWriterSubscriptionDetailsByPrincipalId(
            principal
          );
        if ('ok' in writerDetails) {
          return writerDetails.ok;
        }
      } catch (error) { }
    },

    //returns an array of history item for wallet screen to use
    getMySubscriptionTransactions: async (agent?: Agent): Promise<
      SubscriptionHistoryItem[]
    > => {
      try {
        let subscriptionActor = await getSubscriptionActor(agent);
        let [readerDetails, writerDetails] = await Promise.all([
          subscriptionActor.getReaderSubscriptionDetails(),
          subscriptionActor.getWriterSubscriptionDetails([]),
        ]);
        let allPrincipalIds: string[] = [];
        let userListItemsMap = new Map<string, UserListItem>();
        if ('ok' in readerDetails) {
          for (const readerSubscriptionEvent of readerDetails.ok
            .readerSubscriptions) {
            if (
              !allPrincipalIds.includes(readerSubscriptionEvent.writerPrincipalId)
            ) {
              allPrincipalIds.push(readerSubscriptionEvent.writerPrincipalId);
            }
          }
        }
        if ('ok' in writerDetails) {
          for (const writerSubscriptionEvent of writerDetails.ok
            .writerSubscriptions) {
            if (
              !allPrincipalIds.includes(writerSubscriptionEvent.readerPrincipalId)
            ) {
              allPrincipalIds.push(writerSubscriptionEvent.readerPrincipalId);
            }
          }
        }
        let userActor = await getUserActor(agent);
        let allUserListItems = await userActor.getUsersByPrincipals(
          allPrincipalIds
        );
        for (const userListItem of allUserListItems) {
          userListItemsMap.set(userListItem.principal, userListItem);
        }
        //if here, all the necessary UserListItem values are fetched from backend
        let readerTransactionDetails: SubscriptionHistoryItem[] = [];
        if ('ok' in readerDetails) {
          for (const readerSubscriptionEvent of readerDetails.ok
            .readerSubscriptions) {
            const payment = getEventPayment(readerSubscriptionEvent);
            readerTransactionDetails.push({
              date: Number(readerSubscriptionEvent.startTime).toString(),
              subscriptionFee: payment.amount,
              handle: (
                userListItemsMap.get(
                  readerSubscriptionEvent.writerPrincipalId
                ) as UserListItem
              ).handle,
              isWriter: false,
              paymentMethod: payment.method,
            });
          }
        }
        let writerTransactionDetails: SubscriptionHistoryItem[] = [];
        if ('ok' in writerDetails) {
          for (const writerSubscriptionEvent of writerDetails.ok
            .writerSubscriptions) {
            const payment = getEventPayment(writerSubscriptionEvent);
            writerTransactionDetails.push({
              date: Number(writerSubscriptionEvent.startTime).toString(),
              subscriptionFee: payment.amount,
              handle: (
                userListItemsMap.get(
                  writerSubscriptionEvent.readerPrincipalId
                ) as UserListItem
              ).handle,
              isWriter: true,
              paymentMethod: payment.method,
            });
          }
        }
        return [...readerTransactionDetails, ...writerTransactionDetails];
      } catch (error) {
        return [];
      }
    },

    //returns the subscription details of the user
    //should be called by the user - doesn't accept any principal id
    //it also returns the historical subscription data
    getMySubscriptionDetailsAsWriter:
      async (): Promise<WriterSubscriptionDetailsConverted | void> => {
        try {
          let subscriptionActor = await getSubscriptionActor();
          let writerDetails =
            await subscriptionActor.getWriterSubscriptionDetails([]);
          if ('ok' in writerDetails) {
            return await convertWriterSubscriptionDetails(writerDetails.ok);
          }
        } catch (error) {
          handleError(error, 'Unexpected error: ');
        }
      },
    //editors uses this method to get the publication subscription details
    getPublicationSubscriptionDetailsAsEditor: async (
      publicationCanisterId: string
    ): Promise<WriterSubscriptionDetailsConverted | void> => {
      try {
        let subscriptionActor = await getSubscriptionActor();
        let writerDetails = await subscriptionActor.getWriterSubscriptionDetails([
          publicationCanisterId,
        ]);
        if ('ok' in writerDetails) {
          return await convertWriterSubscriptionDetails(writerDetails.ok);
        }
      } catch (error) {
        handleError(error, 'Unexpected error: ');
      }
    },
    //regular users or editors calls this method to update the subscription details
    updateSubscriptionDetails: async (
      agent?: Agent,
      weeklyFee?: number,
      monthlyFee?: number,
      annuallyFee?: number,
      lifeTimeFee?: number,
      publicationInformation?: {
        paymentReceiverPrincipal: Principal;
        publicationCanisterId: string;
      },
    ): Promise<WriterSubscriptionDetailsConverted | void> => {
      try {
        let subscriptionActor = await getSubscriptionActor(agent);
        let response = await subscriptionActor.updateSubscriptionDetails({
          publicationInformation: publicationInformation
            ? [
              [
                publicationInformation.paymentReceiverPrincipal,
                publicationInformation.publicationCanisterId,
              ],
            ]
            : [],
          weeklyFee: weeklyFee ? [BigInt(weeklyFee)] : [],
          lifeTimeFee: lifeTimeFee ? [BigInt(lifeTimeFee)] : [],
          annuallyFee: annuallyFee ? [BigInt(annuallyFee)] : [],
          monthlyFee: monthlyFee ? [BigInt(monthlyFee)] : [],
        });
        if ('ok' in response) {
          return await convertWriterSubscriptionDetails(response.ok);
        } else {
          handleError(response.err);
        }
      } catch (error) {
        handleError(error, 'Unexpected error: ');
      }
    },
    //should be called by reader to subscribe to a writer
    subscribeWriter: async (
      writerPrincipalId: string,
      subscriptionTimeInterval: SubscriptionTimeInterval,
      amount: number
    ): Promise<ReaderSubscriptionDetailsConverted | void> => {
      try {
        const subscriptionActor = await getSubscriptionActor();
        const paymentRequest =
          await subscriptionActor.createPaymentRequestAsReader(
            writerPrincipalId,
            subscriptionTimeInterval,
            BigInt(amount)
          );
        if ('ok' in paymentRequest) {
          // Payment request has successfully been created
          // Transfer the tokens to the subaccount
          //in order to determine what to do, get the restricted token balance value of the user
          let restrictedTokenBalance =
            useAuthStore.getState().restrictedTokenBalance;
          const nuaLedgerCanister = await getIcrc1Actor(NUA_CANISTER_ID);

          console.log('restrictedTokenBalance: ', restrictedTokenBalance);

          const restrictedNuaUsed = restrictedTokenBalance > Math.pow(10, 6);
          var isPaymentSuccessful = false;
          var errorMessage = '';
          var readerSubscriptionDetailsNew:
            | ReaderSubscriptionDetails
            | undefined = undefined;

          if (restrictedTokenBalance > Math.pow(10, 6)) {
            //check if the restricted tokenBalance is enough
            if (
              restrictedTokenBalance >=
              Number(paymentRequest.ok.paymentFee) + Math.pow(10, 6)
            ) {
              //use only the restricted NUA
              console.log('only using the restricted NUA');
              let userActor = await getUserActor();
              let transferAndCompleteResponse =
                await userActor.spendRestrictedTokensForSubscription(
                  paymentRequest.ok.subscriptionEventId,
                  BigInt(paymentRequest.ok.paymentFee)
                );
              if ('ok' in transferAndCompleteResponse) {
                isPaymentSuccessful = true;
                readerSubscriptionDetailsNew = transferAndCompleteResponse.ok;
              } else {
                errorMessage = transferAndCompleteResponse.err;
              }
            } else {
              //use both regular NUA & restricted NUA
              console.log('using both restricted & regular nua');
              let userActor = await getUserActor();
              //transfer the regular tokens first
              let regularTransferResponse =
                await nuaLedgerCanister.icrc1_transfer({
                  to: {
                    owner: Principal.fromText(SUBSCRIPTION_CANISTER_ID),
                    subaccount: [paymentRequest.ok.subaccount],
                  },
                  fee: [BigInt(100000)],
                  memo: [],
                  from_subaccount: [],
                  created_at_time: [],
                  amount: BigInt(
                    Number(paymentRequest.ok.paymentFee) -
                    restrictedTokenBalance +
                    Math.pow(10, 6)
                  ),
                });
              if ('Ok' in regularTransferResponse) {
                //regular tokens transferred successfully
                //run the spendRestrictedTokensForSubscription to complete the payment
                let restrictedTransferAndCompleteResponse =
                  await userActor.spendRestrictedTokensForSubscription(
                    paymentRequest.ok.subscriptionEventId,
                    BigInt(restrictedTokenBalance - Math.pow(10, 6))
                  );
                if ('ok' in restrictedTransferAndCompleteResponse) {
                  isPaymentSuccessful = true;
                  readerSubscriptionDetailsNew =
                    restrictedTransferAndCompleteResponse.ok;
                } else {
                  errorMessage = restrictedTransferAndCompleteResponse.err;
                }
              } else {
                errorMessage = regularTransferResponse.Err.toString();
              }
            }
          } else {
            //don't use the restricted tokens
            //simply transfer the tokens
            console.log('using only regular nua');
            const transferResponse = await nuaLedgerCanister.icrc1_transfer({
              to: {
                owner: Principal.fromText(SUBSCRIPTION_CANISTER_ID),
                subaccount: [paymentRequest.ok.subaccount],
              },
              fee: [BigInt(100000)],
              memo: [],
              from_subaccount: [],
              created_at_time: [],
              amount: BigInt(paymentRequest.ok.paymentFee),
            });
            if ('Ok' in transferResponse) {
              isPaymentSuccessful = true;
            } else {
              errorMessage = `Token transfer failed: ${transferResponse.Err.toString()}`;
            }
          }

          if (isPaymentSuccessful) {
            // Transfer is also successful
            // if the restricted NUA used, no need to run the completeSubscriptionEvent
            // because User canister already handles that
            if (!restrictedNuaUsed) {
              // Complete the subscription event and return the new readerDetails value
              const response = await subscriptionActor.completeSubscriptionEvent(
                paymentRequest.ok.subscriptionEventId
              );
              if ('ok' in response) {
                readerSubscriptionDetailsNew = response.ok;
              } else {
                errorMessage = `Subscription completion failed: ${response.err}`;
              }
            }

            if (readerSubscriptionDetailsNew) {
              //fire and forget the disperse function
              subscriptionActor.disperseTokensForSuccessfulSubscription(
                paymentRequest.ok.subscriptionEventId
              );
              return await convertReaderSubscriptionDetails(
                readerSubscriptionDetailsNew
              );
            } else {
              //call the function to get back sent tokens
              subscriptionActor.pendingStuckTokensHeartbeatExternal();
              toastError(errorMessage);
            }
          } else {
            toastError(errorMessage);
          }
        } else {
          const errorMessage = `Payment request failed: ${paymentRequest.err}`;
          toastError(errorMessage);
        }
      } catch (error: any) {
        const errorMessage = `Unexpected error: ${error.message || error.toString()
          }`;
        console.error(errorMessage);
      }
    },

    //should be called by the reader to stop the existing subscription
    stopSubscriptionAsReader: async (
      writerPrincipalId: string
    ): Promise<ReaderSubscriptionDetailsConverted | void> => {
      try {
        let subscriptionActor = await getSubscriptionActor();
        let response = await subscriptionActor.stopSubscription(
          writerPrincipalId
        );
        if ('ok' in response) {
          return await convertReaderSubscriptionDetails(response.ok);
        }
      } catch (error) {
        handleError(error, 'Unexpected error: ');
      }
    },

    //writer connects a Stripe account - returns the onboarding URL to redirect to
    activateStripeForWriter: async (
      writerPrincipalId: string,
      agent?: Agent,
      publicationCanisterId?: string
    ): Promise<string | void> => {
      try {
        const { url } = await onboardWriter(writerPrincipalId, agent, publicationCanisterId);
        return url;
      } catch (error) {
        handleError(error, 'Unexpected error: ');
      }
    },

    //writer creates or updates a Stripe price tier for the given interval
    createStripePriceTier: async (
      writerPrincipalId: string,
      interval: 'Weekly' | 'Monthly' | 'Annually' | 'LifeTime',
      usdAmountCents: string,
      agent?: Agent,
      publicationCanisterId?: string
    ): Promise<boolean> => {
      try {
        await createPriceTier(
          writerPrincipalId,
          interval,
          usdAmountCents,
          agent,
          publicationCanisterId
        );
        return true;
      } catch (error) {
        handleError(error, 'Unexpected error: ');
        return false;
      }
    },

    //reader starts a Stripe checkout - returns the Stripe Checkout URL to redirect to
    subscribeWriterWithStripe: async (
      priceId: string,
      writerPrincipalId: string,
      readerPrincipalId: string,
      agent?: Agent
    ): Promise<string | void> => {
      try {
        const { url } = await createCheckoutSession(
          priceId,
          writerPrincipalId,
          readerPrincipalId,
          agent
        );
        return url;
      } catch (error) {
        handleError(error, 'Unexpected error: ');
      }
    },

    //reader opens the Stripe billing portal - returns the portal URL to redirect to
    openStripeBillingPortal: async (
      readerPrincipalId: string,
      agent?: Agent
    ): Promise<string | void> => {
      try {
        const { url } = await createBillingPortalSession(readerPrincipalId, agent);
        return url;
      } catch (error) {
        handleError(error, 'Unexpected error: ');
      }
    },

    //inspects the reader's active subscription to a writer and reports how it is paid
    getActiveSubscriptionPaymentMethod: async (
      writerPrincipalId: string
    ): Promise<'stripe' | 'nua' | 'none'> => {
      try {
        const subscriptionActor = await getSubscriptionActor();
        const details = await subscriptionActor.getReaderSubscriptionDetails();
        if ('ok' in details) {
          const now = Date.now();
          let foundActive = false;
          for (const event of details.ok.readerSubscriptions) {
            if (
              event.writerPrincipalId === writerPrincipalId &&
              now < Number(event.endTime)
            ) {
              foundActive = true;
              const method = event.paymentMethod[0];
              if (method && 'Fiat' in method) {
                return 'stripe';
              }
            }
          }
          return foundActive ? 'nua' : 'none';
        }
        return 'none';
      } catch (error) {
        handleError(error, 'Unexpected error: ');
        return 'none';
      }
    },

    //returns full details of the reader's latest membership to a writer
    getMembershipDetailsForWriter: async (
      writerPrincipalId: string
    ): Promise<MembershipDetails | null> => {
      try {
        const subscriptionActor = await getSubscriptionActor();
        const details = await subscriptionActor.getReaderSubscriptionDetails();
        if ('ok' in details) {
          // pick the most recent event to this writer (highest endTime)
          let latest: (typeof details.ok.readerSubscriptions)[number] | null = null;
          for (const event of details.ok.readerSubscriptions) {
            if (event.writerPrincipalId === writerPrincipalId) {
              if (!latest || Number(event.endTime) > Number(latest.endTime)) {
                latest = event;
              }
            }
          }
          if (latest) {
            const pm = latest.paymentMethod[0];
            const isStripe = !!pm && 'Fiat' in pm;
            return {
              paymentMethod: isStripe ? 'stripe' : 'nua',
              subscriptionTimeInterval: latest.subscriptionTimeInterval,
              startDate: Number(latest.startTime),
              endDate: Number(latest.endTime),
              isActive: Date.now() < Number(latest.endTime),
              stripeCancelAtPeriodEnd: latest.stripeCancelAtPeriodEnd[0] ?? false,
            };
          }
        }
        return null;
      } catch (error) {
        handleError(error, 'Unexpected error: ');
        return null;
      }
    },
  });

export const useSubscriptionStore = create<SubscriptionStore>(
  persist(
    (set, get, api) => ({
      ...createSubscriptionStore(
        set as SetState<SubscriptionStore>,
        get as GetState<SubscriptionStore>,
        api as StoreApi<SubscriptionStore>
      ),
    }),
    {
      name: 'subscriptionStore',
      getStorage: () => sessionStorage,
    }
  )
);