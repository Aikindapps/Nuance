import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables, TooltipItem } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(...registerables, annotationPlugin);

interface SubscriberData {
    day: string;
    count: number;
}

interface SubscribersChartProps {
    data: SubscriberData[];
}

const SubscribersChart: React.FC<SubscribersChartProps> = ({ data }) => {
    console.log('SubscribersChart data:', data);

    const isValidData = data && data.length > 0 && data.every(item => item.day && typeof item.count === 'number');

    if (!isValidData) {
        return <div>Error: Invalid data for the chart.</div>;
    }

    // Aggregate data by month
    const monthlyData = data.reduce((acc, item) => {
        const month = new Date(item.day).toLocaleString('default', { month: 'short' });
        if (!acc[month]) {
            acc[month] = { month, count: 0 };
        }
        acc[month].count += item.count;
        return acc;
    }, {} as Record<string, { month: string; count: number }>);

    const chartData = {
        labels: Object.keys(monthlyData),
        datasets: [
            {
                label: 'Subscribers',
                data: Object.values(monthlyData).map(item => item.count),
                borderColor: '#435AAC',
                backgroundColor: 'rgba(2, 195, 161, 0.2)',
                fill: false,
                tension: 0.1,
            },
        ],
    };

    const today = new Date();
    const todayMonth = today.toLocaleString('default', { month: 'short' });

    const options: any = {
        responsive: true,
        scales: {
            x: {
                beginAtZero: true,
            },
            y: {
                beginAtZero: true,
            },
        },
        plugins: {
            legend: {
                display: false,
                position: 'top' as const,
            },
            tooltip: {
                callbacks: {
                    label: (tooltipItem: TooltipItem<'line'>) => ` ${tooltipItem.raw}`,  // Show only the number
                    title: () => '',  // Remove the title
                },
                backgroundColor: '#02C3A1',
                titleFont: { size: 20 },
                bodyFont: { size: 20 },
                displayColors: false,
            },
            annotation: {
                annotations: {
                    line1: {
                        type: 'line',
                        xMin: todayMonth,
                        xMax: todayMonth,
                        borderColor: '#CC4747',
                        borderWidth: 2,
                        label: {
                            content: 'Today',
                            enabled: true,
                            position: 'top' as const,
                        },
                    },
                },
            },
        },
    };

    return <Line data={chartData} options={options} />;
};


export default SubscribersChart;