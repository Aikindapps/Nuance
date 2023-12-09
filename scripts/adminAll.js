// Usage:
// 1. Run the script with both `<operation>` and `<principal>` arguments:
//    `node scripts/adminAll.js <operation> <principal>`
//    Example: `node scripts/adminAll.js registerAdmin rrkah-fqaaa-aaaaa-aaaaq-cai`

// 2. Or run the script with just `<operation>` and it will prompt you for a principal ID:
//    `node scripts/adminAll.js <operation>`

// Purpose:
// - This script facilitates the execution of admin operations across ALL canisters.

// Possible Operations:
// - registerAdmin
// - unregisterAdmin
// - getAdmins
// - getPlatformOperators (no need for register/unregister as cycles dispenser has a batch method for this)

const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const readline = require('readline');

const execPromisified = util.promisify(exec);
const network = process.argv[4] || "local"; 
const dfx_folder = network === "local" ? '.dfx/local' : "./";

function getJSONFromFile(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath));
    } catch (err) {
        console.error(`Error reading or parsing ${filePath}: `, err);
        process.exit(1);
    }
}

const canisterIdsJson = getJSONFromFile(path.join(dfx_folder, 'canister_ids.json'));
const FrontendCanisterId = canisterIdsJson.nuance_assets[network];
const canisterIds = getJSONFromFile("./CyclesDispenser.json").TotalArray;

function getPrincipalFromUser() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Please enter a principal ID: ', (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function handleCanisterOperation(canisterId, operation, customPrincipal) {
    let command = `dfx canister call --network ${network} ${canisterId} ${operation}`;
    if (customPrincipal) {
        command += ` '("${customPrincipal}")'`;
    }

    try {
        let result = await execPromisified(command);
         console.log(`${operation} result: `, result.stdout);
    } catch (error) {
        if (canisterId === FrontendCanisterId) {
            console.log(`Skipping ${operation} on Frontend canister ${canisterId}`);
        } else {
            console.error(`Error during ${operation} on canister ${canisterId}: `, error);
        }
    }
}

async function main() {
    const operation = process.argv[2] || "getAdmins";
    let customPrincipal = process.argv[3];

    if (!customPrincipal && ['registerAdmin', 'unregisterAdmin'].includes(operation)) {
        customPrincipal = await getPrincipalFromUser();
    }

    if (!customPrincipal && ['registerAdmin', 'unregisterAdmin'].includes(operation)) {
        console.error(`No principal ID provided.`);
        process.exit(1);
    }

    for (const canisterId of canisterIds) {
        console.log(`Operating on canister ${canisterId}`);
        await handleCanisterOperation(canisterId, operation, customPrincipal);
    }
}

main();
