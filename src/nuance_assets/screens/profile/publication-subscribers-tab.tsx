import React, { useEffect, useState } from 'react';
import { images } from '../../shared/constants';
import SubscribersChart from './subscribers-chart';
import { PublicationType } from 'src/nuance_assets/types/types';
import {
  WriterSubscriptionDetailsConverted,
  useSubscriptionStore,
  SubscribedReaderItem,
} from '../../store/subscriptionStore';
import { usePublisherStore } from '../../store/publisherStore';
import './_publication-subscribers-tab.scss';
import { Link } from 'react-router-dom';

interface Subscriber {
  id: number;
  name: string;
  subscribedSince: string;
  period: string;
  fee: string;
  totalFees: string;
}

//props
interface PublicationSubscribersTabProps {
  publicationInfo?: PublicationType;
}

const PublicationSubscribersTab: React.FC<PublicationSubscribersTabProps> = ({
  publicationInfo,
}) => {
  const [publicationCanisterId, setPublicationCanisterId] =
    useState<string>('');
  const [subscribers, setSubscribers] = useState<SubscribedReaderItem[]>([]);
  const [stats, setStats] = useState({
    subscribers: 0,
    nuaEarned: 0,
    thisWeek: 0,
  });
  const [chartData, setChartData] = useState<{ day: string; count: number }[]>(
    []
  );

  const { getPublicationSubscriptionDetailsAsEditor } = useSubscriptionStore(
    (state) => ({
      getPublicationSubscriptionDetailsAsEditor:
        state.getPublicationSubscriptionDetailsAsEditor,
    })
  );

  const { getCanisterIdByHandle } = usePublisherStore((state) => ({
    getCanisterIdByHandle: state.getCanisterIdByHandle,
  }));

  useEffect(() => {
    const fetchDetails = async () => {
      if (publicationInfo?.publicationHandle) {
        try {
          const canisterId = await getCanisterIdByHandle(
            publicationInfo.publicationHandle
          );
          setPublicationCanisterId(canisterId || '');

          if (canisterId) {
            const details = await getPublicationSubscriptionDetailsAsEditor(
              canisterId
            );
            if (details) {
              setStats({
                subscribers: details.subscribersCount || 0,
                nuaEarned: details.totalNuaEarned || 0,
                thisWeek: details.lastWeekNewSubscribers || 0,
              });
              setSubscribers(details.subscribedReaders);
              setChartData(
                details.numberOfSubscribersHistoricalData.map(
                  ([timestamp, count]) => ({
                    day: new Date(timestamp).toISOString(),
                    count,
                  })
                )
              );
            } else {
              setStats({
                subscribers: 0,
                nuaEarned: 0,
                thisWeek: 0,
              });
              setSubscribers([]);
              setChartData([]);
            }
          }
        } catch (error) {
          console.error('Error fetching subscription details:', error);
        }
      }
    };

    fetchDetails();
  }, [
    publicationInfo,
    getCanisterIdByHandle,
    getPublicationSubscriptionDetailsAsEditor,
  ]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className='subscribers-tab'>
      <div className='subscription-statistic-wrapper'>
        <div className='subscription-statistic'>
          <div className='subscription-stat' style={{ border: 'none' }}>
            <p className='subscription-count'>{stats.subscribers}</p>
            <p className='subscription-title'>Subscribers</p>
          </div>
          <div className='subscription-stat'>
            <p className='subscription-count'>{stats.nuaEarned / 1e8}</p>
            <p className='subscription-title'>NUA earned</p>
          </div>
          <div className='subscription-stat'>
            <p className='subscription-count' style={{ marginLeft: '-12px' }}>
              {stats.thisWeek >= 0 ? `+${stats.thisWeek}` : `${stats.thisWeek}`}
            </p>
            <p className='subscription-title'>This week</p>
          </div>
        </div>
      </div>
      <div className='title-wrapper'>
        <p className='chart-title'>SUBSCRIBERS {new Date().getFullYear()}</p>
      </div>
      <SubscribersChart data={chartData} />
      <p className='subscribers-table-info'>
        These readers are currently subscribed to this publication. They have
        unlimited access to all the publication’s content for a chosen period.
        Your subscribers are prompted to renew their memeberships once the
        period has expired.
      </p>
      <div className='subscribers-table-wrapper'>
        <table className='subscription-table'>
          <thead>
            <tr>
              <th>READER</th>
              <th>SUBSCRIBED SINCE</th>
              <th>PERIOD</th>
              <th>FEE PER PERIOD</th>
              <th>EARNED TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub.subscriptionStartDate}>
                <td>
                  <Link to={`/user/${sub.userListItem.handle}`}>
                    <img
                      className='subscribers-tab-avatar'
                      src={sub.userListItem.avatar || images.DEFAULT_AVATAR}
                      alt='Avatar'
                    />
                  </Link>{' '}
                  <Link
                    className='subscribers-tab-chart-handle'
                    to={`/user/${sub.userListItem.handle}`}
                  >
                    @{sub.userListItem.handle}
                  </Link>
                </td>
                <td className='subscribers-tab-chart-info'>
                  {formatDate(sub.subscriptionStartDate)}
                </td>
                <td className='subscribers-tab-chart-info'>{sub.period}</td>
                <td className='subscribers-tab-chart-info'>
                  {sub.feePerPeriod / 1e8}
                </td>
                <td className='subscribers-tab-chart-info'>
                  {sub.totalFees / 1e8}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PublicationSubscribersTab;
