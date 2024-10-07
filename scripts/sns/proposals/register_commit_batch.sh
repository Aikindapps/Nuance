export PEM_FILE="../../.config/dfx/identity/default/identity.pem"
export DEVELOPER_NEURON_ID="a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131"


quill sns --canister-ids-file ./sns_canister_ids.json --pem-file $PEM_FILE make-proposal $DEVELOPER_NEURON_ID --proposal '(
    record {
        title = "Register new SNS function";         
        url = "https://oc.app/community/3qzyb-ryaaa-aaaar-ateiq-cai/channel/50412237915682920172274455331307212818";   
        summary = "This proposal registers a command so the SNS can commit frontend canister assets via proposal. ";
        action = opt variant {
            AddGenericNervousSystemFunction = record {
                id = 1010 : nat64;
                name = "nuance_assets_commit_proposed_batch";
                description = opt "Commit frontend canister assets via proposal";
                function_type = opt variant { 
                    GenericNervousSystemFunction = record { 
                        validator_canister_id = opt principal "exwqn-uaaaa-aaaaf-qaeaa-cai"; 
                        target_canister_id = opt principal "exwqn-uaaaa-aaaaf-qaeaa-cai"; 
                        validator_method_name = opt "validate_commit_proposed_batch"; 
                        target_method_name = opt "commit_proposed_batch";
                    } 
                };
            }
        };
    }
)' > message.json

quill send message.json