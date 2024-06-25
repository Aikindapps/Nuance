import React, { useState, createContext, ReactNode, useEffect } from 'react';
import { PostType, PremiumPostActivityListItem } from '../types/types';
type ModalType =
  | 'Login'
  | 'WithdrawToken'
  | 'WithdrawNft'
  | 'Deposit'
  | 'Clap'
  | 'Premium article'
  | 'Notifications'
  | 'Subscription'
  | 'cancelSubscription'
  | 'claim restricted tokens';

type ModalData = {
  transferNftData?: PremiumPostActivityListItem;
  clappingPostData?: PostType;
  premiumPostData?: PostType;
  premiumPostNumberOfEditors?: number;
  premiumPostOnSave?: (
    maxSupply: bigint,
    price: bigint,
    thumbnail: string
  ) => Promise<void>;
  premiumPostRefreshPost?: () => Promise<void>;
};
type FakeApplaud = {
  postId: string;
  before: number;
  after: number;
  date: Date;
  bucketCanisterId: string;
};
interface ContextType {
  isModalOpen: boolean;
  isSidebarOpen: boolean;
  modalType: ModalType | undefined;
  openModal: (modalType: ModalType, data?: ModalData) => void;
  closeModal: () => void;
  createFakeApplaud: (
    postId: string,
    before: number,
    after: number,
    bucketCanisterId: string
  ) => void;
  getFakeApplaud: (postId: string, real: number) => FakeApplaud | undefined;
  getAllFakeApplauds: () => FakeApplaud[];
  modalData: ModalData | undefined;
}

const Context = createContext<ContextType | undefined>(undefined);

interface ContextProviderProps {
  children: ReactNode;
}
const ContextProvider = ({
  children,
}: ContextProviderProps): React.ReactElement => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | undefined>(undefined);
  const [modalData, setModalData] = useState<ModalData | undefined>(undefined);

  //manage the fake effect of applaud (it takes about 15 seconds to complete the applaud for real.)
  const [fakeApplauds, setFakeApplauds] = useState<FakeApplaud[]>([]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    }
    if (!isModalOpen) {
      document.body.style.overflow = 'unset';
    }
  }, [isModalOpen]);

  const openModal = (type: ModalType, data?: ModalData) => {
    console.log('openModal type:', type);
    setIsModalOpen(true);
    setModalType(type);
    if (data) {
      setModalData(data);
    }

    if (type === 'Notifications') {
      setIsSidebarOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(undefined);
    setModalData(undefined);

    if (modalType === 'Notifications') {
      setIsSidebarOpen(false);
    }
  };

  const createFakeApplaud = (
    postId: string,
    before: number,
    applauds: number,
    bucketCanisterId: string
  ) => {
    let allPostIds = fakeApplauds.map((val) => val.postId);
    if (allPostIds.includes(postId)) {
      //already there, replace the value
      setFakeApplauds(
        fakeApplauds.map((fakeApplaud) => {
          if (fakeApplaud.postId === postId) {
            return {
              postId,
              before,
              after: fakeApplaud.after + applauds,
              date: new Date(),
              bucketCanisterId,
            };
          } else {
            return fakeApplaud;
          }
        })
      );
    } else {
      //simply add the value
      setFakeApplauds([
        ...fakeApplauds,
        {
          postId,
          before,
          after: before + applauds,
          date: new Date(),
          bucketCanisterId,
        },
      ]);
    }
  };

  const getFakeApplaud = (postId: string, real: number) => {
    let allPostIds = fakeApplauds.map((val) => val.postId);
    if (allPostIds.includes(postId)) {
      let fakeApplaud = fakeApplauds.filter((v) => v.postId === postId)[0];
      if (fakeApplaud.after === real) {
        //the after value is equal to real value
        //delete the fakeApplaud and return nothing
        setFakeApplauds(fakeApplauds.filter((v) => v.postId !== postId));
        return undefined;
      } else {
        //the after value in the fake applaud is not close enough to the real value
        //the applaud is still processing
        //return the fake applaud
        return fakeApplaud;
      }
    } else {
      //there is no fake applaud. return undefined
      return undefined;
    }
  };
  const getAllFakeApplauds = () => {
    return fakeApplauds;
  };

  return (
    <Context.Provider
      value={{
        isModalOpen,
        isSidebarOpen,
        modalType,
        openModal,
        closeModal,
        modalData,
        createFakeApplaud,
        getFakeApplaud,
        getAllFakeApplauds,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export { Context, ContextProvider };
