import React, { useState } from 'react';
import './_radio-buttons.scss';
import { RiRadioButtonFill } from "react-icons/ri";
import { MdRadioButtonUnchecked } from "react-icons/md";

type RadioButtonsProps = {
  items: JSX.Element[];
  onSelect: (item: number) => void;
};

const RadioButtons: React.FC<RadioButtonsProps> = (props): JSX.Element => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className='radio-buttons-wrapper'>{props.items.map((element, index) => {
      return (
        <div
          className='radio-button-item'
          key={index}
          onClick={() => {
            setSelectedIndex(index);
            props.onSelect(index);
          }}
        >
          {index === selectedIndex ? (
            <RiRadioButtonFill className='radio-button-icon-selected' />
          ) : (
            <MdRadioButtonUnchecked className='radio-button-icon-not-selected' />
          )}
          {element}
        </div>
      );
    })}</div>
  );
};

export default RadioButtons;
