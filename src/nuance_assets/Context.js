import React, { useState, createContext } from 'react';

const Context = createContext({
  publicationFeature: true,
  nftFeature: true,
  showModal: false,
  setModal: () => {},
  withdrawIcpModal: false,
  setWithdrawIcpModal: () => {},
  width: window.innerWidth,
  height: window.innerHeight,
  setWidth: (arg) => {},
  setHeight: (arg) => {},
});

const ContextProvider = ({ children }) => {
  const [showModal, setShowModal] = useState(false);
  const setModal = () => {
    setShowModal(!showModal);
  };
  const [showWithdrawIcpModal, setShowWithdrawIcpModal] = useState(false);
  const setWithdrawIcpModal = () => {
    setShowWithdrawIcpModal(!showWithdrawIcpModal);
  };
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  return (
    <Context.Provider
      value={{
        publicationFeature: true,
        nftFeature: true,
        showModal: showModal,
        setModal: setModal,
        withdrawIcpModal: showWithdrawIcpModal,
        setWithdrawIcpModal: setWithdrawIcpModal,
        width,
        height,
        setHeight,
        setWidth
      }}
    >
      {children}
    </Context.Provider>
  );
};

export { Context, ContextProvider };
