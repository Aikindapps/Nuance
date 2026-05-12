import React, { useContext } from 'react';
import Button from '../../UI/Button/Button';
import { Context as ModalContext } from '../../contextes/ModalContext';

// Sits next to Follow / Subscribe on the author profile page. Opens the
// email subscribe modal when not subscribed, or a confirmation modal to
// unsubscribe when already subscribed.
type SubscribeToEmailButtonProps = {
  authorHandle: string;
  authorDisplayName: string;
  isPublication?: boolean;
  // When set, the modal targets the publication's email broadcast list
  // instead of an individual author's.
  publicationCanisterId?: string;
  // True when the caller principal already has a verified email subscription.
  isEmailSubscribed?: boolean;
  // Called after a successful unsubscribe so the parent can update its state.
  onUnsubscribeComplete?: () => void;
};

const SubscribeToEmailButton: React.FC<SubscribeToEmailButtonProps> = ({
  authorHandle,
  authorDisplayName,
  publicationCanisterId,
  isEmailSubscribed,
  onUnsubscribeComplete,
}) => {
  const modalContext = useContext(ModalContext);

  const handleClick = () => {
    if (isEmailSubscribed) {
      modalContext?.openModal('EmailUnsubscribeConfirm', {
        emailUnsubscribeAuthorHandle: authorHandle,
        emailUnsubscribeAuthorDisplayName: authorDisplayName,
        emailUnsubscribePublicationCanisterId: publicationCanisterId,
        emailUnsubscribeOnConfirm: onUnsubscribeComplete,
      });
    } else {
      modalContext?.openModal('EmailSubscribe', {
        emailSubscribeAuthorHandle: authorHandle,
        emailSubscribeAuthorDisplayName: authorDisplayName,
        emailSubscribePublicationCanisterId: publicationCanisterId,
      });
    }
  };

  return (
    <div className='followAuthor'>
      <Button
        styleType={{ dark: 'white', light: 'white' }}
        type='button'
        style={{ width: '120px', margin: '10px 0' }}
        onClick={handleClick}
      >
        {isEmailSubscribed ? 'Unsubscribe' : 'Subscribe'}
      </Button>
    </div>
  );
};

export default SubscribeToEmailButton;