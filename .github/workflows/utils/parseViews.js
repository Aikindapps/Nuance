// parseViews.js
const rawData = process.argv[2];

function parseViews(data) {
  // Regular expression to match the first numeric value
  const regex = /(\d+) : nat/;
  const match = regex.exec(data);

  if (match && match[1]) {
    const totalViews = parseInt(match[1], 10);
    return `Total Views: ${totalViews}`;
  } else {
    return 'No valid views metric data found.';
  }
}

const analysisMetrics = parseViews(rawData);
console.log(analysisMetrics);
