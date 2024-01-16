// parseMetrics.js
const rawData = process.argv[2];

function parseMetrics(data) {
  // Regex to extract numbers. Adjust if the format changes.
  const regex = /(\d+) : nat/g;
  let match;
  const metrics = [];

  while ((match = regex.exec(data)) !== null) {
    metrics.push(match[1]);
  }

  return metrics.join(", ");
}

const formattedMetrics = parseMetrics(rawData);
console.log(formattedMetrics);
