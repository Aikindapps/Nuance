#!/bin/bash

# Define an array of versions
canisters=(
    "2lqm4-daaaa-aaaaf-qakda-cai"
    "yrmea-5qaaa-aaaaf-qakma-cai"
    "yypp4-lyaaa-aaaaf-qaknq-cai"
    "l5u7w-paaaa-aaaaf-qajla-cai"
    "ykjyf-hiaaa-aaaaf-qakoq-cai"
    "oimop-saaaa-aaaaf-qajva-cai"
    "mhxx6-nyaaa-aaaaf-qajzq-cai"
    "ogodh-jqaaa-aaaaf-qajua-cai"
    "bomjg-3aaaa-aaaaf-qaita-cai"
    "iee6m-fiaaa-aaaaf-qajcq-cai"
    "5rteu-byaaa-aaaaf-qakrq-cai"
    "3i4f2-xyaaa-aaaaf-qakfq-cai"
    "nkztq-cqaaa-aaaaf-qaj6a-cai"
    "ydktz-raaaa-aaaaf-qakpa-cai"
    "zhh4l-iaaaa-aaaaf-qakja-cai"
    "57rj4-2iaaa-aaaaf-qakqq-cai"
    "pqf3m-4aaaa-aaaaf-qajra-cai"
    "obpft-eiaaa-aaaaf-qajuq-cai"
    "yelvn-4yaaa-aaaaf-qakpq-cai"
    "bhojl-kqaaa-aaaag-qb2fq-cai"
    "yni6r-kqaaa-aaaaf-qakoa-cai"
    "3g6is-miaaa-aaaaf-qakeq-cai"
    "z4cao-syaaa-aaaaf-qaklq-cai"
    "z3dg2-7aaaa-aaaaf-qakla-cai"
    "g6bdf-piaaa-aaaao-ahq2q-cai"
    "luxuk-ziaaa-aaaaf-qajkq-cai"
    "ocpug-eaaaa-aaaal-qbtoq-cai"
    "ofoss-jyaaa-aaaal-qbtoa-cai"
    "ltws6-uqaaa-aaaaf-qajka-cai"
    "zag27-fyaaa-aaaaf-qakjq-cai"
    "nd2ym-uyaaa-aaaaf-qaj7q-cai"
)

# Loop through the array and execute the command for each version
for canister in "${canisters[@]}"
do
    echo "Running for version: $canister"
    dfx canister call $canister --network ic getCanisterVersion -qq
done
