#!/bin/bash

# remove --insecure-local-dev from all commands for mainnet, also be sure to remove ic_url

# uncomment to run on mainnet
# NETWORK="--network ic"

# uncomment to run on local
NETWORK="--insecure-local-dev"

# the neuron that all neurons follow
mainDevNeuron="ad65d0f563d55797a79dfcef8a5a4ab5d1512f870862f0d7af4c4183a8f231b3"

# all neurons except the main dev neuron
vote_ids="2966426e28e2a03df25061888f629745369dbe5e4fe2e517d9880410db4b3bb2, 14ae24cad729160ac7fd75606f5101c720c57692af9727b6c338cdba6456329e, c0db4129b7db5ab626e6fb164d66b3e4df87b115de32de48f6948e95dbf3e2db"
IFS=',' read -r -a vote_ids_array <<< "$vote_ids"

# If the network is not 'ic' then set the IC_URL
if [[ $NETWORK != "--network ic" ]]; then
    export IC_URL="http://localhost:8080/"
fi

# the type you want to follow
type="all" # [possible values: all, motion, manage-nervous-system-parameters, upgrade-sns-controlled-canister, add-generic-nervous-system-function, remove-generic-nervous-system-function, upgrade-sns-to-next-version, manage-sns-metadata, transfer-sns-treasury-funds, register-dapp-canisters, deregister-dapp-canisters]

# run quill follow-neuron for each vote id
for vote_id in "${vote_ids_array[@]}"; do
  vote_id_trimmed=$(echo $vote_id | xargs) # removes leading/trailing white spaces
  
  # prepare neuron follow request
  quill sns follow-neuron "$vote_id_trimmed" --type "$type"  --followees "$mainDevNeuron" --canister-ids-file ./sns_canister_ids.json --pem-file ~/.config/dfx/identity/$(dfx identity whoami)/identity.pem $NETWORK > neuron_request.json
  echo "quill sns follow-neuron $vote_id_trimmed --type $type --followees $mainDevNeuron --canister-ids-file ./sns_canister_ids.json --pem-file ~/.config/dfx/identity/$(dfx identity whoami)/identity.pem $NETWORK > neuron_request.json"
  # send prepared request
  quill send neuron_request.json --yes $NETWORK --pem-file ~/.config/dfx/identity/$(dfx identity whoami)/identity.pem
done
