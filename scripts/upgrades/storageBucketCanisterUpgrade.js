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
  const canisterName = "StorageBucket";

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

    await exec(`dfx canister call Storage resetWasmChunks --network=${network}`); //TODO this should probably happen at the end of upgradeALL and the beginning of upgradeALL in the backend
    console.log("✅ Prepared WASM for upgrade in Storage canister");

    const wasmBytes = await readWasmFile(wasmPath);
    const nat8List = Array.from(wasmBytes);

    const payload = [68, 73, 68, 76, 0, 0];

    // Split the WASM data into chunks
    const chunkSize = 10000;
    const chunks = [];
    for (let i = 0; i < nat8List.length; i += chunkSize) {

      chunks.push(nat8List.slice(i, i + chunkSize));
    }

    // Add chunks to the canister
    for (const chunk of chunks) {
      const chunkCommand = `dfx canister call Storage addWasmChunk 'vec {${chunk.join('; ')}}' --network=${network} -qq`;
      //TODO: pass the wasm without running into the e2Big system error
      console.log(`+ Adding chunk to the Storage canister`);
      await exec(chunkCommand);
    }

    console.log("✅ Prepared new storageBucket WASM in the Storage canister");

    // Call the upgradeBucket function
    const upgradeFunction = deployType === 'single' ? 'upgradeBucket' : 'upgradeAllBuckets';
    const upgradeCommand = `dfx canister call Storage ${upgradeFunction} '("${canisterId}" : text, vec {${payload.join('; ')}})' --network=${network} -qq`;
    await exec(upgradeCommand);

    const { stdout: allBucketsStdout } = await exec(`dfx canister --network=${network} call Storage getAllDataCanisterIds -qq`);
    console.log(`✅ All Bucket Canister IDs: ${allBucketsStdout}`);
  } catch (err) {
    console.error('❌ Error:', err);
  }
})();

