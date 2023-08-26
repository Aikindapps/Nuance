// check-config.js
const { exec } = require('child_process');

// Tool version check function
function checkVersion(tool, expectedVersion, command) {
    exec(command, (err, stdout, stderr) => {
        let version;
        
        // If there's an error and nothing in stderr, we have a real problem
        if (err && !stderr) {
            console.log(`${tool} not installed or not in path: ${err}`);
            return;
        }
        
        // If there's data in stderr, treat it as our version info
        if (stderr) {
            version = stderr.trim();
        } else {
            version = stdout.trim();
        }

        // Check the version
        if(version !== expectedVersion) {
            console.log("\n");
            console.log(`Recommended ${tool} version: ${expectedVersion}`);
            console.log(`Actual ${tool} version: ${version}`);
            console.log("\n");
        } else {
            console.log(`${tool} version check passed: ${version}`);
            console.log("\n");
        }
    });
}
// Checking versions of tools ('Tool', 'Reccomended version', 'Command to check version')');
checkVersion('dfx', '0.14.3', 'dfx --version');
checkVersion('sns-cli', '0.1.0', 'sns-cli --version');
checkVersion('quill', 'v0.4.0', 'quill -V');
checkVersion('didc', '0.3.0', './scripts/didc --version');
