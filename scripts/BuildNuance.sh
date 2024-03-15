#Creates, builds and installs all canisters.
#When building the UI canister, invokes npm run build.
#After deployment, registers admins for all canisters.

#Arguments can be passed to the script to skip prompts.

#Examples
#
# Interactive:
#   bash ./scripts/BuildNuance.sh
#
# Silent:
#   bash ./scripts/BuildNuance.sh -e 'l' -m 'u' -p 'hk4oi-lwh4z-2ifnk-gq2hq-c2ekm-f6ukn-ex6xd-uyd2o-neiwv-t6tkn-zqe, aaaaa-lwh4z-2ifnk-gq2hq-c2ekm-f6ukn-ex6xd-uyd2o-neiwv-t6tkn-zqe' -c 'hk4oi-lwh4z-2ifnk-gq2hq-c2ekm-f6ukn-ex6xd-uyd2o-neiwv-t6tkn-zqe, aaaaa-lwh4z-2ifnk-gq2hq-c2ekm-f6ukn-ex6xd-uyd2o-neiwv-t6tkn-zqe'

#Arguments:
# e (environment) = l (local) or p (production)
# m (mode) = u (upgrade), i (install), u (uninstall)
# p (user principals) = comma-delimited list of user principals to become admins of all canisters
# c (canistergeek Users) = comma-delimited list of Canistergeek Users

#!/bin/bash

#region bash Args

#default arg values
env="l"
mode="u"
modeAction="Upgrading"
network="local"
canisterFilePath="./.dfx/local/canister_ids.json"
productionCanisterFilePath="./canister_ids.json"
cgUsers=""
principalsArg=""
skipPrompts=0;


while getopts e:m:p:c: flag
do
    skipPrompts=1;
    case "${flag}" in
        e) env=${OPTARG};;
        m) mode=${OPTARG};;
        p) principalsArg=${OPTARG};;
        c) cgUsers=${OPTARG};;
    esac
done

#parse and validate comma-delimited list of user principals and add each one to the array
userPrincipals=($(echo "$principalsArg" | grep -o '[A-Za-z0-9\-]\{63\}'))

#endregion

#parse and validate comma-delimited list of Canistergeek principals and add each one to the array
cgUserPrincipals=($(echo "$cgUsers" | grep -o '[A-Za-z0-9\-]\{63\}'))
#endregion

#region User Input

if [ "$skipPrompts" = 0 ]
then
    echo "Enter 'p' for production or 'l' for local"
    read env

    echo "Enter 'u' for upgrade (Default), 'i' for install, or 'r' for reinstall (WARNING: ALL DATA WILL BE LOST)"
    read mode
    echo ""

    addAnotherPrincipal="y"
    while [ "$addAnotherPrincipal" = "y" ]
    do
        echo "Enter a user principal id that should be registered as an admin of all canisters."
        read userPrincipal

        validPrincipal=$(echo "$userPrincipal" | grep -o '[A-Za-z0-9\-]\{63\}')

        if [[ $validPrincipal ]]
        then
            userPrincipals+=("$validPrincipal")
            echo "User principal $validPrincipal will be registered as an admin of all canisters."
        else
            echo "Invalid user principal."
        fi
        echo ""

        echo "Do you want to add another principal? Enter y for yes, n for no."
        read addAnotherPrincipal
        if [ "$addAnotherPrincipal" = "Y" ]
        then
            addAnotherPrincipal="y"
        fi
        echo ""
    done
fi

#endregion


#region Apply Args/Input

echo ""
if [ "$env" = "p" ] || [ "$env" = "P" ]
then
    env="p"
    network="ic"
    canisterFilePath="./canister_ids.json"
    echo "*** PRODUCTION BUILD AND DEPLOYMENT ***"
else
    env="l"
    echo "*** LOCAL BUILD AND DEPLOYMENT ***"
fi
echo ""

if [ "$mode" = "i" ] || [ "$mode" = "I" ]
then
    mode="install"
    modeAction="Installing"
    echo "*** MODE = INSTALL ***"
elif [ "$mode" = "r" ] || [ "$mode" = "R" ]
then
    mode="reinstall"
    modeAction="Reinstalling"
    echo "*** MODE = REINSTALL ***"
