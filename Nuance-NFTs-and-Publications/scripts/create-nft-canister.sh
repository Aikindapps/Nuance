#!/bin/bash

#handle of the publication
PUBLICATION_HANDLE="handle2"
#Marketplace royalty percentage. 2% default here
ROYALTY=2000
#Marketplace royalties will be sent to this address
ROYALTY_ADDRESS="1332631c6644670279f3882e39534e27868c7f858d136d2ca729448aa6bec8ac"
#make it true when working on UAT or PROD
MAINNET=false

if [ "$MAINNET" = true ]; then
    DFX_COMMAND="dfx canister --network ic call"
else
    DFX_COMMAND="dfx canister call"
fi


OUTPUT=$($DFX_COMMAND PublicationManagement getPublishers)

# parse the result
CANISTER_ID=$(echo "$OUTPUT" | perl -lne 'print $1 if /record \{ "'$PUBLICATION_HANDLE'"; "(.*?)"/')

# create the nft canister
RESULT=$($DFX_COMMAND "$CANISTER_ID" createNftCanister '('"$ROYALTY"': nat,"'"$ROYALTY_ADDRESS"'")')

# print the result
echo "$RESULT"