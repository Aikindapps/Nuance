import Result "mo:base/Result";
import List "mo:base/List";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import ENV "env";
import NotificationTypes "../NotificationsV3/types";
module{

    //****************VERIFY_POH_CANISTER****************
    public type VerifyResult = {
    #Ok: UniquePersonProof;
    #Err: Text;
    };

    public type UniquePersonProofProvider = {
        #DecideAI;
    };

    public type UniquePersonProof = {
    provider: UniquePersonProofProvider;
    timestamp: Nat64;
    };

    public type VerifyPohCanisterInterface = actor {
        verify_proof_of_unique_personhood : query (principal : Principal, credential_jwt : Text, now : Nat64) -> async VerifyResult;
    };

    public func getVerifyPohCanister() : VerifyPohCanisterInterface {
        let canister : VerifyPohCanisterInterface = actor("aovwi-4maaa-aaaaa-qaagq-cai");
        return canister;
    };

    //****************USER CANISTER*****************
    public type User = {
        handle: Text;
        displayName: Text;
        avatar: Text;
        bio: Text;
        accountCreated: Text;
        followers: Followers;
        followersPrincipals: FollowersPrincipals;
        followersArray: [Text];
        publicationsArray: [PublicationObject];
        website: Text;
        socialChannels: [Text];
        nuaTokens: Float;
        followersCount: Nat32;
        claimInfo: ?UserClaimInfo;
    };

    public type UserClaimInfo = {
        isClaimActive: Bool;
        maxClaimableTokens: Text; //stored as Nat, returned as Text
        lastClaimDate: ?Text; //stored as Int, returned as Text
        subaccount: ?Blob;
        isUserBlocked: Bool;
    };

    public type PublicationObject = {
        publicationName: Text;
        isEditor: Bool;
    };

    public type Followers = List.List<Text>;
    public type FollowersPrincipals = List.List<Text>;

    public type NuaBalanceResult = Result.Result<Text,Text>;

    public type UserListItem = {
        handle: Text;
        avatar: Text;
        displayName: Text;
        fontType: Text;
        bio: Text;
        principal: Text;
        website: Text;
        socialChannelsUrls: [Text];
        followersCount: Text;
    };

    public type GetPrincipalByHandleReturn = Result.Result<?Text, Text>;
    public type RegisterUserReturn = Result.Result<User, Text>;
    public type AddPublicationReturn = Result.Result<User, Text>;
    public type RemovePublicationReturn = Result.Result<User, Text>;
    public type GetHandleByPrincipalReturn = Result.Result<?Text, Text>;

    public type UserCanisterInterface = actor{
        getUserInternal : (userPrincipalId: Text) -> async ?User;
        getUserByHandle : query (handle : Text) -> async Result.Result<User, Text>;
        getUserListItemByHandle : query (handle : Text) -> async Result.Result<UserListItem, Text>;
        getNuaBalance : (principalId: Text) -> async NuaBalanceResult;
        handleClap : (postCaller: Text, handle : Text) -> ();
        getUserByPrincipalId : (userPrincipalId : Text) -> async Result.Result<User, Text>;
        getUsersByHandles : (handles : [Text]) -> async [UserListItem];
        getUserFollowers : (handle : Text) -> async [UserListItem];
        getFollowersByPrincipalId : (principalId : Principal) -> async [UserListItem];
        getPrincipalByHandle : (handle : Text) -> async GetPrincipalByHandleReturn;
        registerUser : (handle : Text, displayName : Text, avatar : Text) -> async RegisterUserReturn;
        addPublication : (publication : PublicationObject, callerId : Text) -> async AddPublicationReturn;
        removePublication : (publication : PublicationObject, callerId : Text) -> async RemovePublicationReturn;
        updateDisplayName : (displayName : Text) -> async Result.Result<User, Text>;
        updateAvatar : (avatarUrl : Text) -> async Result.Result<User, Text>;
        updateBio : (bio : Text) -> async Result.Result<User, Text>;
        updateFontType : (fontType : Text) -> async Result.Result<User, Text>;
        getHandleByPrincipal : (principal : Text) -> async GetHandleByPrincipalReturn;
        updateHandle : (existingHandle : Text, newHandle : Text, postCanisterId : Text, publicationWritersEditorsPrincipals : ?[Text]) -> async Result.Result<User, Text>;
        registerCanister : (id : Text) -> async Result.Result<(), Text>;
        getTrustedCanisters : () -> async Result.Result<[Text], Text>;
        getUsersByPrincipals : query (principals : [Text]) -> async [UserListItem];
        getFollowersPrincipalIdsByPrincipalId : query (principalId: Text) -> async [Text];
    };

    public func getUserCanister() : UserCanisterInterface {
        let canister : UserCanisterInterface = actor(ENV.USER_CANISTER_ID);
        return canister;
    };


    //****************POSTCORE CANISTER*****************
    public type PostSaveModel = {
        postId: Text;
        handle: Text; //useless for the regular posts, it's used to determine the publication handle
        title: Text;
        subtitle: Text;
        headerImage: Text;
        content: Text;
        isDraft: Bool;
        tagIds: [Text];
        creatorHandle: Text; //publication author
        isPublication: Bool;
        category: Text;
        premium : ?{
          //we  can extend this object with new fields to have more customization
          thumbnail: Text;
          maxSupply: Nat;
          icpPrice: Nat;
        };
        isMembersOnly: Bool;
        scheduledPublishedDate: ?Int;
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
        isMembersOnly: Bool;
        nftCanisterId: ?Text;

        // fields stored as Int, but returned to UI as Text
        created: Text; //determined at draft creation
        publishedDate: Text; //determined at publish
        modified: Text; //determined at save
        views: Text;
        claps: Text;
        
        tags: [PostTagModel];

        //publisher fields
        creatorHandle: Text;
        creatorPrincipal: Text;
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
        addCanisterToCyclesDispenser : (canisterId : Text, minimumThreshold : Nat, topUpAmount : Nat) -> async Result.Result<(), Text>;
        updatePostDraft : (postId : Text, isDraft : Bool, time : Int, writerPrincipalId : Text) -> async PostKeyProperties;
        makePostPublication : (postId : Text, publicationHandle : Text, userHandle : Text, isDraft : Bool, now : Int) -> async ();
        getNextPostId : () -> async Result.Result<Text, Text>;
        getNextPostIdsDebug : (count: Nat) -> async Result.Result<Text, Text>;
        addPostCategory : (postId : Text, category : Text, time : Int) -> async ();
        incrementApplauds : (postId: Text, applauds: Nat) -> async ();
        isWriterPublic : query (publicationCanisterId: Text, caller: Principal) -> async Bool;
        isEditorPublic : query (publicationCanisterId: Text, caller: Principal) -> async Bool;
        getBucketCanisters : query () -> async [(Text, Text)];
        getUserPostIds : query (userHandle : Text) -> async Result.Result<[Text], Text>;
        getTagFollowers : query (tagId : Text) -> async Result.Result<[Text], Text>;
        updatePublicationEditorsAndWriters : (publicationHandle: Text, editorPrincipalIds: [Text], writerPrincipalIds: [Text]) -> async Result.Result<(), Text>;
        updateHandle : (principalId : Text, newHandle : Text) -> async Result.Result<Text, Text>;
        registerCanister : (id : Text) -> async Result.Result<(), Text>;
        getTrustedCanisters : () -> async Result.Result<[Text], Text>;
        getPublicationCanisters : query () -> async [(Text, Text)]
    };

    public func getPostCoreCanister() : PostCoreCanisterInterface {
        let canister : PostCoreCanisterInterface = actor(ENV.POST_CORE_CANISTER_ID);
        return canister;
    };

    //****************POST_RELATIONS_CANISTER*****************
    public type IndexPostModel = {
        postId: Text;
        content: Text;
        title: Text;
        subtitle: Text;
        tags: [Text];
    };

    public type SearchByTagsResponse = {
        totalCount: Text;
        postIds: [Text];
    };

    public type PostRelationsCanisterInterface = actor{
        indexPost : (indexPostModel: IndexPostModel) -> async ();
        indexPosts : (indexPostModels: [IndexPostModel]) -> async ();
        removePost : (postId: Text) -> async ();
        registerCanister : (id: Principal) -> async Result.Result<[Principal], Text>;
        searchByTags : query (tagNames: [Text], indexFrom: Nat32, indexTo: Nat32) -> async SearchByTagsResponse;
    };

    public func getPostRelationsCanister() : PostRelationsCanisterInterface {
        let canister : PostRelationsCanisterInterface = actor(ENV.POST_RELATIONS_CANISTER_ID);
        return canister;
    };



    //****************KINICENDPOINT CANISTER*****************
    public type KinicEndpointCanisterInterface = actor{};

    public func getKinicEndpointCanister() : KinicEndpointCanisterInterface {
        let canister : KinicEndpointCanisterInterface = actor(ENV.KINIC_ENDPOINT_CANISTER_ID);
        return canister;
    };

    //****************STORAGE CANISTER*****************
    public type StorageCanisterInterface = actor{
        getAllDataCanisterIds : () -> async Result.Result<([Principal], [Text]), Text>;
    };

    public func getStorageCanister() : StorageCanisterInterface {
        let canister : StorageCanisterInterface = actor(ENV.STORAGE_CANISTER_ID);
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
        canisterId : Text;
        minimumThreshold : Nat;
        topUpAmount : Nat;
        isStorageBucket: Bool;
    };

    public type CyclesDispenserCanisterInterface = actor{
        addCanister : (canister: AddCanisterModel) -> async Result.Result<RegisteredCanister, Text>
    };

    public func getCyclesDispenserCanister() : CyclesDispenserCanisterInterface {
        let canister : CyclesDispenserCanisterInterface = actor(ENV.CYCLES_DISPENSER_CANISTER_ID);
        return canister;
    };

    //**********************NFTFACTORY CANISTER******************
    public type InitNftCanisterData = {
        royalty: [(Text, Nat64)];
        collectionName: Text;
        marketplaceOpen: Time.Time;
        admins: [Principal];
        thumbnail: Text;
        metadata: Metadata;
        initialMintingAddresses: [Text];
        maxSupply: Nat;
        icpPrice: Nat;
        writerPrincipal: Principal;
        postId: Text;
    };

    public type NftFactoryCanisterInterface = actor{
        getWhitelistedPublishers : () -> async [(Text,Text)];
        whitelistPublication : (handle: Text, canisterId: Text) -> async Result.Result<(Text, Text), Text>;
        createNftCanister : (initData: InitNftCanisterData) -> async Result.Result<Text, Text>;
        getAllNftCanisterIds : () -> async [(Text, Text)];
    };

    public func getNftFactoryCanister() : NftFactoryCanisterInterface {
        let canister : NftFactoryCanisterInterface = actor(ENV.NFT_FACTORY_CANISTER_ID);
        return canister;
    };

    //**********************POSTBUCKET CANISTER****************
    public type PostBucketType = {
        postId : Text;
        handle : Text;
        postOwnerPrincipal: Text; //principal id of the publication if a publicaiton post
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
        creatorPrincipal : Text;
        creatorHandle: Text;
        isPublication : Bool;
        category : Text;
        wordCount : Text;
        bucketCanisterId : Text;
        isMembersOnly: Bool;
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

    public type PostSaveModelBucket = {
        postId : Text;
        handle: Text; //useless for the regular posts, it's used to determine the publication handle
        postOwnerPrincipalId: Text;
        title : Text;
        subtitle : Text;
        headerImage : Text;
        content : Text;
        isDraft : Bool;
        creatorHandle : Text; //publication author
        isPublication : Bool;
        category : Text;
        premium : ?{
            //we  can extend this object with new fields to have more customization
            thumbnail: Text;
            maxSupply: Nat;
            icpPrice: Nat;
            editorPrincipals: [Text]; //to populate the initalMintingAddresses field in NftFactory canister function
        };
        isMembersOnly: Bool;
        tagNames : [Text];
        caller : Principal;
        scheduledPublishedDate: ?Int;
    };

    public type SaveResultBucket = Result.Result<PostBucketType, Text>;

    public type PostBucketCanisterInterface = actor {
        getPostsByPostIds : (postIds : [Text], includeDraft : Bool) -> async [PostBucketType];
        get : (postId : Text) -> async Result.Result<PostBucketType, Text>;
        removePostCategory : (postId : Text) -> async Result.Result<PostBucketType, Text>;
        addPostCategory : (postId : Text, category : Text) -> async Result.Result<PostBucketType, Text>;
        updatePostDraft : (postId : Text, isDraft : Bool) -> async Result.Result<Post, Text>;
        makePostPremium : (postId : Text) -> async Bool;
        getMetadata : (postId : Text, totalSupply : Nat) -> async Result.Result<Metadata, Text>;
        getAllApplauds : query () ->  async [Applaud];
        makeBucketCanisterNonActive : () -> async Result.Result<Bool, Text>;
        registerCanister : (id : Text) -> async Result.Result<(), Text>;
        getKinicList : query () -> async Result.Result<[Text], Text>;
        isBucketCanisterActivePublic : query () -> async Bool;
        rejectPostByModclub : (postId : Text) -> async ();
        unRejectPostByModclub : (postId : Text) -> async ();
        reindex : () -> async Result.Result<Text, Text>;
        save : (postModel : PostSaveModelBucket) -> async SaveResultBucket;
        saveMultiple : (postModels : [PostSaveModelBucket]) -> async [SaveResultBucket];
        getPostUrls : query () -> async Result.Result<Text, Text>;
        updateHandle : (principalId : Text, newHandle : Text) -> async Result.Result<Text, Text>;
        deleteUserPosts : (principalId : Text) -> async Result.Result<Nat, Text>;
        delete : (postId : Text) -> async Result.Result<Nat, Text>;
        getNotMigratedPremiumArticlePostIds : query () -> async [Text];
        migratePremiumArticleFromOldArch : query (postId: Text, price: ?Nat) -> async Result.Result<Text, Text>;
        getPost : query (postId : Text) -> async Result.Result<PostBucketType, Text>;
        getUserPostIds : query (principalId: Text) -> async [Text];
    };

    public func getPostBucketCanister(canisterId: Text) : PostBucketCanisterInterface {
        let canister : PostBucketCanisterInterface = actor(canisterId);
        return canister;
    };

    //#########################__SUBSCRIPTION__CANISTER__#############################
    public type SubscriptionTimeInterval = {
        #Weekly;
        #Monthly;
        #Annually;
        #LifeTime;
    };
    //payment request returned to the reader
    type PaymentRequest = {
        subscriptionEventId: Text;
        writerPrincipalId: Text;
        readerPrincipalId: Text;
        subscriptionTimeInterval: SubscriptionTimeInterval;
        paymentFee: Text; //stored as Nat, served as Text
        expirationDate: Int;
        subaccount: Blob;
    };
    type WriterSubscriptionDetails = {
        writerPrincipalId: Text;
        paymentReceiverPrincipalId: Text;
        weeklyFee: ?Text; //stored as Nat, served as Text
        monthlyFee: ?Text; //stored as Nat, served as Text
        annuallyFee: ?Text; //stored as Nat, served as Text
        lifeTimeFee: ?Text; //stored as Nat, served as Text
        isSubscriptionActive: Bool;
        writerSubscriptions: [SubscriptionEvent];
    };

    type SubscriptionEvent = {
        subscriptionEventId: Text;
        writerPrincipalId: Text;
        readerPrincipalId: Text;
        subscriptionTimeInterval: SubscriptionTimeInterval;
        paymentFee: Text; //stored as Nat, served as Text
        startTime: Int;
        endTime: Int;
        isWriterSubscriptionActive: Bool;
    };

    public type ReaderSubscriptionDetails = {
        readerPrincipalId: Text;
        readerSubscriptions: [SubscriptionEvent];
        readerNotStoppedSubscriptionsWriters: [WriterSubscriptionDetails];
    };

    public type SubscriptionCanisterInterface = actor {
        isReaderSubscriber : query (writerPrincipalId: Text, readerPrincipalId: Text) -> async Bool;
        isWriterActivatedSubscription : query (writerPrincipalId: Text) -> async Bool;
        getPaymentRequestBySubscriptionEventId : query (eventId: Text) -> async Result.Result<PaymentRequest, Text>;
        completeSubscriptionEvent : (eventId: Text) -> async Result.Result<ReaderSubscriptionDetails, Text>;
    };

    public func getSubscriptionCanister() : SubscriptionCanisterInterface {
        let canister : SubscriptionCanisterInterface = actor(ENV.SUBSCRIPTION_CANISTER_ID);
        return canister;
    };

    //##########################___PUBLICATION_CANISTER___############################
    public type PublicationCanisterInterface = actor {
        getEditorAndWriterPrincipalIds : query () -> async ([Text], [Text]);
        refreshEditorsWritersHandles : () -> async Result.Result<(), Text>
    };

    public func getPublicationCanister(canisterId: Text) : PublicationCanisterInterface {
        let canister : PublicationCanisterInterface = actor(canisterId);
        return canister;
    };

    //##########################___FRONTEND_CANISTER___############################

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

    //###########################__METRICS_CANISTER__###############################
    public type MetricsCanisterInterface = actor{
        registerCanister : (id : Text) -> async Result.Result<(), Text>
    };

    public func getMetricsCanister() : MetricsCanisterInterface {
        let canister : MetricsCanisterInterface = actor(ENV.METRICS_CANISTER_ID);
        return canister;
    };



    //######################__ICRC1_CANISTERS___#################
    public type TransferArgs = {
        from_subaccount : ?Blob;
        to : Account;
        amount : Balance;
        fee : ?Balance;
        memo : ?Blob;

        /// The time at which the transaction was created.
        /// If this is set, the canister will check for duplicate transactions and reject them.
        created_at_time : ?Nat64;
    };
    public type TxIndex = Nat;
    public type Timestamp = Nat64;

    public type TimeError = {
        #TooOld;
        #CreatedInFuture : { ledger_time : Timestamp };
    };

    public type TransferError = TimeError or {
        #BadFee : { expected_fee : Balance };
        #BadBurn : { min_burn_amount : Balance };
        #InsufficientFunds : { balance : Balance };
        #Duplicate : { duplicate_of : TxIndex };
        #TemporarilyUnavailable;
        #GenericError : { error_code : Nat; message : Text };
    };
    public type TransferResult = {
        #Ok : TxIndex;
        #Err : TransferError;
    };

    public type BurnArgs = {
        from_subaccount : ?Blob;
        amount : Balance;
        memo : ?Blob;
        created_at_time : ?Nat64;
    };

    public type Account = {
        owner : Principal;
        subaccount : ?Blob;
    };
    public type Balance = Nat;
    public type Value = { #Nat : Nat; #Int : Int; #Blob : Blob; #Text : Text };
    public type MetaDatum = (Text, Value);
    public type MetaData = [MetaDatum];
    public type SupportedStandard = {
        name : Text;
        url : Text;
    };
    public type Mint = {
        to : Account;
        amount : Balance;
        memo : ?Blob;
        created_at_time : ?Nat64;
    };
    public type ICRC1CanisterInterface = actor {

        /// Returns the name of the token
        icrc1_name : shared query () -> async Text;

        /// Returns the symbol of the token
        icrc1_symbol : shared query () -> async Text;

        /// Returns the number of decimals the token uses
        icrc1_decimals : shared query () -> async Nat8;

        /// Returns the fee charged for each transfer
        icrc1_fee : shared query () -> async Balance;

        /// Returns the tokens metadata
        icrc1_metadata : shared query () -> async MetaData;

        /// Returns the total supply of the token
        icrc1_total_supply : shared query () -> async Balance;

        /// Returns the account that is allowed to mint new tokens
        icrc1_minting_account : shared query () -> async ?Account;

        /// Returns the balance of the given account
        icrc1_balance_of : shared query (Account) -> async Balance;

        /// Transfers the given amount of tokens from the sender to the recipient
        icrc1_transfer : shared (TransferArgs) -> async TransferResult;

        /// Returns the standards supported by this token's implementation
        icrc1_supported_standards : shared query () -> async [SupportedStandard];

        burn : shared (BurnArgs) -> async TransferResult;

        mint : shared (Mint) -> async TransferResult;

    };
    public func getIcrc1Canister(canisterId: Text) : ICRC1CanisterInterface {
        let canister : ICRC1CanisterInterface = actor(canisterId);
        return canister;
    };

    //_____________________EXT_CANISTER________________

    public type TokenIndex = Nat32;
    public type Listing = {
        seller : Principal;
        price : Nat64;
        locked : ?Time;
    };

    public type CommonError = {
        #InvalidToken: Text;
        #Other : Text;
    };

    public type HttpStreamingCallbackToken =  {
        content_encoding: Text;
        index: Nat;
        key: Text;
        sha256: ?Blob;
    };

    public type HttpStreamingCallbackResponse = {
        body: Blob;
        token: ?HttpStreamingCallbackToken;
    };

    public type EXTCanisterInterface = actor {
        tokens_ext : query (aid : Text) -> async Result.Result<[(TokenIndex, ?Listing, ?Blob)], CommonError>;
        setConfigData : (initData: InitNftCanisterData) -> async Result.Result<(), Text>;
        getRegistry : query () -> async [(TokenIndex, Text)];
        http_request_streaming_callback : query (token : HttpStreamingCallbackToken) -> async HttpStreamingCallbackResponse;
    };
    public func getExtCanister(canisterId: Text) : EXTCanisterInterface {
        let canister : EXTCanisterInterface = actor(canisterId);
        return canister;
    };


    ////////////////////////___NOTIFICATION$__CANISTER___////////////////////////

public type NotificationContent = {
    #NewCommentOnMyArticle : {
      postId: Text;
      bucketCanisterId: Text;
      postTitle: Text;
      commenterPrincipal: Text;
      commentContent: Text;
      commentId: Text;
      isReply: Bool;
    };
    #ReplyToMyComment: {
      postId: Text;
      bucketCanisterId: Text;
      postTitle: Text;
      postWriterPrincipal: Text;
      myCommentId: Text;
      myCommentContent: Text;
      replyCommentId: Text;
      replyCommentContent: Text;
      replyCommenterPrincipal: Text;
    };
    #NewArticleByFollowedWriter: {
      postId: Text;
      bucketCanisterId: Text;
      postTitle: Text;
      postWriterPrincipal: Text;
    };
    #NewArticleByFollowedTag: {
      postId: Text;
      bucketCanisterId: Text;
      postTitle: Text;
      postWriterPrincipal: Text;
      tagName: Text;
    };
    #NewFollower: {
      followerPrincipalId: Text;
    };
    #TipReceived: {
      postId: Text;
      bucketCanisterId: Text;
      postTitle: Text;
      publicationPrincipalId: ?Text; //if the tip is received for a publication canister, need to have this on frontend to build the url
      tipSenderPrincipal: Text;
      tippedTokenSymbol: Text;
      numberOfApplauds: Text;
      amountOfTokens: Text;
    };
    #PremiumArticleSold: {
      postId: Text;
      bucketCanisterId: Text;
      postTitle: Text;
      publicationPrincipalId: ?Text; //if the sold article was a publication article, need to have this on frontend to build the url
      purchaserPrincipal: Text;
      purchasedTokenSymbol: Text;
      amountOfTokens: Text;
    };
    #AuthorGainsNewSubscriber: {
      subscriberPrincipalId: Text;
      subscriptionTimeInterval: SubscriptionTimeInterval;
      amountOfTokens: Text;
      subscriptionStartTime: Text;
      subscriptionEndTime: Text;
    };
    #AuthorLosesSubscriber: {
      subscriberPrincipalId: Text;
      subscriptionTimeInterval: SubscriptionTimeInterval;
    };
    #YouSubscribedToAuthor: {
      subscribedWriterPrincipalId: Text;
      subscriptionTimeInterval: SubscriptionTimeInterval;
      subscriptionStartTime: Text;
      subscriptionEndTime: Text;
      amountOfTokens: Text;
      isPublication: Bool;
    };
    #YouUnsubscribedFromAuthor: {
      subscribedWriterPrincipalId: Text;
      subscriptionTimeInterval: SubscriptionTimeInterval;
      isPublication: Bool;
    };
    #ReaderExpiredSubscription: {
      subscribedWriterPrincipalId: Text;
      subscriptionTimeInterval: SubscriptionTimeInterval;
      subscriptionStartTime: Text;
      subscriptionEndTime: Text;
      amountOfTokens: Text;
      isPublication: Bool;
    };
    #FaucetClaimAvailable;
  };



    public type NotificationCanisterInterface = actor {
        createNotification : (notificationReceiverPrincipalId: Text, notificationContent : NotificationContent) -> async ();
        createNotifications : (notifications: [(notificationReceiverPrincipalId: Text, notificationContent : NotificationContent)]) -> async ();
    };
    public func getNotificationCanister() : NotificationCanisterInterface {
        let canister : NotificationCanisterInterface = actor(ENV.NOTIFICATIONS_CANISTER_ID);
        return canister;
    };
}