// parseViews.js
const rawData = process.argv[2];

function parseViews(data) {
  const regex = /(\d+) : nat/;
  const match = regex.exec(data);

  if (match && match[1]) {
    const totalViews = parseInt(match[1], 10);
    return totalViews.toString(); // Output as a string
  } else {
    return '0'; 
  }
}

const totalViews = parseViews(rawData);
console.log(totalViews); 
