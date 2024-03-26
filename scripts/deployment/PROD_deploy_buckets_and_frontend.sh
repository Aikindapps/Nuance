# #!/bin/bash


source .env
NETWORK=ic
echo $PUBLICATIONS_REPO_PATH
echo $NUANCE_MAIN_REPO_PATH

echo ""
echo "Deploying frontend to PROD network $NETWORK..."
echo ""

dfx generate
dfx build --all --network $NETWORK
dfx deploy nuance_assets --network $NETWORK
node scripts/upgrades/bucketCanisterUpgrade.js --multi --$NETWORK

echo ""
echo "Deploying nuance publication buckets to PROD network $NETWORK..."
echo ""

cd $PUBLICATIONS_REPO_PATH
dfx generate
dfx build --all --network $NETWORK

echo "Publication Buckets excluded for this deployment"
# node scripts/upgrade-publication-canisters.js  --multi --$NETWORK