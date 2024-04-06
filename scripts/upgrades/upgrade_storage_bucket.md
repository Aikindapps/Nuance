To upgrade storage bucket:

Deploy changes to storage canister to prod via proposal.
delete .dfx storage bucket (if it exists) then build canister.
remember to build Storage and Storage bucket --network ic
run node scripts/upgrades/storageBucketCanisterUpgrade.js --multi --ic
