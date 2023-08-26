#Please configure the constants with your environment's values first and then run bash ./scripts/removeDependencies.sh

#constants
network="local"
postIndexCanisterId="by6od-j4aaa-aaaaa-qaadq-cai"
postCoreCanisterId="b77ix-eeaaa-aaaaa-qaada-cai"
userCanisterId="asrmz-lmaaa-aaaaa-qaaeq-cai"
cyclesDispenserCanisterId="bkyz2-fmaaa-aaaaa-qaaaq-cai"


#commands
echo "Initializing the KinicEndpoint canister"
dfx canister --network $network call KinicEndpoint initializeCanister '("'$postCoreCanisterId'")'

echo "Initializing the Post canister"
dfx canister --network $network call Post initializeCanister '("'$postIndexCanisterId'", "'$userCanisterId'")'

echo "Initializing the PostCore canister"
dfx canister --network $network call PostCore initializeCanister '("'$postIndexCanisterId'", "'$userCanisterId'", "'$cyclesDispenserCanisterId'")'