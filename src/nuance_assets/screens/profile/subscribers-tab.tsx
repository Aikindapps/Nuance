import React, { useEffect, useState } from 'react';
import { images } from '../../shared/constants';
import SubscribersChart from './subscribers-chart';
import { SubscribedReaderItem } from '../../store/subscriptionStore';
import { useSubscriptionStore, useUserStore } from '../../store/';
import './_subscribers-tab.scss';
import { Link } from 'react-router-dom';
import Loader from '../../UI/loader/Loader'

interface Subscriber {
    id: number;
    name: string;
    subscribedSince: string;
    period: string;
    fee: string;
    totalFees: string;
}

const SubscribersTab: React.FC = () => {
    const [subscribers, setSubscribers] = useState<SubscribedReaderItem[]>([]);
    const [stats, setStats] = useState({
        subscribers: 0,
        nuaEarned: 0,
        thisWeek: 0,
    });
    const [chartData, setChartData] = useState<{ day: string, count: number }[]>([]);
    const [loading, setLoading] = useState(true); // Added state for loading

    const { user } = useUserStore((state) => ({
        user: state.user,
    }));

    const { getMySubscriptionDetailsAsWriter } = useSubscriptionStore((state) => ({
        getMySubscriptionDetailsAsWriter: state.getMySubscriptionDetailsAsWriter,
    }));

    useEffect(() => {
        const fetchDetails = async () => {
            if (user?.handle) {
                setLoading(true); // Start loading
                try {
                    const details = await getMySubscriptionDetailsAsWriter();
                    if (details) {
                        setStats({
                            subscribers: details.subscribersCount || 0,
                            nuaEarned: details.totalNuaEarned || 0,
                            thisWeek: details.lastWeekNewSubscribers || 0,
                        });
                        setSubscribers(details.subscribedReaders);
                        setChartData(details.numberOfSubscribersHistoricalData.map(([timestamp, count]: [number, number]) => ({
                            day: new Date(timestamp).toLocaleDateString(),
                            count,
                        })));
                    }
                } catch (error) {
                    console.error('Error fetching subscription details:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchDetails();
    }, [user, getMySubscriptionDetailsAsWriter]);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString();
    };



    return (
        <div className='subscription-wrapper'>
            <div className='wrapper'>
                {loading ? <div style={{ overflow: "hidden" }}><Loader /> </div> :
                    <div className='subscribers-tab'>
                        <div className='subscription-statistic-wrapper'>
                            <div className='subscription-statistic'>
                                <div className='subscription-stat' style={{ border: "none" }}>
                                    <p className='subscription-count'>{stats.subscribers}</p>
                                    <p className='subscription-title'>Subscribers</p>
                                </div>
                                <div className='subscription-stat'>
                                    <p className='subscription-count'>{stats.nuaEarned / 1e8}</p>
                                    <p className='subscription-title'>NUA earned</p>
                                </div>
                                <div className='subscription-stat'>
                                    <p className='subscription-count' style={{ marginLeft: "-12px" }}>+{stats.thisWeek}</p>
                                    <p className='subscription-title'>This week</p>
                                </div>
                            </div>
                        </div>
                        <div className='title-wrapper'>
                            <p className='chart-title'>SUBSCRIBERS 2024</p>
                        </div>
                        <SubscribersChart data={chartData} />
                        <p className='subscribers-table-info'>These readers are currently subscribed to you. They have unlimited access to all of your content for a chosen period. Your subscribers are prompted to renew their memberships once the period has expired.</p>
                        <div className="subscribers-table-wrapper">
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
                                            <td><Link to={`/user/${sub.userListItem.handle}`}><img className='subscribers-tab-avatar' src={sub.userListItem.avatar || images.DEFAULT_AVATAR} alt="Avatar" /></Link> <Link className='subscribers-tab-chart-handle' to={`/user/${sub.userListItem.handle}`}>@{sub.userListItem.handle}</Link></td>
                                            <td className='subscribers-tab-chart-info'>{formatDate(sub.subscriptionStartDate)}</td>
                                            <td className='subscribers-tab-chart-info'>{sub.period}</td>
                                            <td className='subscribers-tab-chart-info'>{sub.feePerPeriod / 1e8}</td>
                                            <td className='subscribers-tab-chart-info'>{sub.totalFees / 1e8}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                }
            </div>
        </div>
    );
};

export default SubscribersTab;
