import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { images, icons, colors } from '../../shared/constants';
import './_premium-article-owners.scss';
import { PremiumArticleOwners as PremiumArticlesOwnersObject } from '../../types/types';

interface PremiumArticleOwnersProps {
  owners: PremiumArticlesOwnersObject | undefined;
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
      <img className='premium-article-owners-nft-icon' src={icons.NFT_ICON} />
      <div className='sold-bar'>
        <div
          className='sold-percentage-sold'
          style={{
            width: `${soldWidth}px`,
            background: dark
              ? colors.darkModePrimaryTextColor
              : colors.primaryTextColor,
          }}
        />
        <div
          className='sold-percentage-remaining'
          style={{ width: `${remainingWidth}px` }}
        />
      </div>
      <div className='premium-article-owners-sold-text'>{`${sold} OF ${owners?.totalSupply} KEYS SOLD`}</div>
    </div>
  );
};

export default PremiumArticleOwners;
