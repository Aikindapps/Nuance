const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const zlib = require('zlib');
const argv = require('yargs').argv;

async function readWasmFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }

      zlib.gzip(data, (gzipError, compressedData) => {
        if (gzipError) {
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
  const deployType = argv.single ? 'single' : argv.multi ? 'multi' : null;
  const network = argv.local ? 'local' : argv.ic ? 'ic' : null;
  const canisterId = argv.canisterId || '';
  const canisterName = "PostBucket"; // No change here; this is a constant in your code

  if (!deployType || !network) {
    console.error('Specify deploy type and network.');
    return;
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

  if (network === 'ic') {
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
      await exec(`dfx canister --network=${network} call PostCore registerCanister '("${trustedCanister}" : text)'`);
      console.log("✅ Added PostCore as a trusted canister");
    }

    try {
      console.log(`🪚 Building ${canisterName} canister WASM`);
      const { stdout: canisterBuildStdout, stderr: canisterBuildStderr } = await exec(`dfx build --network=${network} ${canisterName} -qq`);
      if (canisterBuildStderr) {
        console.error(`❌ Build failed: ${canisterBuildStderr}`);
        return;
      }
      console.log(`${canisterBuildStdout}`);
    } catch (err) {
      console.error(`❌ Build command execution failed: ${err}`);
      return;
    }

    await exec(`dfx canister call PostCore resetWasmChunks --network=${network}`); //TODO this should probably happen at the end of upgradeALL and the beginning of upgradeALL in the backend
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

    console.log("✅ Prepared new PostBucket WASM in the PostCore canister");

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

