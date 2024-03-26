import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contextes/ThemeContext';
import { icons } from '../../shared/constants';
import './meatball-menu-general.scss';
import { GoKebabHorizontal } from 'react-icons/go';

type KebabMenuItem = {
  onClick: () => Promise<void>;
  text: string;
  useDividerOnTop: boolean;
  icon?: string;
};

export const MeatBallMenuGeneral = (props: {
  items: KebabMenuItem[];
  uniqueId: string;
  isMenuOpen: boolean;
  setIsMenuOpen: (input: boolean) => void;
  className?: string;
  inActive?: boolean;
}) => {
  const darkTheme = useTheme();
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const kebabMenuWrapper = document.getElementById(props.uniqueId);
      const itemsWrapper = document.getElementById('items-' + props.uniqueId);
      if (
        kebabMenuWrapper &&
        !kebabMenuWrapper.contains(event.target as Node) &&
        itemsWrapper &&
        !itemsWrapper.contains(event.target as Node) &&
        props.isMenuOpen
      ) {
        props.setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [props.isMenuOpen]);

  const getIconClassname = () => {
    if (darkTheme) {
      if (props.isMenuOpen) {
        return 'meatball-menu-general-icon-dark-open';
      } else {
        return 'meatball-menu-general-icon-dark-closed';
      }
    } else {
      if (props.isMenuOpen) {
        return 'meatball-menu-general-icon-open';
      } else {
        return 'meatball-menu-general-icon-closed';
      }
    }
  };

  const getIconColor = () => {
    if (darkTheme) {
      if (props.isMenuOpen) {
        return '#4C4C52';
      } else {
        return 'white';
      }
    } else {
      if (props.isMenuOpen) {
        return 'white';
      } else {
        return '#4C4C52';
      }
    }
  };

  return (
    <div
      className={`meatball-menu-general-wrapper ${props.className ? props.className : ''}`}
      id={props.uniqueId}
    >
      <GoKebabHorizontal
        className={getIconClassname()}
        color={getIconColor()}
        onClick={() => {
          if (props.inActive) {
            return;
          }
          props.setIsMenuOpen(!props.isMenuOpen);
        }}
      />
      {props.isMenuOpen && (
        <div
          className='meatball-menu-general-items-wrapper'
          id={'items-' + props.uniqueId}
          style={darkTheme ? { background: '#151451' } : {}}
        >
          {props.items.map((menuItem) => {
            return (
              <div
                className={`meatball-menu-general-item ${
                  menuItem.useDividerOnTop ? 'divider-on-top' : ''
                }`}
                onClick={() => {
                  menuItem.onClick();
                  props.setIsMenuOpen(false);
                }}
              >
                {menuItem.icon && (
                  <img className='kebeb-menu-item-icon' src={menuItem.icon} />
                )}
                {menuItem.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
