const fs = require('fs');

const FAMILIAR_ADDRESSES = [
  "d9abade7010df83a34129693d3ddacdbe6025d059b00d0e490dc9ed2a3c7"
 
];

function countProposals(proposalsOutput) {
  let familiarCount = 0;
  let unfamiliarCount = 0;

  const proposals = proposalsOutput.match(/3_000_311_732 = opt record \{[^}]+\}/g) || [];

  proposals.forEach(proposal => {
    const addressMatch = proposal.match(/blob "\\([^"]+)"/);
    const address = addressMatch ? addressMatch[1].replace(/\\/, '') : "";
    console.log(`Extracted Address: ${address}`); 
    if (FAMILIAR_ADDRESSES.includes(address)) {
      familiarCount++;
    } else {
      unfamiliarCount++;
    }
  });

  return { familiarCount, unfamiliarCount };
}

const proposalsOutput = fs.readFileSync(process.argv[2], 'utf8');
const { familiarCount, unfamiliarCount } = countProposals(proposalsOutput);

console.log(`Familiar Count: ${familiarCount}, Unfamiliar Count: ${unfamiliarCount}`); 


fs.appendFileSync(process.env.GITHUB_ENV, `FAMILIAR_COUNT=${familiarCount}\n`);
fs.appendFileSync(process.env.GITHUB_ENV, `UNFAMILIAR_COUNT=${unfamiliarCount}\n`);
