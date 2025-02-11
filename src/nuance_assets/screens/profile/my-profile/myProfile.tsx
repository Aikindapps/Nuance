import React, { useEffect, useContext, useState } from 'react';
import Button from '../../../UI/Button/Button';
import { useNavigate } from 'react-router';
import { useUserStore, useAuthStore, usePublisherStore } from '../../../store';
import Footer from '../../../components/footer/footer';
import { colors, images } from '../../../shared/constants';
import Linkify from 'react-linkify';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { Row, Col } from 'react-bootstrap';
import { PublicationObject } from 'src/nuance_assets/types/types';
import { Context } from '../../../contextes/Context';
import { toast, toastError, ToastType } from '../../../services/toastService';
import { useTheme } from '../../../contextes/ThemeContext';
import { Tooltip } from 'react-tooltip';
import { getIconForSocialChannel } from '../../../shared/utils';
import { Context as ModalContext } from '../../../contextes/ModalContext';
import GradientMdVerified from '../../../UI/verified-icon/verified-icon';
import { Principal } from '@dfinity/principal';
import { useAgent, useAuth, useIsInitializing } from '@nfid/identitykit/react';

const isLocal: boolean =
  window.location.origin.includes('localhost') ||
  window.location.origin.includes('127.0.0.1');

const MyProfile = () => {
  const navigate = useNavigate();
  const customHost = isLocal ? 'http://localhost:8080' : 'https://icp-api.io';
  const agent = useAgent({ host: customHost, retryTimes: 10 });
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { agent: agentToBeUsed } = useAuthStore((state) => ({
    agent: state.agent,
  }));
  const isInitializing = useIsInitializing();
  const darkTheme = useTheme();
  const context = useContext(Context);
  const modalContext = useContext(ModalContext);
  const {
    user,
    getUser,
    counts,
    getUsersByHandles,
    usersByHandles,
    getUserFollowersCount,
    userFollowersCount,
    loadingUser,
    getLinkedPrincipal,
    verifyPoh,
    proceedWithVerification,
  } = useUserStore((state) => ({
    user: state.user,
    getUser: state.getUser,
    counts: state.userPostCounts,
    getUsersByHandles: state.getUsersByHandles,
    usersByHandles: state.usersByHandles,
    getUserFollowersCount: state.getUserFollowersCount,
    userFollowersCount: state.userFollowersCount,
    loadingUser: state.loadingUser,
    getLinkedPrincipal: state.getLinkedPrincipal,
    verifyPoh: state.verifyPoh,
    proceedWithVerification: state.proceedWithVerification,
  }));

  useEffect(() => {
    if (agentToBeUsed && !isInitializing) {
      getUser(agentToBeUsed);
    }
  }, [agentToBeUsed, isInitializing]);

  useEffect(() => {
    if (!isInitializing) {
      if (isLoggedIn && !user) {
        navigate('/register', { replace: true });
      } else {
        user && getUserFollowersCount(user?.handle || '');
      }
    }
  }, [isLoggedIn, user, isInitializing]);

  useEffect(() => {
    getUsersByHandles(
      (user?.publicationsArray || []).map(
        (publication: PublicationObject) => publication.publicationName
      )
    );
  }, []);

  const goToProfileEditPage = () => {
    navigate('/my-profile/edit', { replace: true });
  };

  const [hoverRemovePublication, setHoverRemovePublication] = useState(false);

  const { removeEditor, removeWriter } = usePublisherStore((state) => ({
    removeEditor: state.removeEditor,
    removeWriter: state.removeWriter,
  }));

  const getSocialChannelUrls = () => {
    if (user) {
      if (user.website === '') {
        return user.socialChannels;
      } else {
        return [user.website, ...user.socialChannels];
      }
    } else {
      return [];
    }
  };

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
  };

  return (
    <div
      className='wrapper'
      style={{
        background: darkOptionsAndColors.background,
        color: darkOptionsAndColors.color,
        display: 'flex',
        flexDirection: 'column',
        rowGap: '30px',
        position: 'relative',
      }}
    >
      <p className='title'>MY PROFILE</p>
      <div
        style={{
          alignSelf: 'flex-end',
          position: 'absolute',
          top: context.width > 768 ? '0' : '10px',
          right: context.width < 768 ? '10px' : '50px',
        }}
      >
        <Button
          styleType={{ dark: 'white', light: 'white' }}
          type='button'
          style={{
            width: '96px',
          }}
          onClick={goToProfileEditPage}
        >
          Edit Profile
        </Button>
        {!user?.isVerified && (
          <Button
            styleType={{ dark: 'white', light: 'white' }}
            type='button'
            style={{
              width: '96px',
              marginTop: '5px',
            }}
            onClick={() => modalContext?.openModal('verify profile')}
          >
            Verify Profile
          </Button>
        )}
      </div>
      <div className='content'>
        <img
          src={user?.avatar || images.DEFAULT_AVATAR}
          alt='background'
          className='profile-picture'
          style={
            user?.isVerified
              ? {
                  background: 'linear-gradient(to bottom, #1FDCBD, #23F295)',
                  padding: '0.2em',
                }
              : { borderRadius: '50%' }
          }
        />
        <p className='name'>
          {user?.displayName}{' '}
          {user?.isVerified && <GradientMdVerified width='24' height='24' />}
        </p>
        <p
          style={
            darkTheme
              ? {
                  color: darkOptionsAndColors.color,
                }
              : {}
          }
          className='username'
        >
          @{user?.handle}
        </p>
        <div className='social-channels'>
          {getSocialChannelUrls().map((url, index) => {
            return (
              <div
                onClick={() => {
                  let urlWithProtocol =
                    url.startsWith('https://') || url.startsWith('http://')
                      ? url
                      : 'https://' + url;
                  window.open(urlWithProtocol, '_blank');
                }}
              >
                <Tooltip
                  clickable={true}
                  className='tooltip-wrapper'
                  anchorSelect={'#social-channel-' + index}
                  place='top'
                  noArrow={true}
                >
                  {url}
                </Tooltip>
                <img
                  className='social-channel-icon'
                  src={getIconForSocialChannel(url, darkTheme)}
                  id={'social-channel-' + index}
                />
              </div>
            );
          })}
        </div>
        <p
          style={
            darkTheme
              ? {
                  color: darkOptionsAndColors.secondaryColor,
                }
              : {}
          }
          className='description'
        >
          {user?.bio}
        </p>
      </div>
      <div className='my-profile-screen-statistic-wrapper'>
        <div className='statistic'>
          <div className='stat'>
            <p className='count'>{counts?.publishedCount || 0}</p>
            <p className='title'>Articles</p>
          </div>
          <div className='stat'>
            <p className='count'>{counts?.totalViewCount || 0}</p>
            <p className='title'>Article Views</p>
          </div>
        </div>
        <div className='statistic-horizontal-divider' />
        <div className='statistic'>
          <div className='stat'>
            <p className='count'>{counts?.uniqueClaps || 0}</p>
            <p className='title'>Applause</p>
          </div>
          <div className='stat'>
            <p className='count'>{user?.followersCount || 0}</p>
            <p className='title'>Followers</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyProfile;
