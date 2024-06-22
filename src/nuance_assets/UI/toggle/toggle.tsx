import React, { useState } from 'react';
import './_toggle.scss';

type ToggleProps = {
  toggled: boolean;
  callBack: Function;
  width?: number;
  scheduled?: boolean;
};

export const Toggle: React.FC<ToggleProps> = ({ toggled, callBack, width, scheduled }) => {
  return (
    <div
      className={`toggle-switch ${toggled ? 'toggled' : ''} ${scheduled ? 'scheduled' : ''}`}
      onClick={async () => {
        await callBack();
      }}
    >
      <div className='toggle-knob'></div>
    </div>
  );
};

export default Toggle;
