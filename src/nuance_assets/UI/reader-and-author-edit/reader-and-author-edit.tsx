import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../store';
import { colors, icons } from '../../shared/constants';

type ReaderAndAuthorProps = {
  id?: String;
  handle?: String;
  isPremium?: boolean;
  dark?: boolean;
};

const ReaderAndAuthor: React.FC<ReaderAndAuthorProps> = (
  props
): JSX.Element => {
  const [isAuthorAndReader, setIsAuthorAndReader] = useState(false);
  const author = useUserStore((state) => state.author);
  const user = useUserStore((state) => state.user);

  const darkOptionsAndColors = {
    background: props.dark
      ? colors.primaryTextColor
      : colors.primaryBackgroundColor,
    color: props.dark ? colors.primaryBackgroundColor : colors.primaryTextColor,
  };

  let navigate = useNavigate();

  function editArticle() {
    navigate('/article/edit/' + props.id);
  }

  function authorReaderCheck() {
    // setIsAuthorAndReader(props?.handle == user?.handle);
    var isEditor = false;
    user?.publicationsArray.map((pubObj) => {
      if (pubObj.isEditor && pubObj.publicationName === props.handle) {
        isEditor = true;
      }
    });
    return (props.handle == user?.handle || isEditor) && !props.isPremium;
  }

  useEffect(() => {
    setIsAuthorAndReader(authorReaderCheck());
  }, [props.handle]);

  return isAuthorAndReader ? (
    <a className='links' onClick={editArticle}>
      <li style={{ cursor: 'hand', color: darkOptionsAndColors.color }}>
        Edit Article
      </li>
    </a>
  ) : (
    <a></a>
  );
};
export default ReaderAndAuthor;
