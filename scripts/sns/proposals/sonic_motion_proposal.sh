export PEM_FILE="$HOME/.config/dfx/identity/default/identity.pem"
export DEVELOPER_NEURON_ID="a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131"

quill sns --canister-ids-file ./sns_canister_ids.json --pem-file $PEM_FILE make-proposal --insecure-local-dev-mode  --proposal "(record {
        title = \"Motion Proposal to add liquidity to the ICP/NUA pool on Sonic Dex \";
        url = \"https://oc.app/community/3qzyb-ryaaa-aaaar-ateiq-cai/channel/180903126530388291372782995208461639178/\";
        summary = \"After discussions with the SONIC team, We propose to add liquidity to the ICP/NUA pool on Sonic Dex (https://data.sonic.ooo/pools/rxdbk-dyaaa-aaaaq-aabtq-cai:ryjl3-tyaaa-aaaaa-aaaba-cai)

Following this motion proposal, we will submit 2 additional proposals to apply for the transfer of 3000 ICP and 250K NUA tokens, respectively from the Nuance DAO treasury to the ICP/NUA Swap canister. (https://app.sonic.ooo/)

The destination account for both transfers will be the same but on 2 different ledgers and is as follows:

Principal: 3xwpq-ziaaa-aaaah-qcn4a-cai

Subaccount: [150, 151, 18, 244, 132, 79, 252, 147, 96, 113, 110, 49, 159, 196, 40, 42, 130, 61, 151, 30, 34, 183, 53, 236, 197, 29, 84, 114, 195, 38, 250, 4] (this is the Subaccount generated from the SONIC swap canister)

Simultaneously, @sonic_ooo & @nuancedapp will tweet to verify these proposals.

If these proposals are approved, Sonic Dex will add the funds to the liquidity pool.

\";
        action = opt variant {
            Motion = record {
                motion_text = \"A motion Proposal to add liquidity to the ICP/NUA pool on Sonic Dex \";
            }
        };
    }
)" $DEVELOPER_NEURON_ID > motion_sonic.json
quill send --insecure-local-dev-mode motion_sonic.json 