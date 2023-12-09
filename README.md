# Nuance

https://nuance.xyz/

Built on the Internet Computer, a new blockchain computing network, nuance was the world's first blogging platform built entirely on-chain. 


## Prerequisites

### DFX 0.14.3
To install, run `DFX_VERSION=0.14.3 sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"`

### NPM
Download from https://nodejs.org/en/download

### Vessel
Follow the instructions here: https://github.com/dfinity/vessel

### Nuance NFTs and Publications
Make sure you've cloned the Nuance-NFTs-and-Publications somewhere in your local machine. Here's the repo: https://github.com/Aikindapps/Nuance-NFTs-and-Publications

## Local Setup
Start the DFX by running `dfx start --clean --background`

Change the variable `PUBLICATIONS_REPO_PATH` in the `.env` file with the path of the `Nuance-NFTs-and-Publications` repo in your machine.

Change the variable `NUANCE_MAIN_REPO_PATH` in the `.env` file with the path of the `Nuance` repo in your machine.

To install all the necessary canisters (Nuance and NNS), run `sudo bash ./scripts/DevInstall.sh`

To run the website, run `npm start`
