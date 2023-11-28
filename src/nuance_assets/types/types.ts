import internal from 'stream';

export type SocialLinksObject = {
  website: string;
  twitter: string;
  dscvr: string;
  distrikt: string;
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
  styling: PublicationStylingObject
  cta: PublicationCta;

};


export type PublicationStylingObject = {
  fontType: string;
  primaryColor: string;
  logo: string;
}

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
  nuaTokens: number;
  followersCount: number;
};

export type UserListItem = {
  handle: string;
  avatar: string;
  displayName: string;
  fontType: string;
  bio: string;
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
  bucketCanisterId: string;
  wordCount: string;


  // populated for post lists after calling
  // getUsersByHandles in User canister
  avatar?: string;
  creator?: string;
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
}

export type PremiumArticleOwners = {
  postId: string;
  totalSupply: string;
  available: string;
  ownersList: PremiumArticleOwner[];
}

export type PremiumArticleOwner = {
  handle: string;
  accountId: string;
  accessKeyIndex: string;
}

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
}


export type PremiumArticleSaleInformation = {
  cheapestTokenIndex : string,
  cheapesTokenAccesKeyIndex : string,
  totalSupply : string,
  available : string,
  nftCanisterId : string,
  cheapestPrice : string,
  cheapestTokenIdentifier : string,
  postId : string,
  soldOut: boolean
}

export type PairInfo = {
  'id' : string,
  'reserve0' : number,
  'reserve1' : number,
  'token0' : string,
  'token1' : string
}