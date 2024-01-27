import React, { useContext, useEffect, useState } from 'react';
import './view-rejected-post-modal.scss';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { colors, icons, images } from '../../shared/constants';
import { IoCloseOutline } from 'react-icons/io5';
import { useAuthStore, usePostStore } from '../../store';
import Toggle from '../toggle/toggle';
import InputField from '../InputField/InputField';
import { Principal } from '@dfinity/principal';
import { PostType } from '../../shared/types';
import parse from 'html-react-parser';

export const ViewRejectedPostModal = (props: { post: PostType }) => {
  const modalContext = useContext(ModalContext);

  const { getPost } = usePostStore((state) => ({
    getPost: state.getPost,
  }));

  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    let response = await getPost(
      props.post.bucketCanisterId,
      props.post.postId
    );
    if (response) {
      setContent(response.content);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);
  return (
    <div className='view-rejected-post-modal'>
      <IoCloseOutline
        onClick={() => {
          modalContext?.closeModal();
        }}
        className='close-modal-icon'
      />
      <div className='title'>{props.post.title}</div>
      <div className='subtitle'>{props.post.subtitle}</div>
      <div className='content'>{isLoading ? 'Loading...' : parse(content)}</div>
    </div>
  );
};
