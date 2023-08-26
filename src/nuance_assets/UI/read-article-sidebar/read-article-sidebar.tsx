import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store';
import { images, icons, colors } from '../../shared/constants';

type ReadArticleSidebarProps = {
  isSidebarToggle?: (e: any) => void;
  url: string;
  isPremium?: boolean;
  id?: string;
  handle?: string;
  avatar?: string;
  dark?: boolean;
};

const ReadArticleSidebar: React.FC<ReadArticleSidebarProps> = (
  props
): JSX.Element => {
  const [shown, setShown] = useState(false);
  const [isAuthorAndReader, setIsAuthorAndReader] = useState(false);

  const author = useUserStore((state) => state.author);
  const user = useUserStore((state) => state.user);

  const CloseMenu = () => {
    setShown(false);
  };

  const ToggleMenu = () => {
    setShown(!shown);
    props.isSidebarToggle && props.isSidebarToggle(!shown);
  };

  const copyLinkToArticle = () => {
    if (
      window.location.origin == 'https://exwqn-uaaaa-aaaaf-qaeaa-cai.ic0.app'
    ) {
      navigator.clipboard.writeText('http://www.nuance.xyz' + props.url);
    } else {
      navigator.clipboard.writeText(window.location.origin + props.url);
    }

    CloseMenu();
    props.isSidebarToggle && props.isSidebarToggle(false);
  };

  const reportArticle = () => {
    console.log('Logic for reporting article...');
  };

  let navigate = useNavigate();

  const separateIds = (input: string) => {
    // Split the input string by the '-' character
    let parts = input.split('-');

    // The first part is the post ID
    let postId = parts[0];

    // The rest of the parts make up the canister ID
    let bucketCanisterId = parts.slice(1).join('-');
    // Return the IDs in an object
    return { postId, bucketCanisterId };
  };

  const postId = separateIds(props.id as string).postId;

  function editArticle() {
    navigate('/article/edit/' + postId);
  }

  function authorReaderCheck() {
    var isEditor = false;
    user?.publicationsArray.map((pubObj) => {
      if (pubObj.isEditor && pubObj.publicationName === props.handle) {
        isEditor = true;
      }
    });
    return (props.handle == user?.handle || isEditor) && !props.isPremium;
  }

  useEffect(() => {
    setIsAuthorAndReader(authorReaderCheck());
  }, [props.handle]);

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
      className='read-article-sidebar-menu'
      style={shown ? { width: '230px' } : { width: 0 }}
    >
      <img
        className='sidebar-button'
        onClick={ToggleMenu}
        src={
          shown
            ? darkOptionsAndColors.THREE_DOTS
            : darkOptionsAndColors.THREE_DOTS_LIGHT_ICON
        }
        alt='sidebar-button'
      />
      {
        <div
          className='sidebar-content'
          style={shown ? { width: '230px' } : { width: 0 }}
        >
          <div
            className='left-content-sidebar'
            style={shown ? {} : { display: 'none' }}
          >
            <div className='menus'>
              <a
                className='links'
                style={{ color: darkOptionsAndColors.color }}
                onClick={copyLinkToArticle}
              >
                Copy link to article
              </a>
              <a
                className='links'
                style={{ color: darkOptionsAndColors.color }}
                onClick={reportArticle}
              >
                Report article
              </a>
              {isAuthorAndReader ? (
                <a
                  className='links'
                  style={{ color: darkOptionsAndColors.color }}
                  onClick={editArticle}
                >
                  Edit article
                </a>
              ) : null}
            </div>
            <div className='horizontal-divider'></div>
            {author && (
              <div className='author'>
                <img src={props.avatar || images.DEFAULT_AVATAR} alt=''></img>
                <a style={{ color: darkOptionsAndColors.color }}>
                  @{props.handle}
                </a>
              </div>
            )}
            <div className='horizontal-divider'></div>
          </div>
        </div>
      }
    </div>
  );
};

export default ReadArticleSidebar;
