import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import List "mo:base/List";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import UserTypes "./types_user_canister";
import PostCoreTypes "../../../src/PostCore/types";
import Time "mo:base/Time";
import ExtCore "../motoko/ext/Core";
import Result "mo:base/Result";

module {

  type Time = Time.Time;
  type User = UserTypes.User;
  type PostSaveModel = PostCoreTypes.PostSaveModel;
  type Post = PostCoreTypes.Post;
  type TokenIndex = ExtCore.TokenIndex;
  type TransferResponse = ExtCore.TransferResponse;
  type PostSaveResult = PostCoreTypes.SaveResult;
  type PostKeyProperties = PostCoreTypes.PostKeyProperties;
  type PostBucketType = PostCoreTypes.PostBucketType;
  type PostSaveModelBucket = PostCoreTypes.PostSaveModelBucket;
  // public type UserId = Principal;
  // public type Followers = List.List<Text>;

  public type Publication = {
    publicationHandle : Text;
    publicationTitle : Text;
    editors : [Text];
    writers : [Text];
    headerImage : Text;
    subtitle : Text;
    description : Text;
    categories : [Text];
    socialLinks : SocialLinksObject;
    avatar : Text;
    created : Text;
    modified : Text;
    styling : PublicationStyling;
    cta : PublicationCta;
  };

  public type PublicationCta = {
    buttonCopy : Text;
    ctaCopy : Text;
    link : Text;
    icon : Text;
  };

  public type PublicationStyling = {
    fontType : Text;
    primaryColor : Text;
    logo : Text;
  };

  public type SocialLinksObject = {
    website : Text;
    twitter : Text;
    dscvr : Text;
    distrikt : Text;
  };
  public type Followers = List.List<Text>;

  public type CrossCanisterReturn = {

    #err : Text;
    #ok : User;
  };

  public type PostCrossCanisterReturn = {

    #err : Text;
    #ok : Post;
  };

  public type UserCrossCanisterReturn = {

    #err : Text;
    #ok : User;
  };

  public type PostCoreInterface = actor {
    registerPublisher : () -> async ();
    save : (postModel : PostSaveModel) -> async PostSaveResult;
    getMyPosts : (
      includeDraft : Bool,
      includePublished : Bool,
      indexFrom : Nat32,
      indexTo : Nat32,
    ) -> async [PostKeyProperties];
    getPostKeyProperties : (postId : Text) -> async Result.Result<PostKeyProperties, Text>;
    registerNftCanisterId : (canisterId : Text, handle : Text) -> async Result.Result<Text, Text>;
    addCanisterToCyclesDispenser : (canisterId : Text, minimumThreshold : Nat, topUpAmount : Nat) -> async Result.Result<(), Text>;
  };

  public type BucketCanisterInterface = actor {
    getPostsByPostIds : (postIds : [Text], includeDraft : Bool) -> async [PostBucketType];
    get : (postId : Text) -> async Result.Result<PostBucketType, Text>;
    removePostCategory : (postId : Text) -> async Result.Result<PostBucketType, Text>;
    addPostCategory : (postId : Text, category : Text) -> async Result.Result<PostBucketType, Text>;
    updatePostDraft : (postId : Text, isDraft : Bool) -> async Result.Result<PostBucketType, Text>;
    makePostPremium : (postId : Text) -> async Bool;
    getMetadata : (postId : Text, totalSupply : Nat) -> async Result.Result<Metadata, Text>;
  };

  public type NFTCanisterInterface = actor {
    createNftCanister : () -> async Result.Result<Text, Text>;
  };

  public type UserCanisterInterface = actor {
        
  };

  // // Currently useful for getting avatar URLs
  // // for multiple user handles, but extendable.
  // public type UserListItem = {
  //     handle: Text;
  //     avatar: Text;
  // };

  public type Listing = {
    seller : Principal;
    price : Nat64;
    locked : ?Time;
  };

  public type MetadataValue = (
    Text,
    {
      #text : Text;
      #blob : Blob;
      #nat : Nat;
      #nat8 : Nat8;
    },
  );
  public type MetadataContainer = {
    #data : [MetadataValue];
    #blob : Blob;
    #json : Text;
  };

  public type Metadata = {
    #fungible : {
      name : Text;
      symbol : Text;
      decimals : Nat8;
      metadata : ?MetadataContainer;
    };
    #nonfungible : {
      name : Text;
      asset : Text;
      thumbnail : Text;
      metadata : ?MetadataContainer;
    };
  };

  public type CreateNftFromArticleResponse = {
    tokenIndexes : [TokenIndex];
    transferResponses : [TransferResponse];
  };

  public type GetPremiumArticleInfoReturn = {
    totalSupply : Text;
    nftCanisterId : Text;
    postId : Text;
    tokenIndexStart : Text;
    sellerAccount : Text;
    writerHandle : Text;
  };

  public type NftCanisterInformation = {
    marketplaceRoyaltyAddress : Text;
    marketplaceRoyaltyPercentage : Text;
    nuanceSharePercentage : Text;
    nuanceShareAddress : Text;
    canisterId : Text;
  };

};
