// original source: https://github.com/peterKaleta/react-token-autocomplete

import React from 'react';

type OptionProps = {
  darkMode?: { background: string; color: string };
  value: string;
  fontType?: string;
  isSelected: boolean;
  index: number;
  handleSelect: (index: number) => void;
  handleClick: (index: number) => void;
};

const Option: React.FC<OptionProps> = ({
  darkMode,
  value,
  isSelected,
  index,
  handleSelect: handleSelect,
  handleClick,
  fontType,
}) => {
  const onMouseEnter = () => {
    handleSelect(index);
  };

  const onClick = () => {
    handleClick(index);
  };

  return (
    <div
      style={
        fontType === 'Default'
          ? {
              fontWeight: '500',
              lineHeight: '1.2',
              color: darkMode?.color,
              background: darkMode?.background,
              cursor: 'pointer',
            }
          : fontType
          ? {
              fontFamily: fontType,
              fontWeight: '500',
              lineHeight: '1.2',
              color: darkMode?.color,
              background: darkMode?.background,
              cursor: 'pointer',
            }
          : {}
      }
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`tags-token-autocomplete${isSelected ? ' selected' : ''}`}
    >
      {value}
    </div>
  );
};

export default Option;
