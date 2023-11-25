import React, { useContext, useEffect, useState } from 'react';
import './_login-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { Context } from '../../contextes/Context';
import Button from '../../UI/Button/Button';
import { colors, icons, images } from '../../shared/constants';
import LoggedOutSidebar from '../logged-out-sidebar/logged-out-sidebar';
import { useTheme } from '../../contextes/ThemeContext';
import { IoCloseOutline } from 'react-icons/io5';
export const LoginModal = () => {
  const modalContext = useContext(ModalContext);
  const context = useContext(Context);
  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    backgroundColor: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
    secondaryColor: darkTheme
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
    borderColor: darkTheme ? 'rgb(2, 195, 161)' : '#00113e',
  };

  return (
    <div className='login-modal' style={darkOptionsAndColors}>
      <IoCloseOutline
        onClick={() => {
          modalContext?.closeModal();
        }}
        className='close-modal-icon'
      />
      <p className='modal-title' style={darkOptionsAndColors}>
        Start blogging!
      </p>
      <p className='information-text' style={darkOptionsAndColors}>
        You can only use this feature with a Nuance account!
      </p>
      <LoggedOutSidebar />
    </div>
  );
};
