import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { colors, icons } from '../../shared/constants';
import PublicationCallToAction from '../publication-call-to-action/publication-call-to-action';

import { findIconDefinition, library } from '@fortawesome/fontawesome-svg-core';
import { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { func } from 'prop-types';
import { ctaIcons } from './ctaIcons';
import { faPencil, faAngleDown } from '@fortawesome/free-solid-svg-icons';

interface PublicationIconSelectorProps {
  darkMode: boolean;
  publicationTagLine: string;
  publicationIcon: string;
  publicationButtonText: string;
  backgroundColor: string;
  onIconSelected: (icon: IconDefinition) => void;

  mobile: boolean;
  style?: any;
  isActive: boolean
}

const PublicationIconSelector: React.FC<PublicationIconSelectorProps> = ({
  darkMode,
  publicationTagLine,
  publicationIcon,
  publicationButtonText,
  onIconSelected,
  backgroundColor,
  mobile,
  style,
  isActive
}) => {
  const handleFindIcon = (iconName: string) => {
    const icon = ctaIcons.find((i) => i.name === iconName);

    return icon?.icon;
  };
  const [icon, setIcon] = useState(
    // publicationIcon ? publicationIcon : faPencil

    //if publicationIcon find the iconDefintion from the string value
    publicationIcon ? handleFindIcon(publicationIcon) : faPencil
  );
  const handleIconClick = (name: IconDefinition) => {
    console.log(name);
    setIcon(ctaIcons.find((i) => i.icon === name)?.icon || faPencil);
    onIconSelected(name);
  };

  const [showList, setShowList] = useState(false);

  const toggleList = () => {
    if(isActive){
      setShowList(!showList);
    }
    
  };

  const darkOptionsAndColors = {
    background: darkMode
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkMode ? colors.darkModePrimaryTextColor : colors.primaryTextColor,
  };

  return (
    <div
      style={{
        color: darkOptionsAndColors.color,
        background: darkOptionsAndColors.background,
        ...style
      }}
    >
      <div
        onClick={toggleList}
        style={{
          color: darkOptionsAndColors.color,
          background: darkOptionsAndColors.background,
        }}
      >
        {/* if icon is of type string find it first to convert */}
        <div className='icon-input' style={{ cursor: 'pointer' }}>
          <FontAwesomeIcon
            icon={
              publicationIcon
                ? (handleFindIcon(publicationIcon) as IconDefinition)
                : (icon as IconDefinition)
            }
            size={'2x'}
          />
          <FontAwesomeIcon
            icon={faAngleDown}
            size={'sm'}
            style={{
              marginBottom: '-10px',
              marginLeft: '20px',
              padding: '10px',
              color: 'gray',
            }}
          />
        </div>
      </div>
      {showList && (
        <ul
          onClick={toggleList}
          style={{
            color: darkOptionsAndColors.color,
            background: darkOptionsAndColors.background,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridGap: '10px',
            maxHeight: '200px',
            overflowY: 'scroll',
            boxShadow: '0px 4px 20px 0px rgba(0, 0, 0, 0.2)',
            padding: '20px',
            margin: '10px',
            borderRadius: '5px',
          }}
        >
          {ctaIcons.map(({ name, icon }) => (
            <li
              key={name}
              onClick={() => handleIconClick(icon as IconDefinition)}
              style={{
                color: darkOptionsAndColors.color,
                background: darkOptionsAndColors.background,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
              }}
            >
              <FontAwesomeIcon icon={icon} size={'2x'} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PublicationIconSelector;
