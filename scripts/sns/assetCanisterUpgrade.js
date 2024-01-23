const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const { developerNeuronId: defaultDevNeuronId, pemFilePath: defaultPemFilePath } = require('./snsConfig');

const argv = yargs(hideBin(process.argv))
  .option('developerNeuronId', {
    describe: 'Developer Neuron ID',
    type: 'string',
    default: defaultDevNeuronId,
  })
  .option('pemFilePath', {
    describe: 'Path to the PEM file',
    type: 'string',
    default: defaultPemFilePath,
  })
  .argv;

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
    const command = spawn(cmd, { shell: true, stdio: 'inherit' });

    command.on('error', (error) => reject(error));
    command.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

const snsCanisterIdsFile = "./sns_canister_ids.json";

(async () => {
  const network = 'ic';
  const functionId = argv.functionId || (await prompt('🔖 Enter the Function ID: ')).trim(); 
  const batch_id = argv.batchId || (await prompt('🔖 Enter the batch id: ')).trim();
  const evidence = argv.evidence || (await prompt('🔖 Enter the evidence: ')).trim(); 


  // Prepare evidence and batch_id
  const formattedEvidence = `blob "\\${evidence.match(/.{1,2}/g).join('\\')}"`;
  const argument = `(record {batch_id=${batch_id}:nat; evidence= ${formattedEvidence}})`;

  const argumentEncoded = await execShellCommand(`scripts/didc encode '(${argument})' --format blob`);

  try {
    console.log("🚀 Preparing function execution proposal...");
    const payload = argumentEncoded;

    const proposalStr = `(record { title="Upgrade Nuance Assets Canister"; url="https://oc.app/community/3qzyb-ryaaa-aaaar-ateiq-cai/channel/180903126530388291372782995208461639178"; summary="This proposal executes function with ID ${functionId}, to upgrade nuance assets canister."; action=opt variant {ExecuteGenericNervousSystemFunction = record {function_id=${functionId}:nat64; payload=${payload}}}})`;
    const escapedProposalStr = proposalStr.replace(/"/g, '\\"');

    const executeCommand = `quill sns --canister-ids-file ${snsCanisterIdsFile} --pem-file ${pemFilePath} make-proposal --proposal "${escapedProposalStr}" ${developerNeuronId} > execute-function-${functionId}.json`;
    console.log("executeCommand: ", executeCommand)
    await execShellCommand(executeCommand);
    console.log(`✅ Execution proposal prepared and saved to execute-function-${functionId}.json \n`);
    const sendExecuteCommand = `quill send -y execute-function-${functionId}.json ${network == 'ic' ? "" : "--insecure-local-dev-mode" }`;
    await execShellCommand(sendExecuteCommand);

    // console.log('\x1b[36m%s\x1b[0m',"Use this command to send proposal: ", sendExecuteCommand + "\n")

  } catch (err) {
    console.error('❌ Error:', err);
  }
})();
