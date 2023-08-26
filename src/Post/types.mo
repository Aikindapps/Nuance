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
        title: Text;
        subtitle: Text;
        headerImage: Text;
        content: Text;
        isDraft: Bool;
        tagIds: [Text];
        creator: Text; //publication author
        isPublication: Bool;
        category: Text;
        isPremium: Bool;
    };

    public type PostMigrationType = {
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
        wordCount: Nat;
        caller: Text;
        isRejected: Bool;
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
        posts: [Post];
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
};