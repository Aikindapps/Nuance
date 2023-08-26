import React, { useEffect, useContext, useState } from 'react';
import Button from '../../UI/Button/Button';
import { useNavigate } from 'react-router';
import { useUserStore, useAuthStore, usePublisherStore } from '../../store';
import Footer from '../../components/footer/footer';
import { colors, images } from '../../shared/constants';
import Linkify from 'react-linkify';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { Row, Col } from 'react-bootstrap';
import { PublicationObject } from 'src/nuance_assets/types/types';
import { Context } from '../../Context';
import { toast, toastError, ToastType } from '../../services/toastService';
import { useTheme } from '../../ThemeContext';

const MyProfile = () => {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const darkTheme = useTheme();

  const {
    user,
    getUser,
    counts,
    getUsersByHandles,
    usersByHandles,
    getUserFollowersCount,
    userFollowersCount,
  } = useUserStore((state) => ({
    user: state.user,
    getUser: state.getUser,
    counts: state.userPostCounts,
    getUsersByHandles: state.getUsersByHandles,
    usersByHandles: state.usersByHandles,
    getUserFollowersCount: state.getUserFollowersCount,
    userFollowersCount: state.userFollowersCount,
  }));

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (isLoggedIn && !user) {
      navigate('/register', { replace: true });
    } else {
      getUserFollowersCount(user?.handle || '');
    }
  }, [isLoggedIn, user]);

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

  const featureIsLive = useContext(Context).publicationFeature;

  const [hoverRemovePublication, setHoverRemovePublication] = useState(false);

  const { removeEditor, removeWriter } = usePublisherStore((state) => ({
    removeEditor: state.removeEditor,
    removeWriter: state.removeWriter,
  }));

  //for customizing linkify npm package
  const componentDecorator = (href: any, text: any, key: any) => (
    <a href={href} key={key} target='_blank' rel='noopener noreferrer'>
      {text}
    </a>
  );

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
      }}
    >
      <p className='title'>MY PROFILE</p>
      <div style={{ alignSelf: 'flex-end', marginTop: '20px' }}>
        {window.innerWidth < 768 ? (
          <Button
            styleType='secondary'
            type='button'
            style={{ width: '96px' }}
            onClick={goToProfileEditPage}
          >
            Edit
          </Button>
        ) : (
          <Button
            styleType='secondary'
            type='button'
            style={{ width: '96px' }}
            onClick={goToProfileEditPage}
          >
            Edit profile
          </Button>
        )}
      </div>
      <div className='content'>
        <img
          className='image'
          alt=''
          src={user?.avatar || images.DEFAULT_AVATAR}
        />
        <p className='name' style={{ color: darkOptionsAndColors.color }}>
          {user?.displayName}
        </p>
        <p
          className='username'
          style={{ color: darkOptionsAndColors.secondaryColor }}
        >
          @{user?.handle}
        </p>
        <Linkify componentDecorator={componentDecorator}>
          <p
            className='description'
            style={{ color: darkOptionsAndColors.color }}
          >
            {user?.bio}
          </p>
        </Linkify>
      </div>
      <div
        className='statistic'
        style={{ marginBottom: '150px', marginTop: '30px' }}
      >
        <div className='statistic'>
          <div className='stat'>
            <p className='count'>{counts?.totalPostCount}</p>
            <p className='title'>Articles</p>
          </div>
          <div className='stat'>
            <p className='count'>{counts?.totalViewCount || 0}</p>
            <p className='title'>Article Views</p>
          </div>
          <div className='stat'>
            <p className='count'>{counts?.uniqueClaps || 0}</p>
            <p className='title'>Claps</p>
          </div>
          <div className='stat'>
            <p className='count'>{userFollowersCount || 0}</p>
            <p className='title'>Followers</p>
          </div>
        </div>
      </div>
      {(user?.publicationsArray.length || [].length) > 0 && featureIsLive ? (
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <p style={{ color: darkOptionsAndColors.color }}>
            Linked as writer to the following Publications:
          </p>
          <br></br>
          <ul style={{ listStyleType: 'none' }}>
            {(user?.publicationsArray || []).map((publication) => {
              let avatar = '';
              usersByHandles?.forEach((user) => {
                if (user.handle == publication.publicationName) {
                  avatar = user.avatar;
                }
              });
              return (
                <li key={publication.publicationName}>
                  <Row>
                    <Col>
                      <Link to={`/publication/${publication.publicationName}`}>
                        <p style={{ color: darkOptionsAndColors.color }}>
                          <img
                            style={{ width: '30px' }}
                            src={avatar || images.DEFAULT_AVATAR}
                          />
                          &nbsp; @{publication.publicationName}
                        </p>
                      </Link>
                    </Col>
                    <Col>
                      {publication.isEditor ? (
                        <p style={{ color: darkOptionsAndColors.color }}>
                          Editor
                        </p>
                      ) : (
                        <p style={{ color: darkOptionsAndColors.color }}>
                          Writer
                        </p>
                      )}
                    </Col>
                    <Col>
                      <p
                        style={
                          hoverRemovePublication
                            ? {
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                color: darkOptionsAndColors.color,
                              }
                            : {}
                        }
                        onMouseOver={() => setHoverRemovePublication(true)}
                        onMouseLeave={() => setHoverRemovePublication(false)}
                        onClick={() => {
                          if (publication.isEditor) {
                            toast(
                              'An Editor of a publication cannot remove themselves',
                              ToastType.Error
                            );
                          } else {
                            let userConfirmsRemoval = confirm(
                              'Are you sure you want to remove this publication? You will be removed as an author.'
                            );
                            if (userConfirmsRemoval) {
                              removeWriter(
                                user?.handle as string,
                                publication.publicationName
                              );
                              window.location.reload();
                            }
                          }
                        }}
                      >
                        <FontAwesomeIcon
                          style={{ color: colors.accentColor }}
                          icon={faCircleXmark}
                        />
                        &nbsp;{' '}
                        <span style={{ color: darkOptionsAndColors.color }}>
                          Remove Publication
                        </span>
                      </p>
                    </Col>
                  </Row>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <Footer />
    </div>
  );
};

export default MyProfile;
