export PEM_FILE="~/.config/dfx/identity/default/identity.pem"
export DEVELOPER_NEURON_ID="a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131"

quill sns --canister-ids-file ./sns_canister_ids.json --pem-file $PEM_FILE make-proposal $DEVELOPER_NEURON_ID --proposal "(

    record {
        title = \"De-register Nuance Frontend Canister \";
        url = \"https://oc.app/community/3qzyb-ryaaa-aaaar-ateiq-cai/channel/180903126530388291372782995208461639178\";
        summary = \"This proposal revokes the control of the asset canisters from their current registration, transferring it to the principal of the development team. This transfer will enable the development team to set appropriate permissions on the asset canisters, ensuring they can be upgraded through SNS proposals. A follow-up proposal is planned to reassign control of these canisters back to the SNS.

To understand more about upgrade permissions for asset canisters, you can refer to this documentation: https://internetcomputer.org/docs/current/developer-docs/integrations/sns/managing/sns-asset-canister/ and this developer forum post: https://forum.dfinity.org/t/issue-asset-canister-cant-be-upgraded-via-sns-proposal/23421  \";
        action = opt variant {
            DeregisterDappCanisters = record {
                canister_ids = vec {principal \"exwqn-uaaaa-aaaaf-qaeaa-cai\";};
                new_controllers = vec {principal \"keqno-ecosc-a47cf-rk2ui-5ehla-noflk-jj4it-h6nku-smno2-fucgs-cae\"; principal \"f5o3w-2iaaa-aaaam-qa3fq-cai\"; principal \"3v3rk-jx25f-dl43p-osgkw-6dm7b-wguwy-kjcun-lyo3w-lsuev-kcdnp-7qe\";};
            }
        }
    }
)" > message.json

quill send message.json