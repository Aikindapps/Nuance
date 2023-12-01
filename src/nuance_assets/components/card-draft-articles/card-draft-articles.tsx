import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../../store';
import { images, icons, colors } from '../../shared/constants';
import { PostType } from '../../types/types';
import { useTheme } from '../../contextes/ThemeContext';
import './_card-draft-articles.scss';
import { DateFormat, formatDate } from '../../shared/utils';

interface CardVerticalProps {
  post: PostType;
}

const CardDraftArticles: React.FC<CardVerticalProps> = ({
  post
}) => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [screenWidth, setScreenWidth] = useState(0);
  const dark = useTheme();

  const darkOptionsAndColors = {
    background: dark
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: dark ? colors.darkModePrimaryTextColor : colors.primaryTextColor,
    secondaryColor: dark
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
    filter: dark ? 'contrast(.5)' : 'none',
  };

  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [screenWidth]
  );

  const isUserEditor = () => {
    let postHandle = post.handle;
    let result = false;
    user?.publicationsArray.forEach((val)=>{
      if(val.publicationName === postHandle){
        result = true
      }
    })
    return result
  }

  const getEditStatus = () => {
    if(post.isPremium){
      return 'Premium'
    }
    else{
      if(post.isPublication){
        if(post.isDraft){
          return 'Submitted for review'
        }
        else{
          if(isUserEditor()){
            return 'Published';
          }
          else{
            return "Published but writer"
          }
          
        }
      }
      else{
        if(post.isDraft){
          return "Draft"
        }
        else{
          return "Published"
        }
      }
    }
  }


  return (
    <div className='card-draft-articles-wrapper'>
      <Link className='card-draft-articles-image-wrapper' to={post.url}>
        <img
          className='card-draft-articles-image'
          src={post.headerImage !== '' ? post.headerImage : images.NUANCE_LOGO}
        />
      </Link>

      <div className='card-draft-articles-right-wrapper'>
        <div className='card-draft-articles-actions-wrapper'>
          <div className='card-draft-articles-actions-left'>
            {getEditStatus() === 'Draft' || getEditStatus() === 'Published' ? (
              <img
                className='card-draft-articles-action-icon-pointer'
                src={icons.EDIT}
              />
            ) : getEditStatus() === 'Premium' ? (
              <img
                className='card-draft-articles-action-icon-pointer'
                src={icons.NFT_LOCK_ICON}
              />
            ) : null}
          </div>
          <div className='card-draft-articles-actions-right'>
            {post.isPublication && (
              <div className='card-draft-articles-right-action-wrapper'>
                <img
                  className='card-draft-articles-action-icon'
                  src={icons.PUBLICATION_ICON}
                />
              </div>
            )}
            <div className='card-draft-articles-right-action-wrapper'>
              <img
                className='card-draft-articles-action-icon-pointer'
                src={icons.CLAP_BLACK}
              />
              <div className='card-draft-articles-right-action-text'>
                {post.claps}
              </div>
            </div>
            <div className='card-draft-articles-date'>
              {formatDate(post.publishedDate, DateFormat.NoYear) ||
                formatDate(post.created, DateFormat.NoYear)}
            </div>
          </div>
        </div>
        <Link className='card-draft-articles-title-wrapper' to={post.url}>
          <div className='card-draft-articles-title'>{post.title}</div>
        </Link>
        <div className='card-draft-articles-subtitle'>{post.subtitle}</div>
      </div>
    </div>
  );
};

export default CardDraftArticles;
