const fs = require('fs');
const path = require('path');
const readline = require('readline');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const zlib = require('zlib'); // Require the zlib module for gzip compression

async function readWasmFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }
      
      zlib.gzip(data, (gzipError, compressedData) => {
        if(gzipError) {
          return reject(gzipError);
        }

        resolve(new Uint8Array(compressedData));
      });
    });
  });
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

(async () => {
  console.log('\x1b[36m%s\x1b[0m', '🚀 PostCore Upgrade Script...');

  const canisterName = "PostBucket";

  if (canisterName !== 'PostBucket') {
    console.warn('⚠️  WARNING: Canister name does not equal "PostBucket". This option should be removed before deploying to production. ⚠️');
    await prompt('Press enter to continue or ctrl+c to exit: ');
  }

  const deployType = await prompt('📦 Do you want a single or multi canister deploy? (Enter "single" or "multi"): ');
  const network = await prompt('🌐 Do you want to deploy to the local or ic? (Enter "local" or "ic"): ');
  if (network === 'ic') {
    await prompt('⚠️ Are you sure you want to deploy to the IC? Double check canister_ids.json for PROD or UAT canisters... Press enter to continue or ctrl+c to exit: ');
  }

  let canisterId = '';
  if (deployType === 'single') {
    canisterId = await prompt('🆔 Enter the canister ID: ');
  }

  var wasmPath = path.join(
    __dirname,
    '..',
    '..',
    '.dfx',
    'local',
    'canisters',
    canisterName,
    `${canisterName}.wasm`
  );

  if(network==='ic'){
    wasmPath = path.join(
      __dirname,
      '..',
      '..',
      '.dfx',
      'ic',
      'canisters',
      canisterName,
      `${canisterName}.wasm`
    );
  }

  try {
    function parseCanisterIds(response) {
      const regex = /"(.*?)"/g;
      const canisterIds = [];
      let match;
      while ((match = regex.exec(response)) !== null) {
        canisterIds.push(match[1]);
      }
      return canisterIds;
    }
    
    const { stdout: trustedCanisterStdout } = await exec(`dfx canister --network=${network} call PostCore idQuick`);
    const trustedCanister = trustedCanisterStdout.trim().match(/"(.*?)"/)[1];
    console.log(`✅ Got PostCore canister id: ${trustedCanister}`);
    
    const { stdout: trustedCanistersStdout } = await exec(`dfx canister --network=${network} call PostCore getTrustedCanisters`);
    const trustedCanisters = parseCanisterIds(trustedCanistersStdout);
    console.log(`✅ Got trusted canisters: ${trustedCanisters}`);
    

    if (trustedCanisters.includes(trustedCanister)) {
      console.log("✅ PostCore is already a trusted canister");
    } else {
      await exec(`dfx canister --network=${network} call PostCore registerCanister '("${trustedCanister }" : text)'`);
      console.log("✅ Added PostCore as a trusted canister");
    }

    await exec(`dfx canister call PostCore resetWasmChunks --network=${network}`);
    console.log("✅ Prepared WASM for upgrade in PostCore canister");

    const wasmBytes = await readWasmFile(wasmPath);
    const nat8List = Array.from(wasmBytes);

    const payload = [68, 73, 68, 76, 0, 0];

    // Split the WASM data into chunks
    const chunkSize = 1000000;
    const chunks = [];
    for (let i = 0; i < nat8List.length; i += chunkSize) {
      chunks.push(nat8List.slice(i, i + chunkSize));
    }

    // Add chunks to the canister
    for (const chunk of chunks) {
      const chunkCommand = `dfx canister call PostCore addWasmChunk 'vec {${chunk.join('; ')}}' --network=${network}`;
      //TODO: pass the wasm without running into the e2Big system error
      console.log(`+ Adding chunk to the PostCore canister`);
      await exec(chunkCommand);
    }

    console.log("✅ Added new WASM to the PostCore canister");

    // Call the upgradeBucket function
    const upgradeFunction = deployType === 'single' ? 'upgradeBucket' : 'upgradeAllBuckets';
    const upgradeCommand = `dfx canister call PostCore ${upgradeFunction} '("${canisterId}" : text, vec {${payload.join('; ')}})' --network=${network}`;
    await exec(upgradeCommand);

    const { stdout: allBucketsStdout } = await exec(`dfx canister --network=${network} call PostCore getAllBuckets`);
    console.log(`✅ All Bucket Canister IDs: ${allBucketsStdout}`);
  } catch (err) {
    console.error('❌ Error:', err);
  }
})();

