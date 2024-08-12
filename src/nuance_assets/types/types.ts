import internal from 'stream';
import { SupportedTokenSymbol } from '../shared/constants';
import { UserPostCounts } from '../services/actorService';
import {Notifications, NotificationContent, NotificationType} from '../services/actorService';

export type SocialLinksObject = {
  website: string;
  socialChannels: string[];
};

export type PublicationCta = {
  icon: string;
  link: string;
  ctaCopy: string;
  buttonCopy: string;
};

export type PublicationType = {
  publicationHandle: string;
  publicationTitle: string;
  editors: Array<string>;
  writers: Array<string>;
  headerImage: string;
  subtitle: string;
  description: string;
  categories: Array<string>;
  socialLinks: SocialLinksObject;
  avatar: string;
  created: string;
  modified: string;
  styling: PublicationStylingObject;
  cta: PublicationCta;
  nftCanisterId: string;
  postCounts?: UserPostCounts;
  userListItem?: UserListItem;
};

export type PublicationStylingObject = {
  fontType: string;
  primaryColor: string;
  logo: string;
};

export type PublicationObject = {
  publicationName: string;
  isEditor: boolean;
};

export type UserType = {
  handle: string;
  avatar: string;
  displayName: string;
  bio: string;
  accountCreated: string;
  lastLogin: number;
  followedTags: Array<string>;
  followers: Array<string>;
  followersArray: Array<string>;
  publicationsArray: Array<PublicationObject>;
  website: string;
  socialChannels: Array<string>;
  nuaTokens: number;
  followersCount: number;
  claimInfo: UserClaimInfoType;
};

type UserClaimInfoType = {
  isUserBlocked: boolean;
  maxClaimableTokens: number;
  subaccount: [] | [Uint8Array | number[]];
  lastClaimDate: [] | [number];
  isClaimActive: boolean;
};

export type ClaimTransactionHistoryItem = {
  date: string;
  claimedAmount: number;
};

export type SubscriptionHistoryItem = {
  date: string;
  subscriptionFee: number;
  handle: string;
  isWriter: boolean;
};

export type UserListItem = {
  handle: string;
  avatar: string;
  displayName: string;
  fontType: string;
  bio: string;
  website: string;
  socialChannelsUrls: string[];
  followersCount: string;
  postCounts?: UserPostCounts;
};

//TODO: phase out in postStore and use Post type from canister
export type PostType = {
  postId: string;
  handle: string;
  title: string;
  url: string;
  subtitle: string;
  headerImage: string;
  content: string;
  isDraft: boolean;
  created: string;
  modified: string;
  publishedDate: string;
  views: string;
  //wordCount: BigInt
  tags: Array<{ tagId: string; tagName: string }>;
  claps: string;
  category: string;
  isPremium: boolean;
  isMembersOnly: boolean;
  nftCanisterId?: [] | [string];
  premiumArticleSaleInfo?: PremiumArticleSaleInformation;
  bucketCanisterId: string;
  wordCount: string;

  principal?: string;

  // populated for post lists after calling
  // getUsersByHandles in User canister
  avatar?: string;
  creatorHandle: string;
  creatorPrincipal: string;
  isPublication?: boolean;
  displayName?: string;
  fontType?: string;
};

export type PostSaveModel = {
  postId: string;
  title: string;
  subtitle: string;
  headerImage: string;
  content: string;
  isDraft: boolean;
  tagIds: Array<string>;
  creator: string;
  isPublication: boolean;
  category: string;
  isPremium: boolean;
};

export type NftCanisterEntry = {
  canisterId: string;
  handle: string;
};

export type LockTokenReturn = {
  balance?: bigint;
  sellerAccountId?: string;
  err?: string;
};

export type UserWallet = {
  accountId: string;
  principal: string;
};

export type PremiumArticleOwners = {
  postId: string;
  totalSupply: string;
  available: string;
  ownersList: PremiumArticleOwner[];
};

export type PremiumArticleOwner = {
  handle: string;
  accountId: string;
  accessKeyIndex: string;
};

export type PremiumPostActivityListItem = {
  postId: string;
  title: string;
  url: string;
  writer: string;
  tokenIndex: string;
  accessKeyIndex: string;
  ownedByUser: boolean;
  canisterId: string;
  date: string;
  totalSupply: string;
  tokenIdentifier?: string;
  activity: string;
  userAccountId: string;
  sellerAddresses: string[];
};

export type PremiumArticleSaleInformation = {
  tokenIndex: number;
  totalSupply: number;
  currentSupply: number;
  nftCanisterId: string;
  priceReadable: string;
  price_e8s: number;
};

export type PairInfo = {
  id: string;
  reserve0: number;
  reserve1: number;
  token0: string;
  token1: string;
};

export type ApplaudListItem = {
  applauds: number;
  date: string;
  tokenAmount: number;
  isSender: boolean;
  applaudId: string;
  currency: string;
  postId: string;
  url: string;
  handle: string;
  title: string;
  bucketCanisterId: string;
};

export type TransactionListItem = {
  date: string;
  currency: SupportedTokenSymbol;
  receiver: string;
  sender: string;
  isDeposit: boolean;
  amount: number;
};

export type CreatePremiumArticleData = {
  thumbnail: string;
  icpPrice: bigint;
  maxSupply: bigint;
};

export type MoreFromThisAuthor = {
  authorArticles: PostType[];
  publicationArticles: PostType[];
};
