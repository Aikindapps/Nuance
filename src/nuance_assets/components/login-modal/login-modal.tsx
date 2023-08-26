import React, { useContext, useEffect, useState } from 'react';
import './_login-modal.scss';
import { Context } from '../../Context';
import Button from '../../UI/Button/Button';
import { colors, icons, images } from '../../shared/constants';
import LoggedOutSidebar from '../logged-out-sidebar/logged-out-sidebar';
import { useTheme } from '../../ThemeContext';
export const LoginModal = () => {
  const context = useContext(Context);
  useEffect(() => {
    if (context.showModal) {
      document.body.style.overflow = 'hidden';
    }
    if (!context.showModal) {
      document.body.style.overflow = 'unset';
    }
  }, [context.showModal]);
  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme
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
    <div
      style={
        context.showModal
          ? {
              width: '100%',
              height: '100%',
              top: '0',
              left: '0',
              backdropFilter: 'blur(4px)',
            }
          : {}
      }
      className='login-modal'
    >
      {context.showModal && (
        <div className='login-modal-content' style={darkOptionsAndColors}>
          <Button
            disabled={false}
            type='button'
            styleType='secondary-NFT'
            style={{
              width: '100px',
              marginLeft: '5px',
              marginRight: '5px',
              top: '10px',
              right: '10px',
              position: 'absolute',
              fontFamily: 'Roboto'
            }}
            onClick={() => {
              context.setModal();
            }}
          >
            Cancel
          </Button>
          <img
            src={images.NUANCE_LOGO_BLUE_TEXT}
            style={{
              filter: darkTheme
                ? 'drop-shadow(rgb(67, 223, 186) 1px 1px 40px) drop-shadow(rgb(255, 255, 255) 1px 1px 40px)'
                : 'unset',
            }}
          />
          <p className='information-text' style={darkOptionsAndColors}>
            You can only use this feature with a Nuance account!
          </p>
          <div className='mobile-logged-out'>
            <LoggedOutSidebar responsiveElement={true} />
          </div>

          <div className='logged-out' style={{ margin: 'unset' }}>
            <LoggedOutSidebar responsiveElement={false} />
          </div>
        </div>
      )}
    </div>
  );
};
