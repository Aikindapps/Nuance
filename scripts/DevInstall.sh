# Setup the application

# STEP 1
# ======
# Clone the Nuance-NFTs-Publications repo somewhere in your machine
# Set the publicationsRepoPath variable in the line 20 as the absolute path of the publications repo
# Set the nuanceMainRepoPath variable in the line 21 as the absolute path of the nuance main repo

# STEP 2
# ======
# Ensure that you have created a .env.local file.

# STEP 3
# ======
# Run script from nuance root folder.
#
#   macOS / Linux:
#     bash ./scripts/DevInstall.sh


source .env
NETWORK=local
echo $PUBLICATIONS_REPO_PATH
echo $NUANCE_MAIN_REPO_PATH

if [ "$NETWORK" != "local" ]; then
    echo $NETWORK "is not local"
    read -p "Network is not 'local' (.env). Do you wish to continue to deploy mainnet? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]
    then
        exit 1
    fi
fi

echo ""
echo "##### Create new identity for Nuance deployment first #####"
echo ""
dfx identity new nuance-identity-admin
dfx identity new nuance-identity-0 2>/dev/null
if [ $? -eq 0 ]; then
  dfx identity use nuance-identity-0
else
  dfx identity use nuance-identity-0
fi
echo ""


# exit when any command fails
set -e

echo ""
echo "##### Delete node_modules Folder #####"
echo ""
sudo rm -rf node_modules

echo ""
echo "##### Delete .dfx Folder #####"
echo ""
sudo rm -rf .dfx

echo ""
echo "##### Reinstall node_modules #####"
echo ""
npm ci

echo ""
echo "##### Download Didc Tool (Candid Generator) #####"
echo ""
bash ./scripts/InstallDidc.sh
# comment out nns install if you do not want to run dfx start --clean
#dfx nns install

echo ""
echo "##### Build Nuance #####"
echo ""
bash ./scripts/BuildNuance.sh -e 'l' -m 'i' -p ''

echo ""
echo "##### Create Tags #####"
echo ""
INPUT=./scripts/tag.csv
OLDIFS=$IFS
IFS=','
[ ! -f $INPUT ] && { echo "$INPUT file not found"; exit 99; }
while read tag
do
    echo $tag
    dfx canister --network $NETWORK call PostCore createTag "$tag";
    echo "Value : $tag"
done < $INPUT
IFS=$OLDIFS

echo ""
echo "##### Register User #####"
echo ""
dfx canister --network $NETWORK call User registerUser '("nuance-identity-0", "identity 0", "")' --type idl

echo ""
echo "Creating the first PostBucket canister."
echo ""
dfx canister --network $NETWORK call PostCore initializePostCoreCanister
echo ""


bash ./scripts/CreatePosts.sh $NETWORK

dfx identity use nuance-identity-0


echo ""
echo "##### Build Publications #####"
echo ""
bash ./scripts/BuildPublications.sh $PUBLICATIONS_REPO_PATH $NUANCE_MAIN_REPO_PATH

echo ""
echo "##### Airdrop tokens #####"
echo ""
dfx canister --network $NETWORK call User adminAirDrop '(50.0:float64)'

echo ""
echo "##### Cycles Dispenser setup #####"
echo ""
dfx canister call Storage uploadBlob '(record { contentId = ""; chunkData = vec {}; offset = 0; totalChunks = 0; mimeType = ""; contentSize = 0; })'
node ./scripts/GetAllCanisterIds.js -CyclesDispenser
node ./scripts/adminAll.js registerAdmin $(dfx identity get-principal)
node ./scripts/adminAll.js registerAdmin $(dfx canister id CyclesDispenser)
node ./scripts/cyclesDispenserAdd.js -devInstall
dfx canister call CyclesDispenser batchRegisterAdmin '(principal "'$(dfx identity get-principal --identity nuance-identity-admin)'")'


echo "End of the DevInstall script"

