const { exec } = require('child_process');
const fs = require('fs');

const baselineData = JSON.parse(fs.readFileSync('scripts/tests/dataIntegrityBaseline.json'));

function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) return reject(error);
            if (stderr) return reject(stderr);
            resolve(stdout.trim());
        });
    });
}

async function checkDataIntegrity() {
    for (const command in baselineData) {
        if (baselineData.hasOwnProperty(command)) {
            try {
                const currentOutput = await executeCommand(command);
                const baselineOutput = baselineData[command];
                if (currentOutput !== baselineOutput) {
                    console.error(`🛑 Mismatch for command: ${command}`);
                } else {
                    console.log(`✅ Command matches baseline: ${command}`);
                }
            } catch (error) {
                console.error(`Failed to execute command: ${command}`, error);
            }
        }
    }

    console.log('Data integrity check completed');
}

checkDataIntegrity();
