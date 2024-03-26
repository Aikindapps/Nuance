import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { images, icons, colors } from '../../shared/constants';
import './_premium-article-sold-bar.scss';

interface PremiumArticleSoldBarProps {
  availableSupply: number;
  totalSupply: number;
  dark?: boolean;
}

const PremiumArticleSoldBar: React.FC<PremiumArticleSoldBarProps> = ({
  availableSupply,
  totalSupply,
  dark,
}) => {
  const sold = totalSupply - availableSupply;
  const soldBarWidth = 48;
  const soldWidth = (sold / totalSupply) * soldBarWidth;
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
    <div className='premium-article-sold-bar-wrapper'>
      <div
        style={dark ? { color: darkOptionsAndColors.secondaryColor } : {}}
        className='sold-bar-text'
      >{`${sold} OF ${totalSupply}`}</div>
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
    </div>
  );
};

export default PremiumArticleSoldBar;
