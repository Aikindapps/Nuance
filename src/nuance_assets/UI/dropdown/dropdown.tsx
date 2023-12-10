import React, { useEffect, useRef, useState } from 'react';
import './dropdown.scss';
import { SlArrowDown } from 'react-icons/sl';
import { BsCheck } from 'react-icons/bs';
import { MdFilterList } from 'react-icons/md';
import { useTheme } from '../../contextes/ThemeContext';
import { colors } from '../../shared/constants';
interface DropdownProps {
  items: string[];
  onSelect: (item: string) => void;
  icons?: string[];
  style?: any;
  nonActive?: boolean;
  selectedTextStyle?: any;
  drodownItemsWrapperStyle?: any;
}

const Dropdown: React.FC<DropdownProps> = ({
  items,
  onSelect,
  icons,
  style,
  nonActive,
  selectedTextStyle,
  drodownItemsWrapperStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const darkTheme = useTheme();

  const menuRef = useRef(null);

  /*const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  */

  return (
    <div
      className={
        isOpen ? 'dropdown-menu-wrapper-active' : 'dropdown-menu-wrapper'
      }
      ref={menuRef}
      style={{ ...style, cursor: nonActive ? 'not-allowed' : '' }}
    >
      <div
        className='dropdown-title-wrapper'
        onClick={() => {
          if (nonActive) {
            return;
          }
          setIsOpen(!isOpen);
        }}
        style={{ cursor: nonActive ? 'not-allowed' : '' }}
      >
        <div className='dropdown-icon-title-wrapper'>
          {icons && (
            <img
              className='filter-icon'
              width='30px'
              height='30px'
              src={icons[index]}
            />
          )}
          <div
            className='dropdown-menu-title'
            style={
              darkTheme
                ? {
                    color: colors.darkModePrimaryTextColor,
                    ...selectedTextStyle,
                  }
                : { ...selectedTextStyle }
            }
          >
            {items[index]}
          </div>
        </div>
        <SlArrowDown
          style={{
            transition: '0.2s ease-in-out',
            transform: isOpen ? 'rotate(-180deg)' : 'rotate(0deg)',
            color: darkTheme ? colors.darkSecondaryTextColor : '',
          }}
        />
      </div>
      <div
        className='dropdown-menu-items'
        style={
          isOpen && !nonActive
            ? {
                background: darkTheme
                  ? colors.darkModePrimaryBackgroundColor
                  : colors.primaryBackgroundColor,
                color: darkTheme ? colors.darkModePrimaryTextColor : '',
                borderColor: darkTheme ? colors.darkerBorderColor : '',
                ...drodownItemsWrapperStyle,
              }
            : {
                height: '0',
                opacity: '0',
                ...drodownItemsWrapperStyle,
              }
        }
      >
        {items.map((item, index_) => {
          return (
            <div
              key={index_}
              className='dropdown-menu-item'
              onClick={() => {
                if (nonActive) {
                  return;
                }
                setIndex(index_);
                onSelect(items[index_]);
                setIsOpen(false);
              }}
            >
              <div className='dropdown-menu-item-text'>{item}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dropdown;
