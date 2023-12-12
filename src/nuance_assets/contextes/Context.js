import React, { useState, createContext, useEffect } from 'react';

const Context = createContext({
  publicationFeature: true,
  nftFeature: true,
  width: window.outerHeight,
  height: window.outerHeight,
  setWidth: (arg) => {},
  setHeight: (arg) => {},
  profileSidebarDisallowed: false,
  setProfileSidebarDisallowed: (arg) => {},
});

const ContextProvider = ({ children }) => {
  const [showWithdrawIcpModal, setShowWithdrawIcpModal] = useState(false);
  const setWithdrawIcpModal = () => {
    setShowWithdrawIcpModal(!showWithdrawIcpModal);
  };
  const [width, setWidth] = useState(window.outerWidth);
  const [height, setHeight] = useState(window.outerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup the event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [profileSidebarDisallowed, setProfileSidebarDisallowed] = useState(false)
  
  return (
    <Context.Provider
      value={{
        publicationFeature: true,
        nftFeature: true,
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