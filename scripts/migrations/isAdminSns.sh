
#Populates CyclesDispenser.json with all canisters
node ./scripts/GetAllCanisterIds.js -CyclesDispenser ic

#Ensures you are an admin for all canisters
node ./scripts/adminAll.js registerAdmin $(dfx identity get-principal) ic

#enables CyclesDispenser to call admin function for all canisters
node ./scripts/adminAll.js registerAdmin $(dfx canister --network ic id CyclesDispenser) ic

# adds canisters from CyclesDispenser.json to CyclesDispenser
node ./scripts/cyclesDispenserAdd.js 

# uncomment to test batch register
#dfx canister call CyclesDispenser batchRegisterAdmin '(principal "'$(dfx identity get-principal --identity nuance-identity-admin)'")'

#run to verify admins.
node ./scripts/adminAll.js getAdmins aaaa-aa ic

#You can also run this command to see an overview of all canisters
node ./scripts/GetAllCanisterIds.js -h ic    