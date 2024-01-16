// parseMetrics.js
const rawData = process.argv[2];
const metricType = process.argv[3]; // 'posts' or 'views'

function parseMetrics(data, type) {
  const regex = /: int; (\d+) : nat;/g;
  let match;
  const metrics = [];

  while ((match = regex.exec(data)) !== null) {
    const value = parseInt(match[1], 10);
    if (!isNaN(value)) {
      metrics.push(value);
    }
  }

  if (metrics.length === 0) {
    return `No valid ${type} metric data found.`;
  }

  const total = metrics.reduce((acc, val) => acc + val, 0);
  const max = Math.max(...metrics);
  const min = Math.min(...metrics);
  const average = (total / metrics.length).toFixed(2);

  return `Total ${type.charAt(0).toUpperCase() + type.slice(1)}: ${total}, Max ${type.charAt(0).toUpperCase() + type.slice(1)} in an Hour: ${max}, Min ${type.charAt(0).toUpperCase() + type.slice(1)} in an Hour: ${min}, Average ${type.charAt(0).toUpperCase() + type.slice(1)} per Hour: ${average}`;
}

const analysisMetrics = parseMetrics(rawData, metricType);
console.log(analysisMetrics);
