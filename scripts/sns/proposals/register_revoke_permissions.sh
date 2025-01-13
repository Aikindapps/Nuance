export PEM_FILE="../../.config/dfx/identity/default/identity.pem"
export DEVELOPER_NEURON_ID="a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131"


quill sns --canister-ids-file ./sns_canister_ids.json --pem-file $PEM_FILE make-proposal $DEVELOPER_NEURON_ID --proposal '(
    record {
        title = "Register new SNS function";         
        url = "https://oc.app/community/3qzyb-ryaaa-aaaar-ateiq-cai/channel/50412237915682920172274455331307212818";   
        summary = "This proposal registers a command so the SNS can revoke the team's control over the frontend canister commit function. ";
        action = opt variant {
            AddGenericNervousSystemFunction = record {
                id = 1011 : nat64;
                name = "nuance_assets_revoke_permission";
                description = opt "revoke_permission can revoke Prepare, ManagePermissions, and Commit";
                function_type = opt variant { 
                    GenericNervousSystemFunction = record { 
                        validator_canister_id = opt principal "t6unq-pqaaa-aaaai-q3nqa-cai"; 
                        target_canister_id = opt principal "t6unq-pqaaa-aaaai-q3nqa-cai"; 
                        validator_method_name = opt "validate_revoke_permission"; 
                        target_method_name = opt "revoke_permission";
                    } 
                };
            }
        };
    }
)' > revoke_permissions_proposal.json

quill send revoke_permissions_proposal.json