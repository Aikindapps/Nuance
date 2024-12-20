# #!/bin/bash


source .env
NETWORK=ic
echo $PUBLICATIONS_REPO_PATH
echo $NUANCE_MAIN_REPO_PATH

echo ""
echo "Deploying nuance main repo to SNS_UAT network $NETWORK..."
echo ""

dfx deploy nuance_assets --network $NETWORK -y
# node scripts/upgrades/bucketCanisterUpgrade.js --multi --$NETWORK

# echo ""
# echo "Deploying nuance publications repo to SNS_UAT network $NETWORK..."
# echo ""

# cd $PUBLICATIONS_REPO_PATH
# dfx deploy --network $NETWORK -y

# echo ""
# echo "Upgrading publication buckets..."
# node scripts/upgrade-publication-canisters.js  --multi --$NETWORK

# echo ""
# echo "Upgrading NFT buckets..."
# node scripts/upgrade-nft-canisters.js --multi --$NETWORK
