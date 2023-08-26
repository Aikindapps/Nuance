import React, { useEffect, useState } from 'react';
import InputField from '../../UI/InputField/InputField';
import OptionList from '../tags/options';
import './_select-font-types.scss';
function SelectFontType(props: {
  setFontType: Function;
  darkMode: { background: string; color: string };
}) {
  const fontTypes = [
    'default',
    'Fragment',
    'Mono',
    'Roboto',
    'Lato',
    'Montserrat',
    'Open Sans',
    'Poppins',
    'Xanh Mono',
  ];

  const [selectedFontType, setSelectedFontType] = useState(0);
  const [displayOptions, setDisplayOptions] = useState(false);

  return (
    <div className='select-font-type'>
      <input
        style={
          fontTypes[selectedFontType] === 'Default'
            ? {
                fontWeight: '500',
                lineHeight: '1.2',
                color: props.darkMode.color,
                cursor: 'pointer',
                background: props.darkMode.background,
              }
            : {
                fontFamily: fontTypes[selectedFontType],
                fontWeight: '500',
                lineHeight: '1.2',
                color: props.darkMode.color,
                cursor: 'pointer',
                background: props.darkMode.background,
              }
        }
        className={'input'}
        onChange={() => {}}
        value={fontTypes[selectedFontType]}
        onClick={() => {
          setDisplayOptions(true);
        }}
      />
      {displayOptions && (
        <OptionList
          darkMode={props.darkMode}
          options={fontTypes}
          fontTypes={fontTypes}
          selected={selectedFontType}
          handleOptionSelected={function (index: number): void {
            setSelectedFontType(index);
            props.setFontType(fontTypes[selectedFontType]);
          }}
          handleOptionClicked={function (index: number): void {
            setSelectedFontType(index);
            props.setFontType(fontTypes[selectedFontType]);
            setDisplayOptions(false);
          }}
        />
      )}
    </div>
  );
}

export default SelectFontType;
