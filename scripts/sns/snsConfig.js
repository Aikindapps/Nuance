// snsConfig.js
exports.developerNeuronId = "c36ac1899f86d40ebddee713ab667b57717b912ded90ec37ac24deec12a01abe";
exports.pemFilePath = `../.config/dfx/identity/$(dfx identity whoami)/identity.pem`;
exports.canisterCommands = [
    'dfx canister id FastBlocks_EmailOptIn',
    'dfx canister id KinicEndpoint',
    'dfx canister id PostIndex',
    'dfx canister id Storage',
    'dfx canister id User',
    'dfx canister id nuance_assets',
    'dfx canister id PostCore',
    'dfx canister id CyclesDispenser',
];
