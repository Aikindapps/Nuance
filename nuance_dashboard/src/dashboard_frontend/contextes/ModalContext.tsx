import React, { useState, createContext, ReactNode, useEffect } from 'react';
import { PostType } from '../shared/types';
type ModalType = 'Login' | 'Update handle' | 'Update publication handle' | 'Create Publication' | 'View rejected post' | 'Remove PoH';
type ModalData = {
  post?: PostType
};
interface ContextType {
  isModalOpen: boolean;
  modalType: ModalType | undefined;
  openModal: (modalType: ModalType, data?: ModalData) => void;
  closeModal: () => void;
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
  const [modalType, setModalType] = useState<ModalType | undefined>(undefined);
  const [modalData, setModalData] = useState<ModalData | undefined>(undefined);

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
    if (data) {
      setModalData(data);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(undefined);
    setModalData(undefined);
  };

  return (
    <Context.Provider
      value={{
        isModalOpen,
        modalType,
        openModal,
        closeModal,
        modalData,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export { Context, ContextProvider };
