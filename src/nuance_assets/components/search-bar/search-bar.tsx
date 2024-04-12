import React, { CSSProperties, KeyboardEventHandler } from 'react';
import { useTheme } from '../../contextes/ThemeContext';
import { colors, icons } from '../../shared/constants';

type SearchProps = {
  container?: HTMLElement | null;
  value?: string;
  onChange?: (searchTerm: string) => void;
  onKeyDown?: (e: any) => void;
  onSelect?: (e: any) => void;
  color?: string;
  style?: CSSProperties;
};

// const changeUnderlineColor = () => {
//   const container:HTMLElement | null = document.getElementById('search-container');
//   container?.style.color = 'red'
// };
// onKeyPress={changeUnderlineColor}

const SearchBar: React.FC<SearchProps> = ({
  value,
  onKeyDown,
  onChange,
  color,
  style,
  // onSelect,
}) => {
  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };

  return (
    <div id='search-container' style={{ ...darkOptionsAndColors, ...style }}>
      <input
        style={
          color
            ? {
                borderBottom: `1px solid ${color}`,
                backgroundColor: darkTheme
                  ? colors.darkModePrimaryBackgroundColor
                  : colors.primaryBackgroundColor,
                color: darkTheme
                  ? colors.darkModePrimaryTextColor
                  : colors.primaryTextColor,
              }
            : {
                backgroundColor: darkTheme
                  ? colors.darkModePrimaryBackgroundColor
                  : colors.primaryBackgroundColor,
                color: darkTheme
                  ? colors.darkModePrimaryTextColor
                  : colors.primaryTextColor,
              }
        }
        value={value}
        onKeyDown={onKeyDown}
        onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
          onChange && onChange(e.target.value)
        }
        // onSelect={onSelect}
      />
    </div>
  );
};

export default SearchBar;
