import React, { useState, useContext, useEffect } from 'react';
import { useTheme } from '../../contextes/ThemeContext';
import { toast } from 'react-hot-toast';
import { usePostStore } from '../../store/postStore';
import Button from '../../UI/Button/Button';
import { toastError } from '../../services/toastService';
import {
  Comment,
  SaveCommentModel,
} from '../../../declarations/PostBucket/PostBucket.did';
import { colors } from '../../shared/constants';
import { Context } from '../../contextes/Context';
import { Context as ModalContext } from '../../contextes/ModalContext';
import RequiredFieldMessage from '../required-field-message/required-field-message';
import { buildTempComment } from '../../shared/utils';
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
  totalNumberOfComments: number;
  comments: Comment[];
  setComments: (newComments: Comment[], totalNumberOfComments: number) => void;
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
  closeModal = () => {},
  totalNumberOfComments,
  setComments,
  comments,
}) => {
  const { saveComment } = usePostStore((state) => state);
  const [commentText, setCommentText] = useState(content || '');
  const [isSaving, setIsSaving] = useState(false);

  const hasError = commentText.length >= 400;

  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };

  const context = useContext(Context);
  const modalContext = useContext(ModalContext);

  const commentModel: SaveCommentModel = {
    content: commentText,
    commentId: commentId ? [commentId] : [],
    replyToCommentId: replyToCommentId ? [replyToCommentId] : [],
    postId,
  };

  const scanCommentAndOptimisticiallyUpdate = (
    scanningComment: Comment,
    tempComment: Comment
  ): Comment => {
    if (scanningComment.commentId === tempComment.commentId) {
      //found the comment
      return {
        ...tempComment,
        replies: scanningComment.replies,
        repliedCommentId: scanningComment.repliedCommentId,
      };
    }
    //if here, loop through all the replies and scan the replies too
    let repliesCopied = Array.from(scanningComment.replies);
    return {
      ...scanningComment,
      replies: repliesCopied.map((reply) => {
        //scan the replies too
        return scanCommentAndOptimisticiallyUpdate(reply, tempComment);
      }),
    };
  };

  const scanCommentAndAddReply = (
    scanningComment: Comment,
    tempComment: Comment
  ): Comment => {
    if (
      tempComment.repliedCommentId[0] &&
      scanningComment.commentId === tempComment.repliedCommentId[0]
    ) {
      //found the replying comment
      //add the tempComment to the start of the replies array
      return {
        ...scanningComment,
        replies: [tempComment, ...scanningComment.replies],
      };
    }
    //if here, loop through all the replies and scan the replies too
    let repliesCopied = Array.from(scanningComment.replies);
    return {
      ...scanningComment,
      replies: repliesCopied.map((reply) => {
        //scan the replies too
        return scanCommentAndAddReply(reply, tempComment);
      }),
    };
  };

  const optimisticUpdate = (isEdit: boolean) => {
    //build the temp comment first
    let tempComment = buildTempComment(
      bucketCanisterId,
      commentModel,
      handle,
      avatar,
      isEdit ? comment : undefined
    );
    let updatedComments: Comment[] = [];
    if (isEdit) {
      //loop through all the comments and scan them to edit
      updatedComments = comments.map((scanningComment) => {
        return scanCommentAndOptimisticiallyUpdate(
          scanningComment,
          tempComment
        );
      });
    } else {
      //not an edit
      //find the correct place to add the comment
      if (tempComment.repliedCommentId[0] === undefined) {
        //not a reply
        //just add the start of the array
        updatedComments = [tempComment, ...comments];
      } else {
        //a reply
        //find the replying comment and add it to the start of the replies array
        updatedComments = comments.map((scanningComment) => {
          return scanCommentAndAddReply(
            scanningComment,
            tempComment
          );
        });
      }
    }

    //update the state in the read-article screen
    setComments(updatedComments, totalNumberOfComments + 1);
  };

  const commentCountExceeded = totalNumberOfComments >= 100;
  const handleSave = async (edited: Boolean) => {
    if (commentCountExceeded && !edited) {
      toastError('A post can have maximum of 100 comments. Sorry!');
      return;
    }

    setIsSaving(true);

    if (handle === '' || handle === undefined || handle === null) {
      function handleRegister() {
        modalContext?.openModal('Login');
      }
      handleRegister();
      setIsSaving(false);
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

      //optimistically update the state
      // - copy the old state before updating the state
      let oldComments = Array.from(comments);
      let oldTotalNumber = totalNumberOfComments;

      optimisticUpdate(isEdit);

      let saveResponse = await saveComment(
        commentModel,
        bucketCanisterId,
        isEdit
      );
      if (saveResponse) {
        //the save is successful
        //update the vars in the read article screen
        setComments(saveResponse[0], saveResponse[1]);
        setCommentText(''); // Clear the comment input after saving
      } else {
        //the save is not successful
        //reverse the optimistic update
        setComments(oldComments, oldTotalNumber);
      }

      setIsSaving(false);
    } catch (error) {
      toast.error('Failed to post comment. Please try again later.');
      setIsSaving(false);
    }
  };

  return (
    <div
      className='write-comment'
      style={replyToCommentId || edit ? { margin: '30px 0px 16px 38px' } : {}}
    >
      {commentCountExceeded && label !== 'EDIT YOUR COMMENT' ? (
        <div className='comment-input-container'>
          <div className='comment-title'>{label}</div>
          <textarea
            className={'has-error'}
            style={darkOptionsAndColors}
            placeholder={'Sorry, you cannot post more than 100 comments.'}
            value={commentText}
            onChange={(e) => {
              if (!isSaving) {
                setCommentText(e.target.value);
              }
            }}
          />
          <RequiredFieldMessage
            hasError={hasError}
            errorMessage='Comment cannot exeed 400 characters.'
          />
        </div>
      ) : (
        <div className='comment-input-container'>
          <div className='comment-title'>{label}</div>
          <textarea
            className={hasError ? 'has-error' : 'comment-input'}
            style={darkOptionsAndColors}
            placeholder={'Text'}
            value={commentText}
            onChange={(e) => {
              if (!isSaving) {
                setCommentText(e.target.value);
              }
            }}
          />
          <RequiredFieldMessage
            hasError={hasError}
            errorMessage='Comment cannot exeed 400 characters.'
          />
        </div>
      )}
      {label === 'EDIT YOUR COMMENT' ? (
        <Button
          disabled={!commentText.trim() || isSaving || hasError}
          loading={isSaving}
          type='button'
          styleType={{ dark: 'navy-dark', light: 'navy' }}
          style={{ width: '153px' }}
          onClick={() => handleSave(true)}
        >
          Change comment
        </Button>
      ) : (
        <Button
          disabled={
            !commentText.trim() || isSaving || hasError || commentCountExceeded
          }
          loading={isSaving}
          type='button'
          styleType={{ dark: 'navy-dark', light: 'navy' }}
          style={{ width: '134px' }}
          onClick={handleSave}
        >
          Post comment
        </Button>
      )}
    </div>
  );
};

export default WriteComment;
