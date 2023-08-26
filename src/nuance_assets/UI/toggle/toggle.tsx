import React from "react";
import { useState } from "react"
import './_toggle.scss';
type ToggleProps = {
    toggled: boolean;
    callBack: Function;
}
export const Toggle: React.FC<ToggleProps> = ({ toggled, callBack }) =>{
    return (
        <div onClick={async ()=>await callBack()} className="toggle-switch">
          <input 
            onChange={()=>{}}
            checked={toggled}
            type="checkbox"
            className="toggle-switch-checkbox"
          />
          <label className="toggle-switch-label" htmlFor={'this.props.Name'}>
            <span className="toggle-switch-inner" />
            <span className="toggle-switch-switch" />
          </label>
        </div>
      );
}