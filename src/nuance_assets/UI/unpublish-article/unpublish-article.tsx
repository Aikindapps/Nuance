import React from 'react';
import { icons } from '../../shared/constants';

type UnpublishArticlesProps = {
  shown: boolean;
  isArticle: Boolean;
  setShown: React.Dispatch<React.SetStateAction<boolean>>;
  setShownProfile: React.Dispatch<React.SetStateAction<boolean>>;
};

const UnpublishArticlesMenu: React.FC<UnpublishArticlesProps> = (
  props
): JSX.Element => {
  const CloseMenu = () => {
    props.setShown(false);
  };

  return (
    <div className='unpublish-menu'>
      <img
        onClick={() => {
          props.setShown(!props.shown);
          props.setShownProfile(false);
        }}
        src={
          props.shown
            ? icons.THREE_DOTS_BLUE
            : props.isArticle
            ? icons.THREE_DOTS_WHITE
            : icons.THREE_DOTS
        }
        alt='meatball-menu'
      />

      <div
        className='drop-down-content'
        onMouseLeave={CloseMenu}
        style={
          props.shown
            ? {
                height: 230,
                boxShadow: '0px 2px 10px 5px rgba(117, 117, 117, 0.08)',
              }
            : { height: 0 }
        }
      >
        <ul style={props.shown ? {} : { display: 'none' }}>
          <a href='/'>
            <li>Unpublish this article</li>
          </a>
        </ul>
      </div>
    </div>
  );
};

export default UnpublishArticlesMenu;
