#!/bin/bash

# Get the directory of the current script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Move the quill script to /usr/local/bin
sudo mv "$SCRIPT_DIR/bin/quill" /usr/local/bin/quill
sudo mv "$SCRIPT_DIR/bin/didc" /usr/local/bin/didc
sudo mv "$SCRIPT_DIR/bin/sns-quill" /usr/local/bin/sns-quill

# Make the scripts executable
sudo chmod +x /usr/local/bin/quill
sudo chmod +x /usr/local/bin/didc
sudo chmod +x /usr/local/bin/sns-quill
