#!/bin/bash

# Range-based cache initialization for NuaTransactionHistory
set -e

CANISTER_NAME="NuaTransactionHistory"
NETWORK="ic"
BATCH_SIZE=1000

echo "NuaTransactionHistory Range-Based Cache Initialization"
echo "======================================================"

# Get total transaction count
echo "Getting total transaction count..."
total_result=$(dfx canister --network $NETWORK call $CANISTER_NAME getTransactionData 2>/dev/null || echo "failed")

if echo "$total_result" | grep -q "failed\|error\|Error"; then
    echo "✗ Failed to get transaction count: $total_result"
    exit 1
fi

# Extract transaction count from Candid response
# The response format is: (variant { ok = "{\"latestTransactionId\":12345}" })
# First extract the JSON string from the Candid response
json_part=$(echo "$total_result" | sed 's/.*ok = "\(.*\)".*/\1/')
# Then extract the number from the JSON, unescaping the quotes
total_txs=$(echo "$json_part" | sed 's/\\//g' | grep -o '"latestTransactionId":[0-9]*' | cut -d':' -f2 || echo "90000")

if [ -z "$total_txs" ] || [ "$total_txs" = "90000" ]; then
    echo "Could not parse transaction count, using default: 90000"
    total_txs=90000
fi

echo "Total transactions: $total_txs"

# Calculate ranges
max_archive_range=91999  # Archive handles 0-91999
ledger_start=92000       # Ledger starts at 92k
end_range=$(( total_txs < max_archive_range ? total_txs : max_archive_range ))

echo "Will process archive transactions 0 to $end_range in batches of $BATCH_SIZE"
if [ $total_txs -gt $ledger_start ]; then
    ledger_end=$(( total_txs > ledger_start ? total_txs : ledger_start ))
    echo "Will process ledger transactions $ledger_start to $ledger_end in batches of $BATCH_SIZE"
fi
echo

# Function to process a range
process_range() {
    local start=$1
    local end=$2
    local batch_num=$3
    local source=$4
    
    echo "Batch $batch_num ($source): Processing transactions $start to $end..."
    
    result=$(dfx canister --network $NETWORK call $CANISTER_NAME processTransactionRange "($start:nat, $end:nat)" 2>/dev/null || echo "failed")
    
    if echo "$result" | grep -q "failed\|error\|Error"; then
        echo "✗ Batch $batch_num ($source) failed: $result"
        return 1
    else
        echo "✓ Batch $batch_num ($source) completed"
        return 0
    fi
}

# Process archive transactions (0 to end_range)
current_start=0
batch_num=1

echo "Processing archive transactions..."
while [ $current_start -lt $end_range ]; do
    current_end=$(( current_start + BATCH_SIZE ))
    if [ $current_end -gt $end_range ]; then
        current_end=$end_range
    fi
    
    if ! process_range $current_start $current_end $batch_num "archive"; then
        echo "Stopping archive processing due to failure"
        break
    fi
    
    current_start=$current_end
    batch_num=$(( batch_num + 1 ))
    
    # Brief pause between batches
    sleep 1
done

# Process ledger transactions (92k+) if they exist
if [ $total_txs -gt $ledger_start ]; then
    echo
    echo "Processing ledger transactions..."
    current_start=$ledger_start
    
    while [ $current_start -lt $total_txs ]; do
        current_end=$(( current_start + BATCH_SIZE ))
        if [ $current_end -gt $total_txs ]; then
            current_end=$total_txs
        fi
        
        if ! process_range $current_start $current_end $batch_num "ledger"; then
            echo "Stopping ledger processing due to failure"
            break
        fi
        
        current_start=$current_end
        batch_num=$(( batch_num + 1 ))
        
        # Brief pause between batches
        sleep 1
    done
fi

# Show final status
echo
echo "Cache initialization completed!"
echo "Final cache status:"
dfx canister --network $NETWORK call $CANISTER_NAME getCacheStatus