import Result "mo:base/Result";
import List "mo:base/List";
import ENV "env";
module{


    //****************USER CANISTER*****************
    public type User = {
        handle: Text;
        displayName: Text;
        avatar: Text;
        bio: Text;
        accountCreated: Text;
        followers: Followers;
        followersArray: [Text];
        publicationsArray: [PublicationObject];
        nuaTokens: Float;
        followersCount: Nat32;
    };

    public type PublicationObject = {
        publicationName: Text;
        isEditor: Bool;
    };

    public type Followers = List.List<Text>;

    public type NuaBalanceResult = Result.Result<Text,Text>;

    public type UserListItem = {
        handle: Text;
        avatar: Text;
        displayName: Text;
        fontType: Text;
        bio: Text;
        principal:Text;
    };

    public type GetPrincipalByHandleReturn = Result.Result<?Text, Text>;
    public type RegisterUserReturn = Result.Result<User, Text>;
    public type AddPublicationReturn = Result.Result<User, Text>;
    public type RemovePublicationReturn = Result.Result<User, Text>;
    public type GetHandleByPrincipalReturn = Result.Result<?Text, Text>;

    public type UserCanisterInterface = actor{
        getUserInternal : (userPrincipalId: Text) -> async ?User;
        getNuaBalance : (principalId: Text) -> async NuaBalanceResult;
        handleClap : (postCaller: Text, handle : Text) -> ();
        getUserByPrincipalId : (userPrincipalId : Text) -> async Result.Result<User, Text>;
        getUsersByHandles : (handles : [Text]) -> async [UserListItem];
        getPrincipalByHandle(handle : Text) : async GetPrincipalByHandleReturn;
        registerUser : (handle : Text, displayName : Text, avatar : Text) -> async RegisterUserReturn;
        addPublication : (publication : PublicationObject, callerId : Text) -> async AddPublicationReturn;
        removePublication : (publication : PublicationObject, callerId : Text) -> async RemovePublicationReturn;
        updateDisplayName : (displayName : Text) -> async Result.Result<User, Text>;
        updateAvatar : (avatarUrl : Text) -> async Result.Result<User, Text>;
        updateBio : (bio : Text) -> async Result.Result<User, Text>;
        updateFontType : (fontType : Text) -> async Result.Result<User, Text>;
        getHandleByPrincipal : (principal : Text) -> async GetHandleByPrincipalReturn;
        registerNftCanisterId : (canisterId : Text) -> async Result.Result<Text, Text>;
        updateHandle : (existingHandle : Text, newHandle : Text, postCanisterId : Text, publicationWritersEditorsPrincipals : ?[Text]) -> async Result.Result<User, Text>;
    };

    public func getUserCanister() : UserCanisterInterface {
        let canister : UserCanisterInterface = actor(ENV.USER_CANISTER_ID);
        return canister;
    };


    //****************POSTCORE CANISTER*****************
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

    public type PostTagModel = {
        tagId: Text;
        tagName: Text;
    };
    public type SaveResult = Result.Result<Post, Text>;
    public type PostSaveResult = SaveResult;

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


    public type PostCoreCanisterInterface = actor{
        getKinicList : () -> async Result.Result<[Text], Text>;
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
        updatePostDraft : (postId : Text, isDraft : Bool, time : Int, writerPrincipalId : Text) -> async PostKeyProperties;
        makePostPublication : (postId : Text, publicationHandle : Text, userHandle : Text, isDraft : Bool) -> async ();
        getNextPostId : () -> async Result.Result<Text, Text>;
        addPostCategory : (postId : Text, category : Text, time : Int) -> async ()
    };

    public func getPostCoreCanister() : PostCoreCanisterInterface {
        let canister : PostCoreCanisterInterface = actor(ENV.POST_CORE_CANISTER_ID);
        return canister;
    };


    //****************POSTINDEX CANISTER*****************
    public type IndexPostResult = Result.Result<Text, Text>;
    public type ClearIndexResult = Result.Result<Nat, Text>;
    public type IndexPostModel = {
        postId : Text;
        oldHtml : Text; 
        newHtml : Text; 
        oldTags: [Text]; 
        newTags: [Text];
    };
    public type PostIndexCanisterInterface = actor{
        indexPost : (postId : Text, oldHtml : Text, newHtml : Text, oldTags: [Text], newTags: [Text]) -> async IndexPostResult;
        indexPosts : (indexPostModels: [IndexPostModel]) -> async [IndexPostResult];
        clearIndex : () -> async ClearIndexResult;
        registerAdmin : (id : Text) -> async Result.Result<(), Text>;
        registerCanister : (id : Text) -> async Result.Result<(), Text>
    };

    public func getPostIndexCanister() : PostIndexCanisterInterface {
        let canister : PostIndexCanisterInterface = actor(ENV.POST_INDEX_CANISTER_ID);
        return canister;
    };



    //****************KINICENDPOINT CANISTER*****************
    public type KinicEndpointCanisterInterface = actor{};

    public func getKinicEndpointCanister() : KinicEndpointCanisterInterface {
        let canister : KinicEndpointCanisterInterface = actor(ENV.KINIC_ENDPOINT_CANISTER_ID);
        return canister;
    };


    //****************FASTBLOCKSEMAILOPTIN CANISTER*****************
    public type FastBlocksEmailOptInCanisterInterface = actor{};

    public func getFastblocksEmailOptInCanister() : FastBlocksEmailOptInCanisterInterface {
        let canister : FastBlocksEmailOptInCanisterInterface = actor(ENV.FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID);
        return canister;
    };


    //****************CYCLESDISPENSER CANISTER*****************
    public type TopUp = {
        canisterId: Text;
        time: Int;
        amount: Nat;
        balanceBefore: Nat;
        balanceAfter: Nat;
    };
    public type RegisteredCanister = {
        canisterId: Text;
        minimumThreshold: Nat;
        topUpAmount: Nat;
        balance: Nat;
        topUps: [TopUp];
    };

    public type AddCanisterModel = {
        canisterId: Text;
        minimumThreshold: Nat;
        topUpAmount: Nat;
    };

    public type CyclesDispenserCanisterInterface = actor{
        addCanister : (canister: AddCanisterModel) -> async Result.Result<RegisteredCanister, Text>
    };

    public func getCyclesDispenserCanister() : CyclesDispenserCanisterInterface {
        let canister : CyclesDispenserCanisterInterface = actor(ENV.CYCLES_DISPENSER_CANISTER_ID);
        return canister;
    };

    //**********************NFTFACTORY CANISTER******************
    public type NftFactoryCanisterInterface = actor{
        getWhitelistedPublishers : () -> async [(Text,Text)];
        whitelistPublication : (handle: Text, canisterId: Text) -> async Result.Result<(Text, Text), Text>;
        createNftCanister : () -> async Result.Result<Text, Text>
    };

    public func getNftFactoryCanister() : NftFactoryCanisterInterface {
        let canister : NftFactoryCanisterInterface = actor(ENV.NFT_FACTORY_CANISTER_ID);
        return canister;
    };

    //**********************POSTBUCKET CANISTER****************
    public type PostBucketType = {
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
        
        //publisher fields
        creator: Text;
        isPublication: Bool;
        category: Text;
        wordCount: Text;
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

    public type PostBucketCanisterInterface = actor {
        getPostsByPostIds : (postIds : [Text], includeDraft : Bool) -> async [PostBucketType];
        get : (postId : Text) -> async Result.Result<PostBucketType, Text>;
        removePostCategory : (postId : Text) -> async Result.Result<PostBucketType, Text>;
        addPostCategory : (postId : Text, category : Text) -> async Result.Result<PostBucketType, Text>;
        updatePostDraft : (postId : Text, isDraft : Bool) -> async Result.Result<PostBucketType, Text>;
        makePostPremium : (postId : Text) -> async Bool;
        getMetadata : (postId : Text, totalSupply : Nat) -> async Result.Result<Metadata, Text>;
    };

    public func getPostBucketCanister(canisterId: Text) : PostBucketCanisterInterface {
        let canister : PostBucketCanisterInterface = actor(canisterId);
        return canister;
    };



    //##########################FRONTEND_CANISTER############################

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

    public func getFrontendCanister() : FrontendInterface {
        let canister : FrontendInterface = actor(ENV.NUANCE_ASSETS_CANISTER_ID);
        return canister;
    };

    //###########################__METRICS_CANISTER__
    public type MetricsCanisterInterface = actor{
        registerCanister : (id : Text) -> async Result.Result<(), Text>
    };

    public func getMetricsCanister() : MetricsCanisterInterface {
        let canister : MetricsCanisterInterface = actor(ENV.METRICS_CANISTER_ID);
        return canister;
    };
}