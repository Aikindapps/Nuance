import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export type AccessKeyIndex = string;
export type AccountIdentifier = string;
export type AccountIdentifier__1 = string;
export type AssetHandle = string;
export type AssetId = number;
export type AssetType = { 'other' : string } |
  { 'canister' : { 'id' : AssetId, 'canister' : string } } |
  { 'direct' : Uint32Array };
export type Balance = bigint;
export interface BalanceRequest { 'token' : TokenIdentifier, 'user' : User }
export type BalanceResponse = { 'ok' : Balance } |
  { 'err' : CommonError__1 };
export type Balance__1 = bigint;
export type ChunkId = number;
export type CommonError = { 'InvalidToken' : TokenIdentifier } |
  { 'Other' : string };
export type CommonError__1 = { 'InvalidToken' : TokenIdentifier } |
  { 'Other' : string };
export interface EXTNFT {
  'acceptCycles' : ActorMethod<[], undefined>,
  'addAsset' : ActorMethod<
    [AssetHandle, number, string, string, string],
    undefined
  >,
  'addThumbnail' : ActorMethod<[AssetHandle, Uint8Array], undefined>,
  'adminKillHeartbeat' : ActorMethod<[], undefined>,
  'adminStartHeartbeat' : ActorMethod<[], undefined>,
  'allSettlements' : ActorMethod<
    [],
    Array<
      [
        TokenIndex,
        {
          'subaccount' : SubAccount__1,
          'seller' : Principal,
          'buyer' : AccountIdentifier__1,
          'price' : bigint,
        },
      ]
    >
  >,
  'availableCycles' : ActorMethod<[], bigint>,
  'balance' : ActorMethod<[BalanceRequest], BalanceResponse>,
  'bearer' : ActorMethod<[TokenIdentifier__1], Result_8>,
  'canisterId' : ActorMethod<[], Principal>,
  'details' : ActorMethod<[TokenIdentifier__1], Result_11>,
  'ext_addAssetCanister' : ActorMethod<[], undefined>,
  'ext_admin' : ActorMethod<[], Principal>,
  'ext_assetAdd' : ActorMethod<
    [AssetHandle, string, string, AssetType, bigint],
    undefined
  >,
  'ext_assetExists' : ActorMethod<[AssetHandle], boolean>,
  'ext_assetFits' : ActorMethod<[boolean, bigint], boolean>,
  'ext_assetStream' : ActorMethod<[AssetHandle, Uint8Array, boolean], boolean>,
  'ext_balance' : ActorMethod<[BalanceRequest], BalanceResponse>,
  'ext_bearer' : ActorMethod<[TokenIdentifier__1], Result_8>,
  'ext_capInit' : ActorMethod<[], undefined>,
  'ext_expired' : ActorMethod<[], Array<[AccountIdentifier__1, SubAccount__1]>>,
  'ext_extensions' : ActorMethod<[], Array<Extension>>,
  'ext_marketplaceList' : ActorMethod<[ListRequest], Result_4>,
  'ext_marketplaceList_multiple' : ActorMethod<
    [Array<ListRequest>],
    Array<Result_4>
  >,
  'ext_marketplaceListings' : ActorMethod<
    [],
    Array<[TokenIndex, Listing, Metadata]>
  >,
  'ext_marketplacePurchase' : ActorMethod<
    [TokenIdentifier__1, bigint, AccountIdentifier__1],
    Result_10
  >,
  'ext_marketplaceSettle' : ActorMethod<[AccountIdentifier__1], Result_4>,
  'ext_marketplaceStats' : ActorMethod<
    [],
    [bigint, bigint, bigint, bigint, bigint, bigint, bigint]
  >,
  'ext_marketplaceTransactions' : ActorMethod<[], Array<Transaction>>,
  'ext_metadata' : ActorMethod<[TokenIdentifier__1], Result_9>,
  'ext_mint' : ActorMethod<
    [Array<[AccountIdentifier__1, Metadata]>],
    Uint32Array
  >,
  'ext_payments' : ActorMethod<[], Array<[AccountIdentifier__1, Payment]>>,
  'ext_removeAdmin' : ActorMethod<[], undefined>,
  'ext_saleClose' : ActorMethod<[], boolean>,
  'ext_saleCurrent' : ActorMethod<[], [] | [Sale]>,
  'ext_saleEnd' : ActorMethod<[], boolean>,
  'ext_saleOpen' : ActorMethod<
    [Array<SalePricingGroup>, SaleRemaining, Array<AccountIdentifier__1>],
    boolean
  >,
  'ext_salePause' : ActorMethod<[], boolean>,
  'ext_salePurchase' : ActorMethod<
    [bigint, bigint, bigint, AccountIdentifier__1],
    Result_6
  >,
  'ext_saleResume' : ActorMethod<[], boolean>,
  'ext_saleSettings' : ActorMethod<[AccountIdentifier__1], [] | [SaleDetails]>,
  'ext_saleSettle' : ActorMethod<[AccountIdentifier__1], Result_5>,
  'ext_saleTransactions' : ActorMethod<[], Array<SaleTransaction>>,
  'ext_saleUpdate' : ActorMethod<
    [
      [] | [Array<SalePricingGroup>],
      [] | [SaleRemaining],
      [] | [Array<AccountIdentifier__1>],
    ],
    boolean
  >,
  'ext_setAdmin' : ActorMethod<[Principal], undefined>,
  'ext_setCollectionMetadata' : ActorMethod<[string, string], undefined>,
  'ext_setMarketplaceOpen' : ActorMethod<[Time], undefined>,
  'ext_setOwner' : ActorMethod<[Principal], undefined>,
  'ext_setRoyalty' : ActorMethod<
    [Array<[AccountIdentifier__1, bigint]>],
    undefined
  >,
  'ext_setSaleRoyalty' : ActorMethod<[AccountIdentifier__1], undefined>,
  'ext_transfer' : ActorMethod<[TransferRequest], TransferResponse>,
  'extdata_supply' : ActorMethod<[TokenIdentifier__1], Result_3>,
  'extensions' : ActorMethod<[], Array<Extension>>,
  'failedSales' : ActorMethod<[], Array<[AccountIdentifier__1, SubAccount__1]>>,
  'getAccessKeyIndexByTokenIndex' : ActorMethod<[string], AccessKeyIndex>,
  'getMetadata' : ActorMethod<[], Array<[TokenIndex, MetadataLegacy]>>,
  'getMinter' : ActorMethod<[], Principal>,
  'getOwnersOfPost' : ActorMethod<
    [string],
    Array<[AccessKeyIndex, AccountIdentifier__1]>
  >,
  'getRegistry' : ActorMethod<[], Array<[TokenIndex, AccountIdentifier__1]>>,
  'getTokens' : ActorMethod<[], Array<[TokenIndex, MetadataLegacy]>>,
  'getUserAllowedPostIds' : ActorMethod<[string], Array<string>>,
  'heartbeat_assetCanisters' : ActorMethod<[], undefined>,
  'heartbeat_capEvents' : ActorMethod<[], undefined>,
  'heartbeat_disbursements' : ActorMethod<[], undefined>,
  'heartbeat_external' : ActorMethod<[], undefined>,
  'heartbeat_isRunning' : ActorMethod<[], boolean>,
  'heartbeat_paymentSettlements' : ActorMethod<[], undefined>,
  'heartbeat_pending' : ActorMethod<[], Array<[string, bigint]>>,
  'heartbeat_start' : ActorMethod<[], undefined>,
  'heartbeat_stop' : ActorMethod<[], undefined>,
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  'http_request_streaming_callback' : ActorMethod<
    [HttpStreamingCallbackToken],
    HttpStreamingCallbackResponse
  >,
  'http_request_update' : ActorMethod<[HttpRequest], HttpResponse>,
  'indexToTokenId' : ActorMethod<[TokenIndex], TokenIdentifier__1>,
  'isHeartbeatRunning' : ActorMethod<[], boolean>,
  'list' : ActorMethod<[ListRequest], Result_4>,
  'listings' : ActorMethod<[], Array<[TokenIndex, Listing, MetadataLegacy]>>,
  'lock' : ActorMethod<
    [TokenIdentifier__1, bigint, AccountIdentifier__1, SubAccount__1],
    Result_8
  >,
  'metadata' : ActorMethod<[TokenIdentifier__1], Result_7>,
  'reserve' : ActorMethod<
    [bigint, bigint, AccountIdentifier__1, SubAccount__1],
    Result_6
  >,
  'retreive' : ActorMethod<[AccountIdentifier__1], Result_5>,
  'saleTransactions' : ActorMethod<[], Array<SaleTransaction>>,
  'salesSettings' : ActorMethod<[AccountIdentifier__1], SaleSettings>,
  'setMinter' : ActorMethod<[Principal], undefined>,
  'settle' : ActorMethod<[TokenIdentifier__1], Result_4>,
  'settlements' : ActorMethod<
    [],
    Array<[TokenIndex, AccountIdentifier__1, bigint]>
  >,
  'stats' : ActorMethod<
    [],
    [bigint, bigint, bigint, bigint, bigint, bigint, bigint]
  >,
  'supply' : ActorMethod<[TokenIdentifier__1], Result_3>,
  'tokens' : ActorMethod<[AccountIdentifier__1], Result_2>,
  'tokens_ext' : ActorMethod<[AccountIdentifier__1], Result_1>,
  'tokens_ext_metadata' : ActorMethod<[AccountIdentifier__1], Result>,
  'transactions' : ActorMethod<[], Array<Transaction>>,
  'transfer' : ActorMethod<[TransferRequest], TransferResponse>,
}
export type Extension = string;
export type HeaderField = [string, string];
export interface HttpRequest {
  'url' : string,
  'method' : string,
  'body' : Uint8Array,
  'headers' : Array<HeaderField>,
}
export interface HttpResponse {
  'body' : Uint8Array,
  'headers' : Array<HeaderField>,
  'upgrade' : boolean,
  'streaming_strategy' : [] | [HttpStreamingStrategy],
  'status_code' : number,
}
export interface HttpStreamingCallbackResponse {
  'token' : [] | [HttpStreamingCallbackToken],
  'body' : Uint8Array,
}
export interface HttpStreamingCallbackToken {
  'key' : string,
  'sha256' : [] | [Uint8Array],
  'index' : bigint,
  'content_encoding' : string,
}
export type HttpStreamingStrategy = {
    'Callback' : {
      'token' : HttpStreamingCallbackToken,
      'callback' : [Principal, string],
    }
  };
