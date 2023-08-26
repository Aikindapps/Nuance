const { spawnSync, execSync } = require('child_process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const csv = require('csv-parser');

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
function getQuotedValue(str) {
  const matches = str.match(/"(.*?)"/);
  if (matches && matches.length > 1) {
    return matches[1];
  }
  return null;
}

async function main() {
  console.log(
    '\x1b[36m%s\x1b[0m',
    '🚀 Migrating Posts From Old Post Canister Script...'
  );

  const network = await prompt(
    '🌐 Do you want to migrate in local or in ic?(Enter "local" or "ic"): '
  );

  if (network !== 'local' && network !== 'ic') {
    console.log('❌ Invalid network.');
    return;
  }

  const adminPrincipalId = await prompt('🆔 What is your principal id? ');
  const postCanisterId = await prompt(
    '🆔 What is the canister id of the old Post canister? '
  );
  const postCoreCanisterId = await prompt(
    '🆔 What is the canister id of the PostCore canister? '
  );
  const nuanceAssetsCanisterId = await prompt(
    '🆔 What is the canister id of the nuance_assets canister? '
  );
  const userCanisterId = await prompt(
    '🆔 What is the canister id of the User canister? '
  );
  const publicationManagementCanisterId = await prompt(
    '🆔 What is the canister id of the PublicationManagement canister? '
  );

  const { stdout: activeBucketCanisterIdStdout } = await exec(
    `dfx canister --network ${network} call PostCore getActiveBucketCanisterId`
  );
  let activeBucketCanisterId = getQuotedValue(activeBucketCanisterIdStdout);
  if (activeBucketCanisterId === null) {
    console.log('❌ Could not fetch if the PostCore is initialized or not.');
    return;
  } else if (activeBucketCanisterId === '') {
    //PostCore canister has not been initialized yet.
    console.log('✅ Starting to setup PostCore canister...');

    console.log(
      '🔃 Registering your principal id and the User canister as admin to PostCore canister...'
    );
    const { stdout: registerAdminPostCore } = await exec(
      `dfx canister --network ${network} call PostCore registerAdmin '("${adminPrincipalId}")'`
    );
    if (registerAdminPostCore.includes('err')) {
      console.log(
        '❌ Could not register the admin principal as admin in PostCore canister.'
      );
      console.log(registerAdminPostCore);
      return;
    }

    console.log(
      '🔃 Registering your principal id and the PostCore canister as admin to CyclesDispenser canister...'
    );
    const { stdout: registerAdminCyclesDispenser } = await exec(
      `dfx canister --network ${network} call CyclesDispenser registerAdmin '("${adminPrincipalId}")'`
    );
    if (registerAdminCyclesDispenser.includes('err')) {
      console.log(
        '❌ Could not register the admin principal as admin in CyclesDispenser canister.'
      );
      console.log(registerAdminCyclesDispenser);
      return;
    }

    const { stdout: registerCanisterCyclesDispenser } = await exec(
      `dfx canister --network ${network} call CyclesDispenser registerCanister '("${postCoreCanisterId}")'`
    );
    if (registerCanisterCyclesDispenser.includes('err')) {
      console.log(
        '❌ Could not register the PostCore canister as admin in CyclesDispenser canister.'
      );
      console.log(registerCanisterCyclesDispenser);
      return;
    }

    const { stdout: registerUserCanisterAsAdminInPostCore } = await exec(
      `dfx canister --network ${network} call PostCore registerAdmin '("${userCanisterId}")'`
    );

    if (registerUserCanisterAsAdminInPostCore.includes('err')) {
      console.log(
        '❌ Could not register the User canister as admin in PostCore canister.'
      );
      console.log(registerAdminPostCore);
      return;
    }

    console.log('✅ Successful!');

    console.log(
      '🔃 Registering the PublicationManagement canister as admin to PostCore canister...'
    );

    const { stdout: registerPubManCanStdout } = await exec(
      `dfx canister --network ${network} call PostCore registerAdmin '("${publicationManagementCanisterId}")'`
    );
    
    if (registerPubManCanStdout.includes('err')) {
      console.log(
        '❌ Could not register the PublicationManagement as admin to PostCore canister. Here is the error:'
      );
      console.log(registerAdminOldPostStdout);
      return;
    }

    console.log('✅ Successful!');

    console.log(
      '🔃 Registering the PostCore canister as admin to old Post canister...'
    );

    const { stdout: registerAdminOldPostStdout } = await exec(
      `dfx canister --network ${network} call ${postCanisterId} registerAdmin '("${postCoreCanisterId}")'`
    );
    if (registerAdminOldPostStdout.includes('err')) {
      console.log(
        '❌ Could not register the PostCore as admin to old Post canister. Here is the error:'
      );
      console.log(registerAdminOldPostStdout);
      return;
    }

    console.log('✅ Successful!');

    console.log(
      '🔃 Registering the PostCore canister as admin to PostIndex canister...'
    );

    const { stdout: registerAdminPostIndexStdout } = await exec(
      `dfx canister --network ${network} call PostIndex registerAdmin '("${postCoreCanisterId}")'`
    );
    if (registerAdminPostIndexStdout.includes('err')) {
      console.log(
        '❌ Could not register the PostCore as admin to PostIndex canister. Here is the error:'
      );
      console.log(registerAdminPostIndexStdout);
      return;
    }

    console.log('✅ Successful!');

    console.log('🔃 Authorizing the PostCore canister in frontend canister...');

    const { stdout: authorizePostCoreFrontendStdout } = await exec(
      `dfx canister --network ${network} call nuance_assets authorize '(principal "${postCoreCanisterId}")'`
    );

    const { stdout: giveControlReturnStdout } = await exec(
      `dfx canister --network ${network} update-settings nuance_assets --add-controller ${postCoreCanisterId}`
    );

    const { stdout: registerFrontendCanister } = await exec(
      `dfx canister --network ${network} call PostCore setFrontendCanisterId '("${nuanceAssetsCanisterId}")'`
    );

    if (registerFrontendCanister.includes('err')) {
      console.log(
        '❌ Could not register the nuance_assets canister as the frontend canister in the PostCore, here is the error:'
      );
      console.log(registerFrontendCanister);
      return;
    }

    console.log('✅ Successful!');

    console.log('🔃 Registering the tags...');

    const results = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream('./tag.csv')
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    for (let i = 0; i < results.length; i++) {
      const values = Object.values(results[i]);
      for (let j = 0; j < values.length; j++) {
        console.log('### Create tag ' + values[j] + ' ###');
        const { stdout: createTagReturn } = await exec(
          `dfx canister --network ${network} call PostCore createTag '("${values[j]}")'`
        );
        console.log(createTagReturn);
      }
    }

    console.log('✅ All the tags has been registered successfuly');

    console.log('🔃 Creating the first bucket canister...');
    const { stdout: createFirstBucketReturn } = await exec(
      `dfx canister --network ${network} call PostCore initializePostCoreCanister`
    );

    if (createFirstBucketReturn.includes('err')) {
      console.log(
        '❌ Could not create the first bucket canister, here is the error:'
      );
      console.log(createFirstBucketReturn);
      return;
    }

    console.log('✅ Success: ' + createFirstBucketReturn);

    console.log('✅ PostCore canister setup is successful!');
  }

  const { stdout: totalPostCountStdout } = await exec(
    `dfx canister --network ${network} call ${postCanisterId} getTotalPostCount`
  );
  console.log(
    `✅There are ${extractNumber(
      totalPostCountStdout
    )} posts to migrate in the old Post canister.`
  );

  const chunkSizeInput = await prompt(
    '#️⃣ What is the chunk size you want to migrate the posts? (Enter 20, 50 etc.):  '
  );
  let chunkSize = parseInt(chunkSizeInput);
  if (isNaN(chunkSize)) {
    console.log('❌ Invalid chunk size.');
    return;
  }

  console.log(`✅ Copying the trusted canisters from the old Post canister...`);

  const { stdout: copyTrustedReturn } = await exec(
    `dfx canister --network ${network} call PostCore copyTrustedCanisters '("${postCanisterId}")'`
  );

  if (copyTrustedReturn.includes('err')) {
    console.log('❌Error: ', copyTrustedReturn);
    return;
  }

  console.log(
    `✅ Copying the trusted canisters from the old Post canister succeeded.`
  );

  console.log(
    `✅ Migrating the modclub post statuses from the old Post canister...`
  );

  const { stdout: modclubMigrationResult } = await exec(
    `dfx canister --network ${network} call PostCore handleModclubMigration '("${postCanisterId}")'`
  );

  if (modclubMigrationResult.includes('err')) {
    console.log('❌Error: ', copyTrustedReturn);
    return;
  }
  console.log(
    `✅ Migrating the modclub post statuses from the old Post canister succeeded.`
  );

  var counter = 0;

  const indexStartInput = await prompt(
    '#️⃣ What is the starting index of the migration? If it is your first attempt, enter 0. If one of your attempts has failed, enter the starting index of the last call. '
  );

  try {
    let indexStart = parseInt(indexStartInput);
    counter = indexStart;
  } catch (error) {
    console.log('❌ Invalid starting index.');
    return;
  }

  var end = parseInt(extractNumber(totalPostCountStdout).replace(/_/g, ''));
  var i = 1;
  while (counter < end) {
    console.log(`✅ Migrating the ${i}th batch...`);
    let command = `dfx canister --network ${network} call PostCore migratePostsFromOldPostCanister '("${postCanisterId}", ${counter.toString()}, ${(
      counter + chunkSize
    ).toString()})'`;
    console.log('✅' + command);
    const { stdout: migrateChunkReturn } = await exec(command);
    if (migrateChunkReturn.includes('err')) {
      console.log(
        `❌ Batch ${i} contains an error. Please check it. Here's the results:`
      );
      console.log(migrateChunkReturn.replace(/;/g, ';\n'));
    } else {
      console.log(`✅ Batch ${i} is successful. Here's the results.`);
      console.log(migrateChunkReturn.replace(/;/g, ';\n'));
    }
    counter += chunkSize;
    i += 1;
  }

  console.log('✅ Reconstructing the latest posts after the migration...');
  const { stdout: generateLatestReturn } = await exec(
    `dfx canister --network ${network} call PostCore generateLatestPosts`
  );

  console.log('✅ Indexing the popular posts after the migration...');
  const { stdout: indexPopularReturn } = await exec(
    `dfx canister --network ${network} call PostCore indexPopular`
  );

  console.log('🚀 End...');
}
main();
