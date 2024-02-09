import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PublicationObject } from '../../services/actorService';
import { Context } from '../../contextes/Context';
import { IoIosArrowDown } from 'react-icons/io';
import { icons, colors } from '../../shared/constants';
import './_profile.scss'

type PublicationLinkProps = {
  publicationsArray: Array<PublicationObject>;
  dark?: boolean;
};

const PublicationLink: React.FC<PublicationLinkProps> = (props) => {
  const [isPublicationsExpanded, setIsPublicationsExpanded] = useState(false);
  const [routes, setRoutes] = useState<any>([]);
  const location = useLocation();
  const context = useContext(Context);

  useEffect(() => {
    const newRoutes = props.publicationsArray.map((publication) => ({
      title: publication.publicationName,
      goto: `/my-profile/publications/${publication.publicationName}`,
    }));
    setRoutes(newRoutes);

    // Check if the current location matches any publication routes
    const isCurrentLocationAPublication = newRoutes.some(route => location.pathname.includes(route.goto));
    if (isCurrentLocationAPublication) {
      setIsPublicationsExpanded(true);
    }
  }, [props.publicationsArray, location.pathname]);

  const togglePublications = () => {
    setIsPublicationsExpanded(!isPublicationsExpanded);
  };

  if (props.publicationsArray.length === 0 || !context.publicationFeature) {
    return null;
  }

  const darkOptionsAndColors = {
    background: props.dark
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: props.dark
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
    filter: props.dark ? 'contrast(.5)' : 'none',
  };

  return (
    <div>
      <div onClick={togglePublications}>
        <div className='route'>
          <span style={{ flexGrow: 1, color: darkOptionsAndColors.color }}>
            {`Publications (${props.publicationsArray.length})`}
          </span>
          <IoIosArrowDown
            className={`arrow-button ${isPublicationsExpanded ? 'expanded' : ''}`}
            style={{ color: darkOptionsAndColors.color }}
          />
        </div>
      </div>
      {isPublicationsExpanded && (
        <div className='sub-route publications'>
          {routes.map((route: any) => (
            <Link
              className={`route ${location.pathname === route.goto ? 'sub-route-active' : ''}`}
              key={route.goto}
              to={context.profileSidebarDisallowed ? location.pathname : route.goto}
              style={{
                color: location.pathname === route.goto ? colors.accentColor : darkOptionsAndColors.color,
                cursor: context.profileSidebarDisallowed ? 'not-allowed' : '',
                textDecoration: context.profileSidebarDisallowed ? 'none' : '',
              }}
            >
              {route.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicationLink;