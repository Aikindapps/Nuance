// original source: https://github.com/peterKaleta/react-token-autocomplete

import React, { useState, useEffect, useRef } from 'react';
import Option from './option';

type OptionListProps = {
  darkMode?: { background: string; color: string };
  options: string[];
  fontTypes?: string[];
  selected: number;
  emptyInfo?: string;
  handleOptionSelected: (index: number) => void;
  handleOptionClicked: (index: number) => void;
};

const OptionList: React.FC<OptionListProps> = ({
  options = [],
  selected,
  emptyInfo = 'no suggestions',
  handleOptionSelected,
  handleOptionClicked,
  fontTypes,
}) => {
  const refWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const optionDiv = refWrapper.current?.children[selected] as HTMLDivElement;

    optionDiv?.scrollIntoView({
      block: 'nearest',
      inline: 'start',
    });
  }, [selected]);

  return (
    <div ref={refWrapper} className='tags-options'>
      {options.length ? (
        options.map((option, index) => (
          <Option
            fontType={fontTypes?.length ? fontTypes[index] : ''}
            key={index}
            index={index}
            value={option}
            handleSelect={handleOptionSelected}
            handleClick={handleOptionClicked}
            isSelected={index === selected}
          />
        ))
      ) : (
        <div className='empty-info'>{emptyInfo}</div>
      )}
    </div>
  );
};

export default OptionList;
