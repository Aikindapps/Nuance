const { exec } = require('child_process');


let network = "ic";
const controllerPrincipalId = "gs5lq-gst3q-56phb-4sxwu-eo4nu-fqe3z-k2euk-5okx7-tguxu-x7nkr-nae"; //UAT

//UAT
const canisterIds = {
  FastBlocks_EmailOptIn: "nu6fx-ryaaa-aaaam-qbasa-cai",
  KinicEndpoint: "v2x7c-cyaaa-aaaaf-qahkq-cai",
  PostIndex: "zzdda-wqaaa-aaaaf-qagha-cai",
  Storage: "z6cfu-3iaaa-aaaaf-qaghq-cai",
  User: "3d7l4-iaaaa-aaaaf-qagia-cai",
  nuance_assets: "3e6ni-fyaaa-aaaaf-qagiq-cai",
  PostCore: "nnyve-piaaa-aaaaf-qaj6q-cai",
  CyclesDispenser: "2qvqz-zyaaa-aaaaf-qakbq-cai",
  NftFactory: "kzzqe-waaaa-aaaaf-qajna-cai",
  PublicationManagement: "kx35m-nqaaa-aaaaf-qajma-cai",
  Metrics: "5wsca-maaaa-aaaaf-qakra-cai",
  Publisher: "zvbls-eqaaa-aaaaf-qakka-cai",
  PostBucket: "3p5do-2aaaa-aaaaf-qakfa-cai",
};

// //PROD and Local
// const canisterIds = {
//   CyclesDispenser: "y6ydp-7aaaa-aaaaj-azwyq-cai",
//   FastBlocks_EmailOptIn: "24qg5-ciaaa-aaaak-qtr7a-cai",
//   KinicEndpoint: "sphnc-7yaaa-aaaao-a3wga-cai",
//   Metrics: "a5asx-niaaa-aaaac-aacxq-cai",
//   PostBucket: "yx3it-jiaaa-aaaaj-azwza-cai",
//   PostCore: "4vm7k-tyaaa-aaaah-aq4wq-cai",
//   PostIndex: "r5sjg-7iaaa-aaaaf-qaama-cai",
//   Storage: "44puw-fqaaa-aaaah-aq4xa-cai",
//   User: "wlam3-raaaa-aaaap-qpmaa-cai",
//   nuance_assets: "t6unq-pqaaa-aaaai-q3nqa-cai",
//   NftFactory: "uebr2-liaaa-aaaai-q3sha-cai",
//   PublicationManagement: "zvibj-naaaa-aaaae-qaira-cai"
// };




function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Error in command output: ${stderr}`);
        reject(new Error(stderr));
        return;
      }
      console.log(`Output: ${stdout}`);
      resolve(stdout.trim());
    });
  });
}

async function updateCanisterControllers() {
  for (const [canisterName, canisterId] of Object.entries(canisterIds)) {
    console.log(`Updating controller for canister ${canisterName} with ID ${canisterId}`);
    try {
      await executeCommand(`dfx canister --network=${network} update-settings ${canisterId} --add-controller ${controllerPrincipalId} -qq`);
      console.log(`Updated controller for canister ${canisterName}`);
    } catch (error) {
      console.error(`Failed to update controller for canister ${canisterName}: ${error.message}`);
    }
  }
}

// Start the script
updateCanisterControllers();
