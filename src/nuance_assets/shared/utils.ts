import { format, sub } from 'date-fns';
import { Metadata } from '../services/ext-service/ext_v2.did';
import { ToastType, toast } from '../services/toastService';
import { getNewContentId, uploadBlob } from '../services/storageService';
import {
  ICP_CANISTER_ID,
  NUA_CANISTER_ID,
  SupportedTokenSymbol,
  ckBTC_CANISTER_ID,
} from './constants';
import { PairInfo } from '../types/types';

export enum DateFormat {
  // Sep 16
  NoYear,
  // Sep 16 2021
  WithYear,
  // Sep 16 - 2021
  WithYearAndHyphen,

  Number,
}

export const formatDate = (
  epochTime: string | undefined,
  dateFormat: DateFormat = DateFormat.WithYear
): string => {
  // Supports nullish values to keep UI templates clean from null checks
  if (!epochTime?.trim().length) {
    return '';
  }
  const ms = Number.parseInt(epochTime.trim());
  if (Number.isNaN(ms) || ms === 0) {
    return '';
  } else {
    switch (dateFormat) {
      case DateFormat.WithYear:
        return format(new Date(ms), 'MMM d yyyy');
      case DateFormat.WithYearAndHyphen:
        return format(new Date(ms), 'MMM d - yyyy');
      case DateFormat.Number:
        return format(new Date(ms), 'MM - dd - yyyy');
      default:
        // NoYear
        return format(new Date(ms), 'MMM d');
    }
  }
};

