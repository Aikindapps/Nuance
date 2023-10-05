//first_proposal.md

I suspect some environment tools will be missing, I suggest to install them by running the sns-testing repo prior to moving into this guide. https://github.com/dfinity/sns-testing/tree/main

## Follow Neuron script
All Aikin neurons should follow one main "voting neuron" to make the voting process into 1 step vs 25 steps. 

The voting neuron will be the neuron to submit SNS proposals thus automatically voting yes, then the following neurons will also automatically vote yes because they are setup to follow.

The IC neurons are hard coded, just run: 
`bash ./scripts/sns/follow_neuron.sh`

# Canister upgrade proposal

``` 
dfx build --network ic PostCore
```

* Double check **pem file** location is correct in `snsConfig.js` then run: 

    `node ./scripts/sns/CanisterUpgradeProposal.js`

Follow prompts: 
```
🔖 Enter the canister Name: PostCore

🌐 Do you want to deploy to the local or ic? (Enter "local" or "ic"): ic

🔖 Enter proposal title: Upgrade PostCore for bug fix

🔖 Enter the url: https://nuance.xyz/

🔖 Enter proposal summary: <summary of bug>
```
* Follow output instructions to send quill proposal to the ic.


## Verify proposal status
* Check proposal status here: https://dashboard.internetcomputer.org/canister/rqch6-oaaaa-aaaaq-aabta-cai

using list_proposals to get the proposal status.