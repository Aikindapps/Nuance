import React, { useEffect, useState } from 'react';
import { Comment } from '../../../../../src/declarations/PostBucket/PostBucket.did';
import './comment-card.scss';
import { Link } from 'react-router-dom';
import { useAuthStore, usePostStore } from '../../store';
import { CommentType } from '../../shared/types';
import Toggle from '../toggle/toggle';

type CommentCardProps = {
  comment: CommentType;
  callbackRefresh: () => Promise<void>;
};
export const CommentCard: React.FC<CommentCardProps> = (props) => {
  const { frontendCanisterId, isLocal, reviewComment } =
    usePostStore((state) => ({
      frontendCanisterId: state.frontendCanisterId,
      isLocal: state.isLocal,
      reviewComment: state.reviewComment,
    }));

  const [isToggled, setIsToggled] = useState(false)
  const [loading, setLoading] = useState(false)


  const getUrl = () => {
    let post = props.comment.post;
    let comment = props.comment
    if(frontendCanisterId === 'exwqn-uaaaa-aaaaf-qaeaa-cai' && !isLocal){
        return `https://nuance.xyz/${post.handle.toLowerCase()}/${
          comment.postId
        }-${comment.bucketCanisterId}/some-thing?comment=${comment.commentId}`;
    }
    else{
        return `${
          isLocal
            ? 'http://' + frontendCanisterId + '.localhost:8080'
            : 'https://' + frontendCanisterId + '.icp0.io'
        }/${post.handle.toLowerCase()}/${comment.postId}-${
          comment.bucketCanisterId
        }/some-thing?comment=${comment.commentId}`;
    }
  }

  return (
    <div className='comment-card-wrapper'>
      <div className='content'>{props.comment.content}</div>
      <Link to={getUrl()} target='_blank'>
        See the comment
      </Link>
      <div className='handle'>@{props.comment.post.handle}</div>
      <div className='violates-the-rules'>Comment violates the rules?</div>
      <Toggle
        toggled={isToggled}
        callBack={() => {
          if (loading) {
            return;
          }
          setIsToggled(!isToggled);
        }}
      />
      {loading ? (
        <div className='content'>Processing...</div>
      ) : (
        <button type='submit' onClick={async () => {
            setLoading(true);
            await reviewComment(
              props.comment.commentId,
              props.comment.bucketCanisterId,
              isToggled
            );
            await props.callbackRefresh()
            setLoading(false);
        }}>
          Submit
        </button>
      )}
    </div>
  );
};

export default CommentCard;
