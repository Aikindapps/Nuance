import React, { useState } from 'react';
import './_toggle.scss';

type ToggleProps = {
  toggled: boolean;
  callBack: Function;
  width?: number;
};

export const Toggle: React.FC<ToggleProps> = ({ toggled, callBack, width }) => {
  return (
    <div
      className={`toggle-switch ${toggled ? 'toggled' : ''}`}
      onClick={async () => {
        await callBack();
      }}
    >
      <div className='toggle-knob'></div>
    </div>
  );
};

export default Toggle;
