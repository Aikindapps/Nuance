#!/bin/bash
# Set the default network to insecure local dev mode for testing
#NETWORK="--insecure-local-dev-mode"

# If you wish to use the IC network, uncomment the following line:
 NETWORK=""

if [[ $NETWORK == "--insecure-local-dev-mode" ]]; then
    export IC_URL="http://localhost:8080/"
else
    unset IC_URL
fi

# Trim the output of `dfx identity whoami` using xargs
IDENTITY=$(dfx identity whoami | xargs)

# Base quill commands
quill_register_vote_base="quill sns register-vote --vote n --canister-ids-file ./sns_canister_ids.json --pem-file ~/.config/dfx/identity/$IDENTITY/identity.pem $NETWORK"
quill_send="quill send --yes $NETWORK --pem-file ~/.config/dfx/identity/$IDENTITY/identity.pem"

# Array of proposal IDs
proposal_ids=("22") # Remember to check the previous upgrade prior to voting on the next upgrade

# Array of vote IDs

##comment back for full vote:
#vote_ids=("a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131")

#use for testing smaller portion of vote
vote_ids=("d9abade7010df83a341296933d74ddacdbe6025dd059b00d4590dc9ed2733ac7") 



# Loop through each proposal ID and vote ID
for proposal_id in "${proposal_ids[@]}"; do
    for vote_id in "${vote_ids[@]}"; do
        # Trim IDs using xargs
        proposal_id_trimmed=$(echo $proposal_id | xargs)
        vote_id_trimmed=$(echo $vote_id | xargs)

        # Construct the register vote command
        quill_register_vote="$quill_register_vote_base --proposal-id $proposal_id_trimmed"

        echo "Executing command: $quill_register_vote for vote ID: $vote_id_trimmed"
        eval "$quill_register_vote" "$vote_id_trimmed" | eval "$quill_send"
    done
done