export interface ListRequest {
  'token' : TokenIdentifier__1,
  'from_subaccount' : [] | [SubAccount__1],
  'price' : [] | [bigint],
}
export interface Listing {
  'locked' : [] | [Time],
  'seller' : Principal,
  'price' : bigint,
}
export type Memo = Uint8Array;
export type Metadata = {
    'fungible' : {
      'decimals' : number,
      'metadata' : [] | [MetadataContainer],
      'name' : string,
      'symbol' : string,
    }
  } |
  {
    'nonfungible' : {
      'thumbnail' : string,
      'asset' : string,
      'metadata' : [] | [MetadataContainer],
      'name' : string,
    }
  };
export type MetadataContainer = { 'blob' : Uint8Array } |
  { 'data' : Array<MetadataValue> } |
  { 'json' : string };
export type MetadataLegacy = {
    'fungible' : {
      'decimals' : number,
      'metadata' : [] | [Uint8Array],
      'name' : string,
      'symbol' : string,
    }
  } |
  { 'nonfungible' : { 'metadata' : [] | [Uint8Array] } };
export type MetadataValue = [
  string,
  { 'nat' : bigint } |
    { 'blob' : Uint8Array } |
    { 'nat8' : number } |
    { 'text' : string },
];
export interface Payment {
  'expires' : Time,
  'subaccount' : SubAccount__1,
  'payer' : AccountIdentifier__1,
  'amount' : bigint,
  'purchase' : PaymentType,
}
export type PaymentType = { 'nft' : TokenIndex } |
  { 'nfts' : Uint32Array } |
  { 'sale' : bigint };
