const os = require('os');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const { developerNeuronId } = require('./snsConfig');

// Construct PEM file path dynamically
const pemFilePath = path.join(os.homedir(), '.config/dfx/identity/default/identity.pem');

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

function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    const command = spawn(cmd, { shell: true, stdio: 'pipe' });
    let result = '';

    command.stdout.on('data', (data) => {
      result += data.toString();
    });

    command.on('error', (error) => reject(error));
    command.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command exited with code ${code}`));
      } else {
        resolve(result);
      }
    });
  });
}

const snsCanisterIdsFile = "./sns_canister_ids.json";

(async function executeFunction() {
  console.log('🚀 Function Execution Script...');
  const network = await prompt('🌐 Do you want to execute function on local or ic? (Enter "local" or "ic"): ');
  const functionId = (await prompt('🔖 Enter the Function ID: ')).trim();
  const argument = (await prompt('🔖 Enter the function argument (if none, press enter): ')).trim();
  const argumentEncoded = await execShellCommand(`scripts/didc encode '(${argument})' --format blob`);

  try {
    console.log("🚀 Preparing function execution proposal...");
    const payload = argumentEncoded;

    const proposalStr = `(record { title="Execute function with ID ${functionId}."; url="https://oc.app/community/3qzyb-ryaaa-aaaar-ateiq-cai/channel/319289011514000786761446705357216728776"; summary="This proposal executes function with ID ${functionId}."; action=opt variant {ExecuteGenericNervousSystemFunction = record {function_id=${functionId}:nat64; payload=${payload}}}})`;
    const escapedProposalStr = proposalStr.replace(/"/g, '\\"');

    const executeCommand = `quill sns --canister-ids-file ${snsCanisterIdsFile} --pem-file ${pemFilePath} make-proposal --proposal "${escapedProposalStr}" ${developerNeuronId} > execute-function-${functionId}.json`;
    console.log("executeCommand: ", executeCommand);
    await execShellCommand(executeCommand);
    console.log(`✅ Execution proposal prepared and saved to execute-function-${functionId}.json \n`);

    const sendExecuteCommand = `quill send -y execute-function-${functionId}.json ${network === 'ic' ? "" : "--insecure-local-dev-mode"}`;
    console.log('\x1b[36m%s\x1b[0m', "Use this command to send proposal: ", sendExecuteCommand + "\n");

  } catch (err) {
    console.error('❌ Error:', err);
  }
})();


//revoke permission func:
//dfx canister call --network ic <canister-id>  revoke_permission '(record {permission = variant {<Permission: Commit / Prepare / ManagePermissions >}; of_principal = principal "<principal>"})'
//arg '(record {permission = variant {<Permission: Commit / Prepare / ManagePermissions >}; of_principal = principal "<principal>"})'

//args to remove Aikin's permissions:
// (record { permission = variant { Commit }; of_principal = principal "btrx2-makdj-pw2cp-u264a-cntkp-2mzjv-56oqc-6r7uu-ocexg-mf3sn-qqe" })
// (record { permission = variant { Commit }; of_principal = principal "p5x7e-xqqb3-orerc-tmqof-rnhhy-5y7r7-vpoog-bpqrf-6cuki-bwdpd-3ae" })
// (record { permission = variant { Commit }; of_principal = principal "keqno-ecosc-a47cf-rk2ui-5ehla-noflk-jj4it-h6nku-smno2-fucgs-cae" })
// (record { permission = variant { Commit }; of_principal = principal "3v3rk-jx25f-dl43p-osgkw-6dm7b-wguwy-kjcun-lyo3w-lsuev-kcdnp-7qe" })
// (record { permission = variant { Commit }; of_principal = principal "tonkg-xqaaa-aaaaf-qaacq-cai" })
