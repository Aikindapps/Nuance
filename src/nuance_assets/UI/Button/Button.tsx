import React, { useState } from 'react';
import { hexShade, hexTint } from '../../shared/utils';
import { colors } from '../../shared/constants';
import { LuLoader2 } from 'react-icons/lu';

type ButtonProps = {
  type?: String;
  styleType?: String;
  icon?: String;
  style?: Object;
  onClick?: (event: any) => void;
  disabled?: boolean;
  loading?: boolean;
  primaryColor?: string;
  dark?: boolean;
};

const Button: React.FC<ButtonProps> = (props): JSX.Element => {
  const {
    styleType,
    icon,
    children,
    type,
    disabled,
    style,
    onClick,
    primaryColor,
    loading,
  } = props;
  const [displayingBorderColor, setDisplayingBorderColor] =
    useState(primaryColor);
  var hexTinted = '';
  if (primaryColor) {
    hexTinted = hexTint(primaryColor);
  }
  if (primaryColor) {
    return (
      <button
        className={'button-attributes-' + styleType}
        style={
          primaryColor
            ? { ...style, borderColor: displayingBorderColor }
            : style
        }
        onClick={onClick}
        disabled={disabled}
        onMouseOver={() => {
          setDisplayingBorderColor(hexTinted);
        }}
        onMouseOut={() => {
          setDisplayingBorderColor(primaryColor);
        }}
      >
        {icon ? <img className='plus-sign' src={String(icon)} /> : ''}
        {children}
        {loading && <LuLoader2 className='button-loader-icon' />}
      </button>
    );
  } else {
    return (
      <button
        className={'button-attributes-' + styleType}
        style={style}
        onClick={onClick}
        disabled={disabled}
      >
        {icon ? <img className='plus-sign' src={String(icon)} /> : ''}
        {children}
        {loading && <LuLoader2 className='button-loader-icon' />}
      </button>
    );
  }
};

export default Button;
