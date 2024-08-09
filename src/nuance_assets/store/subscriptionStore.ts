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
import { SUBSCRIPTION_CANISTER_ID } from '../shared/canister_ids';

export type SubscribedWriterItem = {
  userListItem: UserListItem;
  subscriptionStartDate: number;
  period: string;
  feePerPeriod: number;
  totalFees: number;
  isPublication: boolean;
  isSubscriptionActive: boolean;
};

export type ExpiredSubscriptionItem = {
  userListItem: UserListItem;
  subscriptionStartDate: number;
  subscriptionEndDate: number;
  period: string;
  feePerPeriod: number;
  totalFees: number;
  isPublication: boolean;
  isSubscriptionActive: boolean;
};

export type ReaderSubscriptionDetailsConverted = {
  activeSubscriptions: SubscribedWriterItem[];
  expiredSubscriptions: ExpiredSubscriptionItem[];
};

export type SubscribedReaderItem = {
  userListItem: UserListItem;
  subscriptionStartDate: number;
  period: string;
  feePerPeriod: number;
  totalFees: number;
};

export type WriterSubscriptionDetailsConverted = {
  subscribedReaders: SubscribedReaderItem[];
  numberOfSubscribersHistoricalData: [number, number][];
  subscribersCount: number;
  totalNuaEarned: number;
  lastWeekNewSubscribers: number;
  writerPaymentInfo: WriterSubscriptionDetails;
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
  //active
  let activeSubscriptionsWriterPrincipalIds =
    details.readerNotStoppedSubscriptionsWriters.map(
      (val) => val.writerPrincipalId
    );
  //key: writer principal id, value: SubscribedWriterItem
  let activeSubscriptionItemsMap = new Map<string, SubscribedWriterItem>();
  let expiredSubscriptionItemsArray: ExpiredSubscriptionItem[] = [];
  for (const subscriptionEvent of details.readerSubscriptions) {
    if (
      activeSubscriptionsWriterPrincipalIds.includes(
        subscriptionEvent.writerPrincipalId
      )
    ) {
      //the reader is still a subscriber
      let subscribedWriterItem = activeSubscriptionItemsMap.get(
        subscriptionEvent.writerPrincipalId
      );
      //the UserListItem of the writer
      let writerUserListItem = userListItemsMap.get(
        subscriptionEvent.writerPrincipalId
      ) as UserListItem;
      if (subscribedWriterItem) {
        //the item is already in the map
        //update the values if needed
        if (
          subscriptionEvent.startTime >
          subscribedWriterItem.subscriptionStartDate
        ) {
          //this event is more recent
          //update the related values
          subscribedWriterItem = {
            ...subscribedWriterItem,
            feePerPeriod: Number(subscriptionEvent.paymentFee),
            period: getPeriodBySubscriptionTimeInterval(
              subscriptionEvent.subscriptionTimeInterval
            ),
            subscriptionStartDate: Number(subscriptionEvent.startTime),
            totalFees:
              subscribedWriterItem.totalFees +
              Number(subscriptionEvent.paymentFee),
          };
        } else {
          //this is an older event, just update the totalFees
          subscribedWriterItem.totalFees =
            subscribedWriterItem.totalFees +
            Number(subscriptionEvent.paymentFee);
        }

        activeSubscriptionItemsMap.set(
          subscriptionEvent.writerPrincipalId,
          subscribedWriterItem
        );
      } else {
        //the item is not in the list yet, build the SubscribedWriterItem and put it into the map
        activeSubscriptionItemsMap.set(subscriptionEvent.writerPrincipalId, {
          userListItem: writerUserListItem,
          subscriptionStartDate: Number(subscriptionEvent.startTime),
          period: getPeriodBySubscriptionTimeInterval(
            subscriptionEvent.subscriptionTimeInterval
          ),
          feePerPeriod: Number(subscriptionEvent.paymentFee),
          totalFees: Number(subscriptionEvent.paymentFee),
          isPublication: allPublications
            .map((val) => val[1])
            .includes(subscriptionEvent.writerPrincipalId),
          isSubscriptionActive: subscriptionEvent.isWriterSubscriptionActive,
        });
      }
    } else {
      //expired subscription
      //calculate the total fee
      var totalFee = 0;
      details.readerSubscriptions.forEach((event) => {
        if (event.writerPrincipalId === subscriptionEvent.writerPrincipalId) {
          totalFee += Number(event.paymentFee);
        }
      });
      //push the value to expiredSubscriptionItemsArray
      let writerUserListItem = userListItemsMap.get(
        subscriptionEvent.writerPrincipalId
      ) as UserListItem;
      expiredSubscriptionItemsArray.push({
        userListItem: writerUserListItem,
        subscriptionStartDate: Number(subscriptionEvent.startTime),
        subscriptionEndDate: Number(subscriptionEvent.endTime),
        period: getPeriodBySubscriptionTimeInterval(
          subscriptionEvent.subscriptionTimeInterval
        ),
        feePerPeriod: Number(subscriptionEvent.paymentFee),
        totalFees: totalFee,
        isPublication: allPublications
          .map((val) => val[1])
          .includes(subscriptionEvent.writerPrincipalId),
        isSubscriptionActive: subscriptionEvent.isWriterSubscriptionActive,
      });
    }
  }
  //return the ReaderSubscriptionDetailsConverted object
  return {
    activeSubscriptions: Array.from(activeSubscriptionItemsMap.values()),
    expiredSubscriptions: expiredSubscriptionItemsArray,
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

  let subscribedReaderListItemsMap = new Map<string, SubscribedReaderItem>();

  for (const subscriptionEvent of details.writerSubscriptions) {
    //update the subscribedReaderListItemsMap if the event is done by an active subscriber
    if (
      activeSubscribersPrincipalIds.includes(
        subscriptionEvent.readerPrincipalId
      )
    ) {
      //user has an active subscription

      //get the user list item
      let readerUserListItem = subscribedUserListItemsMap.get(
        subscriptionEvent.readerPrincipalId
      ) as UserListItem;
      //get the existing ReaderListItem if there's any
      let subscribedReaderListItem = subscribedReaderListItemsMap.get(
        subscriptionEvent.readerPrincipalId
      );

      if (subscribedReaderListItem) {
        //reader already has an entry in the map
        //update the values
        if (
          Number(subscriptionEvent.startTime) >
          subscribedReaderListItem.subscriptionStartDate
        ) {
          //newer event
          subscribedReaderListItem = {
            ...subscribedReaderListItem,
            subscriptionStartDate: Number(subscriptionEvent.startTime),
            period: getPeriodBySubscriptionTimeInterval(
              subscriptionEvent.subscriptionTimeInterval
            ),
            feePerPeriod: Number(subscriptionEvent.paymentFee),
            totalFees:
              subscribedReaderListItem.totalFees +
              Number(subscriptionEvent.paymentFee),
          };
        } else {
          //older event
          subscribedReaderListItem = {
            ...subscribedReaderListItem,
            totalFees:
              subscribedReaderListItem.totalFees +
              Number(subscriptionEvent.paymentFee),
          };
        }
        subscribedReaderListItemsMap.set(
          subscriptionEvent.readerPrincipalId,
          subscribedReaderListItem
        );
      } else {
        //it's the first time
        //build the SubscribedReaderItem and put it in the map
        subscribedReaderListItemsMap.set(subscriptionEvent.readerPrincipalId, {
          userListItem: readerUserListItem,
          subscriptionStartDate: Number(subscriptionEvent.startTime),
          period: getPeriodBySubscriptionTimeInterval(
            subscriptionEvent.subscriptionTimeInterval
          ),
          feePerPeriod: Number(subscriptionEvent.paymentFee),
          totalFees: Number(subscriptionEvent.paymentFee),
        });
      }
    }
  }
  //calculate the total nua earned
  var totalNuaEarned = 0;
  //calculate the number of subscribers 1 week ago
  let oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  let oneWeekAgoSubscribersCounter = 0;
  //historical data for number of subscribers
  let breakPoints = new Map<number, number>();
  details.writerSubscriptions.forEach((subscriptionEvent) => {
    breakPoints.set(Number(subscriptionEvent.startTime), 0);
    breakPoints.set(Number(subscriptionEvent.endTime), 0);
  });

  for (const subscriptionEvent of details.writerSubscriptions) {
    totalNuaEarned += Number(subscriptionEvent.paymentFee);
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
    subscribedReaders: Array.from(subscribedReaderListItemsMap.values()),
    numberOfSubscribersHistoricalData: Array.from(breakPoints),
    subscribersCount: subscribedReaderListItemsMap.size,
    totalNuaEarned,
    lastWeekNewSubscribers:
      subscribedReaderListItemsMap.size - oneWeekAgoSubscribersCounter,
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
    principal: string
  ) => Promise<WriterSubscriptionDetails | void>;
  getMySubscriptionTransactions: () => Promise<SubscriptionHistoryItem[]>;
  updateSubscriptionDetails: (
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
    principal: string
  ): Promise<WriterSubscriptionDetails | void> => {
    try {
      let subscriptionActor = await getSubscriptionActor();
      let writerDetails =
        await subscriptionActor.getWriterSubscriptionDetailsByPrincipalId(
          principal
        );
      if ('ok' in writerDetails) {
        return writerDetails.ok;
      }
    } catch (error) {}
  },

  //returns an array of history item for wallet screen to use
  getMySubscriptionTransactions: async (): Promise<
    SubscriptionHistoryItem[]
  > => {
    try {
      let subscriptionActor = await getSubscriptionActor();
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
      let userActor = await getUserActor();
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
          readerTransactionDetails.push({
            date: Number(readerSubscriptionEvent.startTime).toString(),
            subscriptionFee: Number(readerSubscriptionEvent.paymentFee),
            handle: (
              userListItemsMap.get(
                readerSubscriptionEvent.writerPrincipalId
              ) as UserListItem
            ).handle,
            isWriter: false,
          });
        }
      }
      let writerTransactionDetails: SubscriptionHistoryItem[] = [];
      if ('ok' in writerDetails) {
        for (const writerSubscriptionEvent of writerDetails.ok
          .writerSubscriptions) {
          writerTransactionDetails.push({
            date: Number(writerSubscriptionEvent.startTime).toString(),
            subscriptionFee: Number(writerSubscriptionEvent.paymentFee),
            handle: (
              userListItemsMap.get(
                writerSubscriptionEvent.readerPrincipalId
              ) as UserListItem
            ).handle,
            isWriter: true,
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
    weeklyFee?: number,
    monthlyFee?: number,
    annuallyFee?: number,
    lifeTimeFee?: number,
    publicationInformation?: {
      paymentReceiverPrincipal: Principal;
      publicationCanisterId: string;
    }
  ): Promise<WriterSubscriptionDetailsConverted | void> => {
    try {
      let subscriptionActor = await getSubscriptionActor();
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
      const errorMessage = `Unexpected error: ${
        error.message || error.toString()
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
