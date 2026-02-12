const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { developerNeuronId: defaultDevNeuronId, pemFilePath: defaultPemFilePath } = require('./snsConfig');
const { Principal } = require('@dfinity/principal');

const argv = yargs(hideBin(process.argv))
  .option('developerNeuronId', {
    describe: 'Neuron ID that will submit the proposal',
    type: 'string',
    default: defaultDevNeuronId,
  })
  .option('pemFilePath', {
    describe: 'Path to PEM for the neuron controller identity',
    type: 'string',
    default: defaultPemFilePath,
  })
  .option('treasury', {
    describe: 'Which SNS treasury: icp or nua (sns token)',
    type: 'string',
    demandOption: true,
  })
  .option('amount', {
    describe: 'Human amount (supports decimals up to 8). Ignored if amountE8s is provided.',
    type: 'string',
    default: '',
  })
  .option('amountE8s', {
    describe: 'Optional amount override in e8s (integer string)',
    type: 'string',
    default: '',
  })
  .option('toPrincipal', {
    describe: 'Receiver principal',
    type: 'string',
    demandOption: true,
  })
  .option('toSubaccountHex', {
    describe: 'Optional 32-byte subaccount in hex (64 hex chars, no 0x)',
    type: 'string',
    default: '',
  })
  .option('memo', {
    describe: 'Optional memo (nat64). Empty means null',
    type: 'string',
    default: '',
  })
  .option('title', {
    describe: 'Proposal title',
    type: 'string',
    demandOption: true,
  })
  .option('url', {
    describe: 'Proposal URL',
    type: 'string',
    demandOption: true,
  })
  .option('summary', {
    describe: 'Proposal summary',
    type: 'string',
    default: '',
  })
  .option('summaryPath', {
    describe: 'Optional path to a Markdown file to use as summary (relative to repo root)',
    type: 'string',
    default: '',
  })
  .strict()
  .argv;

function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, { shell: true, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`Command exited with code ${code}`));
      else resolve();
    });
  });
}

function parseAmountE8s(amountE8sStr) {
  if (!/^[0-9]+$/.test(amountE8sStr)) {
    throw new Error(`amountE8s must be an integer string, got: ${amountE8sStr}`);
  }
  // Keep as string to avoid JS integer overflow; Candid expects nat64 literal.
  return amountE8sStr.replace(/^0+(?!$)/, '');
}

function parseDecimalAmountToE8s(amountStr, decimals) {
  const trimmed = (amountStr || '').trim();
  if (trimmed === '') {
    throw new Error('amount is required when amountE8s is not provided');
  }
  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) {
    throw new Error(`amount must be a non-negative decimal string, got: ${trimmed}`);
  }

  const [wholePartRaw, fracPartRaw = ''] = trimmed.split('.');
  const wholePart = wholePartRaw.replace(/^0+(?!$)/, '');
  if (fracPartRaw.length > decimals) {
    throw new Error(`amount supports up to ${decimals} decimal places`);
  }

  const whole = BigInt(wholePart);
  const fracPadded = fracPartRaw.padEnd(decimals, '0');
  const frac = fracPadded === '' ? 0n : BigInt(fracPadded);

  const scale = 10n ** BigInt(decimals);
  const e8s = whole * scale + frac;
  if (e8s <= 0n) {
    throw new Error('amount must be greater than 0');
  }
  return e8s.toString();
}

function hexToNat8Vec(hex) {
  const trimmed = (hex || '').trim();
  if (trimmed === '') return null;
  if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new Error('toSubaccountHex must be 64 hex chars (32 bytes) or empty');
  }
  const bytes = [];
  for (let i = 0; i < trimmed.length; i += 2) {
    bytes.push(parseInt(trimmed.slice(i, i + 2), 16));
  }
  return bytes;
}

