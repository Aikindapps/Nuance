import React, { useEffect, useState, useContext } from 'react';
import { usePostStore, useUserStore, useAuthStore } from '../../store';
import { icons, images, colors } from '../../shared/constants';
import FollowAuthor from '../../components/follow-author/follow-author';
import { Link, useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { UserType } from 'src/nuance_assets/types/types';
import { PublicationObject } from '../../services/actorService';
import { Context } from '../../contextes/Context';

type PublicationLinkProps = {
  publicationsArray: Array<PublicationObject>;
  dark?: boolean;
};

const PublicationLink: React.FC<PublicationLinkProps> = (props) => {
  // This component is a child of profileSidebar
  const [publicationHandles, setPublications] = useState<any>([]);
  const [routes, setRoutes] = useState<any>([]);

  useEffect(() => {
    setPublications(
      props.publicationsArray.map((obj) => {
        return obj.publicationName;
      })
    );
    setRoutes(
      props.publicationsArray.map((obj) => {
        return {
          title: obj.publicationName,
          goto: `/my-profile/publications/${obj.publicationName}`,
        };
      })
    );
  }, [props.publicationsArray]);
  const context = useContext(Context)
  const featureIsLive = context.publicationFeature;

  if (publicationHandles.length === 0 || featureIsLive == false) {
    return null;
  }

  const darkOptionsAndColors = {
    background: props.dark
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: props.dark
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
    secondaryColor: props.dark
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
    filter: props.dark ? 'contrast(.5)' : 'none',
  };

  return (
    <div style={{ margin: '10px 0' }}>
      <Link
        style={{
          borderRight: 'none',
          background: darkOptionsAndColors.background,
          color: location.pathname.includes('/my-profile/publications')
            ? colors.accentColor
            : darkOptionsAndColors.color,
          cursor: context.profileSidebarDisallowed ? 'not-allowed' : '',
          textDecoration: context.profileSidebarDisallowed ? 'none' : '',
        }}
        className={`route ${
          location.pathname.includes('/my-profile/publications') && 'active'
        }`}
        to={context.profileSidebarDisallowed ? location.pathname : routes[0].goto}
      >
        {`Publications (${props.publicationsArray.length})`}
      </Link>
      <img
        src={icons.PUBLICATION_ICON}
        style={{ width: '18px', filter: darkOptionsAndColors.filter }}
      />
      <div className='sub-route'>
        {routes.map((route: any) => {
          return (
            <Link
              className={`route ${
                location.pathname === route?.goto && 'sub-route-active'
              }`}
              key={route?.goto}
              to={
                context.profileSidebarDisallowed
                  ? location.pathname
                  : route?.goto
              }
              style={{
                marginLeft: '-15px',
                background: darkOptionsAndColors.background,
                color:
                  location.pathname === route?.goto
                    ? colors.accentColor
                    : darkOptionsAndColors.color,
                cursor: context.profileSidebarDisallowed ? 'not-allowed' : '',
                textDecoration: context.profileSidebarDisallowed ? 'none' : '',
                fontWeight: 'normal',
              }}
            >
              {location.pathname === route?.goto ? (
                <span className={`sub-route-active-flex`}>
                  <span className='dot'></span>
                  {route?.title}
                </span>
              ) : (
                <div style={{ marginLeft: '15px' }}>{route?.title}</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default PublicationLink;