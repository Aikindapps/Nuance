import React, { useEffect, useState } from 'react';
import { getMetricsActor, OperationLog } from '../../services/actorService';
import './_metrics.scss';
import Loader from '../../UI/loader/Loader';

const fetchMetrics = async () => {
  try {
    const result = await (await getMetricsActor()).getPlatformOperatorsLog();
    if ('err' in result) {
      console.log(result.err);
      return undefined;
    } else {
      return result.ok;
    }
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

const Metrics = () => {
  const [metrics, setMetrics] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMetrics = async () => {
      setLoading(true);
      const fetchedMetrics = await fetchMetrics();
      setMetrics(fetchedMetrics || []);
      setLoading(false);
    };
    getMetrics();
  }, []);

  const convertTimestamp = (timestamp: BigInt) => {
    const date = new Date(Number(Number(timestamp) / 1000000));
    return date.toLocaleString();
  };

  const sortMetrics = (field: keyof OperationLog) => {
    const sortedMetrics = [...metrics].sort((a, b) => (a[field] > b[field] ? 1 : -1));
    setMetrics(sortedMetrics);
  };

  return (
    <>
      {loading ? (
      
        <div className='loading-container'>    
        <Loader />
        </div>
    
      ) : (
        <div className="metrics-container">
          <div className="log-header">
  <span onClick={() => sortMetrics('principal')}>Principal &#8597;</span>
  <span onClick={() => sortMetrics('operation')}>Operation &#8597;</span>
  <span onClick={() => sortMetrics('timestamp')}>Timestamp &#8597;</span>
</div>

          <div className="log-list">
            {metrics.map((metric, index) => (
              <div key={index} className="log-entry">
                <span className="principal">{metric.principal}</span>
                <span className="operation">{metric.operation}</span>
                <span className="timestamp">{convertTimestamp(metric.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Metrics;
