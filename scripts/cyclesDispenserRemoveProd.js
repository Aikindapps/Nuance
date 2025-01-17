const { spawnSync, execSync } = require('child_process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const csv = require('csv-parser');

const readline = require('readline');
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

async function main() {
  console.log(
    '\x1b[36m%s\x1b[0m',
    '🚀 Remove the canisters from the CyclesDispenser'
  );

  const canisterIds = [
    'hpcqv-diaaa-aaaal-abtsa-cai',
    'nnyve-piaaa-aaaaf-qaj6q-cai',
    'kt6ie-nqaaa-aaaag-abcoq-cai',
    'p6hwe-hqaaa-aaaaf-qajqa-cai',
    'rlkxh-ryaaa-aaaak-qbhla-cai',
    'vtuu6-uqaaa-aaaaf-qahla-cai',
    'zzdda-wqaaa-aaaaf-qagha-cai',
    'nu6fx-ryaaa-aaaam-qbasa-cai',
    'cbew5-7yaaa-aaaak-qbp5q-cai',
    'v2x7c-cyaaa-aaaaf-qahkq-cai',
    '3tzz7-naaaa-aaaaf-qakha-cai',
    '5ta5c-qiaaa-aaaam-aaysq-cai',
    'km6bj-xiaaa-aaaaf-qajoq-cai',
    'zjfrd-tqaaa-aaaaf-qakia-cai',
    'opni3-7yaaa-aaaaf-qajvq-cai',
    '3d7l4-iaaaa-aaaaf-qagia-cai',
    '4vm7k-tyaaa-aaaah-aq4wq-cai',
    'pfckb-5iaaa-aaaaf-qajsq-cai',
    'kx35m-nqaaa-aaaaf-qajma-cai',
    'kzzqe-waaaa-aaaaf-qajna-cai',
    'l2vzc-cyaaa-aaaaf-qajlq-cai',
    'k6ywq-3yaaa-aaaaf-qajnq-cai',
  ];

  for (const canisterId of canisterIds) {
    console.log('🔃 Removing the canister ' + canisterId + '...');
    const { stdout: result } = await exec(
      `dfx canister --network ic call y6ydp-7aaaa-aaaaj-azwyq-cai removeCanister '("${canisterId}")'`
    );
    console.log(result);
  }

  console.log('🚀 End');
}
main();
