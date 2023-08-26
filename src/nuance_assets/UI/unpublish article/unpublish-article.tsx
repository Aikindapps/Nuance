import React from 'react';
import { PostType } from '../../types/types';
import { icons, colors } from '../../shared/constants';

type UnpublishArticleProps = {
  shown: boolean;
  setShown: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDraft: (isDraft: boolean)=>void;
  savePost: () => Promise<void>;
  dark?: boolean;
};

const UnpublishArticle: React.FC<UnpublishArticleProps> = (
  props
): JSX.Element => {
  const CloseMenu = () => {
    props.setShown(false);
  };

  const unpublishArticleHandler = () => {
    props.savePost();
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
                color: darkOptionsAndColors.color,
                backgroundColor: darkOptionsAndColors.background,
              }
            : { height: 0, backgroundColor: 'transparent' }
        }
      >
        <ul
          style={
            props.shown
              ? { color: darkOptionsAndColors.color }
              : { display: 'none' }
          }
        >
          <a onClick={unpublishArticleHandler}>
            <li>Unpublish Article</li>
          </a>
        </ul>
      </div>
    </div>
  );
};

export default UnpublishArticle;
