import React from 'react';
import { colors } from '../../shared/constants';

type InputProps = {
  handle: Boolean;
  onChange?: (searchTerm: string) => void;
  hasError: Boolean;
  theme?: string;
  style?: any;
  inactive?: boolean;
};

const InputField: React.FC<InputProps> = ({
  handle,
  hasError,
  onChange,
  style,
  inactive
}): JSX.Element => {
  const className = hasError
    ? 'textarea has-error input-attributes'
    : 'textarea';
  return (
    <div>
      <div
        className='input-attributes'
        style={inactive ? { height: '23px' } : {}}
      >
        <span
          className={className}
          id={handle ? 'handle' : 'no-handle'}
          role='input'
          contentEditable={!inactive}
          onInput={(e: React.ChangeEvent<HTMLInputElement>): void => {
            onChange && onChange(String(e.currentTarget.textContent));
            // console.log('test: ', e.currentTarget.textContent);
          }}
        ></span>
      </div>
    </div>
  );
};

export default InputField;
