import React, { useState } from 'react';
import Sidebar from '../../components/sidebar/sidebar';

export const Cycles: React.FC = () => {
  return (
    <div className='page-wrapper'>
      <Sidebar />
      <div className='cycles-wrapper'>Cycles</div>
    </div>
  );
};

export default Cycles;
