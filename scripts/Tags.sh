#!/bin/bash
# Purpose: Read Comma Separated CSV File
# Author: Vivek Gite under GPL v2.0+
# ------------------------------------------
INPUT=./scripts/tag.csv
OLDIFS=$IFS
IFS=','
[ ! -f $INPUT ] && { echo "$INPUT file not found"; exit 99; }
while read tag
do
    dfx canister --network ic call Post createTag "$tag";
    echo "Value : $tag"
done < $INPUT
IFS=$OLDIFS