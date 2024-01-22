import React, { useState } from 'react';
import './_reviewComment.scss';
import { usePostStore } from '../../store';
import { useAuthStore } from '../../store';
import { Toggle } from '../../components/toggle/toggle';
import toast from 'react-hot-toast';
import Sidebar from '../../components/sidebar/sidebar';

const ReviewComment = () => {
  const [isToggled, setIsToggled] = useState(false);
  const [commentUrl, setCommentUrl] = useState('');

  const { reviewComment } = usePostStore((state) => ({
    reviewComment: state.reviewComment,
  }));

  const handleToggle = () => {
    setIsToggled(!isToggled);
  };

  const handleCommentUrlChange = (e: any) => {
    setCommentUrl(e.target.value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    //  various URL formats, including localhost
    const urlPattern =
      /https?:\/\/[^\/]+\/[^\/]+\/\d*-*([a-zA-Z0-9-]+)\/[^?]+\?comment=(\d+)/;
    const match = commentUrl.match(urlPattern);

    if (match && match.length >= 3) {
      const bucketCanisterId = match[1];
      const commentId = match[2];
      console.log('Submitted Comment URL:', commentUrl);
      console.log(
        'Extracted - Bucket Canister ID:',
        bucketCanisterId,
        'Comment ID:',
        commentId,
        'Is Violating:',
        isToggled
      );
      reviewComment(commentId, bucketCanisterId, isToggled);
    } else {
      console.log('Invalid comment URL');
      toast.error(
        'Invalid URL, please use the share link from the comment or slack notification.'
      );
    }
  };

  return (
    <div className='page-wrapper'>
      <Sidebar />
      <div className='grid-item two-by-two'>
        <div>
          <h1>Review Comment</h1>
          <form className='form' onSubmit={handleSubmit}>
            <div className='form-group'>
              <label htmlFor='commentUrl'>COMMENT URL:</label>
              <input
                type='text'
                id='commentUrl'
                value={commentUrl}
                onChange={handleCommentUrlChange}
                placeholder=''
              />
            </div>
            <div className='form-group'>
              <label>Comment violates the rules?</label>
              <Toggle toggled={isToggled} callBack={handleToggle} />
            </div>
            <button type='submit'>Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewComment;