export const arraysEqual = <T>(a: T[], b: T[]) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export const base64toBlob = (
  base64Data: string,
  contentType = '',
  sliceSize = 512
) => {
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export type EmbeddedImage = {
  index: number;
  length: number;
  mimeType: string;
  blob: Blob;
  contentId?: string;
};

export const getEmbeddedImages = (html: string): EmbeddedImage[] => {
  const images: EmbeddedImage[] = [];

  const matches = [
    ...html.matchAll(
      // The regex must include the src attribute's quotes in the regex group.
      // This allows a replace with additional element attributes (class, style, etc.).
      /<img[^>]*src=(?<data>["']data:[^"']*;base64,[^"']*["'])[^>]*>/gi
    ),
  ];

  for (const match of matches) {
    if (match.groups?.data) {
      const data = match.groups.data;
      const parsed = parseEmbeddedImage(
        data,
        (match.index || 0) + match[0].indexOf(data)
      );

      if (parsed) {
        images.push(parsed);
      }
    }
  }

  return images;
};

const componentToHex = (c: any) => {
  var hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
};

function rgbToHex(r: any, g: any, b: any) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

const hexToRgb = (hex: string) => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const hexTint = (hex: string) => {
  var rgb = hexToRgb(hex);
  if (rgb) {
    rgb.r = rgb.r + (255 - rgb.r) * 0.4;
    rgb.g = rgb.g + (255 - rgb.g) * 0.4;
    rgb.b = rgb.b + (255 - rgb.b) * 0.4;
    return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  }
  return hex;
};

export const trim_category_name = (name: string) => {
  return name
    .split('')
    .map((char) => {
      if (char === ' ') {
        return '-';
      } else {
        return char.toLowerCase();
      }
    })
    .join('');
};

export const hexShade = (hex: string) => {
  var rgb = hexToRgb(hex);
  console.log(rgb);
  if (rgb) {
    rgb.r = rgb.r * 0.8;
    rgb.g = rgb.g * 0.8;
    rgb.b = rgb.b * 0.8;
    return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  }
  return hex;
};

export const parseEmbeddedImage = (
  embeddedImage: string,
  index: number = 0
): EmbeddedImage | null => {
  // "data:image/png;base64,<base64>"
  var parts = embeddedImage.replaceAll(/["']/g, '').split(/[:;,]/);

  if (parts.length === 4) {
    let mimeType = parts[1];
    let base64 = parts[3];

    //pad end of base64 string with = characters
    if (base64.length % 4 > 0) {
      base64 += '='.repeat(4 - (base64.length % 4));
    }

    const blob = base64toBlob(base64, mimeType);

    return {
      index,
      length: embeddedImage.length,
      mimeType,
      blob,
    };
  } else {
    return null;
  }
};

export const icpPriceToString = (price: bigint) => {
  return (parseFloat(price.toString()) / 100000000).toFixed(2);
};

export const getFieldsFromMetadata = (metadata: Metadata) => {
  var postId = '';
  var accessKeyIndex = '';
  var date = '';
  var writer = '';
  var title = '';
  var totalSupply = '';
  var url = '';

  if ('nonfungible' in metadata) {
    let metadataContainer = metadata.nonfungible.metadata;
    if (metadataContainer.length) {
      if ('data' in metadataContainer[0]) {
        let metadataValues = metadataContainer[0].data;
        metadataValues.forEach((metadataValue) => {
          if (metadataValue[0] === 'Access key index') {
            if ('text' in metadataValue[1]) {
              accessKeyIndex = metadataValue[1].text;
            }
          }
          if (metadataValue[0] === 'Post id') {
            if ('text' in metadataValue[1]) {
              postId = metadataValue[1].text;
            }
          }
          if (metadataValue[0] === 'Title') {
            if ('text' in metadataValue[1]) {
              title = metadataValue[1].text;
            }
          }
          if (metadataValue[0] === 'Writer') {
            if ('text' in metadataValue[1]) {
              writer = metadataValue[1].text;
            }
          }
          if (metadataValue[0] === 'Total supply') {
            if ('text' in metadataValue[1]) {
              totalSupply = metadataValue[1].text;
            }
          }
          if (metadataValue[0] === 'Url') {
            if ('text' in metadataValue[1]) {
              url = metadataValue[1].text;
            }
          }
          if (metadataValue[0] === 'Date') {
            if ('text' in metadataValue[1]) {
              date = metadataValue[1].text;
            }
          }
        });
      }
    }
  }

  return [postId, accessKeyIndex, date, writer, title, totalSupply, url];
};

export const convertImagesToUrls = async (
  content: string,
  postImage: string
): Promise<{ headerUrl: string; contentWithUrls: string } | null> => {
  let headerUrl = postImage;
  // returns null if the header image is already a URL
  const headerImage = parseEmbeddedImage(postImage);
  const images = getEmbeddedImages(content);

  // Validate that the blob size of every image is less than
  // the max allowed bytes for an IC ingress message (2 MB).
  // Subtract 1 KB for additional payload data.
  const maxMessageSize = 1024 * 1024 * 2 - 1024; //2096640 bytes
  let errorImageName = '';

  if ((headerImage?.blob.size || 0) > maxMessageSize) {
    errorImageName = 'Header image';
  } else {
    const imageIndex = images.findIndex(
      (image) => image.blob.size > maxMessageSize
    );

    if (imageIndex > -1) {
      errorImageName = `Content image # ${imageIndex + 1}`;
    }
  }

  if (errorImageName) {
    toast(
      `${errorImageName} exceeded the maximum image size of ` +
        `${(maxMessageSize / 1024 / 1024).toFixed(3)} MBs after compression.`,
      ToastType.Error
    );

    return null;
  }

  // TODO: Remove temporary hack when parallel uploads are working without this.
  // Each call to the canister is 2 seconds, so the header image + 2 content images
  // will take 6 seconds just to get content ids, before uploading begins.
  if (headerImage) {
    headerImage.contentId = await getNewContentId();
  }
  for (let image of images) {
    image.contentId = await getNewContentId();
  }

  const promises = images.map((image) =>
    uploadBlob(
      image.blob,
      image.blob.size,
      image.mimeType,
      image.index.toString(),
      image.contentId
    )
  );

  if (headerImage) {
    promises.push(
      uploadBlob(
        headerImage.blob,
        headerImage.blob.size,
        headerImage.mimeType,
        '-1', // indicates header
        headerImage.contentId
      )
    );
  }

  let storageInfo = await Promise.all(promises);

  if (headerImage) {
    let headerImageStorageInfo = storageInfo.find(
      (info) => info.mappingId === '-1'
    );
    if (headerImageStorageInfo?.dataUrl) {
      headerUrl = headerImageStorageInfo.dataUrl;
    }
    storageInfo = storageInfo.filter((info) => info.mappingId !== '-1');
  }

  storageInfo.sort((a, b) => Number(a.mappingId) - Number(b.mappingId));

  let offset = 0;
  let c = content;
  for (const info of storageInfo) {
    const image = images.find((x) => x.index === Number(info.mappingId));
    if (image) {
      const start = image.index + offset;
      const end = start + image.length;
      const replacement = `"${info.dataUrl}"`; // could add additional attributes

      // replace base64 with url
      c = c.substring(0, start) + replacement + c.substring(end);

      offset += replacement.length - image.length;
    }
  }

  return { headerUrl, contentWithUrls: c };
};

export const getNuaEquivalance = (
  tokenPairs: PairInfo[],
  symbol: SupportedTokenSymbol,
  amount: number
) => {
  switch (symbol) {
    case 'NUA':
      return amount;
    case 'ICP':
      return getPriceBetweenTokens(tokenPairs, 'ICP', 'NUA', amount);
    case 'ckBTC':
      let ckbtcToIcp = getPriceBetweenTokens(
        tokenPairs,
        'ckBTC',
        'ICP',
        amount
      );
      return getPriceBetweenTokens(tokenPairs, 'ICP', 'NUA', ckbtcToIcp);
  }
};

export const getPriceBetweenTokens = (
  tokenPairs: PairInfo[],
  token0Symbol: SupportedTokenSymbol,
  token1Symbol: SupportedTokenSymbol,
  amount: number
) : number => {
  if(token0Symbol === token1Symbol){
    return amount
  }
  if(token0Symbol !== 'ICP' && token1Symbol !== 'ICP'){
    return getPriceBetweenTokens(tokenPairs, 'ICP', token1Symbol, getPriceBetweenTokens(tokenPairs, token0Symbol, 'ICP', amount))
  }  

  let token0 = '';
  let token1 = '';
  switch (token0Symbol) {
    case 'NUA':
      token0 = NUA_CANISTER_ID;
      break;
    case 'ICP':
      token0 = ICP_CANISTER_ID;
      break;
    case 'ckBTC':
      token0 = ckBTC_CANISTER_ID;
      break;
  }
  switch (token1Symbol) {
    case 'NUA':
      token1 = NUA_CANISTER_ID;
      break;
    case 'ICP':
      token1 = ICP_CANISTER_ID;
      break;
    case 'ckBTC':
      token1 = ckBTC_CANISTER_ID;
      break;
  }
  let poolIncludingUndefined = tokenPairs.map((poolValue) => {
    if (
      (poolValue.token0 === token0 && poolValue.token1 === token1) ||
      (poolValue.token1 === token0 && poolValue.token0 === token1)
    ) {
      return poolValue;
    }
  });

  let poolFiltered = poolIncludingUndefined.filter((val) => {
    return val !== undefined;
  });

  if (poolFiltered.length > 0) {
    let pool = poolFiltered[0];
    if (pool) {
      let reserveIn = 0;
      let reserveOut = 0;
      if (pool.token0 === ICP_CANISTER_ID) {
        reserveIn = Number(pool.reserve0);
      } else {
        reserveIn = Number(pool.reserve1);
      }
      if (pool.token1 !== ICP_CANISTER_ID) {
        reserveOut = Number(pool.reserve1);
      } else {
        reserveOut = Number(pool.reserve0);
      }
      
      var amountInWithFee = Math.pow(10, 8) * 997;
      var numerator = amountInWithFee * reserveOut;
      var denominator = reserveIn * 1000 + amountInWithFee;
      var amountOut = numerator / denominator;

      //amountOut means the ICP equivalance of the other token
      if(token0Symbol === 'ICP'){
        return (amount / Math.pow(10, 8)) * amountOut;
      }
      else{
        return amount / amountOut * Math.pow(10, 8)
      }
    } else {
      //the pool not found -> not fetched yet return 0
      return 0;
    }
  } else {
    //the pool not found -> not fetched yet return 0
    return 0;
  }
};


export const toBase256 = (num: number, digitCount: number) => {
  var base256Array : number[] = [];
  while (num > 0) {
    base256Array.unshift(num % 256);
    num = Math.floor(num / 256);
  }

  while (base256Array.length < digitCount) {
    base256Array.unshift(0);
  }

  return base256Array;
};