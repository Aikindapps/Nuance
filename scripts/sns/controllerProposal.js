const { exec } = require('child_process');
const readline = require('readline');
const { developerNeuronId, pemFilePath, canisterCommands } = require('./snsConfig');

function prompt(question) {
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

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error}`);
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

// Prompt network choice
prompt('Choose network: local or ic? ')
  .then(network => {
    if (network === 'local' || network === 'ic') {
      // Fetch and process all canister IDs
      Promise.all(canisterCommands.map(cmd => {
        return executeCommand(cmd + ` --network=${network}`)
          .then(canisterId => {
            return executeCommand(`dfx canister --network=${network} update-settings --add-controller r7inp-6aaaa-aaaaa-aaabq-cai  ${canisterId}
              dfx canister --network=${network} update-settings --add-controller 3v3rk-jx25f-dl43p-osgkw-6dm7b-wguwy-kjcun-lyo3w-lsuev-kcdnp-7qe  ${canisterId}
            `)
              .then((output) => {
                console.log(`${output}`);  // log the output here
                return canisterId;  // return canisterId after adding it as controller
              });
          });
      }))
        //commented out for 1 proposal method
        // .then(canisterIds => {
        //     const idsString = canisterIds.map(id => `principal\\"${id}\\"`).join('; ');

        //     // Create proposal
        //     const quillCommand = 
        //     `quill sns --canister-ids-file ./sns_canister_ids.json --pem-file ${pemFilePath} make-proposal --proposal "(record { title=\\"Register dapp's canisters with SNS.\\"; url=\\"https://example.com/\\";
        //     summary=\\"This proposal registers dapp's canisters with SNS.\\";
        //     action=opt variant {RegisterDappCanisters = record {canister_ids=vec {${idsString}}}}})" ${developerNeuronId} > register.json`;

        //     console.log('quillCommand: ', quillCommand);
        //     // Execute proposal command
        //     executeCommand(quillCommand).then(() => {
        //         console.log("\n" + '✅ Proposal created and saved to register.json');

        //         // Send proposal - Command commented out as per TODO. Uncomment when needed.
        //         // executeCommand('quill send -y register.json --insecure-local-dev-mode');
        //         console.log( "\n" + `Run this command to send: quill send -y register.json  ${network === 'local' ? "--insecure-local-dev-mode" : ""}` + "\n" )
        //     });
        // })
        .catch(error => {
          console.error(`An error occurred: ${error}`);
        });
    } else {
      console.log('Invalid network. Choose "local" or "ic".');
    }
  });
