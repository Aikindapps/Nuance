import React, { useEffect, useRef, useState } from "react";
import "./dropdown.scss";
import { SlArrowDown } from "react-icons/sl";
import { BsCheck } from "react-icons/bs";
import { MdFilterList } from "react-icons/md";
import { useTheme } from "../../contextes/ThemeContext";
import { colors } from "../../shared/constants";
interface DropdownProps {
  items: string[];
  onSelect: (item: string) => void;
  icons?: string[]
}

const Dropdown: React.FC<DropdownProps> = ({ items, onSelect, icons }) => {
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
    >
      <div
        className='dropdown-title-wrapper'
        onClick={() => {
          setIsOpen(!isOpen);
        }}
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
                  }
                : {}
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
          isOpen
            ? {
                background: darkTheme
                  ? colors.darkModePrimaryBackgroundColor
                  : colors.primaryBackgroundColor,
                color: darkTheme ? colors.darkModePrimaryTextColor : '',
                borderColor: darkTheme ? colors.darkerBorderColor : '',
              }
            : {
                height: '0',
                opacity: '0',
              }
        }
      >
        {items.map((item, index_) => {
          return (
            <div
              key={index_}
              className='dropdown-menu-item'
              onClick={() => {
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