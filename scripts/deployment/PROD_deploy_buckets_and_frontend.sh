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
dfx deploy nuance_assets --network $NETWORK -y
dfx deploy Notifications --network $NETWORK -y # deploy here until officially added to SNS
dfx deploy Subscription --network $NETWORK -y # deploy here until officially added to SNS
dfx deploy PostRelations --network $NETWORK -y # deploy here until officially added to SNS
node scripts/upgrades/bucketCanisterUpgrade.js --multi --$NETWORK

echo ""
echo "Deploying nuance publication buckets to PROD network $NETWORK..."
echo ""

cd $PUBLICATIONS_REPO_PATH
dfx generate
dfx build --all --network $NETWORK

echo ""
echo "Upgrading publication buckets..."
node scripts/upgrade-publication-canisters.js  --multi --$NETWORK

echo ""
echo "Upgrading NFT buckets..."
node scripts/upgrade-nft-canisters.js --multi --$NETWORK