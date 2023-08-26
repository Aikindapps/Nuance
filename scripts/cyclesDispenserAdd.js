const fs = require('fs');
const readline = require('readline');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const PROD_CANISTER_IDS = [/* All Previously added PROD canisterIds at the bottom */];
const PROD_PRIVILEGED_CANISTER_IDS = [/* All Previously added PROD privileged canisterIds at the bottom */];

const CANISTER_CONFIG = {
    PROD: {
        network: "ic",
        canisterIds: PROD_CANISTER_IDS,
        privilegedCanisterIds: PROD_PRIVILEGED_CANISTER_IDS

    },
    UAT: {
        network: "ic",
        canisterIds: JSON.parse(fs.readFileSync("./CyclesDispenser.json")).nonPrivilegedCanisterIds,
        privilegedCanisterIds: JSON.parse(fs.readFileSync("./CyclesDispenser.json")).privilegedCanisterIds
    },
    LOCAL: {
        network: "local",
        canisterIds: JSON.parse(fs.readFileSync("./CyclesDispenser.json")).nonPrivilegedCanisterIds,
        privilegedCanisterIds: JSON.parse(fs.readFileSync("./CyclesDispenser.json")).privilegedCanisterIds
    }
};

async function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
            rl.close();
        });
    });
}

async function cyclesDispenserAdd(canisterId, network, threshold, topUp) {
    console.log(`🔃 Adding the canister ${canisterId} ...`);
    const command = `dfx canister --network ${network} call CyclesDispenser addCanister '(record{canisterId="${canisterId}";minimumThreshold=${threshold}; topUpAmount=${topUp}})'`;
    const { stdout: result } = await exec(command);
    console.log(result);
}

async function main() {
    const environment = (process.argv[2] === '-devInstall') ? "LOCAL" : (await prompt("Please select the environment (PROD, UAT, LOCAL): ")).toUpperCase();

    if (!CANISTER_CONFIG[environment]) {
        console.error("Invalid environment. Please enter PROD, UAT, or LOCAL.");
        return;
    }

    const network = CANISTER_CONFIG[environment].network;
    const canisterIds =  CANISTER_CONFIG[environment].canisterIds;
    const privilegedCanisterIds = CANISTER_CONFIG[environment].privilegedCanisterIds;

    for (const canisterId of canisterIds) {
        await cyclesDispenserAdd(canisterId, network, "10_000_000_000_000:nat", "5_000_000_000_000:nat");
    }

    for (const canisterId of privilegedCanisterIds) {
        await cyclesDispenserAdd(canisterId, network, "20_000_000_000_000:nat", "10_000_000_000_000:nat");
    }

    console.log('🚀 End');
}

main();



// const PROD_CANISTER_IDS = [
//   "dgwwd-jaaaa-aaaaf-qai7a-cai",
//   "4m3sz-lqaaa-aaaaf-qagza-cai",
//   "qq4ni-qaaaa-aaaaf-qaalq-cai",
//   "r5sjg-7iaaa-aaaaf-qaama-cai",
//   "y2pkg-ciaaa-aaaaf-qagbq-cai",
//   "rtqeo-eyaaa-aaaaf-qaana-cai",
//   "2lqm4-daaaa-aaaaf-qakda-cai",
//   "l5u7w-paaaa-aaaaf-qajla-cai",
//   "oimop-saaaa-aaaaf-qajva-cai",
//   "mhxx6-nyaaa-aaaaf-qajzq-cai",
//   "ogodh-jqaaa-aaaaf-qajua-cai",
//   "bomjg-3aaaa-aaaaf-qaita-cai",
//   "iee6m-fiaaa-aaaaf-qajcq-cai",
//   "3i4f2-xyaaa-aaaaf-qakfq-cai",
//   "nkztq-cqaaa-aaaaf-qaj6a-cai",
//   "pqf3m-4aaaa-aaaaf-qajra-cai",
//   "obpft-eiaaa-aaaaf-qajuq-cai",
//   "bhojl-kqaaa-aaaag-qb2fq-cai",
//   "3g6is-miaaa-aaaaf-qakeq-cai",
//   "g6bdf-piaaa-aaaao-ahq2q-cai",
//   "luxuk-ziaaa-aaaaf-qajkq-cai",
//   "ocpug-eaaaa-aaaal-qbtoq-cai",
//   "ofoss-jyaaa-aaaal-qbtoa-cai",
//   "ltws6-uqaaa-aaaaf-qajka-cai",
//   "nd2ym-uyaaa-aaaaf-qaj7q-cai",
//   "o5l7c-tiaaa-aaaaf-qajwq-cai",
//   "2zw3f-pqaaa-aaaaf-qakaa-cai",
//   "2mrki-oyaaa-aaaaf-qakdq-cai",
//   "zjfrd-tqaaa-aaaaf-qakia-cai",
//   "3tzz7-naaaa-aaaaf-qakha-cai",
// ];
// const PROD_PRIVILEGED_CANISTER_IDS = [
// "322sd-3iaaa-aaaaf-qakgq-cai",//PostCore
// "kq23y-aiaaa-aaaaf-qajmq-cai", //PublicationManagement
// "kc4mb-myaaa-aaaaf-qajpq-cai"//NftFactory
// ];