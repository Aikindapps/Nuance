import React, { useState, useContext } from 'react';
import { useTheme } from '../../ThemeContext'
import { toast } from 'react-hot-toast';
import { usePostStore } from '../../store/postStore';
import Button from '../../UI/Button/Button';
import { toastError } from '../../services/toastService';
import { SaveCommentModel } from '../../../declarations/PostBucket/PostBucket.did';
import { colors } from '../../shared/constants';
import { Context } from '../../Context';
import { useAuthStore } from '../../store';
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
  closeModal = () => {},
}) => {
  const { saveComment } = usePostStore(state => state);
  const [commentText, setCommentText] = useState(content || '');
  const [edited, setEdited] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);

  const hasError = commentText.length >= 400;
  
  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme ? colors.darkModePrimaryBackgroundColor : colors.primaryBackgroundColor,
    color: darkTheme ?  colors.darkModePrimaryTextColor : colors.primaryTextColor ,
  };

  const context = useContext(Context)
  
  
  const commentModel: SaveCommentModel = {
    content: commentText,
    commentId: commentId ? [commentId] : [],
    replyToCommentId: replyToCommentId ? [replyToCommentId] : [],
    postId,
  };

  const handleSave = async (edited : Boolean) => {
        
    setIsSaving(true);
    
    if (handle === "" || handle === undefined || handle === null) {
        function handleRegister() {
            context.setModal();
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
      const isEdit = commentId !== undefined;
      await saveComment(commentModel, bucketCanisterId, isEdit, handle, avatar );
      closeModal();
      setCommentText(''); // Clear the comment input after saving
      setIsSaving(false);
    } catch (error) {
      toast.error('Failed to post comment. Please try again later.');
      setIsSaving(false);
    }
  };

  return (
    <div className="write-comment">
      <div className="comment-input-container">
        <div className="comment-title">{label}</div>
        <textarea
          className={ hasError ? 'has-error' : 'comment-input'} 
          style={darkOptionsAndColors}
          placeholder={"Text"}
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
        />
        <RequiredFieldMessage hasError={hasError} errorMessage='Comment cannot exeed 400 characters.' />
      </div>
      {label === 'EDIT YOUR COMMENT' ? (
      <Button
        disabled={!commentText.trim() || isSaving || hasError}
        type='button'
        styleType={darkTheme ? 'comment-button-dark' : 'comment-button' }
        style={{ width: '143px' }}
        onClick={handleSave}
      >
       Change comment
      </Button>

        ) : (
        <Button
            disabled={!commentText.trim() || isSaving || hasError}
            type='button'
            styleType={darkTheme ? 'comment-button-dark' : 'comment-button' }
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