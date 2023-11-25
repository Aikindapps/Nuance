import React, { useContext, useEffect, useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { icons, colors } from '../../shared/constants';
import { Context } from '../../contextes/Context';
import {Context as ModalContext} from '../../contextes/ModalContext'


type ButtonProps = {
  type?: String;
  styleType?: String;
  icon?: String;
  style?: Object;
  onClick?: (event: any) => void;
  disabled?: boolean;
  onMouseDown: (event: any) => void;
  onMouseUp: (event: any) => void;
  dark?: boolean;
};

const ClapButton: React.FC<ButtonProps> = (props): JSX.Element => {
  const { styleType, icon, children, type, disabled, style, onClick } = props;

  let clapIcon = props.dark ? icons.CLAP_WHITE : icons.CLAP_BLUE;
  const [clapIcons, setClapIcons] = useState([clapIcon]);
  const [clicks, setClicks] = useState(0);

  const modalContext = useContext(ModalContext)

  function clapAnimation() {
    setClicks(clicks + 1);
    setClapIcons(clapIcons.concat(clapIcon));
    setTimeout(() => {
      setClicks(0);
      //keep from growing too large but leaves room for fast clicks
      if (clapIcons.length > 3) {
        setClapIcons([clapIcon]);
      }
    }, 250);
  }

  const { user} = useUserStore((state) => ({
    user: state.user,
  }));

  function clapCreate() {
    for (let i = 0; i < clicks; i++) {
      return (
        <img
          src={clapIcons[clicks]}
          alt='clap'
          className='clap-icon-container'
        />
      );
    }
  }

  useEffect(() => {
    clapCreate();
  }, [clicks]);

  const darkOptionsAndColors = {
    background: props.dark
      ? colors.primaryTextColor
      : colors.primaryBackgroundColor,
    color: props.dark ? colors.primaryBackgroundColor : colors.primaryTextColor,
  };

  return (
    <button
      className={'button-attributes-' + styleType}
      style={style}
      onClick={()=>{
        if(user){
          clapAnimation()
        }
        else{
          modalContext?.openModal('Login');
        }
      }}
      disabled={disabled && user ? true : false}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
    >
      {clapCreate()}
      {icon ? <img className='plus-sign' src={String(icon)} /> : ''}
      {children}
    </button>
  );
};

export default ClapButton;
