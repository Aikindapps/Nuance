import React, { CSSProperties, useState } from 'react';
import { hexTint } from '../../shared/utils';
import { colors } from '../../shared/constants';
import { LuLoader2 } from 'react-icons/lu';
import classNames from 'classnames';
import { useTheme } from '../../contextes/ThemeContext';

type ButtonProps = {
  type?: 'button' | 'submit';
  styleType?: {dark?: string, light?: string};
  icon?: string;
  style?: Object;
  onClick?: (event: any) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: {dark?: string, light?: string};
};

const Button: React.FC<ButtonProps> = ({
  type,
  styleType,
  icon,
  style,
  onClick,
  disabled,
  loading,
  children,
  className,
}) => {
  const darkTheme = useTheme();

  const themeStyle = darkTheme ? styleType?.dark : styleType?.light
  const localeClassNameStyle = darkTheme ? className?.dark : className?.light

  const buttonClasses = classNames(
    'button-attributes-base', // base class
    `button-attributes-${themeStyle}`, // specific class
    localeClassNameStyle // custom class
  );
  return (
    <button
      className={buttonClasses}
      type={type}
      style={style}
      onClick={onClick}
      disabled={disabled}
    >
      {icon ? <img className='plus-sign' src={String(icon)} /> : ''}
      {children}
      {loading && <LuLoader2 className='button-loader-icon' />}
    </button>
  );
};

export default Button;
