import React from 'react';
import { icons, colors } from '../../shared/constants';

type UnpublishArticleProps = {
  shown: boolean;
  setShown: React.Dispatch<React.SetStateAction<boolean>>;
  isPublication: boolean;
  dark?: boolean;
};

const ReportAuthorMenu: React.FC<UnpublishArticleProps> = (
  props
): JSX.Element => {
  const CloseMenu = () => {
    props.setShown(false);
  };

  const ReportAuthorHandler = () => {
    console.log(props.isPublication);
    console.log('... Report author logic.');
  };

  const darkOptionsAndColors = {
    background: props.dark
      ? colors.primaryTextColor
      : colors.primaryBackgroundColor,
    color: props.dark ? colors.primaryBackgroundColor : colors.primaryTextColor,
    THREE_DOTS: props.dark ? icons.THREE_DOTS_WHITE : icons.THREE_DOTS_BLUE,
    THREE_DOTS_LIGHT_ICON: props.dark
      ? icons.THREE_DOTS_WHITE
      : icons.THREE_DOTS,
  };

  return (
    <div className='meatball-menu'>
      <img
        onClick={() => {
          props.setShown(!props.shown);
        }}
        src={
          props.shown
            ? darkOptionsAndColors.THREE_DOTS
            : darkOptionsAndColors.THREE_DOTS_LIGHT_ICON
        }
        alt='meatball-menu'
        style={{ cursor: 'pointer' }}
      />

      <div
        className='drop-down-content'
        onMouseLeave={CloseMenu}
        style={
          props.shown
            ? {
                height: 78,
                boxShadow: '0px 2px 10px 5px rgba(117, 117, 117, 0.08)',
                background: darkOptionsAndColors.background,
              }
            : { height: 0, background: 'transparent' }
        }
      >
        <ul style={props.shown ? {} : { display: 'none' }}>
          <a onClick={ReportAuthorHandler}>
            <li
              style={{
                cursor: 'hand',
                color: darkOptionsAndColors.color,
              }}
            >
              {props.isPublication ? 'Report Publication' : 'Report Author'}
            </li>
          </a>
        </ul>
      </div>
    </div>
  );
};

export default ReportAuthorMenu;
