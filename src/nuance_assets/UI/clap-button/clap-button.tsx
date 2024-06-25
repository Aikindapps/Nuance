import React, { useContext, useEffect, useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { icons, colors } from '../../shared/constants';
import { Context } from '../../contextes/Context';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { PostType } from '../../types/types';
import { useAuthStore } from '../../store';
import { toastError } from '../../services/toastService';

type ButtonProps = {
  type?: String;
  styleType?: String;
  icon?: String;
  style?: Object;
  onClick?: (event: any) => void;
  disabled: boolean;
  onMouseDown: (event: any) => void;
  onMouseUp: (event: any) => void;
  dark?: boolean;
  applaudingPost: PostType | undefined;
};

const ClapButton: React.FC<ButtonProps> = (props): JSX.Element => {
  const {
    styleType,
    icon,
    children,
    type,
    disabled,
    style,
    onClick,
    applaudingPost,
  } = props;

  let clapIcon = props.dark ? icons.CLAP_WHITE : icons.CLAP_BLUE;
  const [clapIcons, setClapIcons] = useState([clapIcon]);
  const [clicks, setClicks] = useState(0);

  const modalContext = useContext(ModalContext);

  const { fetchTokenBalances, tokenBalances } = useAuthStore((state) => ({
    tokenBalances: state.tokenBalances,
    fetchTokenBalances: state.fetchTokenBalances,
  }));

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

  const { user } = useUserStore((state) => ({
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

  const getNumberOfApplauds = () => {
    if (modalContext && props.applaudingPost) {
      let fakeApplaud = modalContext.getFakeApplaud(
        props.applaudingPost.postId,
        parseInt(props.applaudingPost.claps)
      );
      if (fakeApplaud) {
        return fakeApplaud.after;
      } else {
        return parseInt(props.applaudingPost.claps);
      }
    }
    return 0;
  };
  useEffect(() => {
    if (modalContext && props.applaudingPost) {
      let fakeApplaud = modalContext.getFakeApplaud(
        props.applaudingPost.postId,
        parseInt(props.applaudingPost.claps)
      );
      if (
        fakeApplaud &&
        parseInt(props.applaudingPost.claps) !== getNumberOfApplauds() &&
        Math.abs(fakeApplaud.date.getTime() - new Date().getTime()) < 1000
      ) {
        var i = 0;
        while (i < 3) {
          setTimeout(() => {
            clapAnimation();
          }, 300 * i);
          i += 1;
        }
      }
    }
  }, [getNumberOfApplauds()]);

  return (
    <button
      className={'button-attributes-' + styleType}
      style={style}
      onClick={() => {
        if (user) {
          //clapAnimation()
          //check if the post is written by the user
          if (
            applaudingPost?.handle === user.handle ||
            applaudingPost?.creatorHandle === user.handle
          ) {
            toastError('You can not applaud your own article!');
            return;
          }
          if (applaudingPost && tokenBalances.length !== 0) {
            modalContext?.openModal('Clap', {
              clappingPostData: applaudingPost,
            });
          }
        } else {
          modalContext?.openModal('Login');
        }
      }}
      disabled={false}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
    >
      {clapCreate()}
      {icon ? <img className='plus-sign' src={String(icon)} /> : ''}
      {getNumberOfApplauds()}
    </button>
  );
};

export default ClapButton;
