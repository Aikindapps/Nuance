const fs = require('fs');

const FAMILIAR_ADDRESSES = [
  "\\a0\\e3\\88\\9b@kv\\86d\\06\\19d\\8d\\84\\8dZ\\0d\\80\\0f+Zz*D\\ff|\\da{-&A1",
  "\\d9\\ab\\ad\\e7\\01\\0d\\f8:4\\12\\96\\93=t\\dd\\ac\\db\\e6\\02]\\d0Y\\b0\\0dE\\90\\dc\\9e\\d2s:\\c7"
];

function countProposals(proposalsOutput) {
  let familiarCount = 0;
  let unfamiliarCount = 0;

  const proposals = proposalsOutput.match(/3_000_311_732 = opt record \{[^}]+\}/g);

  if (proposals) {
    proposals.forEach(proposal => {
      const addressMatch = proposal.match(/blob "\\([^"]+)"/);
      const address = addressMatch ? addressMatch[1] : null;
      if (address && FAMILIAR_ADDRESSES.includes(address)) {
        familiarCount++;
      } else {
        unfamiliarCount++;
      }
    });
  }

  return { familiarCount, unfamiliarCount };
}

// Read proposals output from a file passed as an argument
const proposalsOutput = fs.readFileSync(process.argv[2], 'utf8');
const { familiarCount, unfamiliarCount } = countProposals(proposalsOutput);

console.log(`FAMILIAR_COUNT=${familiarCount}`);
console.log(`UNFAMILIAR_COUNT=${unfamiliarCount}`);
