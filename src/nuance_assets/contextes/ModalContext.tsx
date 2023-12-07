import React, { useState, createContext, ReactNode, useEffect } from 'react';
import { PostType, PremiumPostActivityListItem } from '../types/types';
type ModalType = 'Login' | 'WithdrawToken' | 'WithdrawNft' | 'Tipping' | 'Deposit' | 'Clap';
type ModalData = {
    transferNftData?: PremiumPostActivityListItem,
    clappingPostData?: PostType
};
type FakeApplaud = {
  postId: string;
  before: number;
  after: number;
  date: Date;
}
interface ContextType {
  isModalOpen: boolean;
  modalType: ModalType | undefined;
  openModal: (modalType: ModalType, data?: ModalData) => void;
  closeModal: () => void;
  createFakeApplaud: (postId: string, before: number, after: number) => void;
  getFakeApplaud: (postId: string, real: number) => FakeApplaud | undefined;
  modalData: ModalData | undefined
}

const Context = createContext<ContextType | undefined>(undefined);

interface ContextProviderProps {
  children: ReactNode;
}
const ContextProvider = ({
  children,
}: ContextProviderProps): React.ReactElement => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | undefined>(undefined);
  const [modalData, setModalData] = useState<ModalData | undefined>(undefined);

  //manage the fake effect of applaud (it takes about 15 seconds to complete the applaud for real.)
  const [fakeApplauds, setFakeApplauds] = useState<FakeApplaud[]>([])

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    }
    if (!isModalOpen) {
      document.body.style.overflow = 'unset';
    }
  }, [isModalOpen]);

  const openModal = (type: ModalType, data?: ModalData) => {
    setIsModalOpen(true);
    setModalType(type);
    if(data){
        setModalData(data);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(undefined);
    setModalData(undefined)
  };

  const createFakeApplaud = (
    postId: string,
    before: number,
    applauds: number
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
        },
      ]);
    }
  };

  const getFakeApplaud = (postId: string, real: number) => {
    let allPostIds = fakeApplauds.map(val => val.postId);
    if(allPostIds.includes(postId)){
      let fakeApplaud = fakeApplauds.filter(v => v.postId === postId)[0];
      if(fakeApplaud.after === real){
        //the after value is equal to real value
        //delete the fakeApplaud and return nothing
        setFakeApplauds(fakeApplauds.filter((v) => v.postId !== postId));
        return undefined
      }
      else{
        //the after value in the fake applaud is not close enough to the real value
        //the applaud is still processing
        //return the fake applaud
        return fakeApplaud
      }
    }
    else{
      //there is no fake applaud. return undefined
      return undefined
    }
    
    
  };

  return (
    <Context.Provider
      value={{
        isModalOpen,
        modalType,
        openModal,
        closeModal,
        modalData,
        createFakeApplaud,
        getFakeApplaud,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export { Context, ContextProvider };
