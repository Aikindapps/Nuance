import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Int "mo:base/Int";
import Result "mo:base/Result";
import CanisterDeclarations "../shared/CanisterDeclarations";

module {
  public type SaveResult = Result.Result<CanisterDeclarations.PostBucketType, Text>;

  public type PostId = {
    id : Text;
  };

  public type SaveCommentModel = {
    postId : Text;
    commentId : ?Text;
    content : Text;
    replyToCommentId : ?Text;
  };

  public type Comment = {
    commentId : Text; //unique id of this comment
    handle : Text; //handle of the user who sent the comment
    avatar : Text; //avatar of the user who sent the comment. We can modify this on the frontend, can be empty
    content : Text; //stores the content of the comment
    postId : Text; //the postId of the post that this comment sent to
    bucketCanisterId : Text; //canister id of the bucket canister
    upVotes : [Text]; //principal ids of the users upvoted the comment.
    downVotes : [Text]; //principal ids of the users downvoted the comment.
    createdAt : Text; //created time of the comment
    editedAt : ?Text; //last edited time of the comment -> it's null if the comment is not edited
    creator : Text; //principal id of the creator of the comment
    replies : [Comment]; //an array of Comments to enable replying -> As the MVP of the feature is restricted with 400 chars and 100 comments per post, this field directly contains the Comment. It can be converted to [commentId] for pagination
    repliedCommentId : ?Text; //if this comment is a reply, holds the commentId. if not it's null
    isCensored : Bool; //if the comment is moderated, it's true
    isVerified: Bool; //verified status of the user who sent the comment
  };

  public type CommentsReturnType = {
    totalNumberOfComments: Text;
    comments: [Comment];
  };

  public type Applaud = {
    applaudId: Text; //unique id of the applaud
    postId: Text; //postId of the applaud sent to
    bucketCanisterId: Text; //bucket canister id of the post
    currency: Text; //NUA, ICP or ckBTC
    tokenAmount: Nat; // Number of tokens sent by the sender (e8s)
    receivedTokenAmount: Nat; //The token amount received by the writer after the tipping fee (e8s)
    numberOfApplauds: Nat; //number of applauds (The applauds are calculated at the time of the applause)
    date: Text; //Date of the applaud. Stored as Int, returned as Text
    sender: Text; //Principal id of the sender
    receiver: Text; //Principal id of the receiver
  };

  public type Post = {
    postId : Text;
    handle : Text;
    url : Text;
    title : Text;
    subtitle : Text;
    headerImage : Text;
    content : Text;
    isDraft : Bool;
    isPremium : Bool;

    // fields stored as Int, but returned to UI as Text
    created : Text; //determined at draft creation
    publishedDate : Text; //determined at publish
    modified : Text; //determined at save
    views : Text;
    claps : Text;

    tags : [PostTagModel];

    //publisher fields
    creatorHandle: Text;
    creatorPrincipal: Text;
    isPublication : Bool;
    category : Text;

    bucketCanisterId : Text;
    wordCount : Text;
  };

  public type FastblocksPost = {
    postId : Text;
    handle : Text;
    url : Text;
    title : Text;
    subtitle : Text;
    headerImage : Text;
    content : Text;
    isDraft : Bool;

    // fields stored as Int, but returned to UI as Text
    created : Text; //determined at draft creation
    publishedDate : Text; //determined at publish
    modified : Text; //determined at save
    views : Text;
    claps : Text;

    tags : [PostTagModel];
  };

  public type UserPostCounts = {
    handle : Text;
    totalPostCount : Text;
    publishedCount : Text;
    draftCount : Text;
    totalViewCount : Text;
    uniqueClaps : Text;
    uniqueReaderCount : Text;
  };

  public type SearchTerm = {
    userEmailAddress : Text;
    searchTerm : Text;
    isDraft : Bool;
  };

  public type PostModerationStatus = {
    #reviewRequired;
    #rejected;
    #approved;
  };

  public type Tag = {
    id : Text;
    value : Text;
    createdDate : Int;
  };

  public type TagModel = {
    id : Text;
    value : Text;
    createdDate : Text;
  };

  public type PostTag = {
    tagId : Text;
    isActive : Bool;
    createdDate : Int;
    modifiedDate : Int;
  };

  public type PostTagModel = {
    tagId : Text;
    tagName : Text;
  };

  public type GetPostsByFollowers = {
    totalCount : Text;
    posts : [CanisterDeclarations.PostBucketType];
  };

  //metadata formatting EXT types
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
  public type SocialLinksObject = {
    website : Text;
    twitter : Text;
    dscvr : Text;
    distrikt : Text;
  };
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
  };

  public type PublicationStyling = {
    fontType : Text;
    primaryColor : Text;
    logo : Text;
  };

  public type NftCanisterEntry = {
    canisterId : Text;
    handle : Text;
  };

  public type PremiumArticleOwnersReturn = {
    postId : Text;
    totalSupply : Text;
    available : Text;
    owners : [PremiumArticleOwnerObject];
  };

  public type PremiumArticleOwnerObject = {
    handle : Text;
    accountId : Text;
    accessKeyIndex : Text;

  };

  public type RecallOptions = {
    #today;
    #thisWeek;
    #thisMonth;
    #sixtydays;
    #ninetydays;
    #thisYear;
    #allTime;
  };

  public type DayOfWeek = {
    #Sunday;
    #Monday;
    #Tuesday;
    #Wednesday;
    #Thursday;
    #Friday;
    #Saturday;
  };

  public type MonthOfYear = {
    #January;
    #February;
    #March;
    #April;
    #May;
    #June;
    #July;
    #August;
    #September;
    #October;
    #November;
    #December;
  };

  public type DateTimeParts = {
    year : Nat;
    month : Nat;
    day : Nat;
    wday : DayOfWeek;
    hours : Nat;
    minutes : Nat;
    seconds : Nat;
    milliseconds : Nat;
  };
  //#assets canister types

  public type BatchId = Nat;
  public type ChunkId = Nat;
  public type Key = Text;
  public type Time = Int;

  // Add or change content for an asset, by content encoding
  public type SetAssetContentArguments = {
    key : Key;
    content_encoding : Text;
    chunk_ids : [ChunkId];
    sha256 : ?Blob;
  };

  // Remove content for an asset, by content encoding
  public type UnsetAssetContentArguments = {
    key : Key;
    content_encoding : Text;
  };

  // Delete an asset
  public type DeleteAssetArguments = {
    key : Key;
  };

  // Reset everything
  public type ClearArguments = {};

  public type FrontendInterface = actor {
    store : ({
      key : Key;
      content_type : Text;
      content_encoding : Text;
      content : Blob;
      sha256 : ?Blob;
    }) -> ();
    delete_asset : ({ key : Key }) -> ();
  };
};
