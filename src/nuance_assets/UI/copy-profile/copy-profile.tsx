import React from 'react';
import { icons, colors } from '../../shared/constants';

type CopyProfileProps = {
  shown: boolean;
  setShown: React.Dispatch<React.SetStateAction<boolean>>;
  handle: string | undefined;
  dark?: boolean;
};

const CopyProfile: React.FC<CopyProfileProps> = (props): JSX.Element => {
  const CloseMenu = () => {
    props.setShown(false);
  };

  const copyLinkToProfile = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${props.handle}`);
    setTimeout(() => {
      CloseMenu();
    }, 2000);
  };
  const darkOptionsAndColors = {
    background: props.dark
      ? colors.primaryTextColor
      : colors.primaryBackgroundColor,
    color: props.dark ? colors.primaryBackgroundColor : colors.primaryTextColor,
    copyIconShown: icons.COPY_BLUE,
    copyIconNotShown: props.dark ? icons.COPY_BLUE : icons.COPY,
  };

  return (
    <div className='meatball-menu'>
      <img
        onClick={() => {
          props.setShown(!props.shown), copyLinkToProfile();
        }}
        src={
          props.shown ? icons.COPY_BLUE : darkOptionsAndColors.copyIconNotShown
        }
        alt='copy-article-menu'
        style={{ cursor: 'pointer' }}
      />

      <div
        className='left-drop-down-content'
        style={
          props.shown
            ? {
                height: 82,
                boxShadow: '0px 2px 10px 5px rgba(117, 117, 117, 0.08)',
                background: darkOptionsAndColors.background,
                color: darkOptionsAndColors.color,
              }
            : { height: 0, background: darkOptionsAndColors.background }
        }
      >
        <ul style={props.shown ? {} : { display: 'none' }}>
          <div onClick={copyLinkToProfile}>
            <a>
              <li
                style={{
                  cursor: 'hand',
                  color: darkOptionsAndColors.color,
                }}
              >
                Link copied!
              </li>
            </a>
          </div>
        </ul>
      </div>
    </div>
  );
};

export default CopyProfile;
