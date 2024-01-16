// parseMetrics.js
const rawData = process.argv[2];

function parseMetrics(data) {
  // Extract the numbers from the structured format
  const regex = /record \{ (\d+) : int; (\d+) : nat; \};/g;
  let match;
  const metrics = [];

  while ((match = regex.exec(data)) !== null) {
    const posts = parseInt(match[2], 10);
    if (!isNaN(posts)) {
      metrics.push(posts);
    }
  }

  if (metrics.length === 0) {
    return 'No valid metric data found.';
  }

  // Performing data analysis
  const totalPosts = metrics.reduce((acc, val) => acc + val, 0);
  const maxPosts = Math.max(...metrics);
  const minPosts = Math.min(...metrics);
  const averagePosts = (totalPosts / metrics.length).toFixed(2);

  // Formatting the results
  const analysisResult = `Total Posts: ${totalPosts}, Max Posts in an Hour: ${maxPosts}, Min Posts in an Hour: ${minPosts}, Average Posts per Hour: ${averagePosts}`;
  
  return analysisResult;
}

const analysisMetrics = parseMetrics(rawData);
console.log(analysisMetrics);
