import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { images, icons, colors } from '../../shared/constants';
import './_premium-article-owners.scss';
import { PremiumArticleOwners } from '../../types/types';

interface PremiumArticleOwnersProps {
  owners: PremiumArticleOwners | undefined;
  dark?: boolean;
}

const PremiumArticleOwners: React.FC<PremiumArticleOwnersProps> = ({
  owners,
  dark,
}) => {
  const sold = Number(owners?.totalSupply) - Number(owners?.available);
  const soldBarWidth = 75;
  const soldWidth = (sold / Number(owners?.totalSupply)) * soldBarWidth;
  const remainingWidth = soldBarWidth - soldWidth;
  const navigate = useNavigate();

  const darkOptionsAndColors = {
    background: dark
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: dark ? colors.darkModePrimaryTextColor : colors.primaryTextColor,
    secondaryColor: dark
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
  };

  return (
    <div className='edit-article-premium-article-owners'>
      <img
        src={icons.NFT_LOCK_ICON}
        className='NFT-icon'
        style={{
          width: '25px',
          marginBottom: '25px',
          filter: dark ? 'contrast(0.5)' : 'none',
        }}
      ></img>
      <div className='NFT-field-wrapper'>
        <div className='NFT-left-text-container'>
          <p className='NFT-left-text'>
            {`You have created limited access to this article by selling ${owners?.totalSupply} NFT keys.`}
          </p>
          <p className='NFT-left-text'>
            After creating NFT keys you cannot edit the article’s Title,
            Introduction text and Header image anymore.
          </p>
        </div>
      </div>
      <div className='premium-article-owners'>
        <div className='sell-info-flex'>
          <div className='sold-info'>{`SOLD KEYS (${sold.toString()} OF ${
            owners?.totalSupply
          })`}</div>
          <div className='sold-bar'>
            <div
              className='sold-percentage-sold'
              style={{
                width: `${soldWidth}px`,
                background: dark
                  ? colors.darkModeSecondaryButtonColor
                  : colors.primaryTextColor,
              }}
            />
            <div
              className='sold-percentage-remaining'
              style={{ width: `${remainingWidth}px` }}
            />
          </div>
        </div>
        <div className='owners'>
          {owners?.ownersList.map((ownerObject) => {
            if (ownerObject.handle.length) {
              return (
                <div
                  className='owner-flex'
                  key={ownerObject.accessKeyIndex}
                  style={{ color: darkOptionsAndColors.color }}
                >
                  <a
                    className='owner'
                    onClick={() => {
                      navigate('/' + ownerObject.handle);
                    }}
                    style={{ color: darkOptionsAndColors.color }}
                  >{`@${ownerObject.handle}`}</a>
                  <div className='token-index'>{`#${ownerObject.accessKeyIndex}`}</div>
                </div>
              );
            } else {
              return (
                <div className='owner-flex'>
                  <a
                    className='owner'
                    style={{ color: darkOptionsAndColors.color }}
                    onClick={() => {
                      window.open(
                        'https://dashboard.internetcomputer.org/account/' +
                          ownerObject.accountId,
                        '_blank'
                      );
                    }}
                  >{`${ownerObject.accountId.slice(0, 10)}...`}</a>
                  <div className='token-index'>{`#${ownerObject.accessKeyIndex}`}</div>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default PremiumArticleOwners;
