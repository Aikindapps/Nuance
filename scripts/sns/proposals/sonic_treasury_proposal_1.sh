export PEM_FILE="$HOME/.config/dfx/identity/default/identity.pem"
export DEVELOPER_NEURON_ID="a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131"

quill sns --canister-ids-file ./sns_canister_ids.json --pem-file $PEM_FILE make-proposal  --proposal "(record {
        title = \"Transfer 3000 ICP to ICP/NUA Pool on Sonic Dex\";
        url = \"https://oc.app/community/3qzyb-ryaaa-aaaar-ateiq-cai/channel/180903126530388291372782995208461639178/\";
        summary = \"This is the first of 2 proposals which add liquidity to the ICP/NUA pool on SONIC DEX (https://data.sonic.ooo/pools/rxdbk-dyaaa-aaaaq-aabtq-cai:ryjl3-tyaaa-aaaaa-aaaba-cai)

See our motion proposal for LP creation: https://dashboard.internetcomputer.org/sns/rzbmc-yiaaa-aaaaq-aabsq-cai/proposal/18

Simultaneously, @sonic_ooo & @nuancedapp will tweet to verify these proposals. If these proposals are approved, Sonic Dex will add the funds to the liquidity pool.

\";
        action = opt variant {
            TransferSnsTreasuryFunds = record {
                from_treasury = 1 : int32;
                to_principal = opt principal \"3xwpq-ziaaa-aaaah-qcn4a-cai\";
                to_subaccount = \"opt record { subaccount=vec { 150: nat8; 151: nat8; 18: nat8; 244: nat8; 132: nat8; 79: nat8; 252: nat8; 147: nat8; 96: nat8; 113: nat8; 110: nat8; 49: nat8; 159: nat8; 196: nat8; 40: nat8; 42: nat8; 130: nat8; 61: nat8; 151: nat8; 30: nat8; 34: nat8; 183: nat8; 53: nat8; 236: nat8; 197: nat8; 29: nat8; 84: nat8; 114: nat8; 195: nat8; 38: nat8; 250: nat8; 4: nat8; }}\";
                memo = null;
                amount_e8s = 300_000_000_000 : nat64;
            }
        };
    }
)" $DEVELOPER_NEURON_ID > sonic_treasury_proposal_1.json

quill send sonic_treasury_proposal_1.json