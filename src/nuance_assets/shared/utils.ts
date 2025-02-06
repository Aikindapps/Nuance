import { format, sub } from 'date-fns';
import { Metadata } from '../services/ext-service/ext_v2.did';
import { ToastType, toast } from '../services/toastService';
import { getNewContentId, uploadBlob } from '../services/storageService';
import {
  ICP_CANISTER_ID,
  NUA_CANISTER_ID,
  SupportedTokenSymbol,
  ckBTC_CANISTER_ID,
  ckUSDC_CANISTER_ID,
  getDecimalsByTokenSymbol,
  icons,
} from './constants';
import { PostType, TokenPrice } from '../types/types';
import { TagModel } from '../services/actorService';
import { SubscriptionTimeInterval } from '../../declarations/Subscription/Subscription.did';
import {
  Comment,
  SaveCommentModel,
} from '../../declarations/PostBucket/PostBucket.did';
import { Agent } from '@dfinity/agent';

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

export const timeAgo = (datePast: Date) => {
  const dateNow = new Date();
  const seconds = Math.floor((dateNow.getTime() - datePast.getTime()) / 1000);

  const pluralize = (count: number, noun: string) =>
    count === 1 ? noun : `${noun}s`;

  let interval = seconds / 31536000;
  if (interval > 1) {
    return `${Math.floor(interval)} ${pluralize(
      Math.floor(interval),
      'year'
    )} ago`;
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return `${Math.floor(interval)} ${pluralize(
      Math.floor(interval),
      'month'
    )} ago`;
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return `${Math.floor(interval)} ${pluralize(
      Math.floor(interval),
      'day'
    )} ago`;
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return `${Math.floor(interval)} ${pluralize(
      Math.floor(interval),
      'hour'
    )} ago`;
  }
  interval = seconds / 60;
  if (interval > 1) {
    return `${Math.floor(interval)} ${pluralize(
      Math.floor(interval),
      'minute'
    )} ago`;
  }
  return `${Math.floor(seconds)} ${pluralize(
    Math.floor(seconds),
    'second'
  )} ago`;
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
  if (rgb) {
    rgb.r = rgb.r * 0.8;
    rgb.g = rgb.g * 0.8;
    rgb.b = rgb.b * 0.8;
    return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  }
  return hex;
};
export const removeDuplicatesFromArray = (array: any[]) => {
  return [...new Set(array)];
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
  postImage: string,
  agent?: Agent
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
    headerImage.contentId = await getNewContentId(agent);
  }
  for (let image of images) {
    image.contentId = await getNewContentId(agent);
  }

  const promises = images.map((image) =>
    uploadBlob(
      image.blob,
      image.blob.size,
      image.mimeType,
      image.index.toString(),
      image.contentId,
      agent
    )
  );

  if (headerImage) {
    promises.push(
      uploadBlob(
        headerImage.blob,
        headerImage.blob.size,
        headerImage.mimeType,
        '-1', // indicates header
        headerImage.contentId,
        agent
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

export function areUint8ArraysEqual(
  arr1: Uint8Array | number[] | undefined,
  arr2: Uint8Array | number[] | undefined
): boolean {
  if (!arr1 || !arr2) {
    return false;
  }
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}

export const getNuaEquivalance = (
  tokenPrices: TokenPrice[],
  symbol: SupportedTokenSymbol,
  amount: number
) => {
  switch (symbol) {
    case 'NUA':
      return amount;
    case 'ICP':
      return getPriceBetweenTokens(tokenPrices, 'ICP', 'NUA', amount);
    case 'ckBTC':
      return getPriceBetweenTokens(tokenPrices, 'ckBTC', 'NUA', amount);
  }
};

export const getPriceBetweenTokens = (
  tokenPrices: TokenPrice[],
  token0Symbol: 'ICP' | 'ckBTC' | 'NUA' | 'ckUSDC',
  token1Symbol: 'ICP' | 'ckBTC' | 'NUA' | 'ckUSDC',
  amount: number
): number => {
  if (token0Symbol === token1Symbol) {
    return amount;
  }
  if (token0Symbol === 'ICP') {
    let oneIcpEquivelance = tokenPrices.find((value) => {
      return value.tokenSymbol === token1Symbol;
    })?.icpEquivalence as number;
    return (
      (amount * oneIcpEquivelance) /
      Math.pow(10, getDecimalsByTokenSymbol(token1Symbol))
    );
  } else {
    let token0IcpEquivelance =
      (tokenPrices.find((value) => {
        return value.tokenSymbol === token0Symbol;
      })?.icpEquivalence as number) /
      Math.pow(10, getDecimalsByTokenSymbol(token0Symbol));
    let token1IcpEquivelance =
      token1Symbol === 'ICP'
        ? 1
        : (tokenPrices.find((value) => {
          return value.tokenSymbol === token1Symbol;
        })?.icpEquivalence as number) /
        Math.pow(10, getDecimalsByTokenSymbol(token1Symbol));
    return amount * (token1IcpEquivelance / token0IcpEquivelance);
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

export function truncateToDecimalPlace(
  num: number,
  decimalPlaces: number
): string {
  const numStr = parseFloat(num.toString()).toFixed(decimalPlaces + 20);

  const dotIndex = numStr.indexOf('.');

  if (dotIndex === -1 || decimalPlaces < 0) {
    return numStr;
  }

  const cutIndex = dotIndex + decimalPlaces + 1;
  return numStr.substring(0, cutIndex);
}

export const getIconForSocialChannel = (url: string, dark: boolean) => {
  let input = url;
  if (input.startsWith('https://') || input.startsWith('http://')) {
    input = new URL(input).hostname;
  }
  input = input.split('/')[0];
  const psl = require('psl');
  const supportedChannels = [
    ['whatsapp', 'com'],
    ['youtube', 'com'],
    ['discord', 'com'],
    ['telegram', 'org'],
    ['x', 'com'],
    ['twitter', 'com'],
    ['linkedin', 'com'],
    ['wechat', 'com'],
    ['facebook', 'com'],
    ['instagram', 'com'],
    ['dscvr', 'one'],
    ['distrikt', 'app'],
    ['reddit', 'com'],
    ['medium', 'com'],
    ['pinterest', 'com'],
    ['snapchat', 'com'],
    ['tiktok', 'com'],
    ['dfinity', 'org'],
    ['oc', 'app'],
    ['taggr', 'link'],
  ];
  const path = '/assets/images/icons/social-channels/';
  for (const supportedChannel of supportedChannels) {
    if (
      psl.parse(input).domain ===
      supportedChannel[0] + '.' + supportedChannel[1]
    ) {
      return path + supportedChannel[0] + '.svg';
    }
  }
  return dark ? icons.WEBSITE_ICON_DARK : icons.WEBSITE_ICON;
};

function getTitleTexts(post: PostType): string {
  let title = post.title;
  let resultArr = [];
  if (title.length <= 35) {
    resultArr = [title];
  } else {
    const words = title.split(' ');
    let firstLine = '';
    let secondLine = '';
    let isFirstLineAllowed = true;
    let isSecondLineAllowed = true;
    for (const word of words) {
      if (firstLine.length + word.length < 34 && isFirstLineAllowed) {
        firstLine += ` ${word}`;
      } else {
        isFirstLineAllowed = false;
        if (secondLine.length + word.length < 31 && isSecondLineAllowed) {
          secondLine += ` ${word}`;
        } else if (isSecondLineAllowed) {
          secondLine += '...';
          isSecondLineAllowed = false;
        }
      }
    }
    resultArr = [firstLine, secondLine];
  }
  let resultStr = '';
  resultArr.forEach((item, index) => {
    resultStr += `<text

    opacity=".9"
    x="80"
    y="${380 + index * 35}"
    font-size="28"
    font-family="Georgia"
    font-style="normal"
    font-weight="400"
    line-height="30px"
    fill="#ffffff"
  >
    ${item}
  </text>`;
  });
  return resultStr;
}

function getSubtitleTexts(post: PostType): string {
  let subtitle = post.subtitle;
  let resultArr = [];
  if (subtitle.length <= 55) {
    resultArr = [subtitle];
  } else {
    const words = subtitle.split(' ');
    let firstLine = '',
      secondLine = '',
      thirdLine = '';
    let isFirstLineAllowed = true,
      isSecondLineAllowed = true,
      isThirdLineAllowed = true;
    for (const word of words) {
      if (firstLine.length + word.length < 55 && isFirstLineAllowed) {
        firstLine += ` ${word}`;
      } else {
        isFirstLineAllowed = false;
        if (secondLine.length + word.length < 55 && isSecondLineAllowed) {
          secondLine += ` ${word}`;
        } else {
          isSecondLineAllowed = false;
          if (thirdLine.length + word.length < 52 && isThirdLineAllowed) {
            thirdLine += ` ${word}`;
          } else if (isThirdLineAllowed) {
            thirdLine += '...';
            isThirdLineAllowed = false;
          }
        }
      }
    }
    resultArr = [firstLine, secondLine, thirdLine];
  }
  let resultStr = '';
  resultArr.forEach((item, index) => {
    resultStr += `<text
    opacity=".9"
    x="80"
    y="${470 + index * 25}"
    font-size="19.4"
    font-family="Georgia"
    font-style="normal"
    font-weight="400"
    line-height="28px"
    fill="#B2B2B2"
  >
    ${item}
  </text>`;
  });
  return resultStr;
}

export function buildSvgForPremiumArticle(post: PostType, handle: string) {
  return `<svg width="659" height="709" viewBox="0 0 659 709" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="min-height:150px;max-width:250px;max-height:250px">
  <path stroke="url(#a)" stroke-width="4" d="M537 590h120v117H537z"/>
  <path stroke="url(#b)" stroke-width="4" d="M546 490h78v76h-78z"/>
  <path stroke="url(#c)" stroke-width="4" d="M439 617h53v52h-53z"/>
  <g filter="url(#d)">
    <path d="m12.685 36.613 27.189-24.167a8 8 0 0 1 11.421.811L584.424 643.23c3.349 3.957 2.107 10.005-2.529 12.324l-39.206 19.602a8 8 0 0 1-3.578.845H18a8 8 0 0 1-8-8V42.593a8 8 0 0 1 2.685-5.98" fill="url(#e)"/>
  </g>
  <g filter="url(#f)">
    <path fill="#fff" d="M54.828 14.71H589.78V645H54.828z"/>
  </g>
  <g filter="url(#g)">
    <path fill="#fff" d="M50.414 10.297h534.952v630.29H50.414z"/>
  </g>
  <g filter="url(#h)">
    <path fill="#151451" d="M46 5h534.952v630.29H46z"/>
  </g>
  <path d="M46 11a6 6 0 0 1 6-6h529v329H46z" fill="url(#i)"/>
  <path fill="url(#j)" d="M571 288h10v140h-10z"/>
  <path fill="#151451" d="M79 305.138h29.131v29.131H79z"/>
  <path fill="#D9D9D9" d="M86.2 312.972h14.566v1.821H86.2zm0 5.462h14.566v1.821H86.2zm0 5.463h7.283v1.821H86.2z"/>
  <path d="M581 635.405c-174.5 0-520.058.095-529.5.095-9.842 0-5 12.5 7.734 12.5H590" stroke="#151451"/>
  <path fill="url(#k)" style="mix-blend-mode:multiply" d="M46 4h22v631H46z"/>
  <path opacity=".4" d="M100 4h451l-58.71 308-47.463 249L100 633z" fill="url(#l)"/>
  ${getTitleTexts(post)}
  ${getSubtitleTexts(post)}
  <text x="80" y="612" font-size="21.4" font-family="Arial" font-weight="700" fill="#fff">@${handle}</text>
  <defs>
    <linearGradient id="a" x1="597" y1="588" x2="597" y2="709" gradientUnits="userSpaceOnUse">
      <stop stop-color="#25F68D"/>
      <stop offset="1" stop-color="#1BC0F2"/>
    </linearGradient>
    <linearGradient id="b" x1="585" y1="488" x2="585" y2="568" gradientUnits="userSpaceOnUse">
      <stop stop-color="#25F68D"/>
      <stop offset="1" stop-color="#1BC0F2"/>
    </linearGradient>
    <linearGradient id="c" x1="465.5" y1="615" x2="465.5" y2="671" gradientUnits="userSpaceOnUse">
      <stop stop-color="#25F68D"/>
      <stop offset="1" stop-color="#1BC0F2"/>
    </linearGradient>
    <linearGradient id="e" x1="409" y1="273" x2="105" y2="676" gradientUnits="userSpaceOnUse">
      <stop stop-color="#D9D9D9"/>
      <stop offset="1" stop-color="#CDCDCD" stop-opacity=".24"/>
    </linearGradient>
    <linearGradient id="j" x1="576" y1="288" x2="576" y2="428" gradientUnits="userSpaceOnUse">
      <stop stop-color="#25F68D"/>
      <stop offset="1" stop-color="#1BC0F2"/>
    </linearGradient>
    <linearGradient id="k" x1="68" y1="219" x2="38.667" y2="219" gradientUnits="userSpaceOnUse">
      <stop stop-color="#D9D9D9" stop-opacity="0"/>
      <stop offset=".49" stop-color="#C6C6C6"/>
      <stop offset="1" stop-color="#D9D9D9" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="l" x1="522.408" y1="-206.236" x2="54.907" y2="157.836" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fff"/>
      <stop offset=".516" stop-color="#fff" stop-opacity=".672"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <filter id="d" x="0" y=".425" width="596.318" height="685.575" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feGaussianBlur stdDeviation="5" result="effect1_foregroundBlur_3082_8737"/>
    </filter>
    <filter id="f" x="51.297" y="14.71" width="542.014" height="637.352" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="3.531"/>
      <feGaussianBlur stdDeviation="1.766"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
      <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_3082_8737"/>
      <feBlend in="SourceGraphic" in2="effect1_dropShadow_3082_8737" result="shape"/>
    </filter>
    <filter id="g" x="46.883" y="10.297" width="542.014" height="637.352" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="3.531"/>
      <feGaussianBlur stdDeviation="1.766"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
      <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_3082_8737"/>
      <feBlend in="SourceGraphic" in2="effect1_dropShadow_3082_8737" result="shape"/>
    </filter>
    <filter id="h" x="42.469" y="5" width="542.014" height="637.352" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="3.531"/>
      <feGaussianBlur stdDeviation="1.766"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
      <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_3082_8737"/>
      <feBlend in="SourceGraphic" in2="effect1_dropShadow_3082_8737" result="shape"/>
    </filter>
    <pattern id="i" patternContentUnits="objectBoundingBox" width="1" height="1">
      <use xlink:href="#m" transform="matrix(.00192 0 0 .00312 -.086 0)"/>
    </pattern>
    <image id="m" width="612" height="321" xlink:href="${post.headerImage}"/>
  </defs>
</svg>
`;
}
export const searchTextToTag = (input: string, allTags: TagModel[]) => {
  const tagNames = [...input.matchAll(/#[^#]+/gm)].map((x) =>
    x[0].trim().replace(/ +/g, ' ')
  );
  let validTagNames: TagModel[] = [];
  for (const tagName of tagNames) {
    if (tagName.startsWith('#') && tagName.length > 1) {
      const found = allTags.find(
        (t: any) => t.value.toUpperCase() === tagName.substring(1).toUpperCase()
      );
      if (found) {
        validTagNames.push(found);
      }
    }
  }
  return validTagNames;
};

export const textToUrlSegment = (text: string) => {
  var prevHypen = false;
  var result = '';
  for (const char of text) {
    if (isDigit(char) || isAlphabetic(char)) {
      result += char;
      prevHypen = false;
    } else if (char === '-' || char === ' ') {
      if (!prevHypen) {
        result += '-';
        prevHypen = true;
      }
    }
  }
  return result;
};

const isDigit = (c: string) => {
  return typeof c === 'string' && c.length === 1 && c >= '0' && c <= '9';
};
const isAlphabetic = (char: string) => {
  return char.toUpperCase() != char.toLowerCase();
};

export const convertSubscriptionTimeInterval = (
  timeInterval: SubscriptionTimeInterval
) => {
  if ('Weekly' in timeInterval) {
    return 'Weekly';
  } else if ('Monthly' in timeInterval) {
    return 'Monthly';
  } else if ('Annually' in timeInterval) {
    return 'Annually';
  } else {
    return 'Lifetime';
  }
};

export const buildTempComment = (
  bucketCanisterId: string,
  commentModel: SaveCommentModel,
  handle: string,
  avatar: string,
  comment?: Comment
): Comment => {
  return {
    creator: 'TEMP',
    handle,
    avatar,
    postId: commentModel.postId,
    content: commentModel.content,
    commentId: comment ? comment.commentId : new Date().getTime().toString(),
    createdAt: comment ? comment.createdAt : '0',
    downVotes: comment ? comment.downVotes : ([] as string[]),
    upVotes: comment ? comment.upVotes : ([] as string[]),
    replies: comment ? (comment.replies as Comment[]) : ([] as Comment[]),
    repliedCommentId: commentModel.replyToCommentId,
    editedAt: comment ? comment.editedAt : [],
    bucketCanisterId,
    isCensored: false,
    isVerified: false,
  };
};