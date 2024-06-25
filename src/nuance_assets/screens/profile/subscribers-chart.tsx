import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables, TooltipItem } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns'; // Import the date adapter

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

    const currentDate = new Date();

    // Ensure the data is valid, unique, and not in the future
    const filteredData = data.reduce((acc, item) => {
        const exists = acc.find(i => i.day === item.day);
        const itemDate = new Date(item.day);
        if (!exists && item.day && typeof item.count === 'number' && itemDate <= currentDate) {
            acc.push(item);
        }
        return acc;
    }, [] as SubscriberData[]);

    const isValidData = filteredData.length > 0;

    if (!isValidData) {
        return <div>You do not have any subscription data yet.</div>;
    }

    // Prepare chart data
    const chartData = {
        datasets: [
            {
                label: 'Subscribers',
                data: filteredData.map(item => ({ x: new Date(item.day), y: item.count })),
                borderColor: '#435AAC',
                backgroundColor: 'rgba(2, 195, 161, 0.2)',
                fill: false,
                tension: 0.1,
            },
        ],
    };

    // Calculate the minimum date (3 months before the first date in the data)
    const firstDate = new Date(filteredData[0].day);
    const minDate = new Date(firstDate);
    minDate.setMonth(minDate.getMonth() - 3);

    // Calculate the maximum date (1 month after the last date in the data)
    const lastDate = new Date(filteredData[filteredData.length - 1].day);
    const maxDate = new Date(lastDate);
    maxDate.setMonth(maxDate.getMonth() + 1);

    const options: any = {
        responsive: true,
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'month',
                    tooltipFormat: 'MMM dd, yyyy',
                    displayFormats: {
                        day: 'MMM dd',
                        week: 'MMM dd',
                        month: 'MMM yyyy',
                        quarter: 'MMM yyyy',
                        year: 'yyyy'
                    },
                },
                min: minDate,
                max: maxDate,
                title: {
                    display: true,
                    text: 'Date'
                },
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Count'
                },
                grid: {
                    display: true
                }
            },
        },
        plugins: {
            legend: {
                display: false,
                position: 'top' as const,
            },
            tooltip: {
                callbacks: {
                    label: (tooltipItem: TooltipItem<'line'>) => {
                        const dataPoint = tooltipItem.raw as { x: Date; y: number };
                        return ` ${dataPoint.y}` + " ";
                    },
                    title: (tooltipItem: TooltipItem<'line'>[]) => {
                        const dataPoint = tooltipItem[0].raw as { x: Date; y: number };
                        return ""
                    }
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
                        xMin: new Date().toISOString(),
                        xMax: new Date().toISOString(),
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
