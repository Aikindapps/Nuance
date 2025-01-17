// snsConfig.js
exports.developerNeuronId = "a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131";
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
    'dfx canister id uebr2-liaaa-aaaai-q3sha-cai', // NFT Factory
    'dfx canister id zvibj-naaaa-aaaae-qaira-cai', // Publication Management
];
