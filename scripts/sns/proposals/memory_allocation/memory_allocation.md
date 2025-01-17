# Memory Allocation Proposal

Background on memory allocation for future reference:

1. setting to 0 allows "best effort" memory allocation, meaning if the subnet has available memory the canister will work
2. setting a configurable limit allows the canister to use up to that amount of memory, but no more. The memory is allocated by the subnet, and we will be charged this amount of cycles regardless of whether the canister uses it or not. This is goood reason to set the amount conservatively, update more frequently, and not to set it to a high value.

# CLI Command

```bash
quill sns make-proposal 'a0e3889b406b7686640619648d848d5a0d800f2b5a7a2a44ff7cda7b2d264131' \
--proposal '( record { title="Update Memory Allocation"; url="https://oc.app/community/3qzyb-ryaaa-aaaar-ateiq-cai/channel/180903126530388291372782995208461639178"; summary="After a recent update to the SNS canisters, an arbitrary 1gb limit was promoted to all canisters. This limit could interfere with the operation of some canisters. This proposal is to increase the memory allocation to 2gb on canisters at risk of exceeding the 1gb limit."; action=opt variant { ManageDappCanisterSettings=record {
freezing_threshold=null;
canister_ids=vec {principal "4vm7k-tyaaa-aaaah-aq4wq-cai"; principal "wlam3-raaaa-aaaap-qpmaa-cai"};
reserved_cycles_limit=null;
log_visibility=null;
wasm_memory_limit= null;
memory_allocation= (opt 2_147_483_648);
compute_allocation=null
} } } )' \
--canister-ids-file ./sns_canister_ids.json \
--pem-file $PEM_FILE \
> MemoryUpdate.json

quill send MemoryUpdate.json
```

Commands used while using sns-testing repo:

sudo dfx canister --network local deposit-cycles 200000000000000 qaa6y-5yaaa-aaaaa-aaafa-cai
sudo dfx ledger fabricate-cycles --canister bkyz2-fmaaa-aaaaa-qaaaq-cai
sudo dfx sns propose --test-neuron-proposer sns-testing/sns_init.yaml
sudo bash sns-testing/set-icp-xdr-rate.sh  
sudo bash sns-testing/deploy_dapp.sh  
sudo bash sns-testing/setup.sh  
sudo bash sns-testing/setup_locally.sh
