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
#     bash ./scripts/DevInstall1.sh


source .env
NETWORK=ic
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


echo "End of the DevInstall script"

