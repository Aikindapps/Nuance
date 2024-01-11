import React, { useEffect, useRef, useState } from 'react';
import './dropdown.scss';
import { SlArrowDown } from 'react-icons/sl';
import { useTheme } from '../../contextes/ThemeContext';
import { colors } from '../../shared/constants';
interface DropdownProps {
  items: string[];
  onSelect: (item: string) => void;
  selected?: string;
  icons?: string[];
  style?: any;
  nonActive?: boolean;
  selectedTextStyle?: any;
  drodownItemsWrapperStyle?: any;
  arrowWidth?: number;
  imageStyle?: any
  dropdownMenuItemStyle?: any;
  notActiveIfOnlyOneItem?: boolean;
  onIsOpenChanged?: (isOpen: boolean) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  items,
  onSelect,
  selected,
  icons,
  style,
  nonActive,
  selectedTextStyle,
  drodownItemsWrapperStyle,
  arrowWidth,
  imageStyle,
  dropdownMenuItemStyle,
  notActiveIfOnlyOneItem,
  onIsOpenChanged
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const darkTheme = useTheme();

  const menuRef = useRef(null);
  const onlyOneItem = notActiveIfOnlyOneItem && items.length === 1;

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
      style={{
        ...style,
        cursor: nonActive ? 'not-allowed' : onlyOneItem ? 'default' : '',
        borderBottom: onlyOneItem ? 'none' : '',
      }}
    >
      <div
        className='dropdown-title-wrapper'
        onClick={() => {
          if (nonActive) {
            return;
          }
          setIsOpen(!isOpen);
          if (onIsOpenChanged) {
            onIsOpenChanged(!isOpen);
          }
        }}
        style={{
          cursor: nonActive ? 'not-allowed' : onlyOneItem ? 'default' : '',
        }}
      >
        <div className='dropdown-icon-title-wrapper'>
          {icons && (
            <img
              className='filter-icon'
              width='30px'
              height='30px'
              style={imageStyle}
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
            {selected || items[index] || items[0]}
          </div>
        </div>
        {!onlyOneItem && (
          <SlArrowDown
            style={{
              transition: '0.2s ease-in-out',
              transform: isOpen ? 'rotate(-180deg)' : 'rotate(0deg)',
              color: darkTheme ? colors.darkSecondaryTextColor : '',
              width: arrowWidth + 'px',
            }}
          />
        )}
      </div>
      {!onlyOneItem && (
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
                  if (onIsOpenChanged) {
                    onIsOpenChanged(false);
                  }
                }}
                style={{ ...dropdownMenuItemStyle }}
              >
                {icons && (
                  <img
                    className='dropdown-menu-item-icon'
                    src={icons[index_]}
                  />
                )}
                <div className='dropdown-menu-item-text'>{item}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
