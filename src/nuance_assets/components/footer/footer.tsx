import React from 'react';
import { images } from '../../shared/constants';

const Footer = () => {
  return (
    <div className='footer-image-section'>
      <span className='logo-header2'>Powered by:</span>
      <div className='footer-image-container'>
        <a target='_blank' href='https://www.dfinity.org'>
          <img
            className='footer-image'
            src={images.IC_BADGE}
            alt='The internet computer, powered by crypto'
            loading='lazy'
          />
        </a>
      </div>
    </div>
  );
};

export default Footer;
