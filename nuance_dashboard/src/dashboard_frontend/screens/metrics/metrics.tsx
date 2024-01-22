import React, { useState } from 'react';
import Sidebar from '../../components/sidebar/sidebar';



export const Metrics: React.FC = () => {
  return <div className='page-wrapper'>
  <Sidebar />
  <div className='metrics-wrapper'>Metrics</div>
</div>;
};

export default Metrics;
