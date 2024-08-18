import React, { CSSProperties, useState } from 'react';
import { hexTint } from '../../shared/utils';
import { colors } from '../../shared/constants';
import { LuLoader2 } from 'react-icons/lu';
import classNames from 'classnames';

type ButtonProps = {
  type?: 'button' | 'submit';
  styleType?: string;
  icon?: string;
  style?: Object;
  /* style?: {
    width?: string;
    height?: string;
    margin?: string;
    marginLeft?: string;
    marginRight?: string;
    marginTop?: string;
    marginBottom?: string;
  }; */
  onClick?: (event: any) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
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
  const buttonClasses = classNames(
    'button-attributes-base', // base class
    `button-attributes-${styleType}`, // specific class
    className // custom class
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
