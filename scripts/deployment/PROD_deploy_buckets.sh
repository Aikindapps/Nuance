# #!/bin/bash


source .env
NETWORK=ic
echo $PUBLICATIONS_REPO_PATH
echo $NUANCE_MAIN_REPO_PATH

echo ""
echo "Deploy Post Buckets Network $NETWORK..."
echo ""

node scripts/upgrades/bucketCanisterUpgrade.js --multi --$NETWORK

echo ""
echo "Deploying Publication Buckets to PROD Network $NETWORK..."
echo ""

cd $PUBLICATIONS_REPO_PATH
node scripts/upgrade-publication-canisters.js  --multi --$NETWORK