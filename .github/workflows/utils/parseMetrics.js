// parseMetrics.js
const rawData = process.argv[2];

function parseMetrics(data) {
  // Ensure the data is a string and split it into an array of numbers
  const metrics = data.split(' ').map(num => parseInt(num, 10)).filter(num => !isNaN(num));

  // If there are no valid numbers, return a message indicating this
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
