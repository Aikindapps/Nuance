import Blob "mo:base/Blob";
import Nat64 "mo:base/Nat64";
import Array "mo:base/Array";
import Bool "mo:base/Bool";
import Buffer "mo:base/Buffer";
import Char "mo:base/Char";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Hash "mo:base/Hash";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Int "mo:base/Int";
import Option "mo:base/Option";
import Order "mo:base/Order";
import Prelude "mo:base/Prelude";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";

import Canistergeek "../canistergeek/canistergeek";
import PostCoreTypes "../../../src/PostCore/types";
import Types "./types";
import U "../shared/utils";
import ExtUtil "../motoko/util/AccountIdentifier";

import ExtCore "../motoko/ext/Core";
import AccountIdentifier "../motoko/util/AccountIdentifier";
import Cycles "mo:base/ExperimentalCycles";
import Hex "../motoko/util/Hex";
import Nat8 "mo:base/Nat8";
import Float "mo:base/Float";
import Prim "mo:prim";
import CanisterDeclarations "../shared/CanisterDeclarations";
import Versions "../shared/versions";
import ENV "../../../src/shared/env";

actor class Publisher() = this {

    //data type aliases
    type List<T> = List.List<T>;
    type Publication = Types.Publication;
    type PostSaveModel = PostCoreTypes.PostSaveModel;
    type PostSaveResult = PostCoreTypes.SaveResult;
    type Metadata = PostCoreTypes.Metadata;
    type User = CanisterDeclarations.User;
    type Post = PostCoreTypes.Post;
    type PostKeyProperties = PostCoreTypes.PostKeyProperties;
    type CrossCanisterReturn = Types.CrossCanisterReturn;
    type PostCrossCanisterReturn = Types.PostCrossCanisterReturn;
    type UserCrossCanisterReturn = Types.UserCrossCanisterReturn;
    type SocialLinksObject = Types.SocialLinksObject;
    type PublicationStyling = Types.PublicationStyling;
    type TokenIndex = ExtCore.TokenIndex;
    type Time = Time.Time;
    type TokenIdentifier = ExtCore.TokenIdentifier;
    type SubAccount = ExtCore.SubAccount;
    type CommonError = ExtCore.CommonError;
    type PublicationCta = Types.PublicationCta;
    type GetPremiumArticleInfoReturn = Types.GetPremiumArticleInfoReturn;
    type ListRequest = {
        token : TokenIdentifier;
        from_subaccount : ?SubAccount;
        price : ?Nat64;
    };
    type Listing = Types.Listing;
    type TransferRequest = ExtCore.TransferRequest;
    type TransferResponse = ExtCore.TransferResponse;
    type CreateNftFromArticleResponse = Types.CreateNftFromArticleResponse;
    type AccountIdentifier = ExtCore.AccountIdentifier;
    type NftCanisterInformation = Types.NftCanisterInformation;

    //ext asset types
    type AssetType = {
        #canister : {
            id : Nat32;
            canister : Text;
        };
        #direct : [Nat32];
        #other : Text;
    };

    //ledger canister type declarations
    type AccountBalanceArgs = { account : AccountIdentifier };
    type ICPTs = { e8s : Nat64 };
    type TimeStamp = { timestamp_nanos : Nat64 };
    type SendArgs = {
        memo : Nat64;
        amount : ICPTs;
        fee : ICPTs;
        from_subaccount : ?SubAccount;
        to : AccountIdentifier;
        created_at_time : ?TimeStamp;
    };

    // local variables
    let canistergeekMonitor = Canistergeek.Monitor();
    func isEq(x : Text, y : Text) : Bool { x == y };
    var maxHashmapSize = 1000000;
    var hashMap = HashMap.HashMap<Text, [Text]>(maxHashmapSize, isEq, Text.hash);
    stable var index : [(Text, [Text])] = [];

    // publisher data types
    stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
    stable var publicationHandleEntries : [(Text, Text)] = [];
    stable var publicationTitleEntries : [(Text, Text)] = [];
    stable var editorsEntries : [(Text, [Text])] = [];
    stable var canisterIdEntries : [(Text, Text)] = [];
    stable var writersEntries : [(Text, [Text])] = [];
    stable var headerImageEntries : [(Text, Text)] = [];
    stable var subtitleEntries : [(Text, Text)] = [];
    stable var descriptionEntries : [(Text, Text)] = [];
    stable var websiteEntries : [(Text, Text)] = [];
    stable var socialChannelUrlsEntries : [(Text, [Text])] = [];
    stable var categoriesEntries : [(Text, [Text])] = [];
    stable var avatarEntries : [(Text, Text)] = [];
    stable var modifiedEntries : [(Text, Text)] = [];
    stable var createdEntries : [(Text, Text)] = [];
    stable var stylingFontTypeEntries : [(Text, Text)] = [];
    stable var stylingPrimaryColorEntries : [(Text, Text)] = [];
    stable var brandLogoEntries : [(Text, Text)] = [];
    stable var editorsHandlesEntries : [(Text, [Text])] = [];
    stable var writersHandlesEntries : [(Text, [Text])] = [];
    stable var publicationCtaButtonCopyEntries : [(Text, Text)] = [];
    stable var publicationCtaCopyEntries : [(Text, Text)] = [];
    stable var publicationCtaLinkEntries : [(Text, Text)] = [];
    stable var publicationCtaIconEntries : [(Text, Text)] = [];

    // publisher hashmaps
    var publicationHandleHashMap = HashMap.fromIter<Text, Text>(publicationHandleEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var publicationTitleHashMap = HashMap.fromIter<Text, Text>(publicationTitleEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var editorsHashMap = HashMap.fromIter<Text, [Text]>(editorsEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var canisterIdHashMap = HashMap.fromIter<Text, Text>(canisterIdEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var writersHashMap = HashMap.fromIter<Text, [Text]>(writersEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var headerImageHashMap = HashMap.fromIter<Text, Text>(headerImageEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var subtitleHashMap = HashMap.fromIter<Text, Text>(subtitleEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var descriptionHashMap = HashMap.fromIter<Text, Text>(descriptionEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var categoriesHashMap = HashMap.fromIter<Text, [Text]>(categoriesEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var websiteHashMap = HashMap.fromIter<Text, Text>(websiteEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var socialChannelsUrlsHashMap = HashMap.fromIter<Text, [Text]>(socialChannelUrlsEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var avatarHashMap = HashMap.fromIter<Text, Text>(avatarEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var userHandleHashmap = HashMap.fromIter<Text, Text>(canisterIdEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var createdHashMap = HashMap.fromIter<Text, Text>(createdEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var modifiedHashMap = HashMap.fromIter<Text, Text>(modifiedEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var stylingFontTypeHashmap = HashMap.fromIter<Text, Text>(stylingFontTypeEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var stylingPrimaryColorHashmap = HashMap.fromIter<Text, Text>(stylingPrimaryColorEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var brandLogoHashmap = HashMap.fromIter<Text, Text>(brandLogoEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var publicationCtaButtonCopyHashMap = HashMap.fromIter<Text, Text>(publicationCtaButtonCopyEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var publicationCtaCopyHashMap = HashMap.fromIter<Text, Text>(publicationCtaCopyEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var publicationCtaLinkHashMap = HashMap.fromIter<Text, Text>(publicationCtaLinkEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var publicationCtaIconHashMap = HashMap.fromIter<Text, Text>(publicationCtaIconEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var editorsHandlesHashmap = HashMap.fromIter<Text, [Text]>(editorsHandlesEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var writersHandlesHashmap = HashMap.fromIter<Text, [Text]>(writersHandlesEntries.vals(), maxHashmapSize, isEq, Text.hash);

    //Premium article data
    stable var subaccountIndex : Nat = 1;
    stable var nftCanisterIds : [Text] = [];

    stable var premiumArticlesIcpPricesEntries : [(Text, Nat)] = [];
    stable var premiumArticlesTotalSuppliesEntries : [(Text, Nat)] = [];
    stable var premiumArticlesWriterHandlesEntries : [(Text, Text)] = [];
    stable var premiumArticlesTokenIndexStartsEntries : [(Text, Nat32)] = [];
    stable var writerPremiumArticlePostIdsEntries : [(Text, [Text])] = [];

    //key: postId value: IcpPrice
    var premiumArticlesIcpPricesHashmap = HashMap.fromIter<Text, Nat>(premiumArticlesIcpPricesEntries.vals(), maxHashmapSize, isEq, Text.hash);
    //key: postId value: totalSupply
    var premiumArticlesTotalSuppliesHashmap = HashMap.fromIter<Text, Nat>(premiumArticlesTotalSuppliesEntries.vals(), maxHashmapSize, isEq, Text.hash);
    //key: postId value: AccountIdentifier
    var premiumArticlesWriterHandlesHashmap = HashMap.fromIter<Text, Text>(premiumArticlesWriterHandlesEntries.vals(), maxHashmapSize, isEq, Text.hash);
    //key: postId value: AccountIdentifier
    var premiumArticlesTokenIndexStartsHashmap = HashMap.fromIter<Text, Nat32>(premiumArticlesTokenIndexStartsEntries.vals(), maxHashmapSize, isEq, Text.hash);
    //key writer-handle, value: [postId]
    var writerPremiumArticlePostIdsHashmap = HashMap.fromIter<Text, [Text]>(writerPremiumArticlePostIdsEntries.vals(), maxHashmapSize, isEq, Text.hash);

    //the address that secondary marketplace royalties goes. default to baran's terminal icp address :)
    var marketplaceRoyaltyAddress : AccountIdentifier = "f77cc353c778b02ad26974891950e4cb3ae1203e5cd8218e1b99bfc4f316d897";
    //the address that nuance share goes. default to baran's terminal icp address :)
    var nuanceShareAddress : AccountIdentifier = "f77cc353c778b02ad26974891950e4cb3ae1203e5cd8218e1b99bfc4f316d897";
    //defualt to 1%
    var marketplaceRoyaltyPercentage : Nat64 = 1000;
    //default to 10%
    var nuanceSharePercentage : Nat64 = 10;

    type PostBucketInterface = CanisterDeclarations.PostBucketCanisterInterface;

    let LedgerCanister = actor ("ryjl3-tyaaa-aaaaa-aaaba-cai") : actor {
        send_dfx : shared SendArgs -> async Nat64;
        account_balance_dfx : shared query AccountBalanceArgs -> async ICPTs;
    };

    // error messages
    let Unauthorized = "You are not an Admin";
    let UserNotFound = "User not found";
    let NotEditor = "Your principalId is not an editor of this publication";
    let NotWriter = "Your principalId is not an writer in this publication";
    let NotEditorOrWriter = "Your principalId is not an writer or editor of this publication";
    let WriterNotEditor = "You do not have editor permissions to post, writers may only save as draft";
    let HandleIsEditor = "This handle is already an editor";
    let HandleIsWriter = "This handle is already a writer";

    // permanent in-memory state (data types are not lost during upgrades)
    stable var admins : List.List<Text> = List.nil<Text>();
    stable var platformOperators : List.List<Text> = List.nil<Text>();
    stable var cgusers : List.List<Text> = List.nil<Text>();

    //#Admin and Canister Functions
    private func isAnonymous(caller : Principal) : Bool {
        Principal.equal(caller, Principal.fromText("2vxsx-fae"));
    };


    public shared query ({ caller }) func getCgUsers() : async Result.Result<[Text], Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        #ok(List.toArray(cgusers));
    };

    public shared ({ caller }) func registerCgUser(id : Text) : async Result.Result<(), Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        //validate input
        let principalFromText = Principal.fromText(id);

        canistergeekMonitor.collectMetrics();
        if (List.size<Text>(cgusers) > 0 and not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err(Unauthorized);
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        if (not List.some<Text>(cgusers, func(val : Text) : Bool { val == id })) {
            cgusers := List.push<Text>(id, cgusers);
        };

        #ok();
    };

    public shared ({ caller }) func unregisterCgUser(id : Text) : async Result.Result<(), Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        canistergeekMonitor.collectMetrics();
        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err(Unauthorized);
        };
        cgusers := List.filter<Text>(cgusers, func(val : Text) : Bool { val != id });
        #ok();
    };


  private func isAdmin(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    U.arrayContains(ENV.PUBLISHER_CANISTER_ADMINS, c);
  };

  public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    #ok(ENV.PUBLISHER_CANISTER_ADMINS);
  };

  private func isPlatformOperator(caller : Principal) : Bool {
    ENV.isPlatformOperator(caller)
  };

  public shared query func getPlatformOperators() : async List.List<Text> {
    List.fromArray(ENV.PLATFORM_OPERATORS);
  };

  //These methods are deprecated. Admins are handled by env.mo file
  public shared ({ caller }) func registerAdmin(id : Text) : async Result.Result<(), Text> {
    #err("Deprecated function")
  };

  public shared ({ caller }) func unregisterAdmin(id : Text) : async Result.Result<(), Text> {
    #err("Deprecated function")
  };

  //platform operators, similar to admins but restricted to a few functions -> deprecated. Use env.mo file
  public shared ({ caller }) func registerPlatformOperator(id : Text) : async Result.Result<(), Text> {
    #err("Deprecated function.")
  };

  public shared ({ caller }) func unregisterPlatformOperator(id : Text) : async Result.Result<(), Text> {
    #err("Deprecated function.")
  };


    func isCgUser(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        var exists = List.find<Text>(cgusers, func(val : Text) : Bool { val == c });
        exists != null;
    };

    

    //#End Admin and Canister Functions

    //#Publisher functions

    private func isValidHandle(value : Text) : Bool {
        var seg = "";
        let cs = value.chars();
        var l : Nat = value.size();
        var i : Nat = 0;

        while (i < l) {
            switch (cs.next()) {
                case null {
                    return false;
                };
                case (?c) {
                    if (not Char.isAlphabetic(c) and not Char.isDigit(c) and c != '-') {
                        return false;
                    };
                };
            };
            i += 1;
        };
        //check if handle is in the publication handle hashmap
        var exists = publicationHandleHashMap.get(value);
        if (exists != null) {
            return false;
        };

        true;
    };

    // gets canister id
    public func idQuick() : async Principal {
        //change to actor when we have dynamic canister
        return Principal.fromActor(this);
    };

    private func idInternal() : Principal {
        //change to actor when we have dynamic canister
        Principal.fromActor(this);
    };

    private func getNullPublication(principalId : Text) : Publication {
        {
            publicationHandle = "";
            publicationTitle = "";
            editors = [];
            writers = [];
            headerImage = "";
            subtitle = "";
            description = "";
            categories = [];
            socialLinks = {
                website = "";
                socialChannels = [];
            };
            avatar = "";
            created = "0";
            modified = "0";
            styling = {
                fontType = "";
                primaryColor = "";
                logo = "";
            };
            cta = {
                buttonCopy = "";
                ctaCopy = "";
                link = "";
                icon = "";
            };
            nftCanisterId = "";
        };
    };

    private func putPublication(canisterId : Text, principalId : Text, publisher : Publication) {

        canistergeekMonitor.collectMetrics();
        Debug.print("User->putUser: " # principalId);
        canisterIdHashMap.put(canisterId, canisterId);
        publicationHandleHashMap.put(canisterId, publisher.publicationHandle);
        publicationTitleHashMap.put(canisterId, publisher.publicationTitle);
        editorsHashMap.put(canisterId, publisher.editors);
        writersHashMap.put(canisterId, publisher.writers);
        headerImageHashMap.put(canisterId, publisher.headerImage);
        subtitleHashMap.put(canisterId, publisher.subtitle);
        descriptionHashMap.put(canisterId, publisher.description);
        websiteHashMap.put(canisterId, publisher.socialLinks.website);
        socialChannelsUrlsHashMap.put(canisterId, publisher.socialLinks.socialChannels);
        avatarHashMap.put(canisterId, publisher.avatar);
        createdHashMap.put(canisterId, publisher.created);
        modifiedHashMap.put(canisterId, publisher.modified);
    };

    private func createNewPublication(canisterId : Text, principalId : Text, publicationHandle : Text, publicationTitle : Text) : Publication {
        {
            canisterId = canisterId;
            publicationHandle = publicationHandle;
            publicationTitle = publicationTitle;
            editors = [principalId];
            writers = [];
            headerImage = "";
            subtitle = "";
            description = "";
            categories = [];
            socialLinks = {
                website = "";
                socialChannels = [];
            };
            avatar = "";
            created = Int.toText(U.epochTime());
            modified = Int.toText(U.epochTime());
            styling = {
                fontType = "";
                primaryColor = "";
                logo = "";
            };
            cta = {
                buttonCopy = "";
                ctaCopy = "";
                link = "";
                icon = "";
            };
            nftCanisterId = "";
        };
    };

    private func buildPublication(canisterId : Text) : Publication {
        canistergeekMonitor.collectMetrics();
        var publication : Publication = getNullPublication(canisterId);
        //var canisterId = U.safeGet(canisterIdHashMap, canisterId, "");
        if (canisterId != "") {
            publication := {
                publicationHandle = U.safeGet(publicationHandleHashMap, canisterId, "");
                publicationTitle = U.safeGet(publicationTitleHashMap, canisterId, "");
                editors = U.safeGet(editorsHashMap, canisterId, []);
                writers = U.safeGet(writersHashMap, canisterId, []);
                headerImage = U.safeGet(headerImageHashMap, canisterId, "");
                subtitle = U.safeGet(subtitleHashMap, canisterId, "");
                description = U.safeGet(descriptionHashMap, canisterId, "");
                categories = U.safeGet(categoriesHashMap, canisterId, []);
                socialLinks = {
                    website = U.safeGet(websiteHashMap, canisterId, "");
                    socialChannels = U.safeGet(socialChannelsUrlsHashMap, canisterId, []);
                };
                avatar = U.safeGet(avatarHashMap, canisterId, "");
                created = U.safeGet(createdHashMap, canisterId, "");
                modified = U.safeGet(modifiedHashMap, canisterId, "");
                styling = {
                    fontType = U.safeGet(stylingFontTypeHashmap, canisterId, "default");
                    primaryColor = U.safeGet(stylingPrimaryColorHashmap, canisterId, "");
                    logo = U.safeGet(brandLogoHashmap, canisterId, "");
                };
                cta = {
                    buttonCopy = U.safeGet(publicationCtaButtonCopyHashMap, canisterId, "");
                    ctaCopy = U.safeGet(publicationCtaCopyHashMap, canisterId, "");
                    link = U.safeGet(publicationCtaLinkHashMap, canisterId, "");
                    icon = U.safeGet(publicationCtaIconHashMap, canisterId, "");
                };
                nftCanisterId = if(nftCanisterIds.size() == 0){""} else{nftCanisterIds[0]};
            };
        };

        publication;
    };

    //use when editor/writer handles are needed
    private func getPublicationInternal(canisterId : Text) : Publication {

        var publication : Publication = getNullPublication(canisterId);
        publication := buildPublication(canisterId);

        publication := {
            publicationHandle = publication.publicationHandle;
            publicationTitle = publication.publicationTitle;
            editors = U.safeGet(editorsHandlesHashmap, canisterId, []);
            writers = U.safeGet(writersHandlesHashmap, canisterId, []);
            headerImage = publication.headerImage;
            subtitle = publication.subtitle;
            description = publication.description;
            categories = publication.categories;
            socialLinks = publication.socialLinks;
            avatar = publication.avatar;
            created = publication.created;
            modified = publication.modified;
            styling = publication.styling;
            cta = publication.cta;
            nftCanisterId = if(nftCanisterIds.size() == 0){""} else{nftCanisterIds[0]};
        };

        publication;
    };

    public shared ({ caller }) func initializeCanister(postCoreCai : Text, userCai : Text, nftFactoryCai : Text) : async Result.Result<Text, Text> {
        #err("Deprecated function.")
    };

    public shared ({ caller }) func registerPublication(handle : Text, displayName : Text) : async Result.Result<Publication, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        canistergeekMonitor.collectMetrics();
        var principalId = Principal.toText(caller);
        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        Debug.print("User->registerPublication principalId: " # principalId);

        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };
        if (not isValidHandle(handle)) {
            return #err("Invalid publication handle");
        };

        let UserCanister = CanisterDeclarations.getUserCanister();

        //check if the handle exists
        switch (await UserCanister.getPrincipalByHandle(handle)) {
            case (#ok(principal)) {
                return #err("Handle exists!");
            };
            case (_) {};
        };

        var publisher = createNewPublication(canisterId, principalId, Text.trimStart(handle, #char('@')), displayName);
        var publicationHandles = publisher.publicationHandle;
        var isPublicationEditor = true; //Creator will need to be the first editor to add other editors
        var userReturn = await UserCanister.registerUser(handle, displayName, "");
        switch (userReturn) {
            case (#ok(user))();
            case (#err(err)) return #err(err);
        };

        var addPublicationReturn = await UserCanister.addPublication({ publicationName = publicationHandles; isEditor = isPublicationEditor }, principalId);
        switch (addPublicationReturn) {
            case (#ok(user))(Debug.print("UserCanister.registerPublication " # user.handle));
            case (#err(err)) return #err(err);
        };

        //used ignore. no need to wait, just informs post canister about the handle
        let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
        //ToDo: migrate this to PublicationManagement
        ignore PostCoreCanister.registerPublisher();

        putPublication(canisterId, principalId, publisher);
        #ok(buildPublication(canisterId));
    };

    // for initial few publications this unregister func is a helpful back up to fix errors
    // and a starting point for the realtime publication canister, which will need to allow for deletions from editors list
    // In the current state you still need to delete the user from the user canister using delete user, and then deleteUserPosts
    // from post canister.
    public shared ({ caller }) func unregisterPublication() : async Result.Result<Text, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        canistergeekMonitor.collectMetrics();
        var principalId = Principal.toText(caller);
        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);

        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        var publicationHandle = U.safeGet(publicationHandleHashMap, canisterId, "");
        var publicationTitle = U.safeGet(publicationTitleHashMap, canisterId, "");
        var editors = U.safeGet(editorsHashMap, principalId, []);
        //var user: {#err : Text; #ok : Nat} = await UserCanister.deleteUser();
        publicationHandleHashMap.delete(canisterId);
        publicationTitleHashMap.delete(canisterId);
        editorsHashMap.delete(canisterId);
        canisterIdHashMap.delete(canisterId);
        writersHashMap.delete(canisterId);
        headerImageHashMap.delete(canisterId);
        subtitleHashMap.delete(canisterId);
        descriptionHashMap.delete(canisterId);
        websiteHashMap.delete(canisterId);
        socialChannelsUrlsHashMap.delete(canisterId);
        avatarHashMap.delete(canisterId);
        createdHashMap.delete(canisterId);
        modifiedHashMap.delete(canisterId);

        #ok("ok");
    };

    //Todo: add delete post cross canister func

    private func isEditor(caller : Principal, canisterId : Text) : Bool {

        canistergeekMonitor.collectMetrics();
        var publication = buildPublication(canisterId);
        var editors = publication.editors;
        Debug.print("Publication->isEditor Caller Name: " # Principal.toText(caller));
        Debug.print("Publication->isEditor canisterId: " # canisterId);

        if (Principal.toText(caller) == canisterId) {
            Debug.print("Publication->isEditor caller == canisterID : true");
            return true;
        };

        var editorsList : List<Text> = List.nil<Text>();
        for (loggedEditor in Iter.fromArray(editors)) {
            editorsList := List.push<Text>(loggedEditor, editorsList);
        };
        var c = Principal.toText(caller);
        var exists = List.find<Text>(editorsList, func(val : Text) : Bool { val == c });

        exists != null;
    };
    private func isWriter(caller : Principal, canisterId : Text) : Bool {
        canistergeekMonitor.collectMetrics();
        var publication = buildPublication(canisterId);
        var writers = publication.writers;
        Debug.print("Publication->isWriter Caller Name: " # Principal.toText(caller));
        Debug.print("Publication->isWriter canisterId: " # canisterId);

        if (Principal.toText(caller) == canisterId) {
            Debug.print("Publication->isWriter caller == canisterID : true");
            return true;
        };
        var writersList : List<Text> = List.nil<Text>();
        for (loggedWriter in Iter.fromArray(writers)) {
            writersList := List.push<Text>(loggedWriter, writersList);
        };
        var c = Principal.toText(caller);
        var exists = List.find<Text>(writersList, func(val : Text) : Bool { val == c });
        exists != null;
    };

    public shared ({ caller }) func addEditor(editorHandle : Text) : async Result.Result<Publication, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        //validate inputs
        if (not U.isTextLengthValid(editorHandle, 64)) {
            return #err("Invalid editorHandle");
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        canistergeekMonitor.collectMetrics();
        var principalId = Principal.toText(caller);
        var existingEditorsList : List<Text> = List.nil<Text>();
        var newEditorsList : List<Text> = List.nil<Text>();
        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        var publication = buildPublication(canisterId);
        var editors = publication.editors;
        var editor = "";
        var existingEditorsHandlesList : List<Text> = List.fromArray(U.safeGet(editorsHandlesHashmap, canisterId, []));
        var newEditorsHandlesList : List<Text> = List.fromArray(U.safeGet(editorsHandlesHashmap, canisterId, []));

        //iter over editors and push each to new editors list
        for (loggedEditor in Iter.fromArray(editors)) {
            newEditorsList := List.push<Text>(loggedEditor, newEditorsList);
            existingEditorsList := List.push<Text>(loggedEditor, existingEditorsList);
        };

        if (not isEditor(caller, canisterId)) {
            Debug.print("User->addEditor not editor" # Principal.toText(caller));
            return #err(NotEditor);
        };

        //convert handle to principal id from user canister
        let UserCanister = CanisterDeclarations.getUserCanister();
        var userReturn = await UserCanister.getPrincipalByHandle(U.lowerCase(editorHandle));
        switch (userReturn) {
            case (#ok(?id))(editor := id);
            case (#ok(null)) return #err(UserNotFound);
            case (#err(err)) return #err(err);
        };

        //valid handle?
        if (isWriter(Principal.fromText(editor), canisterId)) {
            return #err(HandleIsWriter);
        };

        if (editor != "") {

            //check if editor is already in the list
            var exists = List.find<Text>(existingEditorsList, func(val : Text) : Bool { val == editor });
            if (exists != null) {
                return #err("Editor already exists");
            };

            //check if editorHandle is already in the editorHandles list
            exists := List.find<Text>(existingEditorsHandlesList, func(val : Text) : Bool { val == editorHandle });
            if (exists != null) {
                return #err("Editor already exists");
            };

            //add editor's principal-id to editorsHashmap
            newEditorsList := List.push<Text>(editor, newEditorsList);
            let publishersArray = List.toArray(newEditorsList);
            editorsHashMap.put(canisterId, publishersArray);

            //add editor's handle to editorsHandlesHashmap
            newEditorsHandlesList := List.push<Text>(U.lowerCase(editorHandle), existingEditorsHandlesList);
            let editorsHandlesArray = List.toArray(newEditorsHandlesList);
            editorsHandlesHashmap.put(canisterId, editorsHandlesArray);

            try {
                var addPublicationReturn = await UserCanister.addPublication({ publicationName = publication.publicationHandle; isEditor = true }, editor);
                switch (addPublicationReturn) {
                    case (#ok(user))(Debug.print("UserCanister.addPublication " # user.handle));
                    case (#err(err)) {
                        //reverse the state changes if the inter-canister call returns an error
                        editorsHashMap.put(canisterId, List.toArray(existingEditorsList));
                        editorsHandlesHashmap.put(canisterId, List.toArray(existingEditorsHandlesList));
                        return #err(err);
                    };
                };
                let postCoreCanister = CanisterDeclarations.getPostCoreCanister();
                ignore postCoreCanister.updatePublicationEditorsAndWriters(publication.publicationHandle, publishersArray, publication.writers);
            } catch e {
                //reverse the state changes if the inter canister call fails
                editorsHashMap.put(canisterId, List.toArray(existingEditorsList));
                editorsHandlesHashmap.put(canisterId, List.toArray(existingEditorsHandlesList));
                return #err("Inter canister call failed!");
            };

        };
        #ok(buildPublication(canisterId));
    };

    public shared ({ caller }) func addWriter(writerHandle : Text) : async Result.Result<Publication, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        //validate inputs
        if (not U.isTextLengthValid(writerHandle, 64)) {
            return #err("Invalid writerHandle");
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        canistergeekMonitor.collectMetrics();
        var principalId = Principal.toText(caller);
        var existingWritersList : List<Text> = List.nil<Text>();
        var newWritersList : List<Text> = List.nil<Text>();
        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        var publication = buildPublication(canisterId);
        var writers = publication.writers;
        var writer = "";
        var existingWritersHandlesList : List<Text> = List.fromArray(U.safeGet(writersHandlesHashmap, canisterId, []));
        var newWritersHandlesList : List<Text> = List.fromArray(U.safeGet(writersHandlesHashmap, canisterId, []));

        //iter over writers and push each to new writers list
        for (loggedWriter in Iter.fromArray(writers)) {
            existingWritersList := List.push<Text>(loggedWriter, existingWritersList);
            newWritersList := List.push<Text>(loggedWriter, newWritersList);
        };
        if (not isEditor(caller, canisterId)) {
            return #err(NotEditor);
        };

        //convert handle to principal id from user canister
        let UserCanister = CanisterDeclarations.getUserCanister();
        var userReturn = await UserCanister.getPrincipalByHandle(U.lowerCase(writerHandle));
        switch (userReturn) {
            case (#ok(?id))(writer := id);
            case (#ok(null)) return #err(UserNotFound);
            //Todo: add case to prevent half added state
            case (#err(err)) return #err(err);
        };

        //valid handle?
        if (isEditor(Principal.fromText(writer), canisterId)) {
            return #err(HandleIsEditor);
        };
        if (writer != "") {
            //check if writer is already in the list
            var exists = List.find<Text>(existingWritersList, func(val : Text) : Bool { val == writer });
            if (exists != null) {
                return #err("Writer already exists");
            };

            //check if writerHandle is already in the writerHandles list
            exists := List.find<Text>(existingWritersHandlesList, func(val : Text) : Bool { val == writerHandle });
            if (exists != null) {
                return #err("Writer already exists");
            };

            //add writer's principal-id to writersHashmap
            newWritersList := List.push<Text>(writer, newWritersList);
            let publicationWriters = List.toArray(newWritersList);
            writersHashMap.put(canisterId, publicationWriters);

            //add writer's handle to writersHandlesHashmap
            newWritersHandlesList := List.push<Text>(U.lowerCase(writerHandle), newWritersHandlesList);
            let writersHandlesArray = List.toArray(newWritersHandlesList);
            writersHandlesHashmap.put(canisterId, writersHandlesArray);

            try {
                var addPublicationReturn = await UserCanister.addPublication({ publicationName = publication.publicationHandle; isEditor = false }, writer);
                switch (addPublicationReturn) {
                    case (#ok(user))();
                    case (#err(err)) {
                        //reverse the state changes if the intercanister call returns an error
                        editorsHashMap.put(canisterId, List.toArray(existingWritersList));
                        editorsHandlesHashmap.put(canisterId, List.toArray(existingWritersHandlesList));
                        return #err(err);
                    };
                };
                let postCoreCanister = CanisterDeclarations.getPostCoreCanister();
                ignore postCoreCanister.updatePublicationEditorsAndWriters(publication.publicationHandle, publication.editors, publicationWriters);
            } catch e {
                //reverse the state changes if the inter canister call fails
                editorsHashMap.put(canisterId, List.toArray(existingWritersList));
                editorsHandlesHashmap.put(canisterId, List.toArray(existingWritersHandlesList));
                return #err("Inter canister call failed!");
            };
        };
        #ok(buildPublication(canisterId));
    };

    public shared ({ caller }) func removeWriter(writerHandle : Text) : async Result.Result<Publication, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        //validate inputs
        if (not U.isTextLengthValid(writerHandle, 64)) {
            return #err("Invalid writerHandle");
        };

        canistergeekMonitor.collectMetrics();
        var principalId = Principal.toText(caller);
        var writersList : List<Text> = List.nil<Text>();
        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        var publication = buildPublication(canisterId);
        var writers = publication.writers;
        var writer = "";
        var writersHandlesList : List<Text> = List.nil<Text>();
        var writersHandles = U.safeGet(writersHandlesHashmap, canisterId, []);
        //iter over writers and push each to new writers list
        let UserCanister = CanisterDeclarations.getUserCanister();
        var userReturn = await UserCanister.getPrincipalByHandle(U.lowerCase(writerHandle));
        switch (userReturn) {
            case (#ok(?id))(writer := id);
            case (#ok(null)) return #err(UserNotFound);
            case (#err(err)) return #err(err);
        };

        if (not isEditor(caller, canisterId) and (writer != principalId)) {
            return #err(NotEditor);
        };

        for (loggedWriter in Iter.fromArray(writers)) {
            if (loggedWriter != writer) {
                writersList := List.push<Text>(loggedWriter, writersList);
            };
        };

        for (existingHandle in Iter.fromArray(writersHandles)) {
            if (existingHandle != writerHandle) {
                writersHandlesList := List.push<Text>(existingHandle, writersHandlesList);
            };
        };

        var removePublicationReturn = await UserCanister.removePublication({ publicationName = publication.publicationHandle; isEditor = false }, writer);
        switch (removePublicationReturn) {
            case (#ok(user))();
            case (#err(err)) return #err(err);
        };

        let postCoreCanister = CanisterDeclarations.getPostCoreCanister();
        ignore postCoreCanister.updatePublicationEditorsAndWriters(publication.publicationHandle, publication.editors, List.toArray(writersList));

        let publicationWriters = List.toArray(writersList);
        writersHashMap.put(canisterId, publicationWriters);

        let publicationWritersHandles = List.toArray(writersHandlesList);
        writersHandlesHashmap.put(canisterId, publicationWritersHandles);

        var getPublicationWithHandles = await getPublicationQuery(publication.publicationHandle);
        switch (getPublicationWithHandles) {
            case (#ok(publication)) return #ok(publication);
            case (#err(err)) return #err(err);
        };
    };

    public shared ({ caller }) func removeEditor(editorHandle : Text) : async Result.Result<Publication, Text> {

        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        //validate inputs
        if (not U.isTextLengthValid(editorHandle, 64)) {
            return #err("Invalid editorHandle");
        };

        canistergeekMonitor.collectMetrics();
        var principalId = Principal.toText(caller);
        var editorsList : List<Text> = List.nil<Text>();
        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        var publication = buildPublication(canisterId);
        var editors = publication.editors;
        var editor = "";
        var editorsHandlesList : List<Text> = List.nil<Text>();
        var editorsHandles = U.safeGet(editorsHandlesHashmap, canisterId, []);

        //iter over editors and push each to new editors list
        if (not isEditor(caller, canisterId)) {
            return #err(NotEditor);
        };

        let UserCanister = CanisterDeclarations.getUserCanister();
        var userReturn = await UserCanister.getPrincipalByHandle(U.lowerCase(editorHandle));
        switch (userReturn) {
            case (#ok(?id))(editor := id);
            case (#ok(null)) return #err(UserNotFound);
            case (#err(err)) return #err(err);
        };
        if (editor == principalId) {
            return #err("Cannot remove yourself");
        };

        for (loggedEditor in Iter.fromArray(editors)) {
            if (loggedEditor != editor) {
                editorsList := List.push<Text>(loggedEditor, editorsList);
            };
        };

        for (existingHandle in Iter.fromArray(editorsHandles)) {
            if (existingHandle != editorHandle) {
                editorsHandlesList := List.push<Text>(existingHandle, editorsHandlesList);
            };
        };

        //cross canister call to remove from publications array
        var removePublicationReturn = await UserCanister.removePublication({ publicationName = publication.publicationHandle; isEditor = true }, editor);
        switch (removePublicationReturn) {
            case (#ok(user))();
            case (#err(err)) return #err(err);
        };

        let postCoreCanister = CanisterDeclarations.getPostCoreCanister();
        ignore postCoreCanister.updatePublicationEditorsAndWriters(publication.publicationHandle, List.toArray(editorsList), publication.writers);

        //ToDo: check if editor is in the list

        let publicationEditors = List.toArray(editorsList);
        editorsHashMap.put(canisterId, publicationEditors);

        let publicationEditorsHandles = List.toArray(editorsHandlesList);
        editorsHandlesHashmap.put(canisterId, publicationEditorsHandles);

        var getPublicationWithHandles = await getPublicationQuery(publication.publicationHandle);
        switch (getPublicationWithHandles) {
            case (#ok(publication)) return #ok(publication);
            case (#err(err)) return #err(err);
        };

        //#ok(getPublication2);
    };

    public shared ({caller}) func updateEditorOrWriterHandle(existingHandle: Text, newHandle: Text) : async () {
        let callerPrincipal = Principal.toText(caller);
        if(not (isAdmin(caller))){
            return;
        };
        let canisterId = Principal.toText(idInternal());
        let editorHandles = U.safeGet(editorsHandlesHashmap, canisterId, []);
        let updatedEditorHandles = Buffer.Buffer<Text>(0);
        for(handle in editorHandles.vals()){
            if(handle == existingHandle){
                updatedEditorHandles.add(newHandle);
            }
            else{
                updatedEditorHandles.add(handle);
            }
        };
        editorsHandlesHashmap.put(canisterId, updatedEditorHandles.toArray());

        let writerHandles = U.safeGet(writersHandlesHashmap, canisterId, []);
        let updatedWriterHandles = Buffer.Buffer<Text>(0);
        for(handle in writerHandles.vals()){
            if(handle == existingHandle){
                updatedWriterHandles.add(newHandle);
            }
            else{
                updatedWriterHandles.add(handle);
            }
        };
        writersHandlesHashmap.put(canisterId, updatedWriterHandles.toArray())



    };

    public shared ({ caller }) func updatePublicationHandle(newHandle : Text) : async Result.Result<User, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            Debug.print("I AM HERE, you are not an admin");
            return #err(Unauthorized);
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        var publication = buildPublication(canisterId);

        var editorsPrincipalsList = List.fromArray<Text>(publication.editors);
        var writersPrincipalsList = List.fromArray<Text>(publication.writers);

        let appendedPrincipals = List.append(editorsPrincipalsList, writersPrincipalsList);
        let UserCanister = CanisterDeclarations.getUserCanister();
        switch (await UserCanister.updateHandle(publication.publicationHandle, newHandle, ENV.POST_CORE_CANISTER_ID, ?List.toArray(appendedPrincipals))) {
            case (#ok(val)) {
                //user canister and post canister successfully updated the handles
                //change the local state
                publicationHandleHashMap.put(canisterId, newHandle);

                return #ok(val);
            };
            case (#err(message)) {
                return #err(message);
            };
        };

    };

    public shared ({ caller }) func updatePublicationDetails(description : Text, publicationTitle : Text, headerImage : Text, categories : [Text], writers : [Text], editors : [Text], avatar : Text, subtitle : Text, socialLinks : SocialLinksObject, modified : Text) : async Result.Result<Publication, Text> {

        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        canistergeekMonitor.collectMetrics();

        if (isAnonymous(caller)) {
            return #err(Unauthorized);
        };

        if (not U.isTextLengthValid(description, 1000)) {
            return #err("Invalid description");
        };

        if (not U.isTextLengthValid(publicationTitle, 64)) {
            return #err("Invalid publicationTitle");
        };

        if (not U.isTextLengthValid(headerImage, 256)) {
            return #err("Invalid headerImage");
        };

        if (not U.isTextLengthValid(avatar, 256)) {
            return #err("Invalid avatar");
        };

        if (not U.isTextLengthValid(subtitle, 256)) {
            return #err("Invalid subtitle");
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        var publication = buildPublication(canisterId);

        if (not isEditor(caller, canisterId)) {
            return #err(NotEditor);
        };

        switch (await updatePublicationWriters(writers)) {
            case (#ok(publication))();
            case (#err(err)) {
                //don't change the state if the inter canister call returns an error
                return #err(err);
            };
        };
        switch (await updatePublicationEditors(editors)) {
            case (#ok(publication))();
            case (#err(err)) {
                //don't change the state if the inter canister call returns an error
                return #err(err);
            };
        };

        //add checking for unchanged values
        let UserCanister = CanisterDeclarations.getUserCanister();
        if (publicationTitle != publication.publicationTitle) {
            switch (await UserCanister.updateDisplayName(publicationTitle)) {
                case (#ok(user))();
                case (#err(err)) {
                    //don't change the state if the inter canister call returns an error
                    return #err(err);
                };
            };
        };

        if (avatar != publication.avatar) {
            switch (await UserCanister.updateAvatar(avatar)) {
                case (#ok(user))();
                case (#err(err)) {
                    //don't change the state if the inter canister call returns an error
                    return #err(err);
                };
            };
        };

        if (subtitle != publication.subtitle) {
            //updates 'user' bio
            switch (await UserCanister.updateBio(subtitle)) {
                case (#ok(user))();
                case (#err(err)) {
                    //don't change the state if the inter canister call returns an error
                    return #err(err);
                };
            };
        };
        descriptionHashMap.put(canisterId, description);
        publicationTitleHashMap.put(canisterId, publicationTitle); // updates 'user' displayname
        avatarHashMap.put(canisterId, avatar); //updates 'user' avatar
        subtitleHashMap.put(canisterId, subtitle);
        headerImageHashMap.put(canisterId, headerImage);
        categoriesHashMap.put(canisterId, categories);
        websiteHashMap.put(canisterId, socialLinks.website);
        socialChannelsUrlsHashMap.put(canisterId, socialLinks.socialChannels);
        modifiedHashMap.put(canisterId, modified);
        var getPublicationWithHandles = await getPublicationQuery(publication.publicationHandle);
        switch (getPublicationWithHandles) {
            case (#ok(publication)) return #ok(publication);
            case (#err(err)) return #err(err);
        };
    };

    public shared ({ caller }) func updatePublicationStyling(fontType : Text, primaryColor : Text, brandLogo : Text) : async Result.Result<Publication, Text> {

        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        //validate input
        if (isAnonymous(caller)) {
            return #err(Unauthorized);
        };

        if (not U.isTextLengthValid(fontType, 64)) {
            return #err("Invalid fontType");
        };

        if (not U.isTextLengthValid(primaryColor, 64)) {
            return #err("Invalid primaryColor");
        };

        if (not U.isTextLengthValid(brandLogo, 256)) {
            return #err("Invalid brandLogo");
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        canistergeekMonitor.collectMetrics();

        var whitelistedFontTypes = ["Fragment Mono", "Roboto", "Lato", "Montserrat", "Open Sans", "Poppins", "Xanh Mono", "default"];

        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        var publication = buildPublication(canisterId);

        if (not isEditor(caller, canisterId) and not isAdmin(caller)) {
            return #err(Unauthorized);
        };
        if (not U.arrayContains(whitelistedFontTypes, fontType)) {
            return #err("Font type is not whitelisted!");
        };
        let UserCanister = CanisterDeclarations.getUserCanister();
        switch (await UserCanister.updateFontType(fontType)) {
            case (#ok(user)) {};
            case (#err(err)) {
                return #err(err);
            };
        };

        stylingFontTypeHashmap.put(canisterId, fontType);

        stylingPrimaryColorHashmap.put(canisterId, primaryColor);

        brandLogoHashmap.put(canisterId, brandLogo);

        return #ok(getPublicationInternal(canisterId));

    };

    public shared ({ caller }) func updatePublicationCta(cta : PublicationCta) : async Result.Result<Publication, Text> {

        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        //validate input
        if (not U.isTextLengthValid(cta.buttonCopy, 64)) {
            return #err("Invalid CTA button copy length");
        };
        if (not U.isTextLengthValid(cta.ctaCopy, 100)) {
            return #err("Invalid CTA copy length");
        };
        if (not U.isTextLengthValid(cta.link, 200)) {

            return #err("Invalid CTA link length");
        };

        if (not U.isLinkValid(cta.link)) {
            return #err("Invalid CTA link");
        };

        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        var publication = buildPublication(canisterId);

        if (not isEditor(caller, canisterId) and not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        publicationCtaButtonCopyHashMap.put(canisterId, cta.buttonCopy);
        publicationCtaCopyHashMap.put(canisterId, cta.ctaCopy);
        publicationCtaLinkHashMap.put(canisterId, cta.link);
        publicationCtaIconHashMap.put(canisterId, cta.icon);

        return #ok(getPublicationInternal(canisterId));

    };

    //caller is canisterID
    public shared ({ caller }) func updatePublicationWriters(writers : [Text]) : async Result.Result<Publication, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        canistergeekMonitor.collectMetrics();

        if (isAnonymous(caller)) {
            return #err(Unauthorized);
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        var publication = getPublicationInternal(canisterId);

        if (not isEditor(caller, canisterId)) {
            return #err(NotEditor);
        };
        var writersList : List<Text> = List.nil<Text>();
        var updatedList : List<Text> = List.nil<Text>();

        for (writer in Iter.fromArray(publication.writers)) {
            writersList := List.push<Text>(writer, writersList);
            Debug.print("writer list: " # writer);
        };

        for (writer in Iter.fromArray(writers)) {
            var exists = List.find<Text>(writersList, func(val : Text) : Bool { val == writer });
            if (exists == null) {
                Debug.print("Exists == null:  " # writer);
                switch (await addWriter(writer)) {
                    case (#ok(publication))();
                    case (#err(err)) return #err(err);
                };
                updatedList := List.push<Text>(writer, updatedList);

            } else {
                Debug.print("Exists != null:  " # writer);

            };
        };

        //editorsHashMap.put(canisterId, editors);
        #ok(getPublicationInternal(canisterId));
    };

    private func updatePublicationEditors(editors : [Text]) : async Result.Result<Publication, Text> {

        canistergeekMonitor.collectMetrics();
        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        var publication = getPublicationInternal(canisterId);

        // if (not isEditor(caller, canisterId)) {
        //     return #err(NotEditor);
        // };

        var editorsList : List<Text> = List.nil<Text>();
        var updatedList : List<Text> = List.nil<Text>();

        //add publication editors to editors list
        for (editor in Iter.fromArray(publication.editors)) {
            editorsList := List.push<Text>(editor, editorsList);
            Debug.print("editor list: " # editor);
        };

        for (editor in Iter.fromArray(editors)) {
            var exists = List.find<Text>(editorsList, func(val : Text) : Bool { val == editor });
            if (exists == null) {
                Debug.print("Publisher0->updatePublicationEditors adding editor:   " # editor);
                switch (await addEditor(editor)) {
                    case (#ok(publication))();
                    case (#err(err)) return #err(err);
                };
                updatedList := List.push<Text>(editor, updatedList);

            } else {
                updatedList := List.push<Text>(editor, updatedList);
            };

        };

        //editorsHashMap.put(canisterId, editors);
        #ok(getPublicationInternal(canisterId));
    };

    public shared query ({ caller }) func getPublicationQuery(publicationHandle : Text) : async Result.Result<Publication, Text> {

        //validate input
        if (not U.isTextLengthValid(publicationHandle, 64)) {
            return #err("Invalid publicationHandle");
        };

        canistergeekMonitor.collectMetrics();
        Debug.print("Post->getPublicationQuery for publicationHandle: " # publicationHandle);

        var principalId = Principal.toText(caller);
        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        var publication = buildPublication(canisterId);

        publication := {
            publicationHandle = publication.publicationHandle;
            publicationTitle = publication.publicationTitle;
            editors = U.safeGet(editorsHandlesHashmap, canisterId, []);
            writers = U.safeGet(writersHandlesHashmap, canisterId, []);
            headerImage = publication.headerImage;
            subtitle = publication.subtitle;
            description = publication.description;
            categories = publication.categories;
            socialLinks = publication.socialLinks;
            avatar = publication.avatar;
            created = publication.created;
            modified = publication.modified;
            styling = publication.styling;
            cta = publication.cta;
            nftCanisterId = if(nftCanisterIds.size() == 0){""} else{nftCanisterIds[0]};
        };

        #ok(publication);
    };

    public shared ({ caller }) func getPublication(publicationHandle : Text) : async Result.Result<Publication, Text> {

        //validate input
        if (not U.isTextLengthValid(publicationHandle, 64)) {
            return #err("Invalid publicationHandle");
        };

        canistergeekMonitor.collectMetrics();
        Debug.print("Post->getPublicationQuery for publicationHandle: " # publicationHandle);

        var principalId = Principal.toText(caller);
        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        var publication = buildPublication(canisterId);

        if (publication.publicationHandle != publicationHandle) {
            return #err(UserNotFound);
        };

        publication := {
            publicationHandle = publication.publicationHandle;
            publicationTitle = publication.publicationTitle;
            editors = U.safeGet(editorsHandlesHashmap, canisterId, []);
            writers = U.safeGet(writersHandlesHashmap, canisterId, []);
            headerImage = publication.headerImage;
            subtitle = publication.subtitle;
            description = publication.description;
            categories = publication.categories;
            socialLinks = publication.socialLinks;
            avatar = publication.avatar;
            created = publication.created;
            modified = publication.modified;
            styling = publication.styling;
            cta = publication.cta;
            nftCanisterId = if(nftCanisterIds.size() == 0){""} else{nftCanisterIds[0]};
        };

        #ok(publication);
    };

    public shared query func getEditorAndWriterPrincipalIds() : async ([Text], [Text]){
        let canisterId = Principal.toText(idInternal());
        return (U.safeGet(editorsHashMap, canisterId, []), U.safeGet(writersHashMap, canisterId, []))
    };

    public shared ({ caller }) func getPublicationPosts(includeDraft : Bool, includePublished : Bool, indexFrom : Nat32, indexTo : Nat32) : async [Post] {
        var publicationCanisterId = idInternal();

        if (not isEditor(caller, Principal.toText(publicationCanisterId))) {
            return [];
        };
        let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
        let myPostsKeyPropertiesReturn = await PostCoreCanister.getMyPosts(includeDraft, includePublished, indexFrom, indexTo);

        var result = Buffer.Buffer<Post>(0);

        var bucketCanisterIdToPostKeyPropertiesHashmap = HashMap.HashMap<Text, List<PostKeyProperties>>(maxHashmapSize, isEq, Text.hash);

        for (keyProperty in myPostsKeyPropertiesReturn.vals()) {
            bucketCanisterIdToPostKeyPropertiesHashmap.put(keyProperty.bucketCanisterId, List.push(keyProperty, U.safeGet(bucketCanisterIdToPostKeyPropertiesHashmap, keyProperty.bucketCanisterId, List.nil<PostKeyProperties>())));
        };

        for ((bucketCanisterId, keyPropertiesList) in bucketCanisterIdToPostKeyPropertiesHashmap.entries()) {
            let bucketActor = actor (bucketCanisterId) : PostBucketInterface;

            let keyPropertiesArray = List.toArray(keyPropertiesList);

            let postIds = Array.map(
                keyPropertiesArray,
                func(keyProperty : PostKeyProperties) : Text {
                    return keyProperty.postId;
                },
            );

            let bucketCanisterReturn = await bucketActor.getPostsByPostIds(postIds, includeDraft);

            var counter = 0;
            for (postBucketType in bucketCanisterReturn.vals()) {
                let keyProperties = keyPropertiesArray[counter];
                result.add({
                    bucketCanisterId = keyProperties.bucketCanisterId;
                    category = postBucketType.category;
                    claps = keyProperties.claps;
                    content = postBucketType.content;
                    created = postBucketType.created;
                    creator = postBucketType.creator;
                    handle = postBucketType.handle;
                    headerImage = postBucketType.headerImage;
                    isDraft = postBucketType.isDraft;
                    isPremium = postBucketType.isPremium;
                    isPublication = postBucketType.isPublication;
                    modified = postBucketType.modified;
                    postId = postBucketType.postId;
                    publishedDate = postBucketType.publishedDate;
                    subtitle = postBucketType.subtitle;
                    tags = keyProperties.tags;
                    title = postBucketType.title;
                    url = postBucketType.url;
                    views = keyProperties.views;
                    wordCount = postBucketType.wordCount;
                });
                counter += 1;
            };

        };

        return Buffer.toArray(result);
    };

    public shared ({ caller }) func getWritersDrafts() : async [Post] {

        if (not isWriter(caller, Principal.toText(idInternal()))) {
            return [];
        };

        let writerPrincipalId = Principal.toText(caller);
        let UserCanister = CanisterDeclarations.getUserCanister();
        let getHandle = await UserCanister.getHandleByPrincipal(writerPrincipalId);
        var handle = ?"";
        switch (getHandle) {
            case (#ok(userHandle))(handle := userHandle);
            case (#err(err)) return [];
        };

        let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
        let myPostsKeyPropertiesReturn = await PostCoreCanister.getMyPosts(true, false, 0, 1000); //todo how to get all drafts w/o limit, for now 1000 will just default to size of all drafts in getMyPosts func

        var result = Buffer.Buffer<Post>(0);

        var bucketCanisterIdToPostKeyPropertiesHashmap = HashMap.HashMap<Text, List<PostKeyProperties>>(maxHashmapSize, isEq, Text.hash);

        for (keyProperty in myPostsKeyPropertiesReturn.vals()) {
            bucketCanisterIdToPostKeyPropertiesHashmap.put(keyProperty.bucketCanisterId, List.push(keyProperty, U.safeGet(bucketCanisterIdToPostKeyPropertiesHashmap, keyProperty.bucketCanisterId, List.nil<PostKeyProperties>())));
        };

        for ((bucketCanisterId, keyPropertiesList) in bucketCanisterIdToPostKeyPropertiesHashmap.entries()) {
            let bucketActor = actor (bucketCanisterId) : PostBucketInterface;

            let keyPropertiesArray = List.toArray(keyPropertiesList);

            let postIds = Array.map(
                keyPropertiesArray,
                func(keyProperty : PostKeyProperties) : Text {
                    return keyProperty.postId;
                },
            );

            let bucketCanisterReturn = await bucketActor.getPostsByPostIds(postIds, true);

            var counter = 0;
            for (postBucketType in bucketCanisterReturn.vals()) {
                let keyProperties = keyPropertiesArray[counter];
                if (?postBucketType.creator == handle) {
                    result.add({
                        bucketCanisterId = keyProperties.bucketCanisterId;
                        category = postBucketType.category;
                        claps = keyProperties.claps;
                        content = postBucketType.content;
                        created = postBucketType.created;
                        creator = postBucketType.creator;
                        handle = postBucketType.handle;
                        headerImage = postBucketType.headerImage;
                        isDraft = postBucketType.isDraft;
                        isPremium = postBucketType.isPremium;
                        isPublication = postBucketType.isPublication;
                        modified = postBucketType.modified;
                        postId = postBucketType.postId;
                        publishedDate = postBucketType.publishedDate;
                        subtitle = postBucketType.subtitle;
                        tags = keyProperties.tags;
                        title = postBucketType.title;
                        url = postBucketType.url;
                        views = keyProperties.views;
                        wordCount = postBucketType.wordCount;
                    });
                    counter += 1;
                };
            };

        };

        //return slice of array
        return Buffer.toArray(result);

    };

    public shared ({ caller }) func getPublicationPost(postId : Text) : async Result.Result<Post, Text> {

        //validate input
        if (not U.isTextLengthValid(postId, 20)) {
            return #err("Invalid postId");
        };
        var publicationCanisterId = idInternal();

        if (not isEditor(caller, Principal.toText(publicationCanisterId))) {
            return #err(Unauthorized);
        };

        let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
        switch (await PostCoreCanister.getPostKeyProperties(postId)) {
            case (#ok(keyProperties)) {
                let bucketActor = actor (keyProperties.bucketCanisterId) : PostBucketInterface;

                let bucketCanisterReturn = await bucketActor.getPost(postId);

                switch (bucketCanisterReturn) {
                    case (#ok(postBucketType)) {
                        return #ok({
                            bucketCanisterId = keyProperties.bucketCanisterId;
                            category = postBucketType.category;
                            claps = keyProperties.claps;
                            content = postBucketType.content;
                            created = postBucketType.created;
                            creator = postBucketType.creator;
                            handle = postBucketType.handle;
                            headerImage = postBucketType.headerImage;
                            isDraft = postBucketType.isDraft;
                            isPremium = postBucketType.isPremium;
                            isPublication = postBucketType.isPublication;
                            modified = postBucketType.modified;
                            postId = postBucketType.postId;
                            publishedDate = postBucketType.publishedDate;
                            subtitle = postBucketType.subtitle;
                            tags = keyProperties.tags;
                            title = postBucketType.title;
                            url = postBucketType.url;
                            views = keyProperties.views;
                            wordCount = postBucketType.wordCount;
                        });
                    };
                    case (#err(err)) {
                        return #err(err);
                    };
                };
            };
            case (#err(err)) {
                return #err(err);
            };
        };
    };

    public shared ({ caller }) func removePublicationPostCategory(postId : Text) : async Result.Result<Post, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        //validate input
        if (not U.isTextLengthValid(postId, 20)) {
            return #err("Invalid postId");
        };

        var publicationCanisterId = idInternal();

        if (not isEditor(caller, Principal.toText(publicationCanisterId))) {
            return #err(Unauthorized);
        };

        let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
        switch (await PostCoreCanister.getPostKeyProperties(postId)) {
            case (#ok(keyProperties)) {
                let bucketActor = actor (keyProperties.bucketCanisterId) : PostBucketInterface;

                let bucketCanisterReturn = await bucketActor.removePostCategory(postId);

                switch (bucketCanisterReturn) {
                    case (#ok(postBucketType)) {
                        return #ok({
                            bucketCanisterId = keyProperties.bucketCanisterId;
                            category = postBucketType.category;
                            claps = keyProperties.claps;
                            content = postBucketType.content;
                            created = postBucketType.created;
                            creator = postBucketType.creator;
                            handle = postBucketType.handle;
                            headerImage = postBucketType.headerImage;
                            isDraft = postBucketType.isDraft;
                            isPremium = postBucketType.isPremium;
                            isPublication = postBucketType.isPublication;
                            modified = postBucketType.modified;
                            postId = postBucketType.postId;
                            publishedDate = postBucketType.publishedDate;
                            subtitle = postBucketType.subtitle;
                            tags = keyProperties.tags;
                            title = postBucketType.title;
                            url = postBucketType.url;
                            views = keyProperties.views;
                            wordCount = postBucketType.wordCount;
                        });
                    };
                    case (#err(err)) {
                        return #err(err);
                    };
                };
            };
            case (#err(err)) {
                return #err(err);
            };
        };
    };

    public shared ({ caller }) func addPublicationPostCategory(postId : Text, category : Text) : async Result.Result<Post, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        //validate input
        if (not U.isTextLengthValid(postId, 20)) {
            return #err("Invalid postId");
        };
        if (not U.isTextLengthValid(category, 64)) {
            return #err("Invalid category");
        };

        var publicationCanisterId = idInternal();

        if (not isEditor(caller, Principal.toText(publicationCanisterId))) {
            return #err(Unauthorized);
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
        switch (await PostCoreCanister.getPostKeyProperties(postId)) {
            case (#ok(keyProperties)) {
                let bucketActor = actor (keyProperties.bucketCanisterId) : PostBucketInterface;

                let bucketCanisterReturn = await bucketActor.addPostCategory(postId, category);

                switch (bucketCanisterReturn) {
                    case (#ok(postBucketType)) {
                        return #ok({
                            bucketCanisterId = keyProperties.bucketCanisterId;
                            category = postBucketType.category;
                            claps = keyProperties.claps;
                            content = postBucketType.content;
                            created = postBucketType.created;
                            creator = postBucketType.creator;
                            handle = postBucketType.handle;
                            headerImage = postBucketType.headerImage;
                            isDraft = postBucketType.isDraft;
                            isPremium = postBucketType.isPremium;
                            isPublication = postBucketType.isPublication;
                            modified = postBucketType.modified;
                            postId = postBucketType.postId;
                            publishedDate = postBucketType.publishedDate;
                            subtitle = postBucketType.subtitle;
                            tags = keyProperties.tags;
                            title = postBucketType.title;
                            url = postBucketType.url;
                            views = keyProperties.views;
                            wordCount = postBucketType.wordCount;
                        });
                    };
                    case (#err(err)) {
                        return #err(err);
                    };
                };
            };
            case (#err(err)) {
                return #err(err);
            };
        };
    };

    public shared ({ caller }) func updatePublicationPostDraft(postId : Text, isDraft : Bool) : async Result.Result<Post, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        //validate input
        if (not U.isTextLengthValid(postId, 20)) {
            return #err("Invalid postId");
        };

        var publicationCanisterId = idInternal();

        if (not isEditor(caller, Principal.toText(publicationCanisterId))) {
            return #err(Unauthorized);
        };

        let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
        switch (await PostCoreCanister.getPostKeyProperties(postId)) {
            case (#ok(keyProperties)) {
                let bucketActor = actor (keyProperties.bucketCanisterId) : PostBucketInterface;

                let bucketCanisterReturn = await bucketActor.updatePostDraft(postId, isDraft);

                switch (bucketCanisterReturn) {
                    case (#ok(postBucketType)) {
                        return #ok({
                            bucketCanisterId = keyProperties.bucketCanisterId;
                            category = postBucketType.category;
                            claps = keyProperties.claps;
                            content = postBucketType.content;
                            created = postBucketType.created;
                            creator = postBucketType.creator;
                            handle = postBucketType.handle;
                            headerImage = postBucketType.headerImage;
                            isDraft = postBucketType.isDraft;
                            isPremium = postBucketType.isPremium;
                            isPublication = postBucketType.isPublication;
                            modified = postBucketType.modified;
                            postId = postBucketType.postId;
                            publishedDate = postBucketType.publishedDate;
                            subtitle = postBucketType.subtitle;
                            tags = keyProperties.tags;
                            title = postBucketType.title;
                            url = postBucketType.url;
                            views = keyProperties.views;
                            wordCount = postBucketType.wordCount;
                        });
                    };
                    case (#err(err)) {
                        return #err(err);
                    };
                };
            };
            case (#err(err)) {
                return #err(err);
            };
        };
    };
    //we can remove this method because it was a migration function
    public shared ({ caller }) func migrateEditorsWritersHandles() : async Result.Result<Publication, Text> {

        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        let canisterId = Principal.toText(idInternal());

        if (not isEditor(caller, canisterId) and not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        var editorsPrincipalIdsList : List<Text> = List.fromArray<Text>(U.safeGet(editorsHashMap, canisterId, []));
        var writersPrincipalIdsList : List<Text> = List.fromArray<Text>(U.safeGet(writersHashMap, canisterId, []));

        var editorsHandlesList : List<Text> = List.nil<Text>();
        var writersHandlesList : List<Text> = List.nil<Text>();

        let UserCanister = CanisterDeclarations.getUserCanister();
        for (editorPrincipalId in Iter.fromList(editorsPrincipalIdsList)) {
            var editorHandle = await UserCanister.getHandleByPrincipal(editorPrincipalId);
            switch (editorHandle) {
                case (#ok(?handle)) {
                    editorsHandlesList := List.push<Text>(handle, editorsHandlesList);
                };
                case (#ok(null)) { Debug.print(UserNotFound) };
                case (#err(err)) { Debug.print(err) };
            };

        };

        for (writerPrincipalId in Iter.fromList(writersPrincipalIdsList)) {
            var writerHandle = await UserCanister.getHandleByPrincipal(writerPrincipalId);
            switch (writerHandle) {
                case (#ok(?handle)) {
                    writersHandlesList := List.push<Text>(handle, writersHandlesList);
                };
                case (#ok(null)) { Debug.print(UserNotFound) };
                case (#err(err)) { Debug.print(err) };
            };

        };

        editorsHandlesHashmap.put(canisterId, List.toArray(editorsHandlesList));
        writersHandlesHashmap.put(canisterId, List.toArray(writersHandlesList));

        #ok(getPublicationInternal(canisterId));
    };

    //NFT related functions

    public shared ({ caller }) func createNftCanister(royalty : Nat, royaltyAddress : AccountIdentifier) : async Result.Result<Text, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        if (not isAdmin(caller) and not isEditor(caller, canisterId) and not isPlatformOperator(caller)) {
            return #err(Unauthorized);
        };
        if (royalty > 10000) {
            return #err("Royalty can not be higher than 10%");
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        if (U.arraySize(nftCanisterIds) == 0) {
            let NftFactory = CanisterDeclarations.getNftFactoryCanister();
            switch (await NftFactory.createNftCanister()) {
                case (#ok(nftCanisterId)) {
                    //set marketplace royalty address
                    marketplaceRoyaltyAddress := royaltyAddress;
                    //set marketplace royalty
                    marketplaceRoyaltyPercentage := Nat64.fromNat(royalty);

                    let NftCanister = actor (nftCanisterId) : actor {
                        ext_setCollectionMetadata : (name : Text, metadata : Text) -> async ();
                        ext_setRoyalty : (request : [(AccountIdentifier, Nat64)]) -> async ();
                    };

                    //set collection metadata
                    let publication = getPublicationInternal(Principal.toText(idInternal()));

                    let setMetadataReturn = await NftCanister.ext_setCollectionMetadata(publication.publicationHandle, publication.publicationTitle);
                    let setRoyaltyReturn = await NftCanister.ext_setRoyalty([(principalToAID(idInternal()), marketplaceRoyaltyPercentage)]);
                    let nftCanisterIdsList = List.push(nftCanisterId, List.fromArray(nftCanisterIds));
                    nftCanisterIds := List.toArray(nftCanisterIdsList);

                    let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
                    let UserCanister = CanisterDeclarations.getUserCanister();
                    let registerNftCanisterIdPostCoreCanisterReturn = await PostCoreCanister.registerNftCanisterId(nftCanisterId, publication.publicationHandle);
                    let registerNftCanisterIdUserCanisterReturn = await UserCanister.registerNftCanisterId(nftCanisterId);

                    ignore PostCoreCanister.addCanisterToCyclesDispenser(nftCanisterId, 10_000_000_000_000, 5_000_000_000_000);

                    switch (registerNftCanisterIdPostCoreCanisterReturn) {
                        case (#ok(canisterId)) {
                            switch (registerNftCanisterIdUserCanisterReturn) {
                                case (#err(err)) {
                                    return #ok("Nft canister created with canister id: " # nftCanisterId # " but registering the Nft canister into User canister throw this error: " # err);
                                };
                                case (#ok(canisterId)) {
                                    return #ok("Nft canister created with canister id: " # nftCanisterId # " successfully!");
                                };
                            };
                        };
                        case (#err(err)) {
                            switch (registerNftCanisterIdUserCanisterReturn) {
                                case (#err(err)) {
                                    return #ok("Nft canister created with canister id: " # nftCanisterId # " but registering the Nft canister into PostCore canister and User canister throw this error: " # err);
                                };
                                case (#ok(canisterId)) {
                                    return #ok("Nft canister created with canister id: " # nftCanisterId # " but registering the Nft canister into PostCore canister throw this error: " # err);
                                };
                            };

                        };
                    };
                };
                case (#err(err)) { return #err(err) };
            };

        } else {
            return #err("NFT canister already created.");
        };

    };

    //set nuance address
    //only callable by admins
    public shared ({ caller }) func setNuanceAddress(aid : AccountIdentifier) : async Result.Result<AccountIdentifier, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (isAdmin(caller)) {
            nuanceShareAddress := aid;
            #ok(aid);
        } else {
            #err(Unauthorized);
        };
    };

    //sets percentage of nuance share
    //only callable by admins
    public shared ({ caller }) func setNuanceSharePercentage(percentage : Nat) : async Result.Result<Text, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (isAdmin(caller)) {
            nuanceSharePercentage := Nat64.fromNat(percentage);
            #ok(Nat.toText(percentage));
        } else {
            #err(Unauthorized);
        };
    };

    //sets the secondary marketplace royalty
    //only editors can call this
    public shared ({ caller }) func setNftCanisterRoyalty(royalty : Nat, royaltyAddress : AccountIdentifier) : async Result.Result<(Nat, AccountIdentifier), Text> {

        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        let canisterId = Principal.toText(idInternal());
        if (isEditor(caller, canisterId) or isAdmin(caller)) {
            if (royalty > 1000) {
                return #err("Royalty can not be higher than 10%");
            } else {
                marketplaceRoyaltyAddress := royaltyAddress;
                marketplaceRoyaltyPercentage := Nat64.fromNat(royalty);
                let NftCanister = actor (nftCanisterIds[0]) : actor {
                    ext_setCollectionMetadata : (name : Text, metadata : Text) -> async ();
                    ext_setRoyalty : (request : [(AccountIdentifier, Nat64)]) -> async ();
                };
                await NftCanister.ext_setRoyalty([(principalToAID(idInternal()), marketplaceRoyaltyPercentage)]);
                return #ok((royalty, marketplaceRoyaltyAddress));
            };

        } else {
            return #err(Unauthorized);
        };
    };

    //withdraw the ICPs gained from secondary marketplace to the preconfigured royalty address
    //private function, disperseIcp method automatically calls this
    private func disperseMarketplaceRoyalties() : async () {

        let publicationRoyaltyAddress = principalToAID(Principal.fromActor(this));
        let account_balance = await LedgerCanister.account_balance_dfx({
            account = publicationRoyaltyAddress;
        });
        let balance = account_balance.e8s;
        if (Nat64.greater(balance, 20000)) {
            let nuanceShare = Float.toInt(Float.fromInt(Nat64.toNat(balance)) * (Float.fromInt(Nat64.toNat(nuanceSharePercentage)) / 100.0) - 10000);
            let publicationShare = balance - Nat64.fromIntWrap(nuanceShare) - 20000;
            Debug.print("balance: " #Int.toText(Nat64.toNat(balance)));
            Debug.print("nuance share: " #Int.toText(nuanceShare));
            Debug.print("writer share: " #Int.toText(Nat64.toNat(publicationShare)));
            try {

                let nuanceTransferReturn = await LedgerCanister.send_dfx({
                    amount = { e8s = Nat64.fromIntWrap(nuanceShare) };
                    created_at_time = null;
                    fee = { e8s = 10000 };
                    memo = 0;
                    to = nuanceShareAddress;
                    from_subaccount = null;
                });

                let writerTransferReturn = await LedgerCanister.send_dfx({
                    amount = { e8s = publicationShare };
                    created_at_time = null;
                    fee = { e8s = 10000 };
                    memo = 0;
                    to = marketplaceRoyaltyAddress;
                    from_subaccount = null;
                });

            } catch (e) {
                Debug.print("transfer error");
            };

        };

    };

    //debug function will remove
    public shared ({ caller }) func debugRemoveNftCanister() : async () {
        if (isAnonymous(caller)) {
            return;
        };

        if (isAdmin(caller)) {
            nftCanisterIds := [];
        };
    };

    //temporary function to add existing nft canister
    public shared ({ caller }) func addNftCanister(canisterId : Text) : async () {
        if (isAdmin(caller)) {
            nftCanisterIds := [canisterId];
        };
    };

    //returns the NFT canister related information
    public shared query func getNftCanisterInformation() : async NftCanisterInformation {
        {
            marketplaceRoyaltyAddress = marketplaceRoyaltyAddress;
            marketplaceRoyaltyPercentage = Nat.toText(Nat64.toNat(marketplaceRoyaltyPercentage));
            nuanceSharePercentage = Nat.toText(Nat64.toNat(nuanceSharePercentage));
            nuanceShareAddress = nuanceShareAddress;
            canisterId = nftCanisterIds[0];
        };
    };

    //creates a new premium article by existing post's postId
    //returns an error if there's no nft canister created
    public shared ({ caller }) func createNftFromPremiumArticle(postId : Text, totalSupply : Nat, icpPrice : Nat, headerImage : Text) : async Result.Result<CreateNftFromArticleResponse, Text> {

        //validate input
        if (not U.isTextLengthValid(postId, 20)) {
            return #err("Invalid postId");
        };

        //control if nft canister is created
        if (U.arraySize(nftCanisterIds) == 0) {
            return #err("NFT canister is not created yet!");
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);
        //only an editor call this
        if (not isEditor(caller, canisterId) and not isWriter(caller, canisterId)) {
            return #err(NotEditor);
        };

        if (icpPrice == 0) {
            return #err("Sale price can not be equal to 0!");
        };

        let postReturn = await getPublicationPost(postId);

        switch (postReturn) {
            case (#ok(post)) {
                //if publication doesn't own the post, return an error
                if (post.handle != U.safeGet(publicationHandleHashMap, canisterId, "")) {
                    return #err(NotEditor);
                };
                //post should be draft
                if (not post.isDraft) {
                    return #err("Post is not draft. Can not be published as premium article.");
                };

                let editorsPrincipalsArray = U.safeGet(editorsHashMap, canisterId, []);

                if (Nat.less(totalSupply, U.arraySize(editorsPrincipalsArray) + 1)) {
                    return #err("Insufficient total supply to distribute NFTs to editors and writers itself.");
                };

                //a publication can create maximum of 7777 NFTs
                if (totalSupply + getTotalNftCount() > 7777) {
                    return #err("Maximum amount of NFTs can be created by a single publication is 7777!");
                };

                //make the post premium first and then, make it published
                let bucketActor = actor (post.bucketCanisterId) : PostBucketInterface;
                let makePremiumReturn = await bucketActor.makePostPremium(postId);

                if (not makePremiumReturn) {
                    return #err("This is already a premium article!");
                };
                //publish the article
                let publishReturn = await bucketActor.updatePostDraft(postId, false);

                //fetch metadata from post canister
                let metadata = await bucketActor.getMetadata(postId, totalSupply);

                switch (metadata) {
                    case (#err(err)) { return #err(err) };
                    case (#ok(metadata)) {
                        switch (metadata) {
                            case (#nonfungible(metadata)) {
                                //populate svg with post info
                                let svgBlob = Text.encodeUtf8(U.buildSvg(post, headerImage));
                                let NftCanister = actor (nftCanisterIds[0]) : actor {
                                    ext_assetAdd : (assetHandle : Text, ctype : Text, filename : Text, atype : AssetType, size : Nat) -> async ();
                                    ext_assetStream : (assetHandle : Text, chunk : Blob, first : Bool) -> async Bool;
                                    ext_mint : (request : [(AccountIdentifier, Metadata)]) -> async [TokenIndex];
                                };

                                let addAssetReturn = await NftCanister.ext_assetAdd(post.postId, "image/svg+xml", post.postId, #direct([]), svgBlob.size());

                                let assetStreamReturn = await NftCanister.ext_assetStream(post.postId, svgBlob, true);

                                //put price value and total-supply value to hashmaps
                                premiumArticlesIcpPricesHashmap.put(postId, icpPrice);
                                premiumArticlesTotalSuppliesHashmap.put(postId, totalSupply);
                                premiumArticlesWriterHandlesHashmap.put(postId, post.creator);

                                var mintReturnsBuffer = Buffer.Buffer<TokenIndex>(0);

                                let accountId = getAccountIdByPostId(post.postId);

                                //mint nfts and return the tokenIndexes
                                //if the total supply is higher than 200, divide it to chunks and mint them by chunks to prevent an error in ext side

                                if (Nat.greater(totalSupply, 200)) {
                                    let ext_mint_arguments = Array.tabulate<(AccountIdentifier, Metadata)>(totalSupply, func i : (AccountIdentifier, Metadata) { (accountId, #nonfungible({ name = metadata.name; asset = post.postId; thumbnail = post.postId; metadata = U.populateMetadataWithAccessKeyIndex(metadata.metadata, i + 1) })) });
                                    var using_mint_arguments_buffer = Buffer.Buffer<(AccountIdentifier, Metadata)>(0);
                                    for (mint_argument in ext_mint_arguments.vals()) {
                                        if (Nat.equal(using_mint_arguments_buffer.size(), 200)) {
                                            let mintReturnChunks = await NftCanister.ext_mint(Buffer.toArray(using_mint_arguments_buffer));
                                            for (mintReturn in mintReturnChunks.vals()) {
                                                mintReturnsBuffer.add(mintReturn);
                                            };
                                            using_mint_arguments_buffer.clear();
                                        };
                                        using_mint_arguments_buffer.add(mint_argument);
                                    };

                                    let mintReturnRemaining = await NftCanister.ext_mint(Buffer.toArray(using_mint_arguments_buffer));
                                    for (mintReturn in mintReturnRemaining.vals()) {
                                        mintReturnsBuffer.add(mintReturn);
                                    };

                                } else {
                                    let minting_array = Array.tabulate<(AccountIdentifier, Metadata)>(totalSupply, func i : (AccountIdentifier, Metadata) { (accountId, #nonfungible({ name = metadata.name; asset = post.postId; thumbnail = post.postId; metadata = U.populateMetadataWithAccessKeyIndex(metadata.metadata, i + 1) })) });

                                    let mintReturnAll = await NftCanister.ext_mint(minting_array);
                                    for (mintReturn in mintReturnAll.vals()) {
                                        mintReturnsBuffer.add(mintReturn);
                                    };
                                };

                                let responses = await distributeNfts(post.postId);

                                ignore await listAllTokens(post.postId);

                                premiumArticlesTokenIndexStartsHashmap.put(postId, mintReturnsBuffer.get(0));
                                let writerPremiumPostIdsList = List.fromArray(U.safeGet(writerPremiumArticlePostIdsHashmap, post.creator, []));
                                writerPremiumArticlePostIdsHashmap.put(post.creator, List.toArray(List.push(postId, writerPremiumPostIdsList)));

                                return #ok({
                                    tokenIndexes = Buffer.toArray(mintReturnsBuffer);
                                    transferResponses = responses;
                                });

                            };
                            case (_) {
                                return #err("Unexpected error.");
                            };

                        };

                    };
                };

            };
            case (#err(err)) {
                return #err(err);
            };
        };

    };
    //returns the total number of NFTs created by the publication
    private func getTotalNftCount() : Nat {
        var counter = 0;
        for (number in premiumArticlesTotalSuppliesHashmap.vals()) {
            counter += number;
        };
        counter;
    };

    //distributes the NFTs to the writer and all the editors right after nft is minted
    private func distributeNfts(postId : Text) : async [TransferResponse] {

        var publicationCanisterId = idInternal();
        var canisterId = Principal.toText(publicationCanisterId);

        let writerHandle = U.safeGet(premiumArticlesWriterHandlesHashmap, postId, "");

        var distributingPrincipalsList = List.fromArray(U.safeGet(editorsHashMap, canisterId, []));

        //get principal of writer from user canister to send an nft
        let UserCanister = CanisterDeclarations.getUserCanister();
        var userReturn = await UserCanister.getPrincipalByHandle(U.lowerCase(writerHandle));
        switch (userReturn) {
            case (#ok(writerPrincipal)) {
                switch (writerPrincipal) {
                    case (?principal) {
                        if (not U.arrayContains(List.toArray(distributingPrincipalsList), principal)) {
                            distributingPrincipalsList := List.push(principal, distributingPrincipalsList);
                        };
                    };
                    case (null) {};
                };

            };
            case (#err(err)) {};
        };
        let NftCanister = actor (nftCanisterIds[0]) : actor {
            ext_setMarketplaceOpen : (mpo : Time) -> async ();
            ext_mint : (request : [(AccountIdentifier, Metadata)]) -> async [TokenIndex];
            tokens_ext : (aid : AccountIdentifier) -> async Result.Result<[(TokenIndex, ?Listing, ?Blob)], CommonError>;
            ext_transfer : (request : TransferRequest) -> async TransferResponse;
        };
        let accountId = getAccountIdByPostId(postId);

        var transferResponses = Buffer.Buffer<TransferResponse>(0);

        var tokens = [];
        switch (await NftCanister.tokens_ext(accountId)) {
            case (#ok(tokens)) {
                //distribute nfts to all editors and writer of the post
                var counter = 0;

                for (receiver in List.toArray(distributingPrincipalsList).vals()) {
                    let transferResponse = await NftCanister.ext_transfer({
                        amount = 1;
                        from = #address(accountId);
                        to = #address(principalToAID(Principal.fromText(receiver)));
                        memo = Text.encodeUtf8(""); //don't know what that is, will ask to toniq team
                        notify = false; //don't know what that is, will ask to toniq team
                        subaccount = ?getSubaccountByPostId(postId);
                        token = indexToTokenIdentifier(tokens[counter].0);
                    });
                    transferResponses.add(transferResponse);
                    counter += 1;
                };

            };
            case (_) {};
        };
        //open the marketplace functionality
        await NftCanister.ext_setMarketplaceOpen(Time.now());

        Buffer.toArray(transferResponses)

    };
    //converts a principal to an AccountIdentifier
    private func principalToAID(principal : Principal) : Text {
        let accountIdentifier = ExtCore.User.toAID(#principal principal);
        return accountIdentifier;
    };
    //converts a tokenIndex to tokenIdentifier
    private func indexToTokenIdentifier(index : TokenIndex) : TokenIdentifier {
        let tokenIdentifier = ExtCore.TokenIdentifier.fromPrincipal(Principal.fromText(nftCanisterIds[0]), index);
        return tokenIdentifier;
    };

    //
    public query func getAccountIdByPostIdPublic(postId : Text) : async Text {
        //validate input
        if (not U.isTextLengthValid(postId, 20)) {
            return ("Invalid postId");
        };
        getAccountIdByPostId(postId);
    };

    //lists all the premium article NFTs with this postId
    public func listAllTokens(postId : Text) : async [Result.Result<(), CommonError>] {

        let NftCanister = actor (nftCanisterIds[0]) : actor {
            ext_setMarketplaceOpen : (mpo : Time) -> async ();
            ext_mint : (request : [(AccountIdentifier, Metadata)]) -> async [TokenIndex];
            tokens_ext : (aid : AccountIdentifier) -> async Result.Result<[(TokenIndex, ?Listing, ?Blob)], CommonError>;
            ext_transfer : (request : TransferRequest) -> async TransferResponse;
            ext_marketplaceList_multiple : (request : [ListRequest]) -> async [Result.Result<(), CommonError>];
        };

        var publicationCanisterId = idInternal();

        let accountId = getAccountIdByPostId(postId);

        let subAccount = getSubaccountByPostId(postId);

        let icpPrice = U.safeGet(premiumArticlesIcpPricesHashmap, postId, 0);

        var returnsBuffer = Buffer.Buffer<Result.Result<(), CommonError>>(0);

        switch (await NftCanister.tokens_ext(accountId)) {
            case (#ok(tokens)) {
                var listRequestsBuffer = Buffer.Buffer<ListRequest>(0);
                let chunkCount = tokens.size() / 200 + 1;
                var iter = 0;
                //list all the tokens by chunks
                while (iter < chunkCount) {
                    var i = iter * 200;
                    while (i < (iter + 1) * 200 and i < tokens.size()) {
                        let tokenIdentifier = ExtCore.TokenIdentifier.fromPrincipal(Principal.fromText(nftCanisterIds[0]), tokens[i].0);
                        listRequestsBuffer.add({
                            from_subaccount = ?subAccount;
                            price = ?Nat64.fromNat(icpPrice);
                            token = tokenIdentifier;
                        });
                        i += 1;
                    };
                    let responses = await NftCanister.ext_marketplaceList_multiple(Buffer.toArray(listRequestsBuffer));
                    for (response in responses.vals()) {
                        returnsBuffer.add(response);
                    };
                    listRequestsBuffer.clear();
                    iter += 1;
                };

            };
            case (_) {};
        };
        Buffer.toArray(returnsBuffer);
    };

    public shared query func getPremiumArticleInfo(postId : Text) : async Result.Result<GetPremiumArticleInfoReturn, Text> {

        //validate input
        if (not U.isTextLengthValid(postId, 20)) {
            return #err("Invalid postId");
        };

        let totalSupply = U.safeGet(premiumArticlesTotalSuppliesHashmap, postId, 0);
        let salePrice = U.safeGet(premiumArticlesIcpPricesHashmap, postId, 0);
        let tokenIndexStart = U.safeGet(premiumArticlesTokenIndexStartsHashmap, postId, Nat32.fromNat(0));
        var accountId = getAccountIdByPostId(postId);
        if (totalSupply == 0) {
            return #err("Premium article has not been created yet.");
        };

        return #ok({
            nftCanisterId = nftCanisterIds[0];
            postId = postId;
            totalSupply = Nat.toText(totalSupply);
            tokenIndexStart = Nat.toText(Nat32.toNat(tokenIndexStart));
            sellerAccount = getAccountIdByPostId(postId);
            writerHandle = U.safeGet(premiumArticlesWriterHandlesHashmap, postId, "");
        });
    };

    public shared query func getPremiumArticleInformationsByWriterHandle(handle : Text) : async [GetPremiumArticleInfoReturn] {
        //validate input
        if (not U.isTextLengthValid(handle, 64)) {
            return [];
        };
        let postIds = U.safeGet(writerPremiumArticlePostIdsHashmap, handle, []);
        if (postIds.size() == 0) {
            return [];
        };

        var resultBuffer = Buffer.Buffer<GetPremiumArticleInfoReturn>(0);

        for (postId in postIds.vals()) {
            resultBuffer.add({
                nftCanisterId = nftCanisterIds[0];
                postId = postId;
                totalSupply = Nat.toText(U.safeGet(premiumArticlesTotalSuppliesHashmap, postId, 0));
                tokenIndexStart = Nat.toText(Nat32.toNat(U.safeGet(premiumArticlesTokenIndexStartsHashmap, postId, Nat32.fromNat(0))));
                sellerAccount = getAccountIdByPostId(postId);
                writerHandle = U.safeGet(premiumArticlesWriterHandlesHashmap, postId, "");
            });
        };

        Buffer.toArray(resultBuffer);
    };

    public shared func disperseIcpTimerMethod() : async () {
        ignore disperseMarketplaceRoyalties();
        for (postId in premiumArticlesIcpPricesHashmap.keys()) {
            ignore disperseIcpGainedFromPost(postId);
        };
    };

    //distributes all the icps gained from sales to writers and royalty address
    public shared func disperseIcpGainedFromPost(postId : Text) : async Result.Result<Text, Text> {
        //validate input
        if (not U.isTextLengthValid(postId, 20)) {
            return #err("Invalid postId");
        };

        Debug.print("disperseIcpGainedFromPost -> " # postId);
        let writerHandle = U.safeGet(premiumArticlesWriterHandlesHashmap, postId, "");

        if (writerHandle == "") {
            return #err("There's no premium article with this postId");
        };

        var writerPrincipal = "";

        let UserCanister = CanisterDeclarations.getUserCanister();
        switch (await UserCanister.getPrincipalByHandle(U.lowerCase(writerHandle))) {
            case (#ok(?principal)) {
                writerPrincipal := principal;
            };
            case (_) {
                return #err("Cross canister writer not found!");
            };
        };

        let writerAccountId = principalToAID(Principal.fromText(writerPrincipal));

        let accountId = getAccountIdByPostId(postId);

        let account_balance = (await LedgerCanister.account_balance_dfx({ account = accountId })).e8s;

        if (Nat64.greater(account_balance, 20000)) {
            Debug.print("here1");
            let nuanceShare = Float.toInt(Float.fromInt(Nat64.toNat(account_balance)) * (Float.fromInt(Nat64.toNat(nuanceSharePercentage)) / 100.0) - 10000);
            Debug.print("here2");
            let writerShare = account_balance - Nat64.fromIntWrap(nuanceShare) - 20000;
            Debug.print("here3");
            Debug.print("balance: " #Int.toText(Nat64.toNat(account_balance)));
            Debug.print("nuance share: " #Int.toText(nuanceShare));
            Debug.print("writer share: " #Int.toText(Nat64.toNat(writerShare)));
            try {

                let nuanceTransferReturn = await LedgerCanister.send_dfx({
                    amount = { e8s = Nat64.fromIntWrap(nuanceShare) };
                    created_at_time = null;
                    fee = { e8s = 10000 };
                    memo = 0;
                    to = nuanceShareAddress;
                    from_subaccount = ?getSubaccountByPostId(postId);
                });

                let writerTransferReturn = await LedgerCanister.send_dfx({
                    amount = { e8s = writerShare };
                    created_at_time = null;
                    fee = { e8s = 10000 };
                    memo = 0;
                    to = writerAccountId;
                    from_subaccount = ?getSubaccountByPostId(postId);
                });
                Debug.print("nuance transfer return: " #Int.toText(Nat64.toNat(nuanceTransferReturn)));
                Debug.print("writer transfer return: " #Int.toText(Nat64.toNat(writerTransferReturn)));

                return #ok("Nuance received: " # Nat64.toText(nuanceTransferReturn) # ", Writer received: " # Nat64.toText(writerTransferReturn))

            } catch (e) {
                //if any of the transfer function returns an error, don't let it crash the whole function
                #err("An error occured while transferring ICPs!");
            };

        } else {
            #ok("There's not enough gain to distribute!");
        };

    };

    private func getAccountIdByPostId(postId : Text) : AccountIdentifier {
        let n = U.textToNat(postId) + 4294967296;
        let n_byte = func(i : Nat) : Nat8 {
            assert (i < 32);
            let shift : Nat = 8 * (32 - 1 - i);
            Nat8.fromIntWrap(n / 2 ** shift);
        };
        ExtUtil.fromPrincipal(Principal.fromActor(this), ?Array.tabulate<Nat8>(32, n_byte));
    };

    private func getSubaccountByPostId(postId : Text) : [Nat8] {
        let n = U.textToNat(postId) + 4294967296;
        let n_byte = func(i : Nat) : Nat8 {
            assert (i < 32);
            let shift : Nat = 8 * (32 - 1 - i);
            Nat8.fromIntWrap(n / 2 ** shift);
        };
        Array.tabulate<Nat8>(32, n_byte);
    };

    //#end Publisher function region

    //#region Canister Geek

    public shared query ({ caller }) func getCanisterMetrics(parameters : Canistergeek.GetMetricsParameters) : async ?Canistergeek.CanisterMetrics {
        if (not isCgUser(caller) and not isAdmin(caller)) {
            Prelude.unreachable();
        };
        Debug.print("Publisher0->getCanisterMetrics: The method getCanistermetrics was called from the UI successfully");
        canistergeekMonitor.getMetrics(parameters);
    };

    public shared ({ caller }) func collectCanisterMetrics() : async () {
        if (isAnonymous(caller)) {
            return;
        };

        if (not isCgUser(caller) and not isAdmin(caller)) {
            Prelude.unreachable();
        };
        canistergeekMonitor.collectMetrics();
        Debug.print("Publisher0->collectCanisterMetrics: The method collectCanisterMetrics was called from the UI successfully");
    };

    //cycle management
    public func acceptCycles() : async () {
        let available = Cycles.available();
        let accepted = Cycles.accept(available);
        assert (accepted == available);
    };
    public shared query func availableCycles() : async Nat {
        return Cycles.balance();
    };

    //#region memory management
    stable var MAX_MEMORY_SIZE = 380000000;

    public shared ({ caller }) func setMaxMemorySize(newValue : Nat) : async Result.Result<Nat, Text> {

        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err("Unauthorized");
        };
        MAX_MEMORY_SIZE := newValue;

        #ok(MAX_MEMORY_SIZE);
    };

    public shared query func getMaxMemorySize() : async Nat {
        MAX_MEMORY_SIZE;
    };

    public shared query func isThereEnoughMemory() : async Bool {
        isThereEnoughMemoryPrivate();
    };

    private func isThereEnoughMemoryPrivate() : Bool {
        MAX_MEMORY_SIZE > getMemorySizePrivate();
    };

    public shared query func getMemorySize() : async Nat {
        getMemorySizePrivate();
    };

    private func getMemorySizePrivate() : Nat {
        Prim.rts_memory_size();
    };

    public shared query func getCanisterVersion() : async Text {
        Versions.PUBLICATION_VERSION;
    };

    //#endregion

    //#Pre and post upgrades,
    system func preupgrade() {
        Debug.print("Publisher0->preupgrade: hashmap size: " # Nat.toText(index.size()));
        _canistergeekMonitorUD := ?canistergeekMonitor.preupgrade();
        Debug.print("Publisher0->preupgrade:Inside Canistergeek preupgrade method");
        publicationHandleEntries := Iter.toArray(publicationHandleHashMap.entries());
        publicationTitleEntries := Iter.toArray(publicationTitleHashMap.entries());
        editorsEntries := Iter.toArray(editorsHashMap.entries());
        canisterIdEntries := Iter.toArray(canisterIdHashMap.entries());
        writersEntries := Iter.toArray(writersHashMap.entries());
        headerImageEntries := Iter.toArray(headerImageHashMap.entries());
        subtitleEntries := Iter.toArray(subtitleHashMap.entries());
        descriptionEntries := Iter.toArray(descriptionHashMap.entries());
        categoriesEntries := Iter.toArray(categoriesHashMap.entries());
        websiteEntries := Iter.toArray(websiteHashMap.entries());
        socialChannelUrlsEntries := Iter.toArray(socialChannelsUrlsHashMap.entries());
        avatarEntries := Iter.toArray(avatarHashMap.entries());
        createdEntries := Iter.toArray(createdHashMap.entries());
        modifiedEntries := Iter.toArray(modifiedHashMap.entries());
        stylingFontTypeEntries := Iter.toArray(stylingFontTypeHashmap.entries());
        stylingPrimaryColorEntries := Iter.toArray(stylingPrimaryColorHashmap.entries());
        brandLogoEntries := Iter.toArray(brandLogoHashmap.entries());
        editorsHandlesEntries := Iter.toArray(editorsHandlesHashmap.entries());
        writersHandlesEntries := Iter.toArray(writersHandlesHashmap.entries());
        premiumArticlesTotalSuppliesEntries := Iter.toArray(premiumArticlesTotalSuppliesHashmap.entries());
        premiumArticlesIcpPricesEntries := Iter.toArray(premiumArticlesIcpPricesHashmap.entries());
        premiumArticlesWriterHandlesEntries := Iter.toArray(premiumArticlesWriterHandlesHashmap.entries());
        premiumArticlesTokenIndexStartsEntries := Iter.toArray(premiumArticlesTokenIndexStartsHashmap.entries());
        writerPremiumArticlePostIdsEntries := Iter.toArray(writerPremiumArticlePostIdsHashmap.entries());
        publicationCtaButtonCopyEntries := Iter.toArray(publicationCtaButtonCopyHashMap.entries());
        publicationCtaCopyEntries := Iter.toArray(publicationCtaCopyHashMap.entries());
        publicationCtaLinkEntries := Iter.toArray(publicationCtaLinkHashMap.entries());
        publicationCtaIconEntries := Iter.toArray(publicationCtaIconHashMap.entries());
        index := Iter.toArray(hashMap.entries());
    };

    system func postupgrade() {
        Debug.print("Publisher0->postupgrade: hashmap size: " # Nat.toText(index.size()));
        canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
        Debug.print("Publisher0->postupgrade:Inside Canistergeek postupgrade method");
        hashMap := HashMap.fromIter(index.vals(), maxHashmapSize, isEq, Text.hash);
        _canistergeekMonitorUD := null;
        index := [];
        publicationHandleEntries := [];
        publicationTitleEntries := [];
        editorsEntries := [];
        canisterIdEntries := [];
        writersEntries := [];
        subtitleEntries := [];
        descriptionEntries := [];
        categoriesEntries := [];
        websiteEntries := [];
        socialChannelUrlsEntries := [];
        avatarEntries := [];
        createdEntries := [];
        modifiedEntries := [];
        stylingFontTypeEntries := [];
        stylingPrimaryColorEntries := [];
        brandLogoEntries := [];
        editorsHandlesEntries := [];
        writersHandlesEntries := [];
        premiumArticlesTotalSuppliesEntries := [];
        premiumArticlesIcpPricesEntries := [];
        premiumArticlesWriterHandlesEntries := [];
        premiumArticlesTokenIndexStartsEntries := [];
        writerPremiumArticlePostIdsEntries := [];
        publicationCtaButtonCopyEntries := [];
        publicationCtaCopyEntries := [];
        publicationCtaLinkEntries := [];
        publicationCtaIconEntries := [];
    };

};
