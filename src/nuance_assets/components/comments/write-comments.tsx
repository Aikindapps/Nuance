import React, { useState, useContext, useEffect } from 'react';
import { useTheme } from '../../contextes/ThemeContext'
import { toast } from 'react-hot-toast';
import { usePostStore } from '../../store/postStore';
import Button from '../../UI/Button/Button';
import { toastError } from '../../services/toastService';
import { Comment, SaveCommentModel } from '../../../declarations/PostBucket/PostBucket.did';
import { colors } from '../../shared/constants';
import { Context } from '../../contextes/Context';
import {Context as ModalContext} from '../../contextes/ModalContext'
import RequiredFieldMessage from '../required-field-message/required-field-message';


interface WriteCommentProps {
  label?: string;
  postId: string;
  commentId?: string;
  replyToCommentId?: string;
  bucketCanisterId: string;
  handle: string;
  avatar: string;
  content?: string;
  closeModal?: () => void;
  comment?: Comment; //pass the entire comment for editing
  edit?: boolean;
}

const WriteComment: React.FC<WriteCommentProps> = ({
  label = 'WRITE A COMMENT..',
  postId,
  commentId,
  replyToCommentId,
  bucketCanisterId,
  handle,
  avatar,
  content,
  comment,
  edit = false,
  closeModal = () => { },
}) => {
  const { saveComment, comments, totalNumberOfComments } = usePostStore(state => state);
  const [commentText, setCommentText] = useState(content || '');
  const [isSaving, setIsSaving] = useState(false);

  const hasError = commentText.length >= 400;

  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme ? colors.darkModePrimaryBackgroundColor : colors.primaryBackgroundColor,
    color: darkTheme ? colors.darkModePrimaryTextColor : colors.primaryTextColor,
  };

  const context = useContext(Context)
  const modalContext = useContext(ModalContext)



  const commentModel: SaveCommentModel = {
    content: commentText,
    commentId: commentId ? [commentId] : [],
    replyToCommentId: replyToCommentId ? [replyToCommentId] : [],
    postId,
  };


  const commentCountExceeded = totalNumberOfComments >= 100;
  const handleSave = async (edited: Boolean) => {
    if (commentCountExceeded && !edited) {
      toastError('A post can have maximum of 100 comments. Sorry!');
      return;
    }



    setIsSaving(true);

    if (handle === "" || handle === undefined || handle === null) {
      function handleRegister() {
        modalContext?.openModal('Login');
      }
      handleRegister();
      setIsSaving(false)
      return;
    }



    if (!commentText.trim()) {
      toastError('Please enter a comment.');
      setIsSaving(false);
      return;
    }



    try {
      closeModal();
      const isEdit = commentId !== undefined;
      await saveComment(commentModel, bucketCanisterId, isEdit, handle, avatar, edited ? comment : undefined);
      setCommentText(''); // Clear the comment input after saving
      setIsSaving(false);
    } catch (error) {
      toast.error('Failed to post comment. Please try again later.');
      setIsSaving(false);
    }
  };

  return (
    <div className="write-comment" style={replyToCommentId || edit ? { margin: "30px 0px 16px 38px" } : {}}>
      {(commentCountExceeded && (label !== "EDIT YOUR COMMENT")) ? (
        <div className="comment-input-container">
          <div className="comment-title">{label}</div>
          <textarea
            className={'has-error'}
            style={darkOptionsAndColors}
            placeholder={"Sorry, you cannot post more than 100 comments."}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
          <RequiredFieldMessage hasError={hasError} errorMessage='Comment cannot exeed 400 characters.' />
        </div>
      ) : (
        <div className="comment-input-container">
          <div className="comment-title">{label}</div>
          <textarea
            className={hasError ? 'has-error' : 'comment-input'}
            style={darkOptionsAndColors}
            placeholder={"Text"}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
          <RequiredFieldMessage hasError={hasError} errorMessage='Comment cannot exeed 400 characters.' />
        </div>
      )}
      {label === 'EDIT YOUR COMMENT' ? (
        <Button
          className={{dark: 'comment-button-dark', light: 'comment-button'}}
          disabled={!commentText.trim() || isSaving || hasError}
          type='button'
          styleType={{dark: 'navy-dark', light: 'navy'}}
          style={{ width: '143px' }}
          onClick={() => handleSave(true)}
        >
          Change comment
        </Button>

      ) : (
        <Button
          className={{dark: 'comment-button-dark', light: 'comment-button'}}
          disabled={!commentText.trim() || isSaving || hasError || commentCountExceeded}
          type='button'
          styleType={{dark: 'navy-dark', light: 'navy'}}
          style={{ width: '124px' }}
          onClick={handleSave}
        >
          Post comment
        </Button>
      )}
    </div>
  );
};

export default WriteComment;
