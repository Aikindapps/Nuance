import React, { useState, useEffect } from 'react';
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
  const [timeZone, setTimeZone] = useState<string>('UTC');

  useEffect(() => {
    let isMounted = true;
    const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    if (isMounted) setTimeZone(detectedTimeZone);
  
    return () => {
      isMounted = false;
    };
  }, []);
  
  const currentDate = new Date();
  console.log(timeZone);

  // Parse date string into a Date object
  const parseDate = (dateString: string) => {
    // Adjust this format to match the received data
    const [day, month, year, hour, minute, second] = dateString.split(/[\s:.]+/);
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    return new Date(date.toLocaleString('en-US', { timeZone }));
  };

  // Ensure the data is valid, unique, and not in the future
  const filteredData = data.reduce((acc, item) => {
    const itemDate = parseDate(item.day);
    const isValidDate = !isNaN(itemDate.getTime());
    const isNotFuture = itemDate <= currentDate;
    const isValidCount = typeof item.count === 'number';

    console.log(`Checking item: ${item.day} ---> Date: ${itemDate}, isValidDate: ${isValidDate}, isNotFuture: ${isNotFuture}, isValidCount: ${isValidCount}`);

    if (isValidDate && isNotFuture && isValidCount) {
      acc.push(item);
    }
    return acc;
  }, [] as SubscriberData[]);

  console.log("props data: ", data);
  console.log(navigator.language);
  console.log("filtered data: ", filteredData);

  const sortedData = filteredData.sort((a, b) => {
    const dateA = parseDate(a.day);
    const dateB = parseDate(b.day);
    return dateA.getTime() - dateB.getTime();
  });

  console.log("sorted data: ", sortedData);

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
          x: parseDate(item.day),
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
  const firstDate = parseDate(sortedData[0].day);
  const minDate = new Date(firstDate);
  minDate.setDate(firstDate.getDate() - 7);

  // Calculate the maximum date (1 week after the first date in the data)
  const lastDate = parseDate(sortedData[sortedData.length - 1].day);
  const maxDate = new Date(lastDate);
  maxDate.setDate(lastDate.getDate() + 7);

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
