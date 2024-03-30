#!/bin/bash
publicationsRepoPath=$1
nuanceMainRepoPath=$2
network="local"

publicationCanisterIdsPath=$publicationsRepoPath/.dfx/local/canister_ids.json
nuanceCanisterIdsPath=../.dfx/local/canister_ids.json
productionCanisterIdsPath=./canister_ids.json

principalId=$(dfx identity get-principal)


cd $publicationsRepoPath

echo ""
echo "##### Delete .dfx Folder #####"
echo ""
sudo rm -rf .dfx

echo "Deploying the PublicationManagement and NftFactory canisters that mirror the production canisters"

dfx deploy

dfx ledger fabricate-cycles --all


echo "Getting User canister Id to use in the initialize function of PublicationManagement"
userCanisterId="$(grep -A2 '"User"' $nuanceCanisterIdsPath | grep $network | grep -o '[A-Za-z0-9\-]\{27\}')"
echo "User Canister id: $userCanisterId"
echo ""


echo "Getting PostCore canister Id to use in the initialize function of PublicationManagement"
postCoreCanisterId="$(grep -A2 '"PostCore"' $nuanceCanisterIdsPath | grep $network | grep -o '[A-Za-z0-9\-]\{27\}')"
echo "PostCore Canister id: $postCoreCanisterId"
echo ""

echo "Getting CyclesDispenser canister Id to use in the initialize function of PublicationManagement"
cyclesDispenserCanisterId="$(grep -A2 '"CyclesDispenser"' $nuanceCanisterIdsPath | grep $network | grep -o '[A-Za-z0-9\-]\{27\}')"
echo "CyclesDispenser Canister id: $cyclesDispenserCanisterId"
echo ""


echo "Getting PublicationManagement canister Id to register as admin in User and PostCore canisters"
publicationManagementCanisterId="$(grep -A2 '"PublicationManagement"' $publicationCanisterIdsPath | grep $network | grep -o '[A-Za-z0-9\-]\{27\}')"
echo "PublicationManagement Canister id: $publicationManagementCanisterId"
echo ""

echo "Getting NftFactory canister Id to register as admin in User and PostCore canisters"
nftFactoryCanisterId="$(grep -A2 '"NftFactory"' $publicationCanisterIdsPath | grep $network | grep -o '[A-Za-z0-9\-]\{27\}')"
echo "NftFactory Canister id: $nftFactoryCanisterId"
echo ""

echo ""
echo "Initializing the PublicationManagement canister"
echo ""
dfx canister --network $network call PublicationManagement initManagementCanister


echo ""
echo "Creating the first Publication canister"
echo ""
firstPublicationReturn=$(dfx canister --network $network call PublicationManagement createPublication '("Awesome-publication", "Awesome publication", "nuance-identity-0")')
firstPublicationCanisterId=$(echo "$firstPublicationReturn" | sed -n 's/.*record { "Awesome-publication"; "\(.*\)" }.*/\1/p')
echo "Publication canister id: $firstPublicationCanisterId"


echo ""
echo "Updating the details of the first publication"
echo ""
dfx canister --network $network call $firstPublicationCanisterId updatePublicationDetails '("Description of the awesome publication!", "Awesome publication", "https://7vltd-byaaa-aaaaf-qagqq-cai.raw.ic0.app/storage?contentId=o4exa-u7zvc-6olu6-herh6-6v5i4-e5rp4-lvh7g-q64lt-3ivnf-drqdf-6qe-image-5187", vec {}, vec {}, vec {}, "https://7vltd-byaaa-aaaaf-qagqq-cai.raw.ic0.app/storage?contentId=o4exa-u7zvc-6olu6-herh6-6v5i4-e5rp4-lvh7g-q64lt-3ivnf-drqdf-6qe-image-5147", "Subtitle of this thing.", record {website=""; socialChannels=vec{};}, "1688564984626")'


echo ""
echo "Creating 10 publication posts"
echo ""
counter=0
  while [ $counter -lt 10 ]
  do
    principal=$(dfx identity get-principal)
    title=DevInstall-publication-article-$counter
    subtitle=Subtitle-$counter
    content=DevInstall-$counter-content-publication
    dfx canister call --network $network $postCoreCanisterId save '(record {
        postId=""; 
        title="'$title'"; 
        subtitle="'$subtitle'"; 
        headerImage=""; 
        content="'$content'"; 
        isDraft=false; 
        tagIds= vec{"1"; "5";}; 
        creator="'$principal'"; 
        isPublication=true; 
        category=""; 
        premium= null;
        handle="Awesome-publication"
    })'

    counter=$((counter + 1))
  done


echo ""
echo "Create a premium article"
echo ""
userPrincipal=$(dfx identity get-principal)
savePostReturn=$(dfx canister --network $network call $postCoreCanisterId save '(record {
    postId=""; 
    title="'$title'"; 
    subtitle="'$subtitle'"; 
    headerImage=""; 
    content="'$content'"; 
    isDraft=false; 
    tagIds= vec{"1"; "5";}; 
    creator="'$principal'"; 
    isPublication=true; 
    category=""; 
    premium= opt record {thumbnail= ""; maxSupply = 20: nat; icpPrice= 100000000: nat;};
    handle="Awesome-publication"
})')
echo $savePostReturn

echo ""
echo "Index the popular posts"
echo ""
dfx canister --network $network call $postCoreCanisterId indexPopular

