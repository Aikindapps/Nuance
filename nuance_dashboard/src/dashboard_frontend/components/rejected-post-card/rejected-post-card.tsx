import React, { useContext, useEffect, useState } from 'react';
import { Comment } from '../../../../../src/declarations/PostBucket/PostBucket.did';
import './rejected-post-card.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { CommentType, PostType } from '../../shared/types';
import Toggle from '../toggle/toggle';
import { images } from '../../shared/constants';
import { usePostStore } from 'src/dashboard_frontend/store';

type RejectedPostCardProps = {
  post: PostType;
};
export const RejectedPostCard: React.FC<RejectedPostCardProps> = (props) => {

  
  
  const modalContext = useContext(ModalContext);
  let post = props.post;
  return (
    <div className='rejected-post-card-wrapper'>
      <img className='image' src={post.headerImage || images.LOGO} />
      <div className='title'>{post.title}</div>
      <div className='handle'>
        {post.isPublication ? '@' + post.creator : '@' + post.handle}
      </div>
      {post.isPublication && (
        <div className='publication'>{'In ' + post.handle}</div>
      )}
      <div className='see-content-button' onClick={()=>{
        modalContext?.openModal('View rejected post', { post });
      }}>See the content</div>
    </div>
  );
};

export default RejectedPostCard;
