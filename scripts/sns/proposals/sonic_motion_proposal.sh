export PEM_FILE="$HOME/.config/dfx/identity/default/identity.pem"
export DEVELOPER_NEURON_ID="a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131"

quill sns --canister-ids-file ./sns_canister_ids.json --pem-file $PEM_FILE make-proposal  --proposal "(record {
        title = \"Motion Proposal for auto migration of NUANCE LPs from Sonic V1 to V3 \";
        url = \"https://oc.app/community/3qzyb-ryaaa-aaaar-ateiq-cai/channel/180903126530388291372782995208461639178/\";
        summary = \"As part of the recent launch of Sonic V3, we are introducing significant improvements to enhance the functionality and efficiency of liquidity pools on Sonic. For the same we have taken measures to migrate all existing  Liquidity Pools to V3.

To streamline the transition process for all DAOs and ensure a seamless migration of liquidity, we have developed a new automated migration tool. This tool is designed to auto-migrate all existing DAO LPs to V3, ensuring minimal disruption and maximum efficiency. During migration we will be transferring control of the Liquidity pool to Sonic infrastructure's keeper wallet (vfke4-5457j-s3xak-62zin-t6tx7-vqw5r-rxxk6-a3xp3-th6dr-ne6ti-4ae) temporarily to handle the migration smoothly After the migration, the control will be transferred back to respective DAO governance canister
We are requesting approval from the  NUANCE DAO to grant permission for the Sonic team to  automate the liquidity migration of DAO token. Once approved, the Sonic team will handle the entire migration process, ensuring that NUANCE token liquidity is transferred seamlessly to V3.
Together, let’s build a better future for DeFi on Internet Computer!
Proposal submitted for  Sonic Team.

\";
        action = opt variant {
            Motion = record {
                motion_text = \"Motion Proposal for auto migration of NUANCE LPs from Sonic V1 to V3 \";
            }
        };
    }
)" $DEVELOPER_NEURON_ID > motion_sonic.json
quill send motion_sonic.json 