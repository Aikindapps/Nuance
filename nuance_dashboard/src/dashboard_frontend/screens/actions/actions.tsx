import React, { useState } from 'react';
import Sidebar from '../../components/sidebar/sidebar';



export const Actions: React.FC = () => {
  return (
    <div className='page-wrapper'>
      <Sidebar />
      <div className='actions-wrapper'>Actions</div>
    </div>
  );
};

export default Actions;
