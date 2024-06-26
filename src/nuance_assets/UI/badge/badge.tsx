import React from 'react';
import { icons, colors } from '../../shared/constants';
import './_badge.scss';
type BadgeProps = {
  status: 'Draft' | 'Published' | 'Submitted for review' | 'Not saved' | 'Planned' | 'Minted' | 'Planned + Mint';
  dark: boolean;
};

const Badge: React.FC<BadgeProps> = (props): JSX.Element => {
  const darkOptionsAndColors = {
    background: props.dark
      ? colors.primaryTextColor
      : colors.primaryBackgroundColor,
    color: props.dark ? colors.primaryBackgroundColor : colors.primaryTextColor,
    copyIconShown: icons.COPY_BLUE,
    copyIconNotShown: props.dark ? icons.COPY_BLUE : icons.COPY,
  };
  const getStyle = () => {
    switch (props.status) {
      case 'Draft':
        return { background: '#E6E6E6', color: '#666666' };
      case 'Not saved':
        return { background: '#E6E6E6', color: '#666666' };
      case 'Published':
        return { background: '#02C3A1', color: '#FFFFFF' };
      case 'Submitted for review':
        return { background: '#5E7CC9', color: '#FFFFFF' };
      case 'Planned':
        return { background: '#FFA768', color: '#FFFFFF' };
      case 'Minted':
        return { background: '#1BC1F0', color: '#FFFFFF' };
      case 'Planned + Mint':
        return { background: '#FFA768', color: '#FFFFFF' };
    }
  };

  return (
    <div style={getStyle()} className='badge-wrapper'>
      {props.status}
    </div>
  );
};

export default Badge;
