# #!/bin/bash


source .env
NETWORK=ic
echo $PUBLICATIONS_REPO_PATH
echo $NUANCE_MAIN_REPO_PATH

echo ""
echo "Deploying nuance main repo to UAT network $NETWORK..."
echo ""

dfx generate
dfx deploy --network $NETWORK -y
node scripts/upgrades/bucketCanisterUpgrade.js --multi --$NETWORK

echo ""
echo "Deploying nuance publications repo to UAT network $NETWORK..."
echo ""

cd $PUBLICATIONS_REPO_PATH
dfx generate
dfx deploy --network $NETWORK -y

echo "Publication Buckets excluded for this deployment"
# node scripts/upgrade-publication-canisters.js  --multi --$NETWORK