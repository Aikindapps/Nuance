import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, usePostStore } from '../../store';
import './metrics.scss';
import { IoIosRefresh } from 'react-icons/io';
import { MetricsValue } from '../../shared/types';
import { Applaud } from '../../../../../src/declarations/PostBucket/PostBucket.did';

export const Metrics: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
  }));

  const { getMetrics, getHistoricalData } = usePostStore((state) => ({
    getMetrics: state.getMetrics,
    getHistoricalData: state.getHistoricalData,
  }));

  const [isLoading, setIsLoading] = useState(false);
  const [displayingMetrics, setDisplayingMetrics] = useState<MetricsValue[]>(
    []
  );
  const [postsHistoricalData, setPostsHistoricalData] = useState<
    [string, bigint][]
  >([]);
  const [applaudsHistoricalData, setApplaudsHistoricalData] = useState<
    Applaud[]
  >([]);

  const loadData = async () => {
    setIsLoading(true);
    let [metrics, historicalData] = await Promise.all([
      getMetrics(),
      getHistoricalData(),
    ]);
    setDisplayingMetrics(metrics);
    setPostsHistoricalData(historicalData.posts);
    setApplaudsHistoricalData(historicalData.applauds);
    setIsLoading(false);
  };

  const convertArticlesToCSV = (data: [string, bigint][]) => {
    const csvContent = data.map((row) => row.join(',')).join('\n');
    return csvContent;
  };

  const downloadCSV = (csvContent: string, name: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  console.log(postsHistoricalData);
  console.log(applaudsHistoricalData);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    }
    loadData();
  }, [isLoggedIn]);

  return (
    <div className='page-wrapper'>
      <Sidebar />
      <div className='metrics-wrapper'>
        <div className='metrics-box'>
          <div className='metrics-title-refresh-wrapper'>
            <div className='metrics-title'>Metrics</div>
            <IoIosRefresh
              onClick={async () => {
                await loadData();
              }}
              className='refresh-button'
            />
          </div>
          <div className='metrics-values-wrapper'>
            {displayingMetrics.map((metric, index) => {
              return (
                <div className='metrics-value-wrapper' key={index}>
                  <div className='name'>{metric.name}</div>
                  <div className='value'>{isLoading ? '-' : metric.value}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className='metrics-box'>
          <div className='metrics-title-refresh-wrapper'>
            <div className='metrics-title'>Metrics</div>
            <IoIosRefresh
              onClick={async () => {
                await loadData();
              }}
              className='refresh-button'
            />
          </div>
          <div className='metrics-values-wrapper'>
            <div className='metrics-value-wrapper'>
              <div className='name'>Applauds Historical Data</div>
              <div onClick={() => {}} className='value underline'>
                {isLoading ? '-' : 'Download'}
              </div>
            </div>
            <div className='metrics-value-wrapper'>
              <div className='name'>Published Articles Historical Data</div>
              <div
                onClick={() => {
                  downloadCSV(
                    convertArticlesToCSV(postsHistoricalData),
                    'published_articles_historical_data_' +
                      new Date().toUTCString()
                  );
                }}
                className='value underline'
              >
                {isLoading ? '-' : 'Download'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;
