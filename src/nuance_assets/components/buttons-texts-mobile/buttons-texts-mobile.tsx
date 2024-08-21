import { faNewspaper } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { colors, icons } from '../../shared/constants';
import { Form } from 'react-bootstrap';
import { PostType, PremiumArticleOwners as PremiumArticleOwnersObject, UserType } from '../../types/types';
import { formatDate } from '../../shared/utils';
import Button from '../../UI/Button/Button';
import { PublicationDropdownMenu } from '../publication-dropdown-menu/publication-dropdown-menu';
import PremiumArticleOwners from '../premium-article-owners/premium-article-owners';

interface Props {
  user: UserType | undefined;
  userAllPublications: string [];
  userPublicationsWriter: string[];
  lastSavedPost: PostType | undefined;
  darkTheme: boolean;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  selectedHandle: string;
  setSelectedHandle: React.Dispatch<React.SetStateAction<string>>;
  ownersOfPremiumArticle: PremiumArticleOwnersObject;
  onSave: (isDraft: boolean, notNavigate?: boolean) => Promise<PostType | undefined>
  getPostCurrentStatus: () => "Draft" | "Published as premium" | undefined
  isPublishButtonVisible: () => boolean
  isPublishAsPremiumVisible: () => boolean
  setPremiumModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ButtonsTextsMobile: React.FC<Props> = ({
  user,
  userAllPublications,
  userPublicationsWriter,
  lastSavedPost,
  darkTheme,
  loading,
  setLoading,
  selectedHandle,
  setSelectedHandle,
  ownersOfPremiumArticle,
  onSave,
  getPostCurrentStatus,
  isPublishButtonVisible,
  isPublishAsPremiumVisible,
  setPremiumModalOpen
}) => {
  return (
    <div className='buttons-texts-wrapper'>
      <p className='edit-article-left-text'>
        last modified: {formatDate(lastSavedPost?.modified) || ' - '}
      </p>
      {(location.pathname === '/article/new' || lastSavedPost?.isDraft) && (
        <Button
          disabled={loading}
          type='button'
          styleType={{dark: 'navy-dark', light: 'navy'}}
          style={{
            width: '96px',
            margin: '10px 0',
            border: darkTheme ? '1px solid #fff' : 'none',
          }}
          onClick={async () => {
            setLoading(true);
            await onSave(true);
            setLoading(false);
          }}
        >
          {userPublicationsWriter.includes(selectedHandle) ? 'Submit' : 'Save'}
        </Button>
      )}
      <div className='edit-article-horizontal-divider' />
      <p className='edit-article-left-text'>
        Current status: {getPostCurrentStatus()}
      </p>
      {!lastSavedPost?.isPremium && (
        <PublicationDropdownMenu
          user={user}
          lastSavedPost={lastSavedPost}
          userAllPublications={userAllPublications}
          loading={loading}
          selectedHandle={selectedHandle}
          setSelectedHandle={setSelectedHandle}
        />
      )}
      {isPublishButtonVisible() ? (
        <Button
          disabled={loading}
          type='button'
          styleType={{dark: 'navy-dark', light: 'navy'}}
          style={{ width: '96px' }}
          onClick={async () => {
            setLoading(true);
            await onSave(false);
            setLoading(false);
          }}
        >
          Publish
        </Button>
      ) : null}
      <div className='edit-article-horizontal-divider' />

      {/* display the owners of the post if it's a premium post */}
      {lastSavedPost?.isPremium ? (
        <PremiumArticleOwners
          owners={ownersOfPremiumArticle}
          dark={darkTheme}
        />
      ) : null}

      {/* Display the publish as premium button if the selected handle is a publication with an nft canister */}
      {isPublishAsPremiumVisible() ? (
        <div className='NFT-field-wrapper'>
          <div className='NFT-left-text-container'>
            <p className='NFT-left-text'>
              Limit access to this article by selling exclusive NFT keys.
            </p>
            <p className='NFT-left-text'>
              NOTE: after creating NFT keys you cannot edit the article anymore.
            </p>
          </div>
          <Button
            disabled={false}
            type='button'
            styleType={{dark: 'white', light: 'white'}}
            style={{ width: '190px' }}
            onClick={() => {
              setPremiumModalOpen(true);
            }}
          >
            <img src={icons.NFT_LOCK_ICON} className='NFT-icon'></img>
            Publish as premium
          </Button>
        </div>
      ) : null}
    </div>
  );
};
