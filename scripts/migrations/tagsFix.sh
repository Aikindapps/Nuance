#!/bin/bash

bucketCanister="bkyz2-fmaaa-aaaaa-qaaaq-cai"
timeStamp=1690167498259 # PROD timestamp for last article with defective tags

# script will run index from 1 to 3668 in PROD

# Initial postId to start from
postId=1
endPostId=3668

# Function to call the Motoko function
# For each postID checks the bucket canister is correct, and the timestamp to ensure the article hasn't been updated since the last migration
callTagMigrationBugFix() {
    dfx canister call PostCore tagMigrationBugFix "(\"$postId\", \"$bucketCanister\", $timeStamp)"
}

# Loop from postId to endPostId, incrementing postId each time
while [ $postId -le $endPostId ]; do
    echo "Calling tagMigrationBugFix with postId: $postId"
    callTagMigrationBugFix
    postId=$((postId + 1))

done
