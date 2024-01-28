import React from 'react';
import './_selection-item.scss';
import { useTheme } from '../../contextes/ThemeContext';

export const SelectionItem = (props: {
  isSelected: boolean;
  text: string;
  callBack?: () => void;
}) => {
  const dark = useTheme();
  return (
    <div
      className={
        props.isSelected
          ? dark
            ? 'selection-item-selected-dark'
            : 'selection-item-selected'
          : dark
          ? 'selection-item-dark'
          : 'selection-item'
      }
      onClick={() => {
        if (props.callBack) {
          props.callBack();
        }
      }}
    >
      {props.text}
    </div>
  );
};

export default SelectionItem;
