import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Int "mo:base/Int";
import Result "mo:base/Result";

module {
    public type SaveResult = Result.Result<Post, Text>;

    public type PostId = {
        id: Text;
    };

    public type PostSaveModel = {
        postId: Text;
        handle: Text; //useless for the regular posts, it's used to determine the publication handle
        title: Text;
        subtitle: Text;
        headerImage: Text;
        content: Text;
        isDraft: Bool;
        tagIds: [Text];
        creator: Text; //publication author
        isPublication: Bool;
        category: Text;
        premium : ?{
          //we  can extend this object with new fields to have more customization
          thumbnail: Text;
          maxSupply: Nat;
          icpPrice: Nat;
        };
    };

    public type PostSaveModelBucket = {
      postId : Text;
      handle: Text; //useless for the regular posts, it's used to determine the publication handle
      postOwnerPrincipalId: Text;
      title : Text;
      subtitle : Text;
      headerImage : Text;
      content : Text;
      isDraft : Bool;
      creator : Text; //publication author
      isPublication : Bool;
      category : Text;
      premium : ?{
        //we  can extend this object with new fields to have more customization
        thumbnail: Text;
        maxSupply: Nat;
        icpPrice: Nat;
        editorPrincipals: [Text]; //to populate the initalMintingAddresses field in NftFactory canister function
      };
      tagNames : [Text];
      caller : Principal;
    };
    

    public type Post = {
        postId: Text;
        handle: Text;
        url: Text;
        title: Text;
        subtitle: Text;
        headerImage: Text;
        content: Text;
        isDraft: Bool;
        isPremium: Bool;

        // fields stored as Int, but returned to UI as Text
        created: Text; //determined at draft creation
        publishedDate: Text; //determined at publish
        modified: Text; //determined at save
        views: Text;
        claps: Text;
        
        tags: [PostTagModel];

        //publisher fields
        creator: Text;
        isPublication: Bool;
        category: Text;

        bucketCanisterId: Text;
        wordCount : Text;
    };

    public type PostBucketType = {
      postId : Text;
      handle : Text;
      url : Text;
      title : Text;
      subtitle : Text;
      headerImage : Text;
      content : Text;
      isDraft : Bool;
      isPremium : Bool;
      nftCanisterId: ?Text;

      // fields stored as Int, but returned to UI as Text
      created : Text; //determined at draft creation
      publishedDate : Text; //determined at publish
      modified : Text; //determined at save

      //publisher fields
      creator : Text;
      isPublication : Bool;
      category : Text;
      wordCount : Text;
      bucketCanisterId : Text;
    };

    public type PostKeyProperties = {
        postId: Text;
        handle: Text;
        principal: Text;
        bucketCanisterId: Text;
        views: Text;
        claps: Text;
        tags: [PostTagModel];
        created: Text;
        isDraft: Bool;
        category: Text;
        publishedDate: Text; //may remove it if it's not needed
        modified: Text; //may remove it if it's not needed
    };
    
    public type FastblocksPost = {
        postId: Text;
        handle: Text;
        url: Text;
        title: Text;
        subtitle: Text;
        headerImage: Text;
        content: Text;
        isDraft: Bool;

        // fields stored as Int, but returned to UI as Text
        created: Text; //determined at draft creation
        publishedDate: Text; //determined at publish
        modified: Text; //determined at save
        views: Text;
        claps: Text;
        
        tags: [PostTagModel];
    };

    public type UserPostCounts = {
        handle: Text;
        totalPostCount: Text;
        publishedCount: Text;
        draftCount: Text;
        totalViewCount: Text;
        uniqueClaps: Text;
        uniqueReaderCount: Text;
    };

    public type SearchTerm = {
        userEmailAddress : Text;
        searchTerm : Text;
        isDraft:Bool;
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
        posts: [PostKeyProperties];
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
  //bucket canister interface
  public type BucketCanisterInterface = actor{
    getKinicList : () -> async Result.Result<[Text], Text>;
    get : (postId: Text) -> async Result.Result<PostBucketType, Text>;
    deleteUserPosts : (principalId: Text) -> async Result.Result<Nat, Text>;
    delete : (postId: Text) -> async Result.Result<Nat, Text>;
    reindex : () -> async Result.Result<Text, Text>;
    generateContent : (postId : Text ) -> async  Text;
    registerNftCanisterId : (canisterId: Text, handle: Text) -> async Result.Result<Text, Text>;
    rejectPostByModclub : (postId: Text) -> async ();
    unRejectPostByModclub : (postId: Text) -> async ();
    storeAllSEO : () -> async Result.Result<(), Text>;
    isBucketCanisterActivePublic : () -> async Bool;
    save : (postModel : PostSaveModelBucket) -> async Result.Result<PostBucketType, Text>;
    getPostUrls : () -> async Result.Result<Text, Text>;
    makeBucketCanisterNonActive : () -> async Result.Result<Bool, Text>;
    updateHandle : (principalId: Text, newHandle: Text) -> async Result.Result<Text, Text>;
    registerCanister : (id: Text) -> async Result.Result<(), Text>
  }
};