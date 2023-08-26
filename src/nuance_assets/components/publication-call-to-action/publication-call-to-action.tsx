import React from 'react';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  IconDefinition,
  IconName,
  IconPrefix,
} from '@fortawesome/free-regular-svg-icons';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import IconLookup from '@fortawesome/free-regular-svg-icons';
import { findIconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ctaIcons } from '../publication-icon-selector/ctaIcons';

interface Props {
  publicationTagLine: string;
  publicationIcon: string;
  publicationButtonText: string;
  onClick?: () => void;
  publicationBackgroundColor: string;
  mobile: boolean;
  style?: any;
}

const PublicationCallToAction: React.FC<Props> = ({
  publicationTagLine,
  publicationIcon,
  publicationButtonText,
  onClick,
  publicationBackgroundColor,
  mobile,
  style
}) => {
  const [tagline, setTagline] = useState(publicationTagLine);
  const [buttonText, setButtonText] = useState(publicationButtonText);
  const publicationIconObject = {
    prefix: 'fas' as IconPrefix,
    iconName: publicationIcon as IconName,
  };

  const handleFindIcon = (iconName: string) => {
    const icon = ctaIcons.find((i) => i.name === iconName);

    return icon?.icon;
  };

  return mobile ? (
    <div
      style={{
        backgroundColor: publicationBackgroundColor,
        height: '90px',
        borderRadius: '4px',
        ...style
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <FontAwesomeIcon
          icon={handleFindIcon(publicationIcon) as IconDefinition}
          size={'2x'}
          style={{ padding: '30px', color: 'white' }}
        />
        <h2
          style={{
            fontWeight: '700',
            color: 'white',
            margin: '0 10px',
            flexGrow: 1,
            fontSize: '20px',
          }}
        >
          {publicationTagLine}
        </h2>

        <button
          className='publication-cta-button'
          style={{
            color: publicationBackgroundColor,
            height: '34px',
            padding: '10px 20px',
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 20px',
          }}
          onClick={onClick}
        >
          <h2
            style={{
              margin: '0',
              flexGrow: 1,
              whiteSpace: 'nowrap',
              fontSize: '14px',
            }}
          >
            {publicationButtonText}
          </h2>
        </button>
      </div>
    </div>
  ) : (
    <div
      style={{
        borderTop: `1px solid ${publicationBackgroundColor} `,
        padding: '20px 0',
        borderBottom: `1px solid ${publicationBackgroundColor} `,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {' '}
      <h2
        style={{
          fontWeight: '700',
          color: publicationBackgroundColor,
          margin: '0 10px',
          flexGrow: 1,
          fontSize: '20px',
          padding: ' 20px',
          textAlign: 'center',
        }}
      >
        {publicationTagLine}
      </h2>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          style={{
            color: 'white',
            height: '34px',
            padding: '10px 20px',
            backgroundColor: publicationBackgroundColor,
            border: 'none',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: ' 20px',
          }}
          onClick={onClick}
        >
          <h2
            style={{
              color: 'white',
              margin: '0',
              flexGrow: 1,
              whiteSpace: 'nowrap',
              fontSize: '14px',
            }}
          >
            {
              <FontAwesomeIcon
                icon={faArrowRight}
                size={'sm'}
                style={{ marginRight: '10px' }}
              />
            }

            {publicationButtonText}
          </h2>
        </button>
      </div>
    </div>
  );
};

export default PublicationCallToAction;