else
    mode="upgrade"
    modeAction="Upgrading"
    echo "*** MODE = UPGRADE ***"
fi
echo ""

echo "*** REGISTER USER PRINCIPLES ****"
for p in "${userPrincipals[@]}"
do
    echo "$p"
done
echo ""

echo "*** REGISTER CANISTER GEEK PRINCIPLES ****"
for c in "${cgUserPrincipals[@]}"
do
    echo "$c"
done
echo ""

#endregion


#region Create, Build and Deploy
echo "Deploying all Nuance main canisters"
dfx deploy --network $network
echo ""

#endregion


#region Register admins (user principals and canister principals for inter-canister calls)

echo "Getting default terminal principal to register as the first admin of all canisters"
defaultPrincipal="$(dfx identity get-principal)"
echo "Principal: $defaultPrincipal"
echo ""

echo "Getting User canister Id to register as admin of Post canister"
userCanisterId="$(grep -A2 '"User"' $canisterFilePath | grep $network | grep -o '[A-Za-z0-9\-]\{27\}')"
echo "User Canister id: $userCanisterId"
echo ""


echo "Getting PostCore canister Id to register as admin of PostIndex canister"
postCoreCanisterId="$(grep -A2 '"PostCore"' $canisterFilePath | grep $network | grep -o '[A-Za-z0-9\-]\{27\}')"
echo "PostCore Canister id: $postCoreCanisterId"
echo ""

echo "Getting PostIndex canister Id"
postIndexCanisterId="$(grep -A2 '"PostIndex"' $canisterFilePath | grep $network | grep -o '[A-Za-z0-9\-]\{27\}')"
echo "PostIndex Canister id: $postIndexCanisterId"
echo ""


echo "Getting CyclesDispenser canister Id"
cyclesDispenserCanisterId="$(grep -A2 '"CyclesDispenser"' $canisterFilePath | grep $network | grep -o '[A-Za-z0-9\-]\{27\}')"
echo "CyclesDispenser Canister id: $cyclesDispenserCanisterId"
echo ""

echo "Getting asset canister Id to set it in PostCore canister"
assetCanisterId="$(grep -A2 '"nuance_assets"' $canisterFilePath | grep $network | grep -o '[A-Za-z0-9\-]\{27\}')"
echo "nuance_assets Canister id: $assetCanisterId"
echo ""


echo "Registering Canisters for CyclesDispenser canister"
dfx canister --network $network call CyclesDispenser registerCanister "$postCoreCanisterId"
dfx canister --network $network call CyclesDispenser getTrustedCanisters
echo ""


echo "Registering Users for Canistergeek (PostIndex Canister)"

for c in "${cgUserPrincipals[@]}"
do
dfx canister --network $network call PostIndex registerCgUser "$c"
done
dfx canister --network $network call PostIndex getCgUsers
echo ""

echo "Registering Users for Canistergeek (User Canister)"

for c in "${cgUserPrincipals[@]}"
do
dfx canister --network $network call User registerCgUser "$c"
done
dfx canister --network $network call User getCgUsers
echo ""

echo "Registering Users for Canistergeek (Storage Canister)"

for c in "${cgUserPrincipals[@]}"
do
dfx canister --network $network call Storage registerCgUser "$c"
done
dfx canister --network $network call Storage getCgUsers
echo ""

echo "Registering Users for Canistergeek (KinicEndpoint Canister)"

for c in "${cgUserPrincipals[@]}"
do
dfx canister --network $network call KinicEndpoint registerCgUser "$c"
done
dfx canister --network $network call KinicEndpoint getCgUsers
echo ""

echo "Admin Set up for Canistergeek Completed"


echo ""
echo "Fabricate cycles in local setup"
echo ""
if [ "$network" = "local" ]
then
    echo "FABRICATE CYCLES"
    dfx ledger fabricate-cycles --all
fi

echo ""
echo "AUTHORIZE PostCore as admin to nuance_assets"
echo ""
dfx canister --network $network call nuance_assets authorize '(principal "'$postCoreCanisterId'")'
dfx canister --network $network update-settings nuance_assets --add-controller $postCoreCanisterId
echo "Completed!"

#endregion