function escapeForQuillProposalString(proposalStr) {
  return proposalStr.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeCandidText(value) {
  // Escapes a JS string so it can be placed inside a Candid textual string literal "...".
  // We encode real newlines as \n to keep the shell command one-line safe.
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"');
}

function interpretEscapesForWorkflowInput(value) {
  // GitHub workflow_dispatch inputs are typically single-line.
  // Let users type "\n" / "\t" sequences to represent newlines/tabs.
  return String(value)
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');
}

(async () => {
  const snsCanisterIdsFile = './sns_canister_ids.json';

  const treasury = argv.treasury.trim().toLowerCase();
  const fromTreasury = treasury === 'icp' ? 1 : treasury === 'nua' ? 2 : null;
  if (fromTreasury === null) {
    throw new Error('treasury must be one of: icp, nua');
  }

  const amountE8sOverride = (argv.amountE8s || '').trim();
  const amountE8s = amountE8sOverride !== ''
    ? parseAmountE8s(amountE8sOverride)
    : parseDecimalAmountToE8s(argv.amount, 8);

  const toPrincipalInput = argv.toPrincipal.trim();
  if (toPrincipalInput.length === 0) {
    throw new Error('toPrincipal is required');
  }
  let toPrincipal;
  try {
    toPrincipal = Principal.fromText(toPrincipalInput).toText();
  } catch {
    throw new Error(`toPrincipal is not a valid principal: ${toPrincipalInput}`);
  }

  const subaccountBytes = hexToNat8Vec(argv.toSubaccountHex);
  const toSubaccountCandid = subaccountBytes
    ? `opt record { subaccount = vec { ${subaccountBytes.map((b) => `${b}:nat8`).join('; ')} } }`
    : 'null';

  const memoStr = (argv.memo || '').trim();
  const memoCandid = memoStr === '' ? 'null' : `opt ${memoStr.replace(/^0+(?!$)/, '')}:nat64`;
  if (memoStr !== '' && !/^[0-9]+$/.test(memoStr)) {
    throw new Error('memo must be a nat64 integer string or empty');
  }

  const title = escapeCandidText(interpretEscapesForWorkflowInput(argv.title));
  const url = escapeCandidText(interpretEscapesForWorkflowInput(argv.url));

  const summaryPath = (argv.summaryPath || '').trim();
  let summaryRaw = '';
  if (summaryPath !== '') {
    const resolved = path.resolve(process.cwd(), summaryPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`summaryPath file not found: ${summaryPath}`);
    }
    summaryRaw = fs.readFileSync(resolved, 'utf8');
  } else {
    summaryRaw = argv.summary;
  }
  if (String(summaryRaw).trim() === '') {
    throw new Error('Either --summaryPath must point to a non-empty file, or --summary must be provided');
  }
  const summary = escapeCandidText(interpretEscapesForWorkflowInput(summaryRaw));

  const developerNeuronId = argv.developerNeuronId;
  const pemFilePath = argv.pemFilePath;

  const proposalStr = `(record { title="${title}"; url="${url}"; summary="${summary}"; action=opt variant { TransferSnsTreasuryFunds = record { from_treasury=${fromTreasury}:int32; to_principal=opt principal \"${toPrincipal}\"; to_subaccount=${toSubaccountCandid}; memo=${memoCandid}; amount_e8s=${amountE8s}:nat64 } } })`;
  const escapedProposalStr = escapeForQuillProposalString(proposalStr);

  const outFile = `transfer-treasury-${treasury}-${Date.now()}.json`;

  const makeCommand = `quill sns --canister-ids-file ${snsCanisterIdsFile} --pem-file ${pemFilePath} make-proposal --proposal "${escapedProposalStr}" ${developerNeuronId} > ${outFile}`;
  const sendCommand = `quill send -y ${outFile}`;

  console.log(`\n🧾 Creating proposal file: ${outFile}`);
  await execShellCommand(makeCommand);

  console.log(`\n🚀 Sending proposal...`);
  await execShellCommand(sendCommand);

  console.log(`\n✅ Done. Proposal message was sent using neuron: ${developerNeuronId}`);
})();
