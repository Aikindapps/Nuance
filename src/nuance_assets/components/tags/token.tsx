// original source: https://github.com/peterKaleta/react-token-autocomplete

import React from 'react';

type TokenProps = {
  index: number;
  value: string;
  handleRemove?: (index: number) => void | undefined;
};

const Token: React.FC<TokenProps> = ({
  index = 0,
  value = '',
  handleRemove = undefined,
}) => {
  const onRemoveBtnClick = () => {
    if (handleRemove) {
      handleRemove(index);
    }
  };

  const renderRemoveBtn = () => {
    return (
      <div className='remove-btn' onClick={onRemoveBtnClick}>
        x
      </div>
    );
  };

  return (
    <div className='tags-token'>
      <div className='value'>{value}</div>
      {renderRemoveBtn()}
    </div>
  );
};

export default Token;
