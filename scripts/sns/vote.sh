#!/bin/bash
# Set the default network to insecure local dev mode
NETWORK="--insecure-local-dev-mode"

# If you wish to use the IC network, uncomment the following line:
# NETWORK="--network ic"

if [[ $NETWORK == "--insecure-local-dev-mode" ]]; then
    export IC_URL="http://localhost:8080/"
else
    unset IC_URL
fi

# Trim the output of `dfx identity whoami` using xargs
IDENTITY=$(dfx identity whoami | xargs)

quill_register_vote="quill sns register-vote --proposal-id 1 --vote y --canister-ids-file ./sns_canister_ids.json --pem-file ~/.config/dfx/identity/$IDENTITY/identity.pem $NETWORK"
quill_send="quill send --yes $NETWORK --pem-file ~/.config/dfx/identity/$IDENTITY/identity.pem"

# Comma-separated list of vote IDs if you want to vote with all neurons:
# vote_ids="980efa662f01d15cbb45c6cf750f7bd233fc792a0191a447897c0f38cd70ed41,996419d5efdeb7cad9e33cec35068fee16c708757a95763007b670007fa34ae2,c018aac0fb03efd03d818f316213ed6a4f3832ee685c24e17d96dec55222e0a6,2acab68a760aa12a72b4fac152d8c565631f7d83a425c20ab561fc981bb1961a"

# In case you want to do a single vote from the script, you can just add the main dev neuron here
vote_ids="ad65d0f563d55797a79dfcef8a5a4ab5d1512f870862f0d7af4c4183a8f231b3"

# Convert the comma-separated string into an array
IFS=',' read -r -a vote_ids_array <<< "$vote_ids"

# Loop through the array and execute the command for each vote ID
for vote_id in "${vote_ids_array[@]}"; do
    # Trim the vote_id using xargs
    vote_id_trimmed=$(echo $vote_id | xargs)
    
    echo "Executing command: $quill_register_vote $vote_id_trimmed"
    eval "$quill_register_vote" "$vote_id_trimmed" | eval "$quill_send"
done
