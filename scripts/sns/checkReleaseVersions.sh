#!/bin/bash


# Function to add color
color_echo() {
    local color_code=$1
    local text=$2
    echo -e "\033[${color_code}m${text}\033[0m"
}

# Accepted versions array
ACCEPTED_VERSIONS=(\(\"Tipple Tequila\"\) \(\"Tipple Tequila v7\"\))

# Initialize a counter for matched versions
MATCHED_COUNT=0


# Define an array of versions
canisters=(
    "y6ydp-7aaaa-aaaaj-azwyq-cai"
    "24qg5-ciaaa-aaaak-qtr7a-cai"
    "sphnc-7yaaa-aaaao-a3wga-cai"
    "a5asx-niaaa-aaaac-aacxq-cai"
    "4vm7k-tyaaa-aaaah-aq4wq-cai"
    "r5sjg-7iaaa-aaaaf-qaama-cai"
    "44puw-fqaaa-aaaah-aq4xa-cai"
    "wlam3-raaaa-aaaap-qpmaa-cai"
    "uebr2-liaaa-aaaai-q3sha-cai"
    "zvibj-naaaa-aaaae-qaira-cai"
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


for canister in "${canisters[@]}"
do
    color_echo "0;29" "Running for canister: $canister"
    CANISTER_VERSION=$(dfx canister call $canister --network ic getCanisterVersion -qq)

    if [[ " ${ACCEPTED_VERSIONS[*]} " == *" $CANISTER_VERSION "* ]]; then
        color_echo "0;32" "Version match: $CANISTER_VERSION\n"
        MATCHED_COUNT=$((MATCHED_COUNT + 1))
    else
        color_echo "0;31" "Version mismatch. Got: $CANISTER_VERSION\n "
    fi
done

color_echo "0;32" "Total canisters with accepted versions: $MATCHED_COUNT"