export type Result = {
    'ok' : Array<[TokenIndex, [] | [Listing], Metadata, TokenIdentifier__1]>
  } |
  { 'err' : string };
export type Result_1 = {
    'ok' : Array<[TokenIndex, [] | [Listing], [] | [Uint8Array]]>
  } |
  { 'err' : CommonError };
export type Result_10 = { 'ok' : [AccountIdentifier__1, bigint] } |
  { 'err' : CommonError };
export type Result_11 = { 'ok' : [AccountIdentifier__1, [] | [Listing]] } |
  { 'err' : CommonError };
export type Result_2 = { 'ok' : Uint32Array } |
  { 'err' : CommonError };
export type Result_3 = { 'ok' : Balance__1 } |
  { 'err' : CommonError };
export type Result_4 = { 'ok' : null } |
  { 'err' : CommonError };
export type Result_5 = { 'ok' : null } |
  { 'err' : string };
export type Result_6 = { 'ok' : [AccountIdentifier__1, bigint] } |
  { 'err' : string };
export type Result_7 = { 'ok' : MetadataLegacy } |
  { 'err' : CommonError };
export type Result_8 = { 'ok' : AccountIdentifier__1 } |
  { 'err' : CommonError };
export type Result_9 = { 'ok' : Metadata } |
  { 'err' : CommonError };
