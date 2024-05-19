import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Int "mo:base/Int";
import Result "mo:base/Result";
import CanisterDeclarations "../shared/CanisterDeclarations";

module {
    public type SaveResult = Result.Result<CanisterDeclarations.Post, Text>;

    public type PostId = {
        id: Text;
    };

    public type UserPostCounts = {
        handle: Text;
        totalPostCount: Text;
        publishedCount: Text;
        draftCount: Text;
        submittedToReviewCount: Text;
        totalViewCount: Text;
        premiumCount: Text;
        uniqueClaps: Text;
        uniqueReaderCount: Text;
    };

    public type SearchTerm = {
        userEmailAddress : Text;
        searchTerm : Text;
        isDraft:Bool;
    };

    public type PostModerationStatusV2 = {
        #approved; #new; #rejected
    };

     public type PostModerationStatus = {
        #reviewRequired;#rejected;#approved;
    };

    public type Tag = {   
        id: Text; 
        value: Text;
        createdDate: Int;
    };

    public type TagModel = {   
        id: Text; 
        value: Text;
        createdDate: Text;
    };

    public type PostTag = {
        tagId: Text;
        isActive: Bool;
        createdDate: Int;
        modifiedDate: Int;
    };

    public type PostTagModel = {
        tagId: Text;
        tagName: Text;
    };

    public type GetPostsByFollowers = {
        totalCount: Text;
        posts: [CanisterDeclarations.PostKeyProperties];
    };


    //metadata formatting EXT types
    public type MetadataValue = (Text , {
        #text : Text;
        #blob : Blob;
        #nat : Nat;
        #nat8: Nat8;
    });
    
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
            metadata: ?MetadataContainer;
        };
        #nonfungible : {
            name : Text;
            asset : Text;
            thumbnail : Text;
            metadata: ?MetadataContainer;
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
    canisterId: Text;
    handle: Text;
  };

  public type PremiumArticleOwnersReturn = {
    postId: Text;
    totalSupply: Text;
    available: Text;
    owners: [PremiumArticleOwnerObject]
  };

  public type PremiumArticleOwnerObject = {
    handle: Text;
    accountId: Text;
    accessKeyIndex: Text;

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

  public  type BatchId = Nat;
  public type ChunkId = Nat;
  public type Key = Text;
  public type Time = Int;


  // Add or change content for an asset, by content encoding
  public type SetAssetContentArguments =  {
    key: Key;
    content_encoding: Text;
    chunk_ids:  [ChunkId];
    sha256: ?Blob;
  };

  // Remove content for an asset, by content encoding
  public type UnsetAssetContentArguments =  {
    key: Key;
    content_encoding: Text;
  };

  // Delete an asset
  public type DeleteAssetArguments =  {
    key: Key;
  };

  // Reset everything
  public type ClearArguments =  {};
  public type FrontendInterface = actor {
    store: ({
        key: Key;
        content_type: Text;
        content_encoding: Text;
        content: Blob;
        sha256: ?Blob}) -> ();
    delete_asset: ({key: Key;}) -> ();
    authorize: (principal: Principal) -> async ();
    take_ownership: () -> async ();
  };
};