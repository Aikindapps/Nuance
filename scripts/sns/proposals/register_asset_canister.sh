export PEM_FILE="../../.config/dfx/identity/default/identity.pem"
export DEVELOPER_NEURON_ID="a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131"

quill sns --canister-ids-file ./sns_canister_ids.json --pem-file $PEM_FILE make-proposal $DEVELOPER_NEURON_ID --proposal "(

    record {
        title = \"Re-register Nuance Frontend\";
        url = \"https://oc.app/community/3qzyb-ryaaa-aaaar-ateiq-cai/channel/50412237915682920172274455331307212818\";
        summary = \"This proposal re-registers Nuance assets canister to the SNS, along with permissions to allow for upgrades via proposal. See proposal #3 for full details of the un-upgradeable assets canister. \";
        action = opt variant {
            RegisterDappCanisters = record {
                canister_ids = vec {principal \"exwqn-uaaaa-aaaaf-qaeaa-cai\"};
            }
        }
    }
)" > RegisterFrontend.json

quill send RegisterFrontend.json