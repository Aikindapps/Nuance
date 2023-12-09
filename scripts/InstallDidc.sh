#!/bin/bash

# Credit: https://kyle-peacock.com/blog/dfinity/working-with-candid/

# Usage (run from nuance root folder)
# sudo bash ./scripts/InstallDidc.sh

unameOut="$(uname -s)"

echo "unameOut: $unameOut"

case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    *)          machine="UNKNOWN:${unameOut}"
esac

release=$(curl --silent "https://api.github.com/repos/dfinity/candid/releases/latest" | grep -e '"tag_name"' | cut -c 16-25)

echo "Release: $release"

if [ ${machine} = "Mac" ]
then
  echo "Downloading didc for Mac to ./scripts/didc"
  url=https://github.com/dfinity/candid/releases/download/${release}/didc-macos
  echo "url: $url"
  curl -fsSL https://github.com/dfinity/candid/releases/download/${release}/didc-macos > ./scripts/didc
  chmod +x ./scripts/didc
elif [ ${machine} = "Linux" ]
then
  echo "Downloading didc for Linux to ./scripts/didc"
  url=https://github.com/dfinity/candid/releases/download/${release}/didc-macos
  echo "url: $url"
  curl -fsSL https://github.com/dfinity/candid/releases/download/${release}/didc-linux64 > ./scripts/didc
  chmod +x ./scripts/didc
else
  echo "Could not detect a supported operating system. Please note that didc is currently only supported for Mac and Linux"
fi

echo ""