import React from 'react';
import { images } from '../../shared/constants';
import SubscribersChart from './subscribers-chart';

interface Subscriber {
    id: number;
    name: string;
    subscribedSince: string;
    period: string;
    fee: string;
    totalFees: string;
}

const SubscribersTab: React.FC = () => {
    const subscribers: Subscriber[] = [
        { id: 1, name: "@foodcompany", subscribedSince: "10-02-2022", period: "Monthly", fee: "1 NUA", totalFees: "21 NUA" },
        { id: 2, name: "@jazzyjeff", subscribedSince: "10-02-2022", period: "Monthly", fee: "1 NUA", totalFees: "12 NUA" },
        { id: 3, name: "@jordan234", subscribedSince: "10-02-2022", period: "Weekly", fee: "0.5 NUA", totalFees: "11 NUA" },
        { id: 4, name: "@bemyguest", subscribedSince: "10-02-2022", period: "Annually", fee: "6 NUA", totalFees: "30 NUA" },
        { id: 5, name: "@laywithme", subscribedSince: "10-02-2022", period: "Annually", fee: "6 NUA", totalFees: "44 NUA" },
    ];

    const stats = {
        subscribers: 36,
        nuaEarned: 124,
        thisWeek: 3,
    };

    const chartData = [
        { day: '2024-01-01', count: 10 },
        { day: '2024-02-01', count: 15 },
        { day: '2024-03-01', count: 20 },
        { day: '2024-04-01', count: 25 },
        { day: '2024-05-01', count: 30 },
        { day: '2024-05-02', count: 31 },
        { day: '2024-05-03', count: 32 },
        { day: '2024-05-04', count: 33 },
        { day: '2024-05-05', count: 34 },
        { day: '2024-05-06', count: 35 },
        { day: '2024-05-07', count: 36 },
        { day: '2024-05-08', count: 37 },
        { day: '2024-05-09', count: 38 },
        { day: '2024-05-10', count: 39 },
        { day: '2024-05-11', count: 40 },
        { day: '2024-05-12', count: 41 },
        { day: '2024-05-13', count: 42 },
        // Today's data point
    ];

    return (
        <div className='subscribers-tab'>
            <div className='subscription-statistic-wrapper'>
                <div className='subscription-statistic'>
                    <div className='subscription-stat' style={{ border: "none" }}>
                        <p className='subscription-count'>{0}</p>
                        <p className='subscription-title'>Subscribers</p>
                    </div>
                    <div className='subscription-stat'>
                        <p className='subscription-count'>{0}</p>
                        <p className='subscription-title'>NUA earned</p>
                    </div>
                    <div className='subscription-stat' >
                        <p className='subscription-count' style={{ marginLeft: "-12px" }}>+{0}</p>
                        <p className='subscription-title'>This week</p>
                    </div>
                </div>
            </div>
            <div className='title-wrapper'>
                <p className='chart-title'>SUBSCRIBERS 2024</p>
            </div>
            <SubscribersChart data={chartData} />
            <p className='subscribers-table-info'>These readers are currently subscribed to the this publication. They have unlimited access to all the publication’s content for 1 NUA per month. They pay a monthly fee.</p>
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
                        <tr key={sub.id}>
                            <td><img className='avatar' src={images.DEFAULT_AVATAR} alt="Avatar" /> {sub.name}</td>
                            <td>{sub.subscribedSince}</td>
                            <td>{sub.period}</td>
                            <td>{sub.fee}</td>
                            <td>{sub.totalFees}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SubscribersTab;
