import React, { useState, useEffect } from 'react';
import { PostType } from '../../types/types';
import Button from '../Button/Button';
import { formatDate } from '../../shared/utils';
import { icons, colors } from '../../shared/constants';
import { useLocation } from 'react-router-dom';

type MeatballSidebarArticlesProps = {
  isDraft: boolean;
  isDisabled: boolean;
  onSave: (draft?: boolean) => Promise<PostType | undefined>;
  onPublish: () => Promise<void>;
  post: PostType | undefined;
  dark?: boolean;
};

const MeatBallSidebarArticles: React.FC<MeatballSidebarArticlesProps> = (
  props
): JSX.Element => {
  const [shown, setShown] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);
  const location = useLocation();

  const CloseMenu = () => {
    setShown(false);
  };

  const ToggleMenu = () => {
    setShown(!shown);
  };

  useEffect(() => {
    window.onresize = window.onload = () => {
      setScreenWidth(window.innerWidth);
    };
  }, [screenWidth]);

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
    <div
      style={
        location.pathname.includes('/article/edit/') ||
        (location.pathname.includes('/article/new') && screenWidth < 768)
          ? { display: 'none' }
          : {}
      }
      className='meatball-menu-articles'
    >
      <div
        className='sidebar-button'
        style={shown ? { justifyContent: 'end', marginRight: '20px' } : {}}
      >
        <img onClick={ToggleMenu} src={icons.THREE_DOTS} alt='sidebar-button' />
      </div>

      {shown ? (
        <div
          className='sidebar-content'
          onMouseLeave={CloseMenu}
          style={
            shown ? { width: '200px', paddingLeft: '150px' } : { width: 0 }
          }
        >
          <div className='horizontal-divider'></div>
          <p className='left-text'>
            last modified: {formatDate(props.post?.modified) || ' - '}
          </p>

          <div className={props.isDraft ? '' : 'hideUpdateButton'}>
            <Button
              type='button'
              // icon={NONAME}
              styleType='primary-1'
              style={{ width: '96px' }}
              onClick={() => props.onSave()}
              disabled={props.isDisabled}
            >
              {props.isDraft ? 'Save' : 'Update'}
            </Button>
          </div>
          <div className='horizontal-divider'></div>
          <p className='left-text'>
            Current status: {props.isDraft ? 'Draft' : 'Published'}
          </p>
          <Button
            type='button'
            // icon={NONAME}
            styleType='primary-1'
            style={{ width: '96px' }}
            onClick={() => props.onPublish()}
            disabled={props.isDisabled}
          >
            Publish
          </Button>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default MeatBallSidebarArticles;
