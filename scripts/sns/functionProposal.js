const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const { developerNeuronId, pemFilePath } = require('./snsConfig');
const canisterIds = require(path.join(process.cwd(), './.dfx/local/canister_ids.json'));
const canisterIdsProd = require(path.join(process.cwd(), './canister_ids.json'));

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

(async function registerFunction() {
  console.log('🚀 Function Registration Script...');

  const functionName = await prompt('🔖 Enter the Function Name: ');
  const network = await prompt('🌐 Do you want to deploy to the local or ic? (Enter "local" or "ic"): ');
  
  const functionId = Date.now(); // using current timestamp as a unique numeric identifier, make sure it's greater than 1000
  const canisterName = await prompt('🔖 Enter the Canister Name: ');
  const validateFunction = await prompt('🔖 Is this a generic validate function? (Enter "yes" or enter the custom validation function name): ');
  const canisterId = network === 'ic' ? canisterIdsProd[canisterName].ic : canisterIds[canisterName].local;

  try {
    console.log("🚀 Preparing function registration proposal...");
    const proposalStr = `(record { title="Register ${functionName} function."; url="https://example.com/"; summary="This proposal registers ${functionName} function."; action=opt variant {AddGenericNervousSystemFunction = record {id=${functionId}:nat64; name="${functionName}"; description=null; function_type=opt variant {GenericNervousSystemFunction=record{validator_canister_id=opt principal"${canisterId}"; target_canister_id=opt principal"${canisterId}"; validator_method_name=opt"${(validateFunction === "yes") ? "validate" : validateFunction}"; target_method_name=opt"${functionName}"}}}}})`;
    const escapedProposalStr = JSON.stringify(proposalStr);
    const registerCommand = `quill sns --canister-ids-file ${snsCanisterIdsFile} --pem-file ${pemFilePath} make-proposal --proposal ${escapedProposalStr} ${developerNeuronId} > register-${functionName}.json`;
    
    await execShellCommand(registerCommand);
    console.log("✅ Registration proposal prepared, Please send with the following command: ");
    const sendRegisterCommand = `quill send -y register-${functionName}.json ${network == 'ic' ? "" : "--insecure-local-dev-mode" }`;
    console.log('\x1b[36m%s\x1b[0m', sendRegisterCommand);
    
  } catch (err) {
    console.error('❌ Error:', err);
    console.log("proposal for debugging: " + registerCommand)
  }
  
})();
