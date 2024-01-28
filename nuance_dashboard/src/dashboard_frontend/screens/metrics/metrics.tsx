import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, usePostStore } from '../../store';
import './metrics.scss';
import { IoIosRefresh } from 'react-icons/io';
import { MetricsValue } from '../../shared/types';

export const Metrics: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
  }));

  const { getMetrics } = usePostStore((state) => ({
    getMetrics: state.getMetrics,
  }));

  const [isLoading, setIsLoading] = useState(false);
  const [displayingMetrics, setDisplayingMetrics] = useState<MetricsValue[]>([]);

  const loadData = async () => {
    setIsLoading(true)
    let metrics = await getMetrics();
    setDisplayingMetrics(metrics);
    setIsLoading(false)
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
    loadData()
  }, [isLoggedIn]);


  return (
    <div className='page-wrapper'>
      <Sidebar />
      <div className='metrics-wrapper'>
        <div className='metrics-box'>
          <div className='metrics-title-refresh-wrapper'>
            <div className='metrics-title'>Metrics</div>
            <IoIosRefresh onClick={async ()=>{
              await loadData()
            }} className='refresh-button' />
          </div>
          <div className='metrics-values-wrapper'>
            {displayingMetrics.map((metric) => {
              return (
                <div className='metrics-value-wrapper'>
                  <div className='name'>{metric.name}</div>
                  <div className='value'>{isLoading ? '-' : metric.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;
