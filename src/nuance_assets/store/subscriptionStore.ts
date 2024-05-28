import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getSubscriptionActor,
  getUserActor,
  getIcrc1Actor,
  SUBSCRIPTION_CANISTER_ID,
} from '../services/actorService';
import { UserListItem } from '../types/types';
import {
  ReaderSubscriptionDetails,
  SubscriptionTimeInterval,
  WriterSubscriptionDetails,
} from '../../declarations/Subscription/Subscription.did';
import { Principal } from '@dfinity/principal';
import { toastError } from '../services/toastService';
import { ErrorType, getErrorType } from '../services/errorService';
import { NUA_CANISTER_ID } from '../shared/constants';

type SubscribedWriterItem = {
  userListItem: UserListItem;
  subscriptionStartDate: number;
  period: string;
  feePerPeriod: number;
  totalFees: number;
};

type ExpiredSubscriptionItem = {
  userListItem: UserListItem;
  subscriptionStartDate: number;
  subscriptionEndDate: number;
  period: string;
  feePerPeriod: number;
  totalFees: number;
};

const handleError = (err: any, preText?: string) => {
  const errorType = getErrorType(err);
  toastError(err, preText);
};

const isLocal: boolean =
  window.location.origin.includes('localhost') ||
  window.location.origin.includes('127.0.0.1');
export interface SubscriptionStore {
  getMySubscriptionHistoryAsReader: () => Promise<void>;
  getMySubscriptionDetailsAsWriter: () => Promise<WriterSubscriptionDetails | void>;
  getPublicationSubscriptionDetailsAsEditor: (
    publicationCanisterId: string
  ) => Promise<WriterSubscriptionDetails | void>;
  getWriterSubscriptionDetailsByPrincipalId: (
    principal: string
  ) => Promise<WriterSubscriptionDetails | void>;
  updateSubscriptionDetails: (
    weeklyFee?: number,
    monthlyFee?: number,
    annuallyFee?: number,
    lifeTimeFee?: number,
    publicationInformation?: {
      paymentReceiverPrincipal: Principal;
      publicationCanisterId: string;
    }
  ) => Promise<WriterSubscriptionDetails | void>;
  stopSubscriptionAsReader: (
    writerPrincipalId: string
  ) => Promise<ReaderSubscriptionDetails | void>;
  subscribeWriter: (
    writerPrincipalId: string,
    subscriptionTimeInterval: SubscriptionTimeInterval,
    amount: number
  ) => Promise<ReaderSubscriptionDetails | void>;
}

// Encapsulates and abstracts AuthClient
// identity has a value when authenticated, otherwise it's undefined
// to get the principal, use identity?.getPrincipal()
const createSubscriptionStore:
  | StateCreator<SubscriptionStore>
  | StoreApi<SubscriptionStore> = (set, get) => ({
  //returns the subscription history of the reader
  getMySubscriptionHistoryAsReader: async (): Promise<void> => {
    try {
      let subscriptionActor = await getSubscriptionActor();
      let userActor = await getUserActor();
      let details = await subscriptionActor.getReaderSubscriptionDetails();
      if ('ok' in details) {
        //active
        let activeSubscriptionsWriterPrincipalIds =
          details.ok.readerNotStoppedSubscriptionsWriters.map(
            (val) => val.writerPrincipalId
          );
        let expiredSubscriptionsWriterPrincipalIds: string[] = [];
        let notExpiredSubscriptionsWriterPrincipalIds: string[] = [];
        for (const subscriptionEvent of details.ok.readerSubscriptions) {
          let now = new Date().getTime();
          if (now > Number(subscriptionEvent.endTime)) {
            //expired event
            //add the writer principal id to the expiredSubscriptionsWriterPrincipalIds if it's not in notExpiredSubscriptionsWriterPrincipalIds
          } else {
          }
        }
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
  //returns the subscription details of the user
  //should be called by the user - doesn't accept any principal id
  //it also returns the historical subscription data
  getMySubscriptionDetailsAsWriter:
    async (): Promise<WriterSubscriptionDetails | void> => {
      try {
        let subscriptionActor = await getSubscriptionActor();
        let writerDetails =
          await subscriptionActor.getWriterSubscriptionDetails([]);
        if ('ok' in writerDetails) {
          return writerDetails.ok;
        }
      } catch (error) {
        handleError(error, 'Unexpected error: ');
      }
    },
  //editors uses this method to get the publication subscription details
  getPublicationSubscriptionDetailsAsEditor: async (
    publicationCanisterId: string
  ): Promise<WriterSubscriptionDetails | void> => {
    try {
      let subscriptionActor = await getSubscriptionActor();
      let writerDetails = await subscriptionActor.getWriterSubscriptionDetails([
        publicationCanisterId,
      ]);
      if ('ok' in writerDetails) {
        return writerDetails.ok;
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
  ): Promise<WriterSubscriptionDetails | void> => {
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
        weeklyFee: weeklyFee ? [weeklyFee] : [],
        lifeTimeFee: lifeTimeFee ? [lifeTimeFee] : [],
        annuallyFee: annuallyFee ? [annuallyFee] : [],
        monthlyFee: monthlyFee ? [monthlyFee] : [],
      });
      if ('ok' in response) {
        return response.ok;
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
  ): Promise<ReaderSubscriptionDetails | void> => {
    try {
      let subscriptionActor = await getSubscriptionActor();
      let paymentRequest = await subscriptionActor.createPaymentRequestAsReader(
        writerPrincipalId,
        subscriptionTimeInterval,
        amount
      );
      if ('ok' in paymentRequest) {
        //payment request has successfully been created
        //transfer the tokens to the subaccount
        let nuaLedgerCanister = await getIcrc1Actor(NUA_CANISTER_ID);
        let transferResponse = await nuaLedgerCanister.icrc1_transfer({
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
          //transfer is also successful
          //complete the subscription event and return the new readerDetails value
          let response = await subscriptionActor.completeSubscriptionEvent(
            paymentRequest.ok.subscriptionEventId
          );
          if ('ok' in response) {
            return response.ok;
          } else {
            handleError(response.err);
          }
        } else {
          handleError(transferResponse.Err);
        }
      } else {
        handleError(paymentRequest.err);
      }
    } catch (error) {
      handleError(error, 'Unexpected error: ');
    }
  },
  //should be called by the reader to stop the existing subscription
  stopSubscriptionAsReader: async (
    writerPrincipalId: string
  ): Promise<ReaderSubscriptionDetails | void> => {
    try {
      let subscriptionActor = await getSubscriptionActor();
      let response = await subscriptionActor.stopSubscription(
        writerPrincipalId
      );
      if ('ok' in response) {
        return response.ok;
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
