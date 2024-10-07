# #!/bin/bash


source .env
NETWORK=ic
echo $PUBLICATIONS_REPO_PATH
echo $NUANCE_MAIN_REPO_PATH

echo ""
echo "Deploying non-sns canisters to PROD network $NETWORK..."
echo ""

dfx deploy Notifications --network $NETWORK  # deploy here until officially added to SNS
dfx deploy Subscription --network $NETWORK  # deploy here until officially added to SNS
dfx deploy PostRelations --network $NETWORK  # deploy here until officially added to SNS

echo ""
echo "Deploying Buckets to PROD network $NETWORK..."
echo ""

echo ""
echo "Upgrading Post Buckets..."
node scripts/upgrades/bucketCanisterUpgrade.js --multi --$NETWORK

cd $PUBLICATIONS_REPO_PATH
echo ""
echo "Upgrading publication buckets..."
node scripts/upgrade-publication-canisters.js  --multi --$NETWORK


echo ""
echo "Upgrading NFT buckets..."
node scripts/upgrade-nft-canisters.js --multi --$NETWORK