import React from 'react';
import { icons, colors } from '../../shared/constants';

type CopyArticleProps = {
  url: string;
  shown: boolean;
  setShown: React.Dispatch<React.SetStateAction<boolean>>;
  dark?: boolean;
  postId: string;
};

const CopyArticle: React.FC<CopyArticleProps> = (props): JSX.Element => {
  const CloseMenu = () => {
    props.setShown(false);
  };

  const copyLinkToArticle = () => {
    console.log(window.location.origin);
    // This ensures that the links work locally, in UAT and PROD; When in PROD they display NAUNCE.XYZ
    if (
      window.location.origin ==
      'https://exwqn-uaaaa-aaaaf-qaeaa-cai.raw.ic0.app'
    ) {
      navigator.clipboard.writeText(
        'http://www.nuance.xyz/share/' + props.postId
      );
    } else {
      navigator.clipboard.writeText(
        window.location.origin + '/share/' + props.postId
      );
    }
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
          props.setShown(!props.shown), copyLinkToArticle();
        }}
        src={
          props.shown
            ? darkOptionsAndColors.copyIconShown
            : darkOptionsAndColors.copyIconNotShown
        }
        alt='copy-article-menu'
        style={{ cursor: 'pointer' }}
      />

      <div
        className='drop-down-content'
        style={
          props.shown
            ? {
                height: 82,
                boxShadow: '0px 2px 10px 5px rgba(117, 117, 117, 0.08)',
                background: props.dark ? darkOptionsAndColors.background : '',
              }
            : { height: 0, background: 'transparent' }
        }
      >
        <ul style={props.shown ? {} : { display: 'none' }}>
          <div>
            <a>
              <li style={{ cursor: 'hand', color: darkOptionsAndColors.color }}>
                Link copied!
              </li>
            </a>
          </div>
        </ul>
      </div>
    </div>
  );
};

export default CopyArticle;
