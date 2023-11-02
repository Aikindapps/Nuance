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
  profileSidebarDisallowed: false,
  setProfileSidebarDisallowed: (arg) => {},
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

  const [profileSidebarDisallowed, setProfileSidebarDisallowed] = useState(false)
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
        setWidth,
        profileSidebarDisallowed,
        setProfileSidebarDisallowed,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export { Context, ContextProvider };
