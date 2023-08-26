import React from 'react';

type RequiredFieldMessageProps = {
  hasError: boolean;
  errorMessage?: string;
  NFTModal?: boolean;
};

function RequiredFieldMessage(props: RequiredFieldMessageProps) {
  return (
    <>
      {props.hasError ? (
        <div className='required-fields-container'>
          <div className='arrow-up'></div>
          <div
            className={
              props.NFTModal
                ? 'NFT-required-fields-warning'
                : 'required-fields-warning'
            }
          >
            <span>{props.errorMessage || 'Please review this'}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default RequiredFieldMessage;
