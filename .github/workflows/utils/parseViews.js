// parseViews.js
const rawData = process.argv[2];

function parseViews(data) {
  // Regular expression to match the view counts in the data format
  const regex = /record \{ \d+ : nat; (\d+) : nat; \};/g;
  let match;
  const viewCounts = [];

  while ((match = regex.exec(data)) !== null) {
    const viewCount = parseInt(match[1], 10);
    if (!isNaN(viewCount)) {
      viewCounts.push(viewCount);
    }
  }

  if (viewCounts.length === 0) {
    return 'No valid views metric data found.';
  }

  const totalViews = viewCounts.reduce((acc, val) => acc + val, 0);
  const maxViews = Math.max(...viewCounts);
  const minViews = Math.min(...viewCounts);
  const averageViews = (totalViews / viewCounts.length).toFixed(2);

  return `Total Views: ${totalViews}, Max Views in an Hour: ${maxViews}, Min Views in an Hour: ${minViews}, Average Views per Hour: ${averageViews}`;
}

const analysisMetrics = parseViews(rawData);
console.log(analysisMetrics);
