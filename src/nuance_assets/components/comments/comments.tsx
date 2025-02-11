import React, { useState, useContext } from 'react';
import './_comments.scss';
import { icons, images } from '../../shared/constants';
import { Comment } from 'src/declarations/PostBucket/PostBucket.did';
import { User } from 'src/declarations/User/User.did';
import WriteComment from '../comments/write-comments';
import { usePostStore } from '../../store/postStore';
import { useAuthStore, useUserStore } from '../../../nuance_assets/store';
import { Context } from '../../contextes/Context';
import { useTheme } from '../../contextes/ThemeContext';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { Link } from 'react-router-dom';
import { ToastType, toastError, toast } from '../..//services/toastService';
import GradientMdVerified from '../../UI/verified-icon/verified-icon';

interface CommentProps {
  loggedInUser: string;
  avatar: string;
  comment: Comment;
  isReply?: boolean;
  postId: string;
  bucketCanisterId: string;
  totalNumberOfComments: number;
  comments: Comment[];
  isVerified: boolean;
  setComments: (newComments: Comment[], totalNumberOfComments: number) => void;
}

const Comments: React.FC<CommentProps> = ({
  loggedInUser,
  comment,
  isReply = false,
  postId,
  bucketCanisterId,
  avatar,
  totalNumberOfComments,
  comments,
  isVerified,
  setComments,
}) => {
  let identity =
    useAuthStore((state) => state.userWallet?.principal.toString()) || '';
  let censoredComment = (
    <em>
      {' '}
      This comment was removed due to{' '}
      <a href='https://wiki.nuance.xyz/nuance/content-rules' target='_blank'>
        content rules
      </a>
      . Please play nice.{' '}
    </em>
  );
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyActive, setReplyActive] = useState(false);
  const [replyToCommentId, setReplyToCommentId] = useState<
    string | undefined
  >();
  const [repliesVisible, setRepliesVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [upVotesCount, setUpVotesCount] = useState(comment.upVotes.length);
  const [downVotesCount, setDownVotesCount] = useState(
    comment.downVotes.length
  );
  const [voting, setVoting] = useState({
    upVoted: comment.upVotes.includes(identity),
    downVoted: comment.downVotes.includes(identity),
  });

  const context = useContext(Context);
  const modalContext = useContext(ModalContext);
  const darkTheme = useTheme();

  const {
    upVoteComment,
    downVoteComment,
    getPostComments,
    removeCommentVote,
    reportComment,
  } = usePostStore((state) => state);
  const toggleReplies = () => {
    setRepliesVisible(!repliesVisible);
  };

  let loggedOut =
    loggedInUser === '' || loggedInUser === undefined || loggedInUser === null;
  function handleRegister() {
    modalContext?.openModal('Login');
  }

  const handleVote = async (voteType: string) => {
    if (loggedOut) {
      handleRegister();
      return;
    }

    // Determine if the user has already voted in the same way.
    const hasVoted = voteType === 'up' ? voting.upVoted : voting.downVoted;
    const oppositeVoteType = voteType === 'up' ? 'down' : 'up';
    const oppositeVoteFunction =
      voteType === 'up' ? upVoteComment : downVoteComment;
    const hasVotedOpposite =
      voteType === 'up' ? voting.downVoted : voting.upVoted;

    // Update the UI optimistically
    if (hasVoted) {
      voteType === 'up'
        ? setUpVotesCount(upVotesCount - 1)
        : setDownVotesCount(downVotesCount - 1);
    } else {
      voteType === 'up'
        ? setUpVotesCount(upVotesCount + 1)
        : setDownVotesCount(downVotesCount + 1);
      if (hasVotedOpposite) {
        oppositeVoteType === 'up'
          ? setUpVotesCount(upVotesCount - 1)
          : setDownVotesCount(downVotesCount - 1);
      }
    }

    // Update local voting state
    setVoting({
      upVoted: voteType === 'up' ? !voting.upVoted : false,
      downVoted: voteType === 'down' ? !voting.downVoted : false,
    });

    try {
      if (hasVoted && !hasVotedOpposite) {
        await removeCommentVote(comment.commentId, bucketCanisterId);
        console.log('removeCommentVote');
      } else if (hasVotedOpposite) {
        await oppositeVoteFunction(comment.commentId, bucketCanisterId);
        console.log('oppositeVoteFunction' + oppositeVoteFunction);
      } else {
        const action = voteType === 'up' ? upVoteComment : downVoteComment;
        await action(comment.commentId, bucketCanisterId);
        console.log('action' + action);
      }
    } catch (error) {
      console.error(error);
      toastError(
        `Failed to ${
          hasVoted ? 'remove' : 'cast'
        } vote. Please try again later.`
      );

      setVoting({
        upVoted: voting.upVoted,
        downVoted: voting.downVoted,
      });
      setUpVotesCount(upVotesCount);
      setDownVotesCount(downVotesCount);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyToCommentId(commentId);
    //setCommentText(''); // Optionally clear the comment input
  };
  const handleReplyClick = () => {
    if (loggedOut) {
      handleRegister();
      return;
    }
    setReplyToCommentId(comment.commentId);
    setShowReplyBox(!showReplyBox);
    setReplyActive(!replyActive);
    console.log('replyActive' + replyActive);
  };

  const handleEdit = () => {
    setEditMode(!editMode);
  };

  const handleSaveEdit = async () => {
    setEditMode(false);
  };

  const handleSaveReply = async () => {
    setShowReplyBox(false);
    setReplyActive(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?comment=${comment.commentId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard!', ToastType.Success);
    } catch (err) {
      console.error('Failed to copy:', err);
      toastError('Failed to copy the link.');
    }
  };

  const handleReport = async (isCensored: boolean) => {
    if (isCensored) {
      toastError('This comment has already been reported.');
      return;
    }

    try {
      await reportComment(comment.commentId, bucketCanisterId);
      //toast('Comment reported!', ToastType.Success);
    } catch (err) {
      console.error('Failed to report: ', err);
      toastError('Failed to report the comment.');
    }
  };

  function timeAgo(dateParam: number | null): string {
    if (typeof dateParam !== 'number' || dateParam === 0) {
      return 'just now';
    }

    const date = new Date(dateParam);
    const today = new Date();
    const seconds = Math.round((today.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const months = Math.round(days / 30.44);
    const years = Math.round(months / 12);

    const pluralize = (count: number, noun: string) =>
      count === 1 ? noun : `${noun}s`;

    if (seconds < 60) {
      return `${seconds} ${pluralize(seconds, 'second')} ago`;
    } else if (minutes < 60) {
      return `${minutes} ${pluralize(minutes, 'minute')} ago`;
    } else if (hours < 24) {
      return `${hours} ${pluralize(hours, 'hour')} ago`;
    } else if (days < 30.44) {
      return `${days} ${pluralize(days, 'day')} ago`;
    } else if (months < 12) {
      return `${months} ${pluralize(months, 'month')} ago`;
    } else {
      return `${years} ${pluralize(years, 'year')} ago`;
    }
  }

  return (
    <div
      id={`comment-${comment.commentId}`}
      className={`comment ${isReply ? 'reply' : ''}`}
    >
      <div className='comment-header-container'>
        <div className='comment-avatar-and-name'>
          <div className='user-icon'>
            <Link to={`/user/${comment.handle}`} rel='noopener noreferrer'>
              <img
                className='user-icon'
                alt='user icon'
                src={comment.avatar || images.DEFAULT_AVATAR}
                style={comment.isVerified ? {
                  background: "linear-gradient(to bottom, #1FDCBD, #23F295)",
                  padding: "0.1em",
                 } : {borderRadius: "50%"}}
              />
            </Link>
          </div>
          <Link to={`/user/${comment.handle}`} rel='noopener noreferrer'>
            <strong className={darkTheme ? 'username-dark' : 'username'}>
              {comment.handle} {comment.isVerified && <div className='verified-badge'><GradientMdVerified width={'12'} height={'12'} /></div>}
            </strong>
          </Link>
        </div>
        <span className='time'>{timeAgo(parseInt(comment.createdAt))}</span>
      </div>
      {editMode ? (
        <WriteComment
          label='EDIT YOUR COMMENT'
          postId={postId}
          commentId={comment.commentId}
          bucketCanisterId={bucketCanisterId}
          handle={loggedInUser}
          avatar={avatar}
          closeModal={handleSaveEdit}
          content={comment.content}
          comment={comment}
          edit={true}
          totalNumberOfComments={totalNumberOfComments}
          setComments={setComments}
          comments={comments}
        />
      ) : (
        <>
          <>
            <p className='content'>
              {comment.isCensored ? censoredComment : comment.content}
            </p>
            {comment.creator !== 'TEMP' && (
              <div className={darkTheme ? 'actions dark' : 'actions'}>
                {loggedInUser === comment.handle && (
                  <button
                    className='edit'
                    onClick={handleEdit}
                    aria-label='Edit comment'
                  >
                    <img className='icon' alt='Edit' src={icons.EDIT_COMMENT} />
                    <span
                      className={
                        darkTheme
                          ? 'comment-control-text dark edit'
                          : 'comment-control-text edit'
                      }
                    >
                      Edit
                    </span>
                  </button>
                )}
                <button
                  className={
                    darkTheme
                      ? `thumbs-up ${voting.upVoted && 'voted'} dark`
                      : `thumbs-up  ${voting.upVoted && 'voted'}`
                  }
                  onClick={() => handleVote('up')}
                  aria-label='Thumbs up'
                >
                  <img
                    className='icon'
                    alt='Thumbs up'
                    src={darkTheme ? icons.THUMBS_UP_DARK : icons.THUMBS_UP}
                  />
                  <span
                    className={
                      darkTheme
                        ? 'comment-control-text dark'
                        : 'comment-control-text'
                    }
                  >
                    Thumbs up
                  </span>
                  {upVotesCount > 0 && `(${upVotesCount})`}
                </button>
                <button
                  className={
                    darkTheme
                      ? `thumbs-down ${voting.downVoted && 'voted'} dark`
                      : `thumbs-down ${voting.downVoted && 'voted'}`
                  }
                  onClick={() => handleVote('down')}
                  aria-label='Thumbs down'
                >
                  <img
                    className='icon'
                    alt='Thumbs down'
                    src={darkTheme ? icons.THUMBS_DOWN_DARK : icons.THUMBS_DOWN}
                  />
                  <span
                    className={
                      darkTheme
                        ? 'comment-control-text dark'
                        : 'comment-control-text'
                    }
                  >
                    Thumbs down
                  </span>
                  {downVotesCount > 0 && `(${downVotesCount})`}
                </button>

                <button
                  className={`reply-btn ${replyActive ? 'active' : ''}`}
                  onClick={handleReplyClick}
                >
                  <img
                    className='icon'
                    alt='reply'
                    src={darkTheme ? icons.REPLY_DARK : icons.REPLY}
                  />
                  <span
                    className={
                      darkTheme
                        ? 'comment-control-text dark'
                        : 'comment-control-text'
                    }
                  >
                    Reply
                  </span>
                </button>
                <button className='share' onClick={handleShare}>
                  <img
                    className='icon'
                    alt='share'
                    src={darkTheme ? icons.SHARE_DARK : icons.SHARE}
                  />
                  <span
                    className={
                      darkTheme
                        ? 'comment-control-text dark'
                        : 'comment-control-text'
                    }
                  >
                    Share
                  </span>
                </button>

                {loggedInUser !== comment.handle && (
                  <button
                    className='report'
                    onClick={() => handleReport(comment.isCensored)}
                  >
                    <img
                      className='icon'
                      alt='report'
                      src={darkTheme ? icons.REPORT_DARK : icons.REPORT}
                    />
                    <span
                      className={
                        darkTheme
                          ? 'comment-control-text dark'
                          : 'comment-control-text'
                      }
                    >
                      Report
                    </span>
                  </button>
                )}
              </div>
            )}
          </>
        </>
      )}

      {showReplyBox && (
        <WriteComment
          label={
            'WRITE A REPLY TO ' + comment.handle.toLocaleUpperCase() + '..'
          }
          postId={postId}
          replyToCommentId={replyToCommentId}
          bucketCanisterId={bucketCanisterId}
          handle={loggedInUser}
          avatar={avatar}
          closeModal={handleSaveReply}
          totalNumberOfComments={totalNumberOfComments}
          setComments={setComments}
          comments={comments}
        />
      )}
      {comment.replies &&
        comment.replies.map((reply) => (
          <Comments
            key={reply.commentId}
            isReply={true}
            comment={reply}
            bucketCanisterId={bucketCanisterId}
            postId={postId}
            loggedInUser={loggedInUser}
            avatar={avatar}
            totalNumberOfComments={totalNumberOfComments}
            setComments={setComments}
            comments={comments}
            isVerified={isVerified}
          />
        ))}
    </div>
  );
};

export default Comments;
