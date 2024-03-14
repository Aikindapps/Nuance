import { Principal } from '@dfinity/principal';

const to32bits = (num: number) => {
  let b = new ArrayBuffer(4);
  new DataView(b).setUint32(0, num);
  return Array.from(new Uint8Array(b));
};

const from32bits = (ba: number[]) => {
  var value: number = 0;
  for (var i = 0; i < 4; i++) {
    value = (value << 8) | ba[i];
  }
  return value;
};
const toHexString = (byteArray: number[]) => {
  return Array.from(byteArray, function (byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
};

export const tokenIdentifier = (principal: string, index: number) => {
  const padding = new Buffer('\x0Atid');
  const array = new Uint8Array([
    ...padding,
    ...Principal.fromText(principal).toUint8Array(),
    ...to32bits(index),
  ]);
  return Principal.fromUint8Array(array).toText();
};
export const decodeTokenId = (tid: string) => {
  var p = [...Principal.fromText(tid).toUint8Array()];
  var padding = p.splice(0, 4);
  if (toHexString(padding) !== toHexString(Array.from(new Buffer('\x0Atid')))) {
    return {
      index: 0,
      canister: tid,
      token: tokenIdentifier(tid, 0),
    };
  } else {
    return {
      index: from32bits(p.splice(-4)),
      canister: Principal.fromUint8Array(new Uint8Array(p)).toText(),
      token: tid,
    };
  }
};

export const toBase256 = (num: number, digitCount: number) => {
  var base256Array: number[] = [];
  while (num > 0) {
    base256Array.unshift(num % 256);
    num = Math.floor(num / 256);
  }

  while (base256Array.length < digitCount) {
    base256Array.unshift(0);
  }

  return base256Array;
};
