const fs = require('fs');

const FAMILIAR_ADDRESSES = [
    "d9ab\\ad\\e7\\01\\0d\\f8:4\\12\\96\\93=t\\dd\\ac\\db\\e6\\02]\\d0Y\\b0\\0dE\\90\\dc\\9e\\d2s:\\c7",
    "b0e3\\88\\9b@kv\\86d\\06\\19d\\8d\\84\\8dZ\\0d\\80\\0f+Zz*D\\ff|\\da{-&A1"
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