export interface Sale {
  'end' : Time,
  'groups' : Array<SalePricingGroup>,
  'start' : Time,
  'quantity' : bigint,
  'remaining' : SaleRemaining,
}
export interface SaleDetailGroup {
  'id' : bigint,
  'end' : Time,
  'name' : string,
  'available' : boolean,
  'pricing' : Array<[bigint, bigint]>,
  'start' : Time,
}
export interface SaleDetails {
  'end' : Time,
  'groups' : Array<SaleDetailGroup>,
  'start' : Time,
  'quantity' : bigint,
  'remaining' : bigint,
}
export interface SalePricingGroup {
  'end' : Time,
  'participants' : Array<AccountIdentifier__1>,
  'name' : string,
  'limit' : [bigint, bigint],
  'pricing' : Array<[bigint, bigint]>,
  'start' : Time,
}
export type SaleRemaining = { 'retain' : null } |
  { 'burn' : null } |
  { 'send' : AccountIdentifier__1 };
export interface SaleSettings {
  'startTime' : Time,
  'whitelist' : boolean,
  'totalToSell' : bigint,
  'sold' : bigint,
  'bulkPricing' : Array<[bigint, bigint]>,
  'whitelistTime' : Time,
  'salePrice' : bigint,
  'remaining' : bigint,
  'price' : bigint,
}
export interface SaleTransaction {
  'time' : Time,
  'seller' : Principal,
  'tokens' : Uint32Array,
  'buyer' : AccountIdentifier__1,
  'price' : bigint,
}
export type SubAccount = Uint8Array;
export type SubAccount__1 = Uint8Array;
export type Time = bigint;
export type TokenIdentifier = string;
export type TokenIdentifier__1 = string;
export type TokenIndex = number;
export interface Transaction {
  'token' : TokenIndex,
  'time' : Time,
  'seller' : AccountIdentifier__1,
  'buyer' : AccountIdentifier__1,
  'price' : bigint,
}
export interface TransferRequest {
  'to' : User,
  'token' : TokenIdentifier,
  'notify' : boolean,
  'from' : User,
  'memo' : Memo,
  'subaccount' : [] | [SubAccount],
  'amount' : Balance,
}
export type TransferResponse = { 'ok' : Balance } |
  {
    'err' : { 'CannotNotify' : AccountIdentifier } |
      { 'InsufficientBalance' : null } |
      { 'InvalidToken' : TokenIdentifier } |
      { 'Rejected' : null } |
      { 'Unauthorized' : AccountIdentifier } |
      { 'Other' : string }
  };
export type User = { 'principal' : Principal } |
  { 'address' : AccountIdentifier };
export interface _SERVICE extends EXTNFT {}
