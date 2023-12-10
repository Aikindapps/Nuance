









//Work in progress







// install-config.js
const { exec } = require('child_process');
const fs = require('fs');
const https = require('https');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pipelineAsync = promisify(pipeline);

// Install DFX
exec('DFX_VERSION=0.13.1 sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"', handleExec);


// Download sns for MacOS
const snsPath = './sns.gz';
const snsUrl = 'https://download.dfinity.systems/ic/82a53257ed63af4f602afdccddadc684df3d24de/openssl-static-binaries/x86_64-darwin/sns.gz';
downloadFile(snsUrl, snsPath).then(() => {
    exec(`gunzip ${snsPath}`, handleExec);
    exec(`sudo ln -s "$(pwd)/sns" /usr/local/bin/sns-cli`, handleExec);
});

// Download quill
const quillUrl = 'https://github.com/dfinity/quill/releases/download/v0.4.0/quill-macos-x86_64';
downloadFile(quillUrl, './quill').then(() => {
    exec('sudo mv quill /usr/local/bin/quill', handleExec);
});

// Download didc
const didcUrl = 'https://github.com/dfinity/candid/releases/download/v0.3.0/didc';
downloadFile(didcUrl, './scripts/didc').then(() => {
    exec('sudo chmod +x ./scripts/didc', handleExec);
});

// Run dfx sns import and dfx sns download commands
const dfxIcCommit = '82a53257ed63af4f602afdccddadc684df3d24de';
exec(`DFX_IC_COMMIT=${dfxIcCommit} dfx sns import`, handleExec);
exec(`DFX_IC_COMMIT=${dfxIcCommit} dfx sns download`, handleExec);

function handleExec(err, stdout, stderr) {
    if (err) {
        console.error(`exec error: ${err}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
}

async function downloadFile(url, dest) {
    const file = fs.createWriteStream(dest);
    const request = https.get(url, response => {
        pipelineAsync(response, file).catch(err => console.error(`Download error: ${err}`));
    });
}
