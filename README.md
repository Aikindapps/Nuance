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

## Local Setup
Start the DFX by running `dfx start --clean --background`

Change the variable `PUBLICATIONS_REPO_PATH` in the `.env` file with the path of the `Nuance-NFTs-and-Publications` dir in your machine.

Change the variable `NUANCE_MAIN_REPO_PATH` in the `.env` file with the path of the `Nuance` repo in your machine.

To install all the necessary canisters (Nuance and NNS), run `sudo bash ./scripts/DevInstall.sh`

To run the website, run `npm start`
