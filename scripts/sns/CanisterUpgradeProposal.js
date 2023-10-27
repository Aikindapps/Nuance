const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const { developerNeuronId: defaultDevNeuronId, pemFilePath: defaultPemFilePath, canisterCommands } = require('./snsConfig');
const canisterIds = require(path.join(process.cwd(), './.dfx/local/canister_ids.json'));
const canisterIdsProd = require(path.join(process.cwd(), './canister_ids.json'));
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('devNeuronId', {
    describe: 'Developer Neuron ID',
    type: 'string',
  })
  .option('pemFilePath', {
    describe: 'Path to the PEM file',
    type: 'string',
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

(async () => {
  const canisterName = argv.canisterName || await prompt('🔖 Enter the canister Name: ');
  const network = argv.network || await prompt('🌐 Do you want to deploy to the local or ic? (Enter "local" or "ic"): ');
  const title = argv.title || await prompt('🔖 Enter proposal title: ');
  const url = argv.url || await prompt('🔖 Enter the url: ');
  const summary = argv.summary || await prompt('🔖 Enter proposal summary: ');
  const developerNeuronId = argv.devNeuronId || defaultDevNeuronId;
  const pemFilePath = argv.pemFilePath || defaultPemFilePath;

  const snsCanisterIdsFile = "./sns_canister_ids.json";
  const canisterId = network === 'local' ? canisterIds[canisterName].local : canisterIdsProd[canisterName].ic;

  const wasmPath = path.join(
    process.cwd(),
    '.dfx',
    network,
    'canisters',
    canisterName,
    `${canisterName}.wasm`
  );

  try {
    const makeProposalCommand = `quill sns --canister-ids-file ${snsCanisterIdsFile} --pem-file ${pemFilePath} make-upgrade-canister-proposal --summary "${summary}" --title "${title}" --url "${url}" --target-canister-id ${canisterId} --wasm-path "${wasmPath}" ${developerNeuronId} > upgrade${canisterName}.json`;
    await execShellCommand(makeProposalCommand);

    const sendCommand = `quill send upgrade${canisterName}.json ${network === 'ic' ? "" : "--insecure-local-dev-mode"} -y | grep -v "^ *new_canister_wasm"`;
    await execShellCommand(sendCommand);
    // console.log('\x1b[36m%s\x1b[0m', "Run the following command to send the proposal: \n");
    // console.log(sendCommand);
    // console.log("\n");
  } catch (err) {
    console.error('❌ Error:', err);
    console.log("err proposal for debugging: " + makeProposalCommand);
  }
})();
