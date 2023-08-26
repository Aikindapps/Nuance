import React, { useState, useEffect } from 'react';
import { colors, icons } from '../../shared/constants';
import ReaderAndAuthor from '../../UI/reader-and-author-edit/reader-and-author-edit';
import { usePostStore, useUserStore } from '../../store';

type ReportArticleProps = {
  id: string;
  handle: string;
  url: string;
  shown: boolean;
  setShown: React.Dispatch<React.SetStateAction<boolean>>;
  isPremium: boolean;
  dark?: boolean;
};

//report article logic
const ReportArticle: React.FC<ReportArticleProps> = (props): JSX.Element => {
  const CloseMenu = () => {
    props.setShown(false);
  };

  const copyLinkToArticle = () => {
    navigator.clipboard.writeText(window.location.origin + props.url);
    CloseMenu();
  };

  //follow author logic

  usePostStore((state) => state);

  const { user, getAuthor, author } = useUserStore((state) => ({
    user: state.user,
    getAuthor: state.getAuthor,
    author: state.author,
  }));
  const { followAuthor, unfollowAuthor } = useUserStore((state) => ({
    followAuthor: state.followAuthor,
    unfollowAuthor: state.unfollowAuthor,
  }));

  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleFollow() {
    if (!user?.followersArray || user.followersArray.includes(props.handle)) {
      return;
    }

    if (props?.handle) {
      followAuthor(props?.handle);
      setLoading(true);

      setTimeout(() => {
        setLoading(false);
      }, 10000);
    }
  }

  useEffect(() => {
    if (user && props.handle) {
      setFollowing(user.followersArray.includes(props.handle));
      setLoading(false);
    }
  }, [user?.followersArray, props.handle]);

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
        alt='copy-article-menu'
        style={{ cursor: 'pointer' }}
      />

      <div
        className='left-drop-down-content'
        onMouseLeave={CloseMenu}
        style={
          props.shown
            ? {
                height: 100,
                boxShadow: '0px 2px 10px 5px rgba(117, 117, 117, 0.08)',
                background: darkOptionsAndColors.background,
              }
            : { height: 0, background: 'transparent' }
        }
      >
        <ul style={props.shown ? {} : { display: 'none' }}>
          <div onClick={copyLinkToArticle}>
            <a>
              <li
                style={{
                  cursor: 'hand',
                  color: darkOptionsAndColors.color,
                }}
              >
                Report Article
              </li>
            </a>
            <ReaderAndAuthor
              id={props.id}
              handle={props.handle}
              isPremium={props.isPremium}
              dark={props.dark}
            />
            {following || !user ? null : (
              <a>
                <li
                  onClick={handleFollow}
                  style={{ cursor: 'hand', color: darkOptionsAndColors.color }}
                >
                  Follow Author
                </li>
              </a>
            )}
          </div>
        </ul>
      </div>
    </div>
  );
};

export default ReportArticle;
