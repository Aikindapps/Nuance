import { faNewspaper } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { colors } from '../../shared/constants';
import { Form } from 'react-bootstrap';
import { PostType, UserType } from '../../types/types';

interface Props {
  user: UserType | undefined;
  lastSavedPost: PostType | undefined;
  userAllPublications: string[];
  loading: boolean;
  selectedHandle: string;
  setSelectedHandle: React.Dispatch<React.SetStateAction<string>>;
}

export const PublicationDropdownMenu: React.FC<Props> = ({
  user,
  lastSavedPost,
  userAllPublications,
  loading,
  selectedHandle,
  setSelectedHandle,
}) => {
  const getDropdownOptions = () => {
    if (user) {
      if (lastSavedPost) {
        if (lastSavedPost.isPublication) {
          //publication post -> display only the publication handle
          return [lastSavedPost.handle];
        } else {
          //not publication post
          if (lastSavedPost.isDraft) {
            //if draft -> display all
            let array = userAllPublications;
            return [...array, user.handle];
          } else {
            //if published -> display only the user handle
            return [user.handle];
          }
        }
      } else {
        //new article screen -> display all
        let array = userAllPublications;
        return [...array, user.handle];
      }
    }
  };
  return (
    <div className='edit-article-publication-dropdown'>
      <FontAwesomeIcon
        style={{ color: colors.darkerBorderColor }}
        icon={faNewspaper}
      />
      <span style={{ marginLeft: '10px', color: colors.darkerBorderColor }}>
        To:
      </span>
      <Form.Select
        disabled={loading}
        style={{
          border: 'none',
          borderBottom: `1px solid ${colors.accentColor}`,
          marginBottom: '20px',
          boxShadow: 'none',
          color: colors.darkerBorderColor,
          marginTop: '20px',
          backgroundColor: 'transparent',
        }}
        aria-label='Default select example'
        value={selectedHandle}
        onChange={(e) => setSelectedHandle(e.target.value)}
      >
        {getDropdownOptions()?.map((handle) => {
          return <option key={handle}>{handle}</option>;
        })}
      </Form.Select>
    </div>
  );
};
