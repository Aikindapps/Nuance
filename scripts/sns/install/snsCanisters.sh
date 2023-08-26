#!/bin/bash

# Set the DFX_IC_COMMIT environment variable
export DFX_IC_COMMIT=82a53257ed63af4f602afdccddadc684df3d24de

# Run the dfx sns import command
dfx sns import

# Run the dfx sns download command
dfx sns download

sudo sns-cli deploy-testflight


echo "Record the developer neuronID for later use 👆"