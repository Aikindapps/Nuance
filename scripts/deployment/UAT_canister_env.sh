#!/bin/bash

source .env
NETWORK=local
echo $PUBLICATIONS_REPO_PATH
echo $NUANCE_MAIN_REPO_PATH

# Convert canister_ids.json to canister_ids.json.prod
mv canister_ids.json canister_ids.json.prod
# Convert canister_ids.json.SNS_UAT to canister_ids.json
mv canister_ids.json.SNS_UAT canister_ids.json

cd $PUBLICATIONS_REPO_PATH
mv canister_ids.json canister_ids.json.prod
mv canister_ids.json.SNS_UAT canister_ids.json

cd $NUANCE_MAIN_REPO_PATH


# Parse JSON to get variables
USER_CANISTER_ID=$(jq -r '.User.ic' canister_ids.json)
POST_CORE_CANISTER_ID=$(jq -r '.PostCore.ic' canister_ids.json)
KINIC_ENDPOINT_CANISTER_ID=$(jq -r '.KinicEndpoint.ic' canister_ids.json)
FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID=$(jq -r '.FastBlocks_EmailOptIn.ic' canister_ids.json)
POST_INDEX_CANISTER_ID=$(jq -r '.PostIndex.ic' canister_ids.json)
STORAGE_CANISTER_ID=$(jq -r '.Storage.ic' canister_ids.json)
CYCLES_DISPENSER_CANISTER_ID=$(jq -r '.CyclesDispenser.ic' canister_ids.json)
NUANCE_ASSETS_CANISTER_ID=$(jq -r '.nuance_assets.ic' canister_ids.json)
METRICS_CANISTER_ID=$(jq -r '.Metrics.ic' canister_ids.json)
NFT_FACTORY_CANISTER_ID=$(jq -r '.NftFactory.ic' "${PUBLICATIONS_REPO_PATH}/canister_ids.json")
PUBLICATION_MANAGEMENT_CANISTER_ID=$(jq -r '.PublicationManagement.ic' "${PUBLICATIONS_REPO_PATH}/canister_ids.json")

# Update env.mo
cat > src/shared/canisterIds.mo << EOL
module {
  public let USER_CANISTER_ID = "$USER_CANISTER_ID";
  public let POST_CORE_CANISTER_ID = "$POST_CORE_CANISTER_ID";
  public let KINIC_ENDPOINT_CANISTER_ID = "$KINIC_ENDPOINT_CANISTER_ID";
  public let FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID = "$FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID";
  public let POST_INDEX_CANISTER_ID = "$POST_INDEX_CANISTER_ID";
  public let STORAGE_CANISTER_ID = "$STORAGE_CANISTER_ID";
  public let CYCLES_DISPENSER_CANISTER_ID = "$CYCLES_DISPENSER_CANISTER_ID";
  public let NUANCE_ASSETS_CANISTER_ID = "$NUANCE_ASSETS_CANISTER_ID";
  public let METRICS_CANISTER_ID = "$METRICS_CANISTER_ID";
  public let NFT_FACTORY_CANISTER_ID = "$NFT_FACTORY_CANISTER_ID";
  public let PUBLICATION_MANAGEMENT_CANISTER_ID = "$PUBLICATION_MANAGEMENT_CANISTER_ID";
};
EOL

cat > $PUBLICATIONS_REPO_PATH/src/shared/canisterIds.mo << EOL
module {
  public let USER_CANISTER_ID = "$USER_CANISTER_ID";
  public let POST_CORE_CANISTER_ID = "$POST_CORE_CANISTER_ID";
  public let KINIC_ENDPOINT_CANISTER_ID = "$KINIC_ENDPOINT_CANISTER_ID";
  public let FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID = "$FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID";
  public let POST_INDEX_CANISTER_ID = "$POST_INDEX_CANISTER_ID";
  public let STORAGE_CANISTER_ID = "$STORAGE_CANISTER_ID";
  public let CYCLES_DISPENSER_CANISTER_ID = "$CYCLES_DISPENSER_CANISTER_ID";
  public let NUANCE_ASSETS_CANISTER_ID = "$NUANCE_ASSETS_CANISTER_ID";
  public let METRICS_CANISTER_ID = "$METRICS_CANISTER_ID";
  public let NFT_FACTORY_CANISTER_ID = "$NFT_FACTORY_CANISTER_ID";
  public let PUBLICATION_MANAGEMENT_CANISTER_ID = "$PUBLICATION_MANAGEMENT_CANISTER_ID";
};
EOL