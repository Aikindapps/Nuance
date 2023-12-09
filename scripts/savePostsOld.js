const { spawnSync, execSync } = require('child_process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const readline = require('readline');

function extractNumber(str) {
  let insideParenthesis = str.split('(')[1].split(')')[0];
  let number = insideParenthesis.split(':')[0].trim();
  return number;
}
async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
      rl.close();
    });
  });
}
async function main() {
  const creatingPostCount = await prompt(
    '🔖 Enter the number of posts you would like to create in the old Post canister: '
  );

  const { stdout: postCountBeforeReturn } = await exec(
    `dfx canister call Post getTotalPostCount`
  );

  const postCountBefore = parseInt(extractNumber(postCountBeforeReturn));

  var i = 0;
  while (i < parseInt(creatingPostCount)) {
    execSync(
      `dfx canister call Post save '(record {title="${(
        parseInt(postCountBefore) + i + 1
      ).toString()}"; creator=""; content="${(
        parseInt(postCountBefore) + i + 1
      ).toString()}"; isPremium=false; isDraft=false; tagIds=vec{"1";}; category=""; headerImage=""; subtitle="${(
        parseInt(postCountBefore) + i + 1
      ).toString()}"; isPublication=false; postId=""})'`,
      { stdio: 'inherit' }
    );
    i += 1;
  }

  const { stdout: totalPostCountStdout } = await exec(
    `dfx canister call Post getTotalPostCount`
  );
  console.log(totalPostCountStdout);
  console.log('Total post count: ' + extractNumber(totalPostCountStdout));
}
main();
