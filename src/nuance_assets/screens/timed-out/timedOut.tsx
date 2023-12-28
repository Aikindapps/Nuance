import React, { useContext, useEffect, useState } from 'react';
import Button from '../../UI/Button/Button';
import { useNavigate } from 'react-router';
import Footer from '../../components/footer/footer';
import LoggedOutSidebar from '../../components/logged-out-sidebar/logged-out-sidebar';
import Header from '../../components/header/header';
import { useUserStore } from '../../store';
import { useTheme } from '../../contextes/ThemeContext';
import { colors } from '../../shared/constants';
import { Context } from '../../contextes/Context';


const TimedOut = () => {
  const [screenWidth, setScreenWidth] = useState(0);
  const navigate = useNavigate();
  const darkTheme = useTheme();
  const context = useContext(Context)

  const goToHomePage = () => {
    navigate('/', { replace: true });
  };

  const { user, getUser } = useUserStore((state) => ({
    user: state.user,
    getUser: state.getUser,
  }));

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      goToHomePage();
    }
  }, [user]);

  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.primaryTextColor
      : colors.primaryBackgroundColor,
    color: darkTheme ? colors.primaryBackgroundColor : colors.primaryTextColor,
  };

  return (
    <div style={darkOptionsAndColors} className='homepage-wrapper'>
      <Header
        loggedIn={false}
        isArticlePage={false}
        ScreenWidth={screenWidth}
        isPublicationPage={false}
      />

      {context.width < 768 && (
        <div style={{ width: '100%' }} className='logged-out-mobile'>
          <LoggedOutSidebar />
        </div>
      )}
      <div className='main'>
        <div className='left'>
          <div className='logged-out'>
            <LoggedOutSidebar />
          </div>
        </div>
        <div className='right'>
          <div className='content'>
            <p className='title'>SESSION TIMED OUT</p>
            <p>Your session has timed-out. Please login again.</p>
            <Button
              styleType='primary-1'
              type='button'
              style={{ width: '96px' }}
              onClick={goToHomePage}
            >
              Home
            </Button>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimedOut;
