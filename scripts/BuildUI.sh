#!/bin/bash

echo "Building nuance...."

dfx build nuance_assets

echo "Upgrading nuance...."

dfx canister install nuance_assets --mode upgrade

echo "Completed!"