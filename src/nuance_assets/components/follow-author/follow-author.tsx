import React, { useState, useEffect, useContext } from 'react';
import Button from '../../UI/Button/Button';
import { useUserStore } from '../../store';
import { images } from '../../shared/constants';
import { Context } from '../../contextes/Context';
import {Context as ModalContext} from '../../contextes/ModalContext'


type FollowAuthorProps = {
  AuthorHandle: string;
  Followers: Array<String> | undefined;
  user: string;
  isPublication: boolean;
  primaryColor?: string;
};

const FollowAuthor: React.FC<FollowAuthorProps> = (props): JSX.Element => {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const context = useContext(Context)
  const modalContext = useContext(ModalContext)

  const { followAuthor, unfollowAuthor } = useUserStore((state) => ({
    followAuthor: state.followAuthor,
    unfollowAuthor: state.unfollowAuthor,
  }));

  function handleFollow() {
    if (!props.Followers || props?.Followers.includes(props.AuthorHandle)) {
      return;
    }

    if (props.AuthorHandle) {
      followAuthor(props.AuthorHandle);
      setLoading(true);

      setTimeout(() => {
        setLoading(false);
      }, 10000);
    }
  }
  function handleUnfollow() {
    if (props.AuthorHandle) {
      unfollowAuthor(props.AuthorHandle);
      setLoading(true);

      setTimeout(() => {
        setLoading(false);
      }, 10000);
    }
  }

  function handleRegister() {
    modalContext?.openModal('Login')
  }

  useEffect(() => {
    if (props.Followers && props.AuthorHandle) {
      setFollowing(props.Followers.includes(props.AuthorHandle));
      setLoading(false);
    }
  }, [props.Followers, props.AuthorHandle]);
  return (
    <div className='followAuthor'>
      {following ? (
        <Button
          styleType='secondary'
          type='button'
          style={
            props.isPublication ? { width: '180px', margin: '10px 0' }
            : { width: '110px', margin: '10px 0' }
          }
          onClick={handleUnfollow}
          disabled={loading}
          icon={loading ? images.loaders.BUTTON_SPINNER : ''}
          primaryColor={props.primaryColor}
        >
          Following
        </Button>
      ) : (
        <Button
          styleType='secondary'
          type='button'
          style={
            props.isPublication ? { width: '180px', margin: '10px 0' }
            : { width: '96px', margin: '10px 0' }
          }
          onClick={props.user ? handleFollow : handleRegister}
          disabled={loading}
          icon={loading ? images.loaders.BUTTON_SPINNER : ''}
          primaryColor={props.primaryColor}
        >
          {props.isPublication ? 'Follow this Publication' : 'Follow'}
        </Button>
      )}
    </div>
  );
};

export default FollowAuthor;
