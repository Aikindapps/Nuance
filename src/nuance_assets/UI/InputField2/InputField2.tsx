import { number } from 'prop-types';
import React from 'react';
import { stripVTControlCharacters } from 'util';
import { colors, icons } from '../../shared/constants';

type InputProps = {
  defaultText: string;
  width: string;
  height: string;
  fontSize: string;
  fontFamily: string;
  fontColor: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: string;
  border?: string;
  borderColor?: string;
  background?: string;
  value?: string;
  maxLength?: number;
  onChange?: (postTitle: string) => void;
  hasError: boolean;
  isFloatInput?: boolean;
  isNaturalNumberInput?: boolean;
  theme?: string;
  style?: any;
  classname: string;
  icon?: string;
  button?: { icon: string; onClick: () => void };
};

const InputField: React.FC<InputProps> = (props): JSX.Element => {
  const className = props.hasError ? 'has-error textarea' : 'textarea';

  const darkOptionsAndColors = {
    background:
      props.theme === 'dark'
        ? colors.darkModePrimaryBackgroundColor
        : colors.primaryBackgroundColor,
    color:
      props.theme === 'dark'
        ? colors.darkModePrimaryTextColor
        : colors.primaryTextColor,
  };
  return (
    <div
      className={
        props.button ? props.classname + ' with-button' : props.classname
      }
    >
      <input
        className={className}
        role='input'
        placeholder={String(props.defaultText)}
        style={{
          borderColor: String(props.borderColor),
          width: String(props.width),
          fontSize: String(props.fontSize),
          fontFamily: String(props.fontFamily),
          color:
            props.theme === 'dark'
              ? colors.darkModePrimaryTextColor
              : String(props.fontColor),
          fontWeight: String(props.fontWeight),
          fontStyle: String(props.fontStyle),
          lineHeight: String(props.lineHeight),
          border: String(props.border),
          background:
            props.theme === 'dark'
              ? darkOptionsAndColors.background
              : darkOptionsAndColors.background,
          ...props.style,
        }}
        contentEditable
        maxLength={props.maxLength}
        value={props.value}
        onChange={(e) => props.onChange && props.onChange(e.target.value)}
        type={props.isFloatInput || props.isNaturalNumberInput ? 'number' : ''}
        step={
          props.isFloatInput ? '0.001' : props.isNaturalNumberInput ? '1' : ''
        }
        min={props.isFloatInput ? '0' : props.isNaturalNumberInput ? '0' : ''}
      />
      {props.icon && <img className='icon' src={props.icon} />}
      {props.button && (
        <img
          className='button'
          onClick={props.button.onClick}
          src={props.button.icon}
        />
      )}
    </div>
  );
};

export default InputField;
