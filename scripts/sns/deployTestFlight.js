// deploy-test-flight.js
const { exec } = require('child_process');

exec('sns-cli deploy-testflight', (err, stdout, stderr) => {
    if (err) {
        // handle error
        return;
    }
    
    // Parse the stdout to find the neuron developer ID
    const matches = stdout.match(/Developer neuron IDs:\n(\w+)/);
    if (matches) {
        console.log(`Neuron developer ID: ${matches[1]}`);
    } else {
        console.error('Neuron developer ID not found');
    }
});
