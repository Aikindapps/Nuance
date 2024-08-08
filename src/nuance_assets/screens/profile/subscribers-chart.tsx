import React, { useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables, TooltipItem } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-date-fns'; // Import the date adapter
import { parse, isValid, addWeeks, subWeeks } from 'date-fns';

Chart.register(...registerables, annotationPlugin);

interface SubscriberData {
  day: string;
  count: number;
}

interface SubscribersChartProps {
  data: SubscriberData[];
}

const SubscribersChart: React.FC<SubscribersChartProps> = ({ data }) => {
  const currentDate = new Date();

  // Ensure the data is valid, unique, and not in the future
  const filteredData = data.reduce((acc, item) => {
    const exists = acc.filter((i) => i.day === item.day);
    const itemDate = parse(item.day, 'dd.MM.yyyy HH:mm:ss', new Date());
    if (
      exists &&
      isValid(itemDate) &&
      itemDate <= currentDate &&
      typeof item.count === 'number'
    ) {
      acc.push(item);
    }
    return acc;
  }, [] as SubscriberData[]);

  const sortedData = filteredData.sort((a, b) => {
    const dateA = parse(a.day, 'dd.MM.yyyy HH:mm:ss', new Date());
    const dateB = parse(b.day, 'dd.MM.yyyy HH:mm:ss', new Date());
    return dateA.getTime() - dateB.getTime();
  });

  const isValidData = sortedData.length > 0 && sortedData[0].count !== 0;

  if (!isValidData) {
    return <div>You do not have any subscription data yet.</div>;
  }

  // Prepare chart data
  const chartData = {
    datasets: [
      {
        label: 'Subscribers',
        data: sortedData.map((item) => ({
          x: parse(item.day, 'dd.MM.yyyy HH:mm:ss', new Date()),
          y: item.count,
        })),
        borderColor: '#435AAC',
        backgroundColor: 'rgba(2, 195, 161, 0.2)',
        fill: false,
        tension: 0,
      },
    ],
  };

  // Calculate the minimum date (1 week before the first date in the data)
  const firstDate = parse(sortedData[0].day, 'dd.MM.yyyy HH:mm:ss', new Date());
  const minDate = subWeeks(new Date(firstDate), 1);

  // Calculate the maximum date (1 week after the first date in the data)
  const lastDate = parse(sortedData[sortedData.length - 1].day, 'dd.MM.yyyy HH:mm:ss', new Date());
  const maxDate = addWeeks(new Date(lastDate), 1);

  const maxCount = Math.max(...sortedData.map((item) => item.count)) + 1;

  const options: any = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'week',
          tooltipFormat: 'MMM dd, yyyy',
          displayFormats: {
            day: 'MMM dd',
            week: 'MMM dd yyyy',
            month: 'MMM yyyy',
            quarter: 'MMM yyyy',
            year: 'yyyy',
          },
        },
        min: minDate,
        max: maxDate,
        title: {
          display: true,
          text: 'Date',
        },
        grid: {
          display: false,
        },
        ticks: {
          stepSize: 1
        }
      },
      y: {
        beginAtZero: true,
        max: maxCount,

        title: {
          display: true,
          text: 'Count',
        },
        grid: {
          display: true,
        },
        ticks: {
          stepSize: 1,
        },
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
            return `Subscribers: ${dataPoint.y}`;
          },
          title: (tooltipItem: TooltipItem<'line'>[]) => {
            const dataPoint = tooltipItem[0].raw as { x: Date; y: number };
            return ` ${dataPoint.x.toLocaleDateString()}` + ' ';
          },
        },
        backgroundColor: '#02C3A1',
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
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
            display: false,
            label: {
              content: 'Today',
              enabled: true,
              position: 'top' as const,
            },
          }
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default SubscribersChart;
