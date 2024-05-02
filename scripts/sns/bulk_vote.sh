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
quill_register_vote_base="quill sns register-vote --vote y --canister-ids-file ./sns_canister_ids.json --pem-file ~/.config/dfx/identity/$IDENTITY/identity.pem $NETWORK"
quill_send="quill send --yes $NETWORK --pem-file ~/.config/dfx/identity/$IDENTITY/identity.pem"

# Array of proposal IDs
proposal_ids=("87") # Remember to check the previous upgrade prior to voting on the next upgrade

# Array of vote IDs
#main dev neuron - "a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131"
#all neurons including main:
# "a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131" "f2088bbe57e45bf1b40e4ad8fd0c31c3fb8deac021fb10810ca1bbc2ecbfd343" "d9abade7010df83a341296933d74ddacdbe6025dd059b00d4590dc9ed2733ac7" "e20714723eff4d6fe334dd19487e09b3fb6dfd2a5daac60226abfa02ce464cb9" "9e8c11603242e05caf0b661c1225238e787ba82e0f5b4ea52c7fcd0dfaf008a2" "08267047453466f0472fa9369ce427a331fab29fc7df23b2c4ce58e1aa17b32f" "a34a92a8188ecb1b36a08d1ffcacccb95062098781fdbe5e133ff1adbb5dd2cd" "cfdd9e30722c6aabf86cb332951bf4fdd84cc82dbe14742dde3fd91c45cf67ff" "f66b14bb4b3cfe867252ab8a6a5708d65bbf1cc5e43f0ec9bc1a11caad074087" "23beceb670d7e1fc8a19692c2f1db11958b955a804efebb4a8fe18648bee5a1a" "30080c7a5e4309b46df890c6b521254a7ceef23d36bae13a8fcbec0ac7a74db0" "40662ae063ab6668f494e6655361c3344537a8ac1909f032edeca5feacd1bae5" "cb651e312d6b3b8623985fba45a1f609f15b2a2bb6fbad2048ce4225761db859" "a92503231f77f46375a0d484b66114fb35e95f4c45998ba4eb02af2653f5ebc0" "6bd885450efb7ec52315e3d826750263feb6c577d3b23d5c27735a683a8e01a9" "5e8ab108bea0ff2d24ebf9277c66266b4e2d74c84b1c950382e712d7927f56fa" "51ee3c96a0109f977e9e85fd4ae07fe7052d7dd299fcc5be970171fa129aa340" "d4306472877df084ba8dd8d0c046ea81ac9cf1e88cffdbe67b1f34a16e569f04" "e67b0ca85c5a61ac820a1416e31d4594a64da4b204bcc0351fe9fc33fb68fb7f" "e912fae1d039c0ef65d36a38e2e2db582b46478ee014f3f861f16b9c9b1291c3" "efb0dc5999ecad4752c582bc299c042f39d2f400e1c003e63885bbf4e25d6995" "341026de74cf85442b8e52ae7479e3db1498d6d6dc6d7a66b8c266bfb369843c" "7549a04ce163ded4505aabc05d966a0623f58e9ef2e98b4511c0bd01ff5e66e4" "c3a00542916cda95291d88597fe4a2934bfa36648710d72c41959de256416428" "be527c9208508b96833e6a8e883635038caa3a956dca3694574876d06abb5c9d"
vote_ids=("f2088bbe57e45bf1b40e4ad8fd0c31c3fb8deac021fb10810ca1bbc2ecbfd343" "d9abade7010df83a341296933d74ddacdbe6025dd059b00d4590dc9ed2733ac7" "e20714723eff4d6fe334dd19487e09b3fb6dfd2a5daac60226abfa02ce464cb9" "9e8c11603242e05caf0b661c1225238e787ba82e0f5b4ea52c7fcd0dfaf008a2" "08267047453466f0472fa9369ce427a331fab29fc7df23b2c4ce58e1aa17b32f" "a34a92a8188ecb1b36a08d1ffcacccb95062098781fdbe5e133ff1adbb5dd2cd" "cfdd9e30722c6aabf86cb332951bf4fdd84cc82dbe14742dde3fd91c45cf67ff" "f66b14bb4b3cfe867252ab8a6a5708d65bbf1cc5e43f0ec9bc1a11caad074087" "23beceb670d7e1fc8a19692c2f1db11958b955a804efebb4a8fe18648bee5a1a" "30080c7a5e4309b46df890c6b521254a7ceef23d36bae13a8fcbec0ac7a74db0" "40662ae063ab6668f494e6655361c3344537a8ac1909f032edeca5feacd1bae5" "cb651e312d6b3b8623985fba45a1f609f15b2a2bb6fbad2048ce4225761db859" "a92503231f77f46375a0d484b66114fb35e95f4c45998ba4eb02af2653f5ebc0" "6bd885450efb7ec52315e3d826750263feb6c577d3b23d5c27735a683a8e01a9" "5e8ab108bea0ff2d24ebf9277c66266b4e2d74c84b1c950382e712d7927f56fa" "51ee3c96a0109f977e9e85fd4ae07fe7052d7dd299fcc5be970171fa129aa340" "d4306472877df084ba8dd8d0c046ea81ac9cf1e88cffdbe67b1f34a16e569f04" "e67b0ca85c5a61ac820a1416e31d4594a64da4b204bcc0351fe9fc33fb68fb7f" "e912fae1d039c0ef65d36a38e2e2db582b46478ee014f3f861f16b9c9b1291c3" "efb0dc5999ecad4752c582bc299c042f39d2f400e1c003e63885bbf4e25d6995" "341026de74cf85442b8e52ae7479e3db1498d6d6dc6d7a66b8c266bfb369843c" "7549a04ce163ded4505aabc05d966a0623f58e9ef2e98b4511c0bd01ff5e66e4" "c3a00542916cda95291d88597fe4a2934bfa36648710d72c41959de256416428" "be527c9208508b96833e6a8e883635038caa3a956dca3694574876d06abb5c9d" ) # Add your vote IDs here
main_dev_neuron_vote_id=("a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131")

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
