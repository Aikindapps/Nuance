// Usage: node scripts/tests/data_integirity_base_line.js
// next run: node scripts/tests/sns_uat_data_integrity.js to
// This script will populate the baseline data for data integrity check. Run data_integirity_base_line.js prior to deployment of the canisters.
// to add more commands, you only need to add them to the commands array ib data_integirity_base_line.js, note -qq flag used to disable warnings. 


const { exec } = require('child_process');
const fs = require('fs');

// Base commands to run without canister ID.
const baseCommands = [
    'dfx canister call PostCore --network ic getPostKeyProperties \'("1")\' -qq',
    'dfx canister call User --network ic dumpUsers -qq',
    'dfx canister call PostCore --network ic getLatestPosts \'(0,1)\' -qq',
    // ... other commands
];

// Function to execute shell commands.
function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) return reject(error);
            if (stderr) return reject(stderr);
            resolve(stdout.trim());
        });
    });
}

// Function to extract canister ID from the getBucketCanisters command.
async function extractCanisterId() {
    const command = 'dfx canister call PostCore --network ic getBucketCanisters -qq';
    const output = await executeCommand(command);
    const match = output.match(/"([\w-]+)"/); // Adjust regex according to the output format.
    return match ? match[1] : null;
}

// Main function to populate the baseline data.
async function populateDataIntegrityBaseline() {
    const baselineData = {};
    const canisterId = await extractCanisterId();

    if (!canisterId) {
        console.error('Failed to retrieve the canister ID');
        return;
    }

    // Add the dynamic command with the canister ID.
    const dynamicCommand = `dfx canister call ${canisterId} --network ic get '("19")' -qq`;
    const commands = [...baseCommands, dynamicCommand];

    for (const command of commands) {
        try {
            const output = await executeCommand(command);
            baselineData[command] = output;
        } catch (error) {
            console.error(`Failed to execute command: ${command}`, error);
        }
    }

    fs.writeFileSync('scripts/tests/dataIntegrityBaseline.json', JSON.stringify(baselineData, null, 2));
    console.log('✅ dataIntegrityBaseline.json poulated successfully, double check for undefined values');
}


populateDataIntegrityBaseline();
