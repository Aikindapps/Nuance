# #!/bin/bash


source .env
NETWORK=local
echo $PUBLICATIONS_REPO_PATH
echo $NUANCE_MAIN_REPO_PATH

echo ""
echo "Deploying nuance main repo to network $NETWORK..."
echo ""

dfx deploy --network $NETWORK
node scripts/upgrades/bucketCanisterUpgrade.js --multi --$NETWORK

echo ""
echo "Deploying nuance publications repo to $NETWORK network..."
echo ""

cd $PUBLICATIONS_REPO_PATH
dfx deploy --network $NETWORK
node scripts/upgrade-publication-canisters.js  --multi --$NETWORK