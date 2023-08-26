import Array "mo:base/Array";
import Bool "mo:base/Bool";
import Buffer "mo:base/Buffer";
import Char "mo:base/Char";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Hash "mo:base/Hash";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Int32 "mo:base/Int32";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Order "mo:base/Order";
import Prelude "mo:base/Prelude";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Blob "mo:base/Blob";
import IC "mo:base/ExperimentalInternetComputer";
import Cycles "mo:base/ExperimentalCycles";
import Canistergeek "../canistergeek/canistergeek";
import MC "./modclub/modclub";
import Types "./types";
import U "../shared/utils";
import UserTypes "../User/types";
import Timer "mo:base/Timer";
import DateTime "../shared/DateTime";
import Nat16 "mo:base/Nat16";
import CanisterDeclarations "../shared/CanisterDeclarations";

actor Post {
    // local variables
    let canistergeekMonitor = Canistergeek.Monitor();
    let maxHashmapSize = 1000000;
    func isEq(x: Text, y: Text): Bool { x == y };

    // error messages
    let Unauthorized = "Unauthorized";
    let ArticleNotFound = "Article not found";
    let RejectedByModerators = "RejectedByModerators";
    let TagAlreadyExists = "Tag already exists";
    var InvalidTagId = "Invalid tag ID";
    let TagAlreadyFollowed = "Tag already followed";
    let UserNotFound = "User not found";
    let NotNuanceCanister = "Not a nuance canister, unauthorized";
    let NotPublicationPost = "Not a publication post. Can't have a category.";
    let ArticleNotEditable = "Premium article. Can not edit.";
    let NotPremium = "Post is not premium.";

    // data type aliases
    type List<T> = List.List<T>;
    type User = UserTypes.User;
    type Post = Types.Post;
    type UserPostCounts = Types.UserPostCounts;
    type PostSaveModel = Types.PostSaveModel;
    type ToDo = Types.Post;
    type Tag = Types.Tag;
    type TagModel = Types.TagModel;
    type PostTag = Types.PostTag;
    type PostTagModel = Types.PostTagModel;
    type PostModerationStatus = Types.PostModerationStatus;
    type GetPostsByFollowers = Types.GetPostsByFollowers;
    type SaveResult = Types.SaveResult;
    type PremiumArticleOwnersReturn = Types.PremiumArticleOwnersReturn;
    type PremiumArticleOwnerObject = Types.PremiumArticleOwnerObject;
    type RecallOptions = Types.RecallOptions;
    type DayOfWeek = Types.DayOfWeek;
    type  MonthOfYear = Types.MonthOfYear;
    type DateTimeParts = Types.DateTimeParts;

    type Publication = Types.Publication;

    type FastblocksPost = Types.FastblocksPost;

    type NftCanisterEntry = Types.NftCanisterEntry;

    type Order = {#less; #equal; #greater};

    //ext metadata types
    type Metadata = Types.Metadata;
    type MetadataValue = Types.MetadataValue;
    type MetadataContainer = Types.MetadataContainer;


    // permanent in-memory state (data types are not lost during upgrades)
    stable var admins : List.List<Text> = List.nil<Text>();
    stable var platformOperators : List.List<Text> = List.nil<Text>();
    stable var cgusers : List.List<Text> = List.nil<Text>();
    stable var nuanceCanisters : List.List<Text> = List.nil<Text>();
    stable var postId : Nat = 0;
    stable var popularHeartbeat : Int = 0;
    stable var tagIdCounter: Nat = 0;
    stable var modClubRulesAdded = false;
    stable var environment = "local";
    stable var totalViewsToday : Nat = 0; //stored by date and reset by timer daily, incremented by viewPost func
    stable var totalDailyViewsDate : Text = "20230101";
    stable var storeSEOonDeployment = false;
    //canister ids that this canister interacts with
    stable var postIndexCanisterId = "";
    stable var userCanisterId = "";

    // in-memory state swap (holds hashmap entries between preupgrade and postupgrade) then is cleared
    stable var _canistergeekMonitorUD: ? Canistergeek.UpgradeData = null;
    stable var handleEntries: [(Text, Text)] = [];
    stable var handleReverseEntries: [(Text, Text)] = [];
    stable var lowercaseHandleEntries: [(Text, Text)] = [];
    stable var lowercaseHandleReverseEntries: [(Text, Text)] = [];
    stable var userPostsEntries: [(Text, List.List<Text>)] = [];
    stable var principalIdEntries: [(Text, Text)] = [];
    stable var titleEntries: [(Text, Text)] = [];
    stable var subtitleEntries: [(Text, Text)] = [];
    stable var headerImageEntries: [(Text, Text)] = [];
    stable var contentEntries: [(Text, Text)] = [];
    stable var isDraftEntries: [(Text, Bool)] = [];
    stable var createdEntries: [(Text, Int)] = [];
    stable var modifiedEntries: [(Text, Int)] = [];
    stable var publishedDateEntries: [(Text, Int)] = [];
    stable var latestPostsEntries: [(Text, Text)] = [];
    stable var viewsEntries: [(Text, Nat)] = [];
    stable var dailyViewHistory: [(Text, Nat)] = [];
    stable var postModerationStatusEntries: [(Text, PostModerationStatus)] = [];
    stable var postVersionEntries: [(Text, Nat)] = [];
    stable var tagEntries: [(Text, Tag)] = [];
    stable var relationshipEntries: [(Text, [PostTag])] = [];
    stable var userTagRelationshipEntries: [(Text, [PostTag])] = [];
    stable var clapsEntries: [(Text, Nat)] = [];
    stable var popularity: [(Text, Nat)] = [];
    stable var popularityToday: [(Text, Nat)] = [];
    stable var popularityThisWeek: [(Text, Nat)] = [];
    stable var popularityThisMonth: [(Text, Nat)] = [];
    stable var popularitySortedArray: [(Text, Nat)] = [];
    stable var popularitySortedArrayToday: [(Text, Nat)] = [];
    stable var popularitySortedArrayThisWeek: [(Text, Nat)] = [];
    stable var popularitySortedArrayThisMonth: [(Text, Nat)] = [];
    stable var creatorEntries: [(Text, Text)] = [];
    stable var isPublicationEntries: [(Text, Bool)] = [];
    stable var categoryEntries: [(Text, Text)] = [];
    stable var wordCountsEntries: [(Text, Nat)] = [];
    stable var isPremiumEntries: [(Text, Bool)] = [];

    // in-memory state (holds object field data) - hashmaps must match entires in above stable vars and in preupgrade and postupgrade
    // HashMaps with one entry per user
    //   key: principalId, value: handle
    var handleHashMap = HashMap.fromIter<Text, Text>(handleEntries.vals(), maxHashmapSize, isEq, Text.hash);
    //   key: handle, value: principalId
    var handleReverseHashMap = HashMap.fromIter<Text, Text>(handleReverseEntries.vals(), maxHashmapSize, isEq, Text.hash);
    //   key: principalId, value: handle(lowercase)
    var lowercaseHandleHashMap = HashMap.fromIter<Text, Text>(lowercaseHandleEntries.vals(), maxHashmapSize, isEq, Text.hash);
    //   key: handle(lowercase), value: principalId
    var lowercaseHandleReverseHashMap = HashMap.fromIter<Text, Text>(lowercaseHandleReverseEntries.vals(), maxHashmapSize, isEq, Text.hash);
    //   key: principalId, value: List<postId>
    var userPostsHashMap = HashMap.fromIter<Text, List.List<Text>>(userPostsEntries.vals(), maxHashmapSize, isEq, Text.hash);

    // HashMaps with one entry per post (key: postId)
    var principalIdHashMap = HashMap.fromIter<Text, Text>(principalIdEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var titleHashMap = HashMap.fromIter<Text, Text>(titleEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var subtitleHashMap = HashMap.fromIter<Text, Text>(subtitleEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var headerImageHashMap = HashMap.fromIter<Text, Text>(headerImageEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var contentHashMap = HashMap.fromIter<Text, Text>(contentEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var isDraftHashMap = HashMap.fromIter<Text, Bool>(isDraftEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var createdHashMap = HashMap.fromIter<Text, Int>(createdEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var modifiedHashMap = HashMap.fromIter<Text, Int>(modifiedEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var publishedDateHashMap = HashMap.fromIter<Text, Int>(publishedDateEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var latestPostsHashmap = HashMap.fromIter<Text, Text>(latestPostsEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var viewsHashMap = HashMap.fromIter<Text, Nat>(viewsEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var dailyViewHistoryHashMap = HashMap.fromIter<Text, Nat>(dailyViewHistory.vals(), maxHashmapSize, isEq, Text.hash);
    var postModerationStatusMap = HashMap.fromIter<Text, PostModerationStatus>(postModerationStatusEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var postVersionMap = HashMap.fromIter<Text, Nat>(postVersionEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var tagsHashMap = HashMap.fromIter<Text, Tag>(tagEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var relationships = HashMap.fromIter<Text, [PostTag]>(relationshipEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var userTagRelationships = HashMap.fromIter<Text, [PostTag]>(userTagRelationshipEntries.vals(), maxHashmapSize, isEq, Text.hash);   
    var clapsHashMap = HashMap.fromIter<Text, Nat>(clapsEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var popularityHashMap = HashMap.fromIter<Text, Nat>(popularity.vals(), maxHashmapSize, isEq, Text.hash);
    var popularityTodayHashMap = HashMap.fromIter<Text, Nat>(popularityToday.vals(), maxHashmapSize, isEq, Text.hash);
    var popularityThisWeekHashMap = HashMap.fromIter<Text, Nat>(popularityThisWeek.vals(), maxHashmapSize, isEq, Text.hash);
    var popularityThisMonthHashMap = HashMap.fromIter<Text, Nat>(popularityThisMonth.vals(), maxHashmapSize, isEq, Text.hash);
    var creatorHashMap = HashMap.fromIter<Text, Text>(creatorEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var isPublicationHashMap = HashMap.fromIter<Text, Bool>(isPublicationEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var categoryHashMap = HashMap.fromIter<Text, Text>(categoryEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var wordCountsHashmap = HashMap.fromIter<Text, Nat>(wordCountsEntries.vals(), maxHashmapSize, isEq, Text.hash);
    var isPremiumHashMap = HashMap.fromIter<Text, Bool>(isPremiumEntries.vals(), maxHashmapSize, isEq, Text.hash);

    //nft canister ids mapped to publication handles (this can extend to regular user handles when we have nft feature for regular users too)

    stable var nftCanisterIds : [(Text, Text)] = [];
    var nftCanisterIdsHashmap = HashMap.fromIter<Text, Text>(nftCanisterIds.vals(), maxHashmapSize, isEq, Text.hash);

    //0th account-id of user's principal mapped to user's handle
    //key: account-id, value: handle
    stable var accountIdsToHandleEntries : [(Text, Text)] = [];
    var accountIdsToHandleHashMap = HashMap.fromIter<Text, Text>(accountIdsToHandleEntries.vals(),maxHashmapSize, isEq, Text.hash);

    //SNS
    public type Validate =  {
        #Ok : Text;
        #Err : Text;
    };

     public shared func validate(input: Any) : async Validate {
     
       return #Ok("success");
    };

    //#region Security Management
    
    private func isAnonymous(caller : Principal) : Bool {
        Principal.equal(caller, Principal.fromText("2vxsx-fae"))
    };

    private func isAuthor(caller : Principal, postId : Text) : Bool {
        ?Principal.toText(caller) == principalIdHashMap.get(postId);
    };

    private func isAdmin(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        var exists = List.find<Text>(admins, func(val: Text) : Bool { val == c });
        exists != null;
    };
    
     func isNuanceCanister (caller : Principal) : Bool {
        var c = Principal.toText(caller);
        var exists = List.find<Text>(nuanceCanisters, func(val: Text) : Bool { val == c });
        exists != null;
    };

    public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {

        #ok(List.toArray(admins));
    };

    //platform operators, similar to admins but restricted to a few functions

    public shared ({ caller }) func registerPlatformOperator(id : Text) : async Result.Result<(), Text> {
        let principal = Principal.toText(caller);
        
        if (not isAdmin(caller)) {
            return #err("Unauthorized");
        };

        if (not List.some<Text>(platformOperators, func(val : Text) : Bool { val == id })) {
            platformOperators := List.push<Text>(id, platformOperators);
        };

        #ok();
    };

    public shared ({ caller }) func unregisterPlatformOperator(id : Text) : async Result.Result<(), Text> {
        if (not isAdmin(caller)) {
            return #err("Unauthorized");
        };
        platformOperators := List.filter<Text>(platformOperators, func(val : Text) : Bool { val != id });
        #ok();
    };

    public shared query func getPlatformOperators() : async List.List<Text> {
        platformOperators;
    };

    private func isPlatformOperator(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        var exists = List.find<Text>(platformOperators, func(val : Text) : Bool { val == c });
        exists != null;
    };


    public shared query ({ caller }) func getTrustedCanisters() : async Result.Result<[Text], Text> {
        /*if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };*/

        #ok(List.toArray(nuanceCanisters));
    };


    public shared query ({ caller }) func getCgUsers() : async Result.Result<[Text], Text> {
        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        #ok(List.toArray(cgusers));
    };

    public shared ({caller}) func registerCanister(id: Text) : async Result.Result<(), Text> {
        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };
        if (not List.some<Text>(nuanceCanisters, func(val: Text) : Bool { val == id })) {
            nuanceCanisters := List.push<Text>(id, nuanceCanisters);
        };
        #ok();
    };

    public shared ({caller}) func unregisterCanister(id: Text) : async Result.Result<(), Text> {
        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };
        nuanceCanisters := List.filter<Text>(nuanceCanisters, func(val: Text) : Bool { val != id });
        #ok();
    };

    func isCgUser(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        var exists = List.find<Text>(cgusers, func(val: Text) : Bool { val == c });
        exists != null;
    };

    public shared ({ caller }) func registerCgUser(id : Text) : async Result.Result<(), Text> {
        canistergeekMonitor.collectMetrics();
        if (List.size<Text>(cgusers) > 0 and not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        if (not List.some<Text>(cgusers, func(val: Text) : Bool { val == id })) {
            cgusers := List.push<Text>(id, cgusers);
        };

        #ok();
    };

    public shared ({ caller }) func unregisterCgUser(id : Text) : async Result.Result<(), Text> {
        canistergeekMonitor.collectMetrics();
        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };
        cgusers := List.filter<Text>(cgusers, func(val: Text) : Bool { val != id });
        #ok();
    };


    //This function should be invoked immediately after the canister is deployed via script.
    public shared({ caller }) func registerAdmin(id : Text) : async Result.Result<(), Text> {
        canistergeekMonitor.collectMetrics();
        if (List.size<Text>(admins) > 0 and not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        if (not List.some<Text>(admins, func(val: Text) : Bool { val == id })) {
            admins := List.push<Text>(id, admins);
        };

        #ok();
    };

    public shared({ caller }) func unregisterAdmin(id : Text) : async Result.Result<(), Text> {
        canistergeekMonitor.collectMetrics();
        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };
        admins := List.filter<Text>(admins, func(val: Text) : Bool { val != id });
        #ok();
    };

    //initialize method to store the canister ids that this canister interacts with
    public shared ({caller}) func initializeCanister(postIndexCai: Text, userCai: Text) : async Result.Result<Text, Text>{
        if(not isAdmin(caller)){
            return #err(Unauthorized)
        };
        postIndexCanisterId := postIndexCai;
        userCanisterId := userCai;
        #ok(postIndexCanisterId # ", " # userCanisterId)
    };

    public shared({ caller }) func getPostUrls() : async Result.Result<Text, Text> {
        canistergeekMonitor.collectMetrics();
        if (not isAdmin(caller) and false) {
            return #err(Unauthorized);
        };
        var postUrls : Text = "";

        for ((postId, title) in titleHashMap.entries()) {
            var post : Post = buildPost(postId);
            postUrls := postUrls # post.url # "\n";
         };

        #ok(postUrls);
    };

    public shared ({caller}) func updateHandle(principalId: Text, newHandle: Text) : async Result.Result<Text, Text>{
        if(not Principal.equal(caller, Principal.fromText(userCanisterId))){
            return #err(Unauthorized)
        };

        switch(handleHashMap.get(principalId)){
            case(?existingHandle){
                
                handleHashMap.put(principalId, newHandle);
                handleReverseHashMap.delete(existingHandle);
                handleReverseHashMap.put(newHandle, principalId);
                lowercaseHandleHashMap.put(principalId, U.lowerCase(newHandle));
                lowercaseHandleReverseHashMap.delete(U.lowerCase(existingHandle));
                lowercaseHandleReverseHashMap.put(U.lowerCase(newHandle), principalId);
                accountIdsToHandleHashMap.put(U.principalToAID(principalId), newHandle);

                //check if there's any nft canister id linked to existing handle
                //if there's, update the handle
                switch(nftCanisterIdsHashmap.get(existingHandle)) {
                    case(?nftCanisterId) {
                        nftCanisterIdsHashmap.put(newHandle, nftCanisterId);
                        nftCanisterIdsHashmap.delete(existingHandle);
                    };
                    case(null) {};
                };

                //check all the posts of the user
                //update the creator fields if the user is creator of the post
                switch(userPostsHashMap.get(principalId)){
                    case(?postIds){
                        for(postId in List.toArray(postIds).vals()){
                            let post = buildPost(postId);
                            if(post.isPublication and post.creator == existingHandle){
                                creatorHashMap.put(postId, newHandle);
                            }
                        }
                    };
                    case(null){};
                };

                //reindex all the posts of the user by chunks
                switch(userPostsHashMap.get(principalId)){
                    case(?postIds){
                        let postIdsArray = List.toArray(postIds);
                        let size = postIdsArray.size();
                        let chunkCount = size / 20 + 1;
                        var iter = 0;
                        var indexingArguments = Buffer.Buffer<CanisterDeclarations.IndexPostModel>(0);
                        while(iter < chunkCount){
                            let chunkPostIds = U.filterArrayByIndexes(iter*20, (iter + 1)*20, postIdsArray);
                            for(postId in chunkPostIds.vals()){
                                let post = buildPost(postId);

                                let tagIdsBuffer = Buffer.Buffer<Text>(0);
                                for(tagModel in post.tags.vals()){
                                    tagIdsBuffer.add(tagModel.tagId);
                                };
                                let tagIds = Buffer.toArray(tagIdsBuffer);

                                let prevTitle = U.safeGet(titleHashMap, postId, "");
                                let prevSubtitle = U.safeGet(subtitleHashMap, postId, "");
                                let prevContent = U.safeGet(contentHashMap, postId, "");
                                let previous = post.handle # " " # prevTitle # " " # prevSubtitle # " " # prevContent;
                                let current = post.handle # " " # post.title # " " # post.subtitle # " " # post.content;
                                let prevTags = getTagNamesByPostId(postId);
                                let currentTags = getTagNamesByTagIds(tagIds);
                                indexingArguments.add({postId = postId; oldHtml = previous; newHtml = current; oldTags = prevTags; newTags = currentTags;});
                            };
                            let PostIndexCanister = CanisterDeclarations.getPostIndexCanister(postIndexCanisterId);
                            ignore await PostIndexCanister.indexPosts(Buffer.toArray(indexingArguments));
                            indexingArguments.clear();
                            iter += 1;
                        };
                        
                        
                    };
                    case(null){};
                };



                return #ok("Success");

            };
            case(null){
                return #ok("There's no instance of the given user. Nothing to do.")
            }
        };

        

    };


    //#endregion


    //#region Post Management

    private func getNextPostId() : Text {
        postId += 1;
        Nat.toText(postId);
    };

    private func buildPostUrl(postId : Text, handle : Text, title : Text) : Text {
        "/" # U.lowerCase(handle) # "/" # postId # "/" # U.textToUrlSegment(title);
    };

    public shared query ({caller}) func getKinicList() : async Result.Result<[Text], Text> {
       
     if (not isNuanceCanister(caller)){
        return #err(NotNuanceCanister);
     };

     //using the latest post id loop through and get a URL for each post and put in an array
        var i : Nat = 0;
        var count = principalIdHashMap.size();
        var kinicList = List.nil<Text>();
        
        for (postId in principalIdHashMap.keys()) {
            i += 1;
            var principalId = U.safeGet(principalIdHashMap, postId, "");
            var handle = U.safeGet(handleHashMap, principalId, "");
            var title = U.safeGet(titleHashMap, postId, "");
            var url = "nuance.xyz" # buildPostUrl(postId, handle, title);
            kinicList := List.push<Text>(url, kinicList);
            
        };
        
        
        #ok(List.toArray(kinicList));
    };
    
    private func buildPost(postId: Text) : Post {
        Debug.print("Post-buildPost: " # postId);

        // posts are not saved as single objects
        // the fields are fragmented across multiple hashtables (1 per field)
        // this allows us to change the schema without losing data during upgrades
        let principalId = U.safeGet(principalIdHashMap, postId, "");
        let handle = U.safeGet(handleHashMap, principalId, "");
        let title = U.safeGet(titleHashMap, postId, "");

        {
            postId = postId;
            handle = handle;
            url = buildPostUrl(postId, handle, title);
            title = title;
            subtitle = U.safeGet(subtitleHashMap, postId, "");
            headerImage = U.safeGet(headerImageHashMap, postId, "");
            content = U.safeGet(contentHashMap, postId, "");
            isDraft = U.safeGet(isDraftHashMap, postId, true);
            created = Int.toText(U.safeGet(createdHashMap, postId, 0));
            modified = Int.toText(U.safeGet(modifiedHashMap, postId, 0));
            publishedDate = Int.toText(U.safeGet(publishedDateHashMap, postId, 0));
            views = Nat.toText(U.safeGet(viewsHashMap, postId, 0));
            tags = getTagModelsByPost(postId);
            claps = Nat.toText(U.safeGet(clapsHashMap, postId, 0));
            creator = U.safeGet(creatorHashMap, postId, "");
            isPublication = U.safeGet(isPublicationHashMap, postId, false);
            category = U.safeGet(categoryHashMap, postId, "");
            isPremium = U.safeGet(isPremiumHashMap, postId, false)
        }
    };

    private func buildPostListItem(postId: Text) : Post {
        Debug.print("Post-buildPostListItem: " # postId);
        
        // Use this function to build a post when displaying partial information
        // in a list like latest posts, or search results.
        // It will reduce the payload when returning multiple posts, so it doesn't
        // exceed the max size of a message on the IC. It will also increase performance.
        let principalId = U.safeGet(principalIdHashMap, postId, "");
        let handle = U.safeGet(handleHashMap, principalId, "");
        var title = U.safeGet(titleHashMap, postId, "");
        var url = buildPostUrl(postId, handle, title);
        var subTitle = U.safeGet(subtitleHashMap, postId, "");

        // only display the first 60 characters of title
        if (title.size() > 60) {
            title := U.subText(title, 0, 60) # "...";
        };

        // only display the first 200 characters of the intro (subtitle)
        if (subTitle.size() > 200) {
            subTitle := U.subText(subTitle, 0, 200) # "...";
        };

        {
            postId = postId;
            handle = U.safeGet(handleHashMap, principalId, "");
            url = url;
            title = title;
            subtitle = subTitle;
            headerImage = U.safeGet(headerImageHashMap, postId, "");
            content = ""; // lists do not display article content
            isDraft = U.safeGet(isDraftHashMap, postId, true);
            created = Int.toText(U.safeGet(createdHashMap, postId, 0));
            publishedDate = Int.toText(U.safeGet(publishedDateHashMap, postId, 0));
            modified = Int.toText(U.safeGet(modifiedHashMap, postId, 0));
            views = Nat.toText(U.safeGet(viewsHashMap, postId, 0));
            tags = getTagModelsByPost(postId);
            claps = Nat.toText(U.safeGet(clapsHashMap, postId, 0));
            creator = U.safeGet(creatorHashMap, postId, "");
            isPublication = U.safeGet(isPublicationHashMap, postId, false);
            category = U.safeGet(categoryHashMap, postId, "");
            isPremium = U.safeGet(isPremiumHashMap, postId, false)
        }
    };
    
    private func addOrUpdatePost(isNew: Bool, postId: Text, principalId : Text, title : Text,
        subtitle : Text, headerImage : Text, content : Text, isDraft : Bool, tagIds: [Text], creator : Text, isPublication : Bool, category : Text, isPremium: Bool) : () {
        
        // posts are not saved as single objects
        // the fields are fragmented across multiple hashtables (1 per field)
        // this allows us to change the schema without losing data during upgrades
        let creatorHandle = U.safeGet(handleHashMap, creator, "");
        Debug.print("Post-addOrUpdatePostCreator: " # creatorHandle);
        Debug.print("Post-addOrUpdatePostPrincipalID: " # creator);
       
        let now = U.epochTime();
        principalIdHashMap.put(postId, principalId);
        titleHashMap.put(postId, title);
        subtitleHashMap.put(postId, subtitle);
        headerImageHashMap.put(postId, headerImage);
        contentHashMap.put(postId, content);
        isDraftHashMap.put(postId, isDraft);
        modifiedHashMap.put(postId, now);
        isPublicationHashMap.put(postId, isPublication);
        isPremiumHashMap.put(postId, isPremium);
        if (isNew) {
            createdHashMap.put(postId, now);
            creatorHashMap.put(postId, creatorHandle);
        };
        let post = buildPost(postId);
        if (isDraft == false and post.publishedDate == "0" and not U.arrayContains(Iter.toArray(latestPostsHashmap.vals()),postId)) {
            publishedDateHashMap.put(postId, now);
            latestPostsHashmap.put(Int.toText(latestPostsHashmap.size()), postId);
        };
        
        //publishedDate
        addOrUpdatePostTag(postId, tagIds);
        addOrUpdatePostCategory(postId, category);

        let wordCount = U.calculate_total_word_count(content);
        wordCountsHashmap.put(postId, wordCount);
    };


    public shared query ({ caller }) func get(postId : Text) : async Result.Result<Post, Text> {
        Debug.print("Post->Get: " # postId);

        //only the author can retrieve own drafts
        let isDraft = U.safeGet(isDraftHashMap, postId, true);
        if (isDraft and not isAuthor(caller, postId) and not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        if(rejectedByModClub(postId)) {
            return #err(RejectedByModerators);
        };

        if (principalIdHashMap.get(postId) == null) {
            return #err(ArticleNotFound);
        };

        var post = buildPost(postId);

        if(post.isPremium){
            post := {
                postId = post.postId;
                handle = post.handle;
                url = post.url;
                title = post.title;
                subtitle = post.subtitle;
                headerImage = post.headerImage;
                content = "";
                isDraft = post.isDraft;
                created = post.created;
                modified = post.modified;
                publishedDate = post.publishedDate;
                views = post.views;
                tags = post.tags;
                claps = post.claps;
                creator = post.creator;
                isPublication = post.isPublication;
                category = post.category;
                isPremium = post.isPremium
            };
            #ok(post);
        }
        else{
            #ok(post);
        };

        
    };

    public shared ({ caller }) func getPremiumArticle(postId : Text) : async Result.Result<Post, Text> {
        Debug.print("Post->GetPremiumArticle: " # postId);

        //only the author can retrieve own drafts
        let isDraft = U.safeGet(isDraftHashMap, postId, true);
        if (isDraft and not isAuthor(caller, postId) and not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        if(rejectedByModClub(postId)) {
            return #err(RejectedByModerators);
        };

        if (principalIdHashMap.get(postId) == null) {
            return #err(ArticleNotFound);
        };

        var post = buildPost(postId);

        if(isAnonymous(caller) and post.isPremium){
            post := {
                postId = post.postId;
                handle = post.handle;
                url = post.url;
                title = post.title;
                subtitle = post.subtitle;
                headerImage = post.headerImage;
                content = "";
                isDraft = post.isDraft;
                created = post.created;
                modified = post.modified;
                publishedDate = post.publishedDate;
                views = post.views;
                tags = post.tags;
                claps = post.claps;
                creator = post.creator;
                isPublication = post.isPublication;
                category = post.category;
                isPremium = post.isPremium
            };
            return #ok(post);
        };

        if(post.isPremium){
            let nftCanisterId = U.safeGet(nftCanisterIdsHashmap, post.handle, "");
            if(nftCanisterId == ""){
                return #err("Canister id of the NFT canister not found!");
            };
            let nftCanisterActor = actor (nftCanisterId) : actor {
                getUserAllowedPostIds : (caller: Text) -> async [Text]
            };
            let userAllowedPostIds = await nftCanisterActor.getUserAllowedPostIds(Principal.toText(caller));
            if(U.arrayContains(userAllowedPostIds, postId)){
                return #ok(post);
            }
            else{
                return #err(Unauthorized);
            };
        }
        else{
            return #ok(post);
        };

        
    };

    public shared ({ caller }) func getPostWithPublicationControl(postId : Text) : async Result.Result<Post, Text> {
        Debug.print("Post->getPostWithPublicationControl: " # postId);

        //only the author can retrieve own drafts
        let isDraft = U.safeGet(isDraftHashMap, postId, true);
        if (isDraft and not isAuthor(caller, postId) and not isAdmin(caller)) {

            let authorPrincipalId = U.safeGet(principalIdHashMap, postId, "");
            if(Text.notEqual(authorPrincipalId, "") and U.safeGet(isPublicationHashMap, postId, false)){
                let userPrincipalId = Principal.toText(caller);
                let canisterId = authorPrincipalId;
                let publicationHandle =  U.safeGet(handleHashMap, canisterId, "");

                var callerHandle = U.safeGet(handleHashMap, userPrincipalId, "");

                if(Text.equal(callerHandle, "")){
                    let UserCanister = CanisterDeclarations.getUserCanister(userCanisterId);
                    var user: ?User = await UserCanister.getUserInternal(userPrincipalId);
                    switch(user){
                        case(?user){
                            callerHandle := user.handle;
                        };
                        case(null){
                            return #err(Unauthorized);
                        }
                    }
                };

                let publisherActor = actor(canisterId): actor {getPublicationQuery: (handle: Text) -> async Result.Result<Publication, Text>};
                
                let publicationReturn = await publisherActor.getPublicationQuery(publicationHandle);

                switch(publicationReturn){
                    case (#ok(pub)){
                        if(not U.arrayContains(pub.editors, callerHandle)){
                            return #err(Unauthorized);
                        }
                        else if(rejectedByModClub(postId)){
                            return #err(RejectedByModerators);
                        }
                        else{
                            return #ok(buildPost(postId));
                        }

                    };
                    case (#err(error)){
                        return #err(Unauthorized);
                    };
                }
            };

            return #err(Unauthorized);
        };

        if(rejectedByModClub(postId)) {
            return #err(RejectedByModerators);
        };

        if (principalIdHashMap.get(postId) == null) {
            return #err(ArticleNotFound);
        };

        #ok(buildPost(postId));
    };

    public shared query func getList(postIds : [Text]) : async [Post] {
        Debug.print("Post->getList: size=" # Nat.toText(postIds.size()));

        var posts : Buffer.Buffer<Post> = Buffer.Buffer<Post>(10);
        label l for (postId in Iter.fromArray(postIds)) {
            if (postId != "" and not rejectedByModClub(postId)) {
                posts.add(buildPostListItem(postId));
            };
            if (posts.size() == 20) {
                break l;
            };
        };

        Buffer.toArray(posts);
    };

    // TODO: See if this can be a fire-and-forget call from the get function
    //   without affecting performance when fetching an article.
    //   Currently, this can be called by anyone to increase the view count.
    public shared ({ caller }) func viewPost(postId : Text) : () {
        viewsHashMap.put(postId, U.safeGet(viewsHashMap, postId, 0) + 1);
        totalViewsToday += 1;
    };

    public shared ({ caller }) func clapPost(postId : Text) : ()  {
       
        //look up handle for post
        let principalId = U.safeGet(principalIdHashMap, postId, "");
        let handle = U.safeGet(handleHashMap, principalId, "");
       

        //to prevent gaming your own article for claps/tokens
        if (Principal.toText(caller) != principalId){
        
       // check if user has enough tokens to clap
       let UserCanister = CanisterDeclarations.getUserCanister(userCanisterId);
       var tokenAmounts = await UserCanister.getNuaBalance(Principal.toText(caller));
        switch (tokenAmounts){
            case (#ok(balance)) Debug.print("balance: " # balance);
            case (#err(msg)) {
                Debug.print("error: " # msg);
                return;
                };
            };
        
        //clap post
        clapsHashMap.put(postId, U.safeGet(clapsHashMap, postId, 0) + 1);
        Debug.print("Post->clap");

        //Nua tokens added to author and subtracted from user
        UserCanister.handleClap(Principal.toText(caller), handle);
        };

    };


    public shared query func getTotalPostCount() : async Nat {
        Debug.print("Post->Count");
        principalIdHashMap.size();
    };

    public shared query func getTotalArticleViews() : async Nat {
        var counter = 0;
        for(view in viewsHashMap.vals()){
            counter += view;
        };
        counter
    };

    public shared query func currentId() : async Nat {
        Debug.print("Post->CurrentId");
        postId;
    };
    //TODO: Delete the data of the posts also
    public shared ({ caller }) func deleteUserPosts(principalId: Text) : async Result.Result<Nat, Text> {
        canistergeekMonitor.collectMetrics();
        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };
        Debug.print("Post->deleteUserPosts for PrincipalId: " # principalId);

        let userPosts = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());
        for(postId in List.toArray(userPosts).vals()){
            ignore await delete(postId);
        };
        
        #ok(principalIdHashMap.size());
    };

    public shared ({ caller }) func delete(postId : Text) : async Result.Result<Nat, Text> {
        canistergeekMonitor.collectMetrics();
        //ensure the caller owns the post before deleting it
        if(not isAuthor(caller, postId) and not isAdmin(caller) and not isNuanceCanister(caller)) {
            return #err(Unauthorized);
        };

        //Author can not delete a premium article but admin can delete.
        if(isAuthor(caller, postId) and U.safeGet(isPremiumHashMap, postId, false)){
            return #err(ArticleNotEditable);
        };
        
        Debug.print("Post->Delete: " # postId);

        let principalId = U.safeGet(principalIdHashMap, postId, "");
        if (principalId != "") {
            principalIdHashMap.delete(postId);

            // remove postId from the user's posts
            let userPosts = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());
            let filteredPosts = List.filter<Text>(userPosts, func(val: Text) : Bool { val != postId });
            userPostsHashMap.put(principalId, filteredPosts);

            // remove postId from the writer's posts if post is not draft
            if(U.safeGet(isPublicationHashMap, postId, true) and not U.safeGet(isDraftHashMap, postId, false)){
                let writerHandle = U.safeGet(creatorHashMap, postId, "");
                let writerPrincipalId = U.safeGet(handleReverseHashMap, writerHandle, "");
                if(writerPrincipalId != ""){
                    let writerPosts = U.safeGet(userPostsHashMap, writerPrincipalId, List.nil<Text>());
                    let filteredPostsWriter = List.filter<Text>(writerPosts, func(val: Text) : Bool { val != postId });
                    userPostsHashMap.put(writerPrincipalId, filteredPostsWriter);
                };
            };
            
        };
        //find post in latestpostsHashmap and remove it
        for (i in Iter.range(0, latestPostsHashmap.size())) {
        let latestPosts = U.safeGet(latestPostsHashmap, Int.toText(i), "");
            if (latestPosts == postId) {
                latestPostsHashmap.delete(Int.toText(i));
                Debug.print("Post->Delete: post " # latestPosts # " removed from latestPostsHashmap from postition " # Int.toText(i));
            };
        };

        titleHashMap.delete(postId);
        subtitleHashMap.delete(postId);
        headerImageHashMap.delete(postId);
        contentHashMap.delete(postId);
        isDraftHashMap.delete(postId);
        createdHashMap.delete(postId);
        publishedDateHashMap.delete(postId);
        modifiedHashMap.delete(postId);
        viewsHashMap.delete(postId);
        creatorHashMap.delete(postId);
        isPublicationHashMap.delete(postId);
        categoryHashMap.delete(postId);
        wordCountsHashmap.delete(postId);

        await generateLatestPosts();

        #ok(principalIdHashMap.size());
    };


    public shared query ({caller}) func getViewsHistoryHashmap() : async Result.Result<[(Text, Nat)], Text> {
        if(not isAdmin(caller)){
            return #err(Unauthorized)
        };

        #ok(Iter.toArray(dailyViewHistoryHashMap.entries()))
    };


    public shared ({caller}) func getPostsMigration(indexStart: Nat, indexEnd: Nat) : async Result.Result<([Types.PostMigrationType], [(Text, Text)]), Text> {
        if(not isAdmin(caller)){
            return #err(Unauthorized)
        };
        var postsBuffer = Buffer.Buffer<Types.PostMigrationType>(0);
        var localHandleHashMap = HashMap.HashMap<Text, Text>(maxHashmapSize, isEq, Text.hash);
        var counter = indexStart;
        let postIdsSorted = Array.sort(Iter.toArray(titleHashMap.keys()), func (postId_1: Text, postId_2: Text) : Order.Order{
            return Nat.compare(U.textToNat(postId_1), U.textToNat(postId_2))
        });
        let end = if(indexEnd > postIdsSorted.size()){postIdsSorted.size()}else{indexEnd};
        while(counter < end){
            let post = buildPost(postIdsSorted[counter]);
            let principalId = U.safeGet(handleReverseHashMap, post.handle, "");
            if(principalId == ""){
                return #err("Principal id of the handle is not found for the postId " # post.postId);
            }
            else{
                localHandleHashMap.put(post.handle, principalId);
            };

            if(post.creator != ""){
                let creatorPrincipalId = U.safeGet(handleReverseHashMap, post.creator, "");
                if(creatorPrincipalId != ""){
                    localHandleHashMap.put(post.creator, creatorPrincipalId);
                };
            };

            postsBuffer.add({
                category = post.category;
                claps = post.claps;
                content = post.content;
                created = post.created;
                creator = post.creator;
                handle = post.handle;
                headerImage = post.headerImage;
                isDraft = post.isDraft;
                isPremium = post.isPremium;
                isPublication = post.isPublication;
                modified = post.modified;
                postId = post.postId;
                publishedDate = post.publishedDate;
                subtitle = post.subtitle;
                tags = post.tags;
                title = post.title;
                url = post.url;
                views = post.views;
                wordCount = U.safeGet(wordCountsHashmap,post.postId,0);
                caller = U.safeGet(handleReverseHashMap, post.handle, "");
                isRejected = rejectedByModClub(post.postId)
            });
            counter += 1;
        };
        #ok((Buffer.toArray(postsBuffer), Iter.toArray(localHandleHashMap.entries())))
    };

    public shared ({caller}) func getAllModerationStatus() : async Result.Result<([(Text, Nat)], [(Text, PostModerationStatus)]), Text> {
        if(not isAdmin(caller)){
            return #err(Unauthorized)
        };
        
        #ok((Iter.toArray(postVersionMap.entries()), Iter.toArray(postModerationStatusMap.entries())))
    };

    //This function allows writers to migrate their draft posts to publication
    public shared ({ caller }) func migratePostToPublication(postId : Text, publicationHandle:Text, isDraft: Bool) : async Result.Result<Post, Text> {
        canistergeekMonitor.collectMetrics();

        //writer is not allowed to migrate his/her premium post to publication. 
        if(U.safeGet(isPremiumHashMap, postId, false)){
            return #err(ArticleNotEditable);
        };
        let UserCanister = CanisterDeclarations.getUserCanister(userCanisterId);
        let user = await UserCanister.getUserByPrincipalId(Principal.toText(caller));
        var userHandle = "";
        var isEditor = false;
        var isWriter = false;
        switch user{
            case(#ok(user)){
                userHandle := user.handle;
                for(userPublicationObject in user.publicationsArray.vals()){
                    if(Text.equal(userPublicationObject.publicationName,publicationHandle)){
                        if(userPublicationObject.isEditor){
                            isEditor := true;
                        }
                        else{
                            isWriter := true;
                        };
                    };
                };
            };
            case(#err(error)){return #err(UserNotFound);};
        };

        let wasDraft = U.safeGet(isDraftHashMap, postId, false);
        
        //authorization
        if((not ((isEditor or isWriter) and (isAuthor(caller,postId)) and wasDraft)) or (not isDraft and not isEditor)) {
            return #err(Unauthorized);
        };

        Debug.print("Post->MigratePostToPublication: " # postId);
        
        makePostPublication(postId, publicationHandle, userHandle, isDraft);
        ignore storeSEO(postId, isDraft);
    
        #ok(buildPost(postId));
    };

    private func makePostPublication(postId : Text, publicationHandle:Text, userHandle: Text, isDraft: Bool) : (){
        let publicationPrincipalId = U.safeGet(handleReverseHashMap, publicationHandle, "");
        let userPrincipalId = U.safeGet(handleReverseHashMap, userHandle, "");
        

        if(not Text.equal(publicationPrincipalId, "") and not Text.equal(userPrincipalId, "")){
            //change the principal-id of the post to publication principal-id
            principalIdHashMap.put(postId, publicationPrincipalId);
            isPublicationHashMap.put(postId,true);
            creatorHashMap.put(postId,userHandle);
            //remove postId from the user's posts if it's draft
            //add postId to publication's posts
            //remove the post from latest posts if it's draft
            if(isDraft){
                let userPosts = U.safeGet(userPostsHashMap, userPrincipalId, List.nil<Text>());
                let filteredPosts = List.filter<Text>(userPosts, func(val: Text) : Bool { val != postId });
                userPostsHashMap.put(userPrincipalId, filteredPosts);

                var publicationPostIds = U.safeGet(userPostsHashMap, publicationPrincipalId, List.nil<Text>());
                let exists = List.find<Text>(publicationPostIds, func(val: Text) : Bool {val == postId });
                if (exists == null) {
                    let updatedPublicationPostIds = List.push(postId, publicationPostIds);
                    userPostsHashMap.put(publicationPrincipalId, updatedPublicationPostIds);
                };

            }
            //add postId to publication postIds, user postIds and latestPostsHashmap
            else {
                let now = U.epochTime();
                modifiedHashMap.put(postId, now);
                isDraftHashMap.put(postId, isDraft);
                
                
                //if the post hasn't published before, add it to latestPostsHashmap and add the published date into publishedDateHashmap
                let post = buildPostListItem(postId);
                if(post.publishedDate=="0" and not U.arrayContains(Iter.toArray(latestPostsHashmap.vals()),postId)){
                    latestPostsHashmap.put(Int.toText(latestPostsHashmap.size()), postId);
                    publishedDateHashMap.put(postId, now);
                };

                var writerPostIds = U.safeGet(userPostsHashMap, userPrincipalId, List.nil<Text>());
                let exists = List.find<Text>(writerPostIds, func(val: Text) : Bool {val == postId });
                if (exists == null) {
                    let updatedWriterPostIds = List.push(postId, writerPostIds);
                    userPostsHashMap.put(userPrincipalId, updatedWriterPostIds);
                };

                var publicationPostIds = U.safeGet(userPostsHashMap, publicationPrincipalId, List.nil<Text>());
                let exists_2 = List.find<Text>(publicationPostIds, func(val: Text) : Bool {val == postId });
                if (exists_2 == null) {
                    let updatedPublicationPostIds = List.push(postId, publicationPostIds);
                    userPostsHashMap.put(publicationPrincipalId, updatedPublicationPostIds);
                };

            };
            
        };        
    };

    //
    public shared ({caller}) func registerPublisher() : async () {
        let callerPrincipalId = Principal.toText(caller);
        let UserCanister = CanisterDeclarations.getUserCanister(userCanisterId);
        var user: ?User = await UserCanister.getUserInternal(callerPrincipalId);
        switch (user){
            case(null){};
            case(?userReturn){
                handleHashMap.put(callerPrincipalId, userReturn.handle);
                handleReverseHashMap.put(userReturn.handle, callerPrincipalId);
                lowercaseHandleHashMap.put(callerPrincipalId, U.lowerCase(userReturn.handle));
                lowercaseHandleReverseHashMap.put(U.lowerCase(userReturn.handle), callerPrincipalId);
                accountIdsToHandleHashMap.put(U.principalToAID(callerPrincipalId), userReturn.handle);
            };
        };
    };

    public shared ({caller}) func generateAccountIds() : async (){
        if(isAdmin(caller)){
            for(handleEntry in handleHashMap.entries()){
                accountIdsToHandleHashMap.put(U.principalToAID(handleEntry.0), handleEntry.1);
            };
        }
    };


    public shared ({caller}) func migratePostsFromFastblocks(canisterId: Text, handle: Text): async Result.Result<Text, Text> {
        if(not isAdmin(caller)){
            return #err(Unauthorized);
        };

        // retrieve publication principal if it's not already mapped to the handle
        let publicationCanisterId = U.safeGet(handleReverseHashMap, handle, "");
        if (publicationCanisterId == "") {
            let UserCanister = CanisterDeclarations.getUserCanister(userCanisterId);
            var user: ?User = await UserCanister.getUserInternal(publicationCanisterId);
            switch (user) {
                case (null) return #err("cross canister Publication not found");
                case (?value) {
                    handleHashMap.put(publicationCanisterId, handle);
                    handleReverseHashMap.put(handle, publicationCanisterId);
                    lowercaseHandleHashMap.put(publicationCanisterId, U.lowerCase(handle));
                    lowercaseHandleReverseHashMap.put(U.lowerCase(handle), publicationCanisterId);
                    accountIdsToHandleHashMap.put(U.principalToAID(publicationCanisterId), handle);
                };
            };
        };

        let fastblocksPostActor = actor(canisterId): 
            actor {
                getPostsIncludingDrafts: (indexStart: Nat, indexEnd: Nat) -> async [FastblocksPost];
                getTotalPostCount: () -> async Nat;
            };
        //get the total post count
        let totalPostCount = await fastblocksPostActor.getTotalPostCount();
        let chunkCount = totalPostCount/20 + 1;
        var iter = 0;
        var migratedPostCount = 0;
        var indexingArguments = Buffer.Buffer<CanisterDeclarations.IndexPostModel>(0);

        while(iter < chunkCount){
            //get the posts for each chunk and iterate through the posts
            let posts = await fastblocksPostActor.getPostsIncludingDrafts(iter*20 + 1,(iter+1)*20);
        
            for(post in posts.vals()){
                let postId = getNextPostId();
                let tagIdsBuffer = Buffer.Buffer<Text>(0);
                for(tagModel in post.tags.vals()){
                    tagIdsBuffer.add(tagModel.tagId);
                };
                let tagIds = Buffer.toArray(tagIdsBuffer);
                //addOrUpdatePost function with date adjustements
                principalIdHashMap.put(postId, publicationCanisterId);
                titleHashMap.put(postId, post.title);
                subtitleHashMap.put(postId, post.subtitle);
                headerImageHashMap.put(postId, post.headerImage);
                contentHashMap.put(postId, post.content);
                isDraftHashMap.put(postId, post.isDraft);
                modifiedHashMap.put(postId, U.textToNat(post.modified));
                isPublicationHashMap.put(postId, true);
                isPremiumHashMap.put(postId, false);
                createdHashMap.put(postId, U.textToNat(post.created));
                creatorHashMap.put(postId, post.handle); 
                publishedDateHashMap.put(postId, U.textToNat(post.publishedDate));
            
                addOrUpdatePostTag(postId, tagIds);
                addOrUpdatePostCategory(postId, "");

                let wordCount = U.calculate_total_word_count(post.content);
                wordCountsHashmap.put(postId, wordCount);
            
                viewsHashMap.put(postId, U.textToNat(post.views));
                clapsHashMap.put(postId, U.textToNat(post.claps));

                // add this postId to the publication's posts
                var publicationPostIds = U.safeGet(userPostsHashMap, publicationCanisterId, List.nil<Text>());
                let exists = List.find<Text>(publicationPostIds, func(val: Text) : Bool { val == postId });
                if (exists == null) {
                    let updatedPublicationPostIds = List.push(postId, publicationPostIds);
                    userPostsHashMap.put(publicationCanisterId, updatedPublicationPostIds);
                };
                //add post-version as 1
                postVersionMap.put(postId, 1);
                // TODO: should we move indexing to the modclub callback function when content is approved? 
                // returns UnauthorizedError if this canister is not registered as an admin in the PostIndex canister
                let prevTitle = U.safeGet(titleHashMap, postId, "");
                let prevSubtitle = U.safeGet(subtitleHashMap, postId, "");
                let prevContent = U.safeGet(contentHashMap, postId, "");
                let previous = handle # " " # prevTitle # " " # prevSubtitle # " " # prevContent;
                let current = handle # " " # post.title # " " # post.subtitle # " " # post.content;
                let prevTags = getTagNamesByPostId(postId);
                let currentTags = getTagNamesByTagIds(tagIds);
                

                indexingArguments.add({postId = postId; oldHtml = previous; newHtml = current; oldTags = prevTags; newTags = currentTags;});
                migratedPostCount += 1;
            };
            //assuming there's no problem with indexing
            let PostIndexCanister = CanisterDeclarations.getPostIndexCanister(postIndexCanisterId);
            ignore await PostIndexCanister.indexPosts(Buffer.toArray(indexingArguments));
            //clear it for the next chunk
            indexingArguments.clear();

            iter += 1;
        };
        

        return #ok(Nat.toText(migratedPostCount));
    };

    
    public shared ({caller}) func copyPostsFromHandleToPublication(handle: Text, publicationHandle: Text): async Result.Result<Text, Text> {
        if(not isAdmin(caller)){
            return #err(Unauthorized);
        };

        var counter = 0;


        let handlePrincipalId = U.safeGet(handleReverseHashMap, handle, "");
        if(handlePrincipalId == ""){
            return #err("User doesn't have any post to migrate!");
        };

        let publicationPrincipalId = U.safeGet(handleReverseHashMap, publicationHandle, "");

        if(publicationPrincipalId == ""){
            return #err("Publication not found!");
        };


        var handlePostIds = U.safeGet(userPostsHashMap, handlePrincipalId, List.nil<Text>());
        
        for(postId in List.toIter(handlePostIds)){
            makePostPublication(postId, publicationHandle, handle, U.safeGet(isDraftHashMap, postId, true));
            counter += 1;
        };
        
        ignore storeAllSEO(0, postId);
        return #ok(Nat.toText(counter));
            
    };

    public shared ({ caller }) func save(postModel : PostSaveModel) : async SaveResult {
        if (isAnonymous(caller)) {
            return #err(Unauthorized);
        };

        let postIdTrimmed = U.trim(postModel.postId);
        let isNew = (postIdTrimmed == "");

        Debug.print("Post->Save postId is: " # postIdTrimmed);

        // ensure the caller owns the post before updating it
        if(not isNew and not isAuthor(caller, postIdTrimmed)) {
            return #err(Unauthorized);
        };


        // ensure the tags exist
        for (tagId in postModel.tagIds.vals()) {
            if (tagsHashMap.get(tagId) == null) {
                return #err(InvalidTagId # ": " # tagId);
            };
        };

        let isPublication = if(postModel.isPublication and isNuanceCanister(caller)){true}else{false};

        //if category is not empty, ensure it's a publication post
        if(not Text.equal(postModel.category, "") and not isPublication){
            return #err(NotPublicationPost);
        };

        //if the creator field is not empty and it's not a publication post, give an error
        if(not isPublication and postModel.creator != ""){
            return #err(Unauthorized);
        };

        if(postModel.content == ""){
            return #err("Body can not be empty.")
        };

        if(postModel.tagIds.size() == 0){
            return #err("There should be at least 1 tag id.");
        };

        if(postModel.tagIds.size() > 3){
            return #err("There can be maximum of 3 tag ids.");
        };

        let principalId = Principal.toText(caller);
        var savedCreatedDate : Int = 0;
        var postId: Text = if (isNew) { getNextPostId() } else { postIdTrimmed };
        var isPremium: Bool = if(U.safeGet(isPremiumHashMap, postId, false)){ true } else {false};

        //if it's premium and not a new article, give an error
        if(not isNew and isPremium and not U.safeGet(isDraftHashMap, postId, true)){
            let category = U.safeGet(categoryHashMap, postId, "");
            if(postModel.category != category){
                //assume that it's just a category change
                //ignore the other changes if there's
                addOrUpdatePostCategory(postId, postModel.category);
                return #ok(buildPost(postId));
            };
            return #err(ArticleNotEditable);
        };

        // retrieve user handle if it's not already mapped to the principalId
        var userHandle = U.safeGet(handleHashMap, principalId, "");
        if (userHandle == "") {
            let UserCanister = CanisterDeclarations.getUserCanister(userCanisterId);
            var user: ?User = await UserCanister.getUserInternal(principalId);
            switch (user) {
                case (null) return #err("cross canister User not found");
                case (?value) {
                    userHandle := value.handle;

                    handleHashMap.put(principalId, value.handle);
                    handleReverseHashMap.put(value.handle, principalId);
                    lowercaseHandleHashMap.put(principalId, U.lowerCase(value.handle));
                    lowercaseHandleReverseHashMap.put(U.lowerCase(value.handle), principalId);
                    accountIdsToHandleHashMap.put(U.principalToAID(principalId), value.handle);
                };
            };
        };

        let creatorHandle = U.safeGet(handleHashMap, postModel.creator, "");
        if (creatorHandle == "" and isPublication) {
            let UserCanister = CanisterDeclarations.getUserCanister(userCanisterId);
            var user: ?User = await UserCanister.getUserInternal(postModel.creator);
            switch (user) {
                case (null) {
                   return #err("Cross canister user not found");
                };
                case (?value) {
                    //here only if a publication post
                    //check if the user given as creator is writer or editor in the publication
                    var isAllowed = false;
                    
                    for(creatorPubs in value.publicationsArray.vals()){
                        if(creatorPubs.publicationName == userHandle){
                            isAllowed := true;
                        }
                    };

                    if(not isAllowed){
                        return #err("Creator is not a writer or editor of the publication!");
                    };


                    handleHashMap.put(postModel.creator, value.handle);
                    handleReverseHashMap.put(value.handle, postModel.creator);
                    lowercaseHandleHashMap.put(postModel.creator, U.lowerCase(value.handle));
                    lowercaseHandleReverseHashMap.put(U.lowerCase(value.handle), postModel.creator);
                    accountIdsToHandleHashMap.put(U.principalToAID(postModel.creator), value.handle);
                };
            };
        };




        Debug.print("Post->Save user handle is: " # userHandle);

        addOrUpdatePost(isNew, postId, principalId, postModel.title, postModel.subtitle,
            postModel.headerImage, postModel.content, postModel.isDraft, postModel.tagIds, postModel.creator, isPublication, postModel.category, isPremium);

        // add this postId to the user's posts if not already added
        var userPostIds = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());
        let exists = List.find<Text>(userPostIds, func(val: Text) : Bool { val == postId });
        if (exists == null) {
            let updatedUserPostIds = List.push(postId, userPostIds);
            userPostsHashMap.put(principalId, updatedUserPostIds);
        };

        // if it's a publication post add this postId to the writer's posts if not already added
        if(isPublication and not postModel.isDraft){
            var writerPostIds = U.safeGet(userPostsHashMap, postModel.creator, List.nil<Text>());
            let exists = List.find<Text>(writerPostIds, func(val: Text) : Bool {val == postId });
            if (exists == null) {
                let updatedWriterPostIds = List.push(postId, writerPostIds);
                userPostsHashMap.put(postModel.creator, updatedWriterPostIds);
            };
            
        };


        //remove the postId from writer's postIds if this is a publication post and it's draft
         if(isPublication and postModel.isDraft and Text.notEqual(postModel.creator, principalId)){
            var writerPostIds = U.safeGet(userPostsHashMap, postModel.creator, List.nil<Text>());
            let filteredPostsWriter = List.filter<Text>(writerPostIds, func(val: Text) : Bool { val != postId });
            userPostsHashMap.put(postModel.creator, filteredPostsWriter);
            List.iterate(filteredPostsWriter, func(val:Text):(){Debug.print(val);});
            
        };
        
        //it was controlling if it's a draft post or not and only indexing the not draft posts. now, indexes all the posts
        if (true) {
            var postVersion = 1;
            if(not isNew) {
                switch(postVersionMap.get(postId)) {
                    case(null) ();
                    case(?version) {
                        postVersion := version + 1;
                    };
                };
            };
            postVersionMap.put(postId, postVersion);

            // TODO: should we move indexing to the modclub callback function when content is approved? 
            // returns UnauthorizedError if this canister is not registered as an admin in the PostIndex canister
            let handle = U.safeGet(handleHashMap, postId, "");
            let prevTitle = U.safeGet(titleHashMap, postId, "");
            let prevSubtitle = U.safeGet(subtitleHashMap, postId, "");
            let prevContent = U.safeGet(contentHashMap, postId, "");
            let previous = handle # " " # prevTitle # " " # prevSubtitle # " " # prevContent;
            let current = handle # " " # postModel.title # " " # postModel.subtitle # " " # postModel.content;
            let prevTags = getTagNamesByPostId(postId);
            let currentTags = getTagNamesByTagIds(postModel.tagIds);
            let PostIndexCanister = CanisterDeclarations.getPostIndexCanister(postIndexCanisterId);
            var indexResult = await PostIndexCanister.indexPost(postId, previous, current, prevTags, currentTags);

            switch(indexResult) {
                case (#ok(id)) Debug.print("indexed post id: " # id);
                case (#err(msg)) return #err(msg);
            };

            ignore submitPostToModclub(postId, postModel, postVersion);
            ignore storeSEO(postId, postModel.isDraft);
            
        };


        #ok(buildPost(postId));
    };

    public shared ({caller}) func linkWritersToPublicationPosts(): async Result.Result<Text, Text> {


        if(not isAdmin(caller)){
            return #err(Unauthorized);
        };
        //key: handle, value: principal
        var localHandleReverseHashmap = HashMap.HashMap<Text, Text>(maxHashmapSize, Text.equal, Text.hash);

        //put all the publication post writers into local hashmap
        for(postId in isPublicationHashMap.keys()){
            if(not U.safeGet(isDraftHashMap, postId, true) and U.safeGet(isPublicationHashMap, postId, false)){
                let writerHandle = U.safeGet(creatorHashMap, postId, "");
                localHandleReverseHashmap.put(writerHandle, "");
            };
        };

        var handlesLowercase = Buffer.Buffer<Text>(0);

        for(handle in localHandleReverseHashmap.keys()){
            handlesLowercase.add(U.lowerCase(handle));
        };

        //get the user details from User canister
        let UserCanister = CanisterDeclarations.getUserCanister(userCanisterId);
        let usersListItems = await UserCanister.getUsersByHandles(Buffer.toArray(handlesLowercase));

        //update localHandleReverseHashmap by getting the user details from User canister 
        for(user in usersListItems.vals()){
            localHandleReverseHashmap.put(user.handle, user.principal);
        };

        var counter = 0;
        //loop through the publication posts and add the writer postIds to userPostsHashmap
        for(postId in isPublicationHashMap.keys()){
            if(not U.safeGet(isDraftHashMap, postId, true) and U.safeGet(isPublicationHashMap, postId, false)){
                let writerHandle = U.safeGet(creatorHashMap, postId, "");
                let writerPrincipalId = U.safeGet(localHandleReverseHashmap, writerHandle, "");
                if(writerPrincipalId!=""){
                    
                    //make sure that post canister holds the handle and principal of the writer
                    handleHashMap.put(writerPrincipalId, writerHandle);
                    handleReverseHashMap.put(writerHandle, writerPrincipalId);
                    lowercaseHandleHashMap.put(writerPrincipalId, U.lowerCase(writerHandle));
                    lowercaseHandleReverseHashMap.put(U.lowerCase(writerHandle), writerPrincipalId);
                    accountIdsToHandleHashMap.put(U.principalToAID(writerPrincipalId), writerHandle);

                    // add the postId
                    var writerPostIds = U.safeGet(userPostsHashMap, writerPrincipalId, List.nil<Text>());
                    let exists = List.find<Text>(writerPostIds, func(val: Text) : Bool {val == postId });
                    if (exists == null) {
                        let updatedWriterPostIds = List.push(postId, writerPostIds);
                        userPostsHashMap.put(writerPrincipalId, updatedWriterPostIds);
                        counter += 1;
                    };
                };
                
            };
        };
        
        return #ok(Nat.toText(counter));


    };


    public shared ({ caller }) func generateWordCounts() : async () {
        for(postId in contentHashMap.keys()){
            let content = U.safeGet(contentHashMap,postId,"");
            if(content!=""){
                wordCountsHashmap.put(postId,U.calculate_total_word_count(content));
            };
        };
    };

    public shared query func getWordCount(postId:Text):async Nat{
        U.safeGet(wordCountsHashmap,postId,0)
    };

    

    public shared ({ caller }) func reindex() : async Result.Result<Text, Text> {
        canistergeekMonitor.collectMetrics();
        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };
        let PostIndexCanister = CanisterDeclarations.getPostIndexCanister(postIndexCanisterId);
        var result = await PostIndexCanister.clearIndex();

        switch(result) {
            case (#ok(wordCount)) Debug.print("Post->reindex: Cleared " # Nat.toText(wordCount) # " words from the index");
            case (#err(msg)) return #err(msg);
        };

        // loop through each post and call indexPost function 
        var i : Nat = 0;
        var count = principalIdHashMap.size();
        for (postId in principalIdHashMap.keys()) {
            i += 1;
            Debug.print("Indexing postId " # postId # " (" # Nat.toText(i) # " of " # Nat.toText(count) # ")");

            let handle = U.safeGet(handleHashMap, postId, "");
            let title = U.safeGet(titleHashMap, postId, "");
            let subtitle = U.safeGet(subtitleHashMap, postId, "");
            let content = U.safeGet(contentHashMap, postId, "");
            let current = handle # " " # title # " " # subtitle # " " # content;
            let tags = getTagNamesByPostId(postId);

            var indexResult = await PostIndexCanister.indexPost(postId, "", current, [], tags);

            switch(indexResult) {
                case (#ok(id)) Debug.print("indexed post id: " # id);
                case (#err(msg)) return #err(msg);
            };
        };

        #ok(Nat.toText(count));
    };

    public shared query ({ caller }) func getUserPosts(handle : Text) : async [Post] {
        Debug.print("Post->GetUserPosts: " # handle);

        var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(userPostsHashMap.size());
        let trimmedHandle = U.trim(handle);
        let callerPrincipalId = Principal.toText(caller);
        let authorPrincipalId = U.safeGet(lowercaseHandleReverseHashMap, trimmedHandle, "");

        if (authorPrincipalId != "") {
            let userPostIds = U.safeGet(userPostsHashMap, authorPrincipalId, List.nil<Text>());

            List.iterate(userPostIds, func (postId : Text) : () {
                let isDraft = U.safeGet(isDraftHashMap, postId, true);

                if (not isDraft and not rejectedByModClub(postId)) {
                    let postListItem = buildPostListItem(postId);
                    postsBuffer.add(postListItem);
                };
            });
        };

        Buffer.toArray(postsBuffer);
    };

    public shared query func getPostsByPostIds(postIds : [Text]) : async [Post] {
        Debug.print("Post->GetPostsByPostIds");

        var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(userPostsHashMap.size());

        
        let givenPostIds = List.fromArray(postIds);

        List.iterate(givenPostIds, func (postId : Text) : () {
            let isDraft = U.safeGet(isDraftHashMap, postId, true);
            if (not isDraft and not rejectedByModClub(postId)) {
                let postListItem = buildPostListItem(postId);
                postsBuffer.add(postListItem);
            };
        });
        
        Buffer.toArray(postsBuffer)
    };



    public shared query ({ caller }) func getMyPosts(includeDraft : Bool, includePublished : Bool,
        indexFrom: Nat32, indexTo: Nat32) : async [Post] {
        
        Debug.print("Post->getMyPosts");

        var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(10);
        let callerPrincipalId = Principal.toText(caller);
        let userPosts = U.safeGet(userPostsHashMap, callerPrincipalId, List.nil<Text>());

        // filter: draft or published state
        // posts are already stored desc by created time
        let postIds = Array.filter<Text>(List.toArray(userPosts),
            func filter(postId : Text) : Bool {
                let isDraft = U.safeGet(isDraftHashMap, postId, true);
                (isDraft and includeDraft) or (not isDraft and includePublished);
            }
        );

        // prevent underflow error
        let l : Nat = postIds.size();
        if (l == 0) {
            return [];
        };

        let lastIndex : Nat = l - 1;

        let indexStart = Nat32.toNat(indexFrom);
        if (indexStart > lastIndex) {
            return [];
        };
        
        var indexEnd = Nat32.toNat(indexTo);
        if (indexEnd > lastIndex) {
            indexEnd := lastIndex;
        };

        for (i in Iter.range(indexStart, indexEnd)) {
            let postListItem = buildPostListItem(postIds[i]);
            postsBuffer.add(postListItem);
        };

        Buffer.toArray(postsBuffer)
    };

    public shared query func getUserPostCounts(userHandle : Text) : async UserPostCounts {
        // Iterates all of the user's posts, then adds up the
        // draft and published counts and the total view count of all posts.

        let trimmedHandle =  U.trim(userHandle);
        var totalPostCount : Nat = 0;
        var draftCount : Nat = 0;
        var publishedCount : Nat = 0;
        var totalViewCount : Nat = 0;
        var totalClapCount : Nat = 0;

        let principalId = U.safeGet(lowercaseHandleReverseHashMap, trimmedHandle, "");
        if (principalId != "") {
            
            let userPostIds = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());

            totalPostCount := List.size(userPostIds);

            List.iterate(userPostIds, func (postId : Text) : () {
                let isDraft = U.safeGet(isDraftHashMap, postId, true);

                if (isDraft) {
                    draftCount += 1;
                } else {
                    publishedCount += 1;
                };

                let postViewCount = U.safeGet(viewsHashMap, postId, 0);
                totalViewCount += postViewCount;
                let clapCount = U.safeGet(clapsHashMap, postId, 0);
                totalClapCount += clapCount;
            });
        };

        {
            handle = U.safeGet(handleHashMap, principalId, "");
            totalPostCount = Nat.toText(totalPostCount);
            publishedCount = Nat.toText(publishedCount);
            draftCount = Nat.toText(draftCount);
            totalViewCount = Nat.toText(totalViewCount);
            // TODO: Implement counts
            uniqueClaps = Nat.toText(totalClapCount);
            uniqueReaderCount = "0";
        }
    };
    
    // sort posts by published date and migration function
    public shared ({ caller }) func latestPostsMigration() : async () {

        Debug.print("Post->latestPostsMigration");
        Debug.print("Post->PostsToMigrate: " # Nat.toText(postId));

       //get all posts, build each post, if published date == "0" then set to lastModified date
    for ((postId, principalId) in principalIdHashMap.entries()) {
           let isDraft = U.safeGet(isDraftHashMap, postId, true);
        let isRejected = rejectedByModClub(postId);
        if (not isDraft and not isRejected) {
            let post = buildPostListItem(postId);
            let publishedDate = post.publishedDate;
            let lastModified = U.safeGet(modifiedHashMap, postId, 0);
            if (publishedDate == "0") {
                publishedDateHashMap.put(postId, lastModified);
            };
        };
    };
    };


    public shared ({caller}) func generateLatestPosts() : async () {
       var publishedDateArray = Iter.toArray(publishedDateHashMap.entries());
       var publishedDateSortedArray = Array.sort<(Text,Int)>(publishedDateArray,ivEqual2);
       for(j in latestPostsHashmap.keys()){
        latestPostsHashmap.delete(j);
       };
      for (i in Iter.range(0, publishedDateSortedArray.size() - 1)) {
        latestPostsHashmap.put(Nat.toText(i), publishedDateSortedArray[i].0);
      };
    };

    public shared ({caller}) func generatePublishedDates() : async () {
       let now = U.epochTime();
       for(postId in isDraftHashMap.keys()){
        let isDraft = U.safeGet(isDraftHashMap, postId, true);
        if(not isDraft){
            let publishedDate = U.safeGet(publishedDateHashMap,postId,0);
            if(Int.equal(publishedDate,0)){
                publishedDateHashMap.put(postId,now);
            };
        };
        
       };
    };

    public shared query func getLatestPosts(indexFrom: Nat32, indexTo: Nat32 ) : async GetPostsByFollowers {
        canistergeekMonitor.collectMetrics();
        Debug.print("Post->LatestPosts");
 
        let totalCount = latestPostsHashmap.size();
        let lastIndex : Nat = totalCount - 1;

        let indexStart = Nat32.toNat(indexFrom);
        if (indexStart > lastIndex) {
            return {
                totalCount = "0";
                posts = [];
            };

        };

        var indexEnd = Nat32.toNat(indexTo);
        if (indexEnd > lastIndex) {
            indexEnd := lastIndex;
        };

        var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(10);
        
        for (i in Iter.range(indexStart, indexEnd)) {
            //get the post id from latestPostsHashmap to build post
            let post = buildPostListItem(U.safeGet(latestPostsHashmap, Nat.toText((latestPostsHashmap.size() - 1) - i ), ""));
            Debug.print("post.isDraft: " # Bool.toText(post.isDraft));

            if (rejectedByModClub(post.postId)) {
            Debug.print("rejected");
            indexEnd := indexEnd + 1;
            }
            else if (post.isDraft == true) {
                Debug.print("Post is draft");
                indexEnd := indexEnd + 1;
            }
            else {
                postsBuffer.add(post);
                Debug.print("Post is successfully added");
            };
        };

        {
            totalCount = Nat.toText(latestPostsHashmap.size());
            posts = Buffer.toArray(postsBuffer);
        };
    };

    public shared query func getUserPostIds(userHandle:Text) : async Result.Result<[Text], Text> {
        switch(lowercaseHandleReverseHashMap.get(userHandle)){
            case null {return #err(UserNotFound)};
            case (?principalId) {
                let userPostIds = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());
                return #ok(List.toArray(userPostIds));
            };
        };
    };


    //load more of the latest posts
    public shared query func getMoreLatestPosts(indexFrom: Nat32, indexTo: Nat32) : async [Post] {
        Debug.print("Post->getMoreLatestPosts");

        var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(10);
        let indexStart = Nat32.toNat(indexFrom);
        let indexEnd = Nat32.toNat(indexTo);

        for (i in Iter.range(indexStart, indexEnd)) {
            let postListItem = buildPostListItem(Nat.toText(i));
            //do not add draft posts
            if (postListItem.isDraft == false or not rejectedByModClub(Nat.toText(i))) {
                postsBuffer.add(postListItem);
            };
        };

        Buffer.toArray(postsBuffer);
    };

    
    //sorting func for hashmaps
    func ivEqual(a: (Text,Nat), b: (Text,Nat)): Order{
        if (a.1 >  b.1){
            return #greater;
        };
        if (a.1 < b.1){
            return #less;
        }
        else {
            return #equal;
        }
    };

    func ivEqual2(a: (Text,Int), b: (Text,Int)): Order{
        if (a.1 >  b.1){
            return #greater;
        };
        if (a.1 < b.1){
            return #less;
        }
        else {
            return #equal;
        }
    };

private func setPopularHeartBeat() {
    let now = U.epochTime() / 1000;
    popularHeartbeat := now;
};

public shared ({caller}) func indexPopular(): async () {
    if(isAdmin(caller)){
        await indexPopularPosts();
    }
};

private func indexPopularPosts(): async () {
    Debug.print("indexPopularPosts is called");
    let now = U.epochTime() / 1000;
    if (now - popularHeartbeat > 0){ //always true after the timer api implmentation
    for(key in popularityHashMap.keys()){
        popularityHashMap.delete(key);
    };
    for(key in popularityTodayHashMap.keys()){
        popularityTodayHashMap.delete(key);
    };
    for(key in popularityThisWeekHashMap.keys()){
        popularityThisWeekHashMap.delete(key);
    };
    for(key in popularityThisMonthHashMap.keys()){
        popularityThisMonthHashMap.delete(key);
    };
    for ((postId, principalId) in principalIdHashMap.entries()) {
        let isDraft = U.safeGet(isDraftHashMap, postId, true);
        let isRejected = rejectedByModClub(postId);
        if (not isDraft and not isRejected) {
            let clapCount = (U.safeGet(clapsHashMap, postId, 0) + 1);
            let viewCount = (U.safeGet(viewsHashMap, postId, 0) + 1);

            let popularity = clapCount * viewCount;
            Debug.print("Post->getPopular: " # postId # " " # Nat.toText(popularity));

            let created = U.safeGet(createdHashMap, postId, 0);

            let DAY = 86400000000000;
            let now = Time.now();

            let todayThreshold = (now - DAY) / 1000000;
            let thisWeekThreshold = (now - 7*DAY) / 1000000;
            let thisMonthThreshold = (now - 28*DAY) / 1000000;

            if(created != 0 and created > todayThreshold){
                popularityTodayHashMap.put(postId, popularity);
            };

            if(created != 0 and created > thisWeekThreshold){
                popularityThisWeekHashMap.put(postId, popularity);
            };

            if(created != 0 and created > thisMonthThreshold){
                popularityThisMonthHashMap.put(postId, popularity);
            };

            popularityHashMap.put(postId, popularity);
        }
        else{
            popularityHashMap.delete(postId);
            popularityTodayHashMap.delete(postId);
            popularityThisWeekHashMap.delete(postId);
            popularityThisMonthHashMap.delete(postId);
        }
    };
        setPopularHeartBeat();
        var ever = Iter.toArray(popularityHashMap.entries());
        popularitySortedArray := Array.sort<(Text,Nat)>(ever,ivEqual);
        var today = Iter.toArray(popularityTodayHashMap.entries());
        popularitySortedArrayToday := Array.sort<(Text,Nat)>(today,ivEqual);
        var week = Iter.toArray(popularityThisWeekHashMap.entries());
        popularitySortedArrayThisWeek := Array.sort<(Text,Nat)>(week,ivEqual);
        var month = Iter.toArray(popularityThisMonthHashMap.entries());
        popularitySortedArrayThisMonth := Array.sort<(Text,Nat)>(month,ivEqual);
        
    };
};

let localPostCanister = "sgymv-uiaaa-aaaaa-aaaia-cai"; //change to your local post canister
        let localFrontEndCanister = "s24we-diaaa-aaaaa-aaaka-cai"; //change to your local front end canister
        let uatPostCanister = "zqai4-ayaaa-aaaaf-qaggq-cai";
        let uatFrontend = "aaa-aaa";
        let prodFrontend = "exwqn-uaaaa-aaaaf-qaeaa-cai";
        let snsUATFrontend = "equ7v-uaaaa-aaaam-qbbcq-cai";
        let snsPostCanister = "emqfe-daaaa-aaaam-qbbaq-cai";


private func storeSeoTimer() : async (){
    var rangeLower = 0; 
    var rangeUpper = 25;
    var totalStoreEvolutions : Int = (postId + rangeUpper -1 ) / rangeUpper;
    var i = 0;

//env selection
        var frontEndActor = "";
        let postCanister = Principal.toText(idInternal());
        if (postCanister == localPostCanister) 
        {
            //local be sure to adjust canisterId if needed
            frontEndActor := localFrontEndCanister;
        }
        else if ( postCanister == uatPostCanister )
        {
            //UAT
            frontEndActor := uatFrontend;
        }
        else if ( postCanister == snsPostCanister )
        {
            //nuancedevs.xyz
            frontEndActor := snsUATFrontend;
        }
        else //PROD
        {
            frontEndActor := prodFrontend;
        };


        let FrontEndCanister =  actor (frontEndActor) : actor {
  store: ( {
    key: Key;
    content_type: Text;
    content_encoding: Text;
    content: Blob;
    sha256: ?Blob
  }) -> ();
   delete_asset: ( {
        key: Key;
    }) -> ();
        
get: ( {
    key: Key;
    accept_encodings: [Text]
    }) -> async ( {
    content: Blob;
    content_type: Text;
    content_encoding: Text;
    sha256: ?Blob;
    total_length: Nat;
    });
    };

    let firstArticle = 
    try {
     FrontEndCanister.get({
        key = "/share" # "/" # Nat.toText(8);
        accept_encodings= ["identity"]
    });
    } catch (msg) {
    msg;
    };

    let emptyArticle = 
    try {
     FrontEndCanister.get({
        key = "/share" # "/" # Nat.toText(postId + 1);
        accept_encodings= ["identity"]
    });
    } catch (msg) {
    //note this could be an error or a message, ideally empty article will be error
       msg;
    };
        
        //compare one article in the range, to one article above postId (guaranteed to be empty if not stored)
    if (firstArticle == emptyArticle) {
       
        

        while (i <= totalStoreEvolutions) {
        switch (await storeAllSEO(rangeLower, rangeUpper)){
            case (#ok) ();
            case (#err(err)) (
                
            );
        };
        rangeLower := rangeUpper;
        rangeUpper := rangeUpper + 25;
        i := i + 1;
    };
       
        };



    
    Debug.print("Post->timer: Inside timer method");

};

//returns SEO files that were not stored properly with the error message from the asset canister
public shared func getSEOStorageErrors() : async ([Text]) {
     var frontEndActor = "";
        let postCanister = Principal.toText(idInternal());



        if (postCanister == localPostCanister) 
        {
            frontEndActor := localFrontEndCanister;
        }
        else if ( postCanister == uatPostCanister )
        {
            frontEndActor := uatFrontend;
        }
        else if ( postCanister == snsPostCanister )
        {
            frontEndActor := snsUATFrontend;
        }
        else //PROD
        {
            frontEndActor := prodFrontend;
        };


        let FrontEndCanister =  actor (frontEndActor) : actor {
      
        
get: ( {
    key: Key;
    accept_encodings: [Text]
    }) -> async ( {
    content: Blob;
    content_type: Text;
    content_encoding: Text;
    sha256: ?Blob;
    total_length: Nat;
    });
    };
var errorBuffer = Buffer.Buffer<Text>(1);

let emptyArticle = FrontEndCanister.get({
        key = "/share" # "/" # Nat.toText(postId + 1);
        accept_encodings= ["identity"]
    });

    //need to catch errors, or the posts not stored, currently trapping for asset not found!

    for (posts in principalIdHashMap.keys()) {
        let key = "/share" # "/" # posts;
        let article = 
        try {
     await  FrontEndCanister.get({
            key = key;
            accept_encodings= ["identity"]
        });
        
        } catch (msg) {
            errorBuffer.add("URL: " # key # " Message: " # Error.message(msg));
        } 

    };
       
    return Buffer.toArray(errorBuffer);


};

    
    public shared ({caller}) func  storeAllSEO(indexFrom: Nat, indexTo: Nat) : async Result.Result<(), Text> {
        
        var i : Nat = indexFrom;
        var count = indexTo;
       

         while (i <= count) {
            var postId = Nat.toText(i);
             i += 1;
            if (i > indexTo) {
               return #ok();
            }; 
           
           switch(await storeSEO(postId, true)) {
                case (#ok) {
                  
                };
                case (#err(err)) {
                   
                    
                };
           };

           switch (await storeSEO(postId, false)) {
            case (#ok) {
             
            };
            case (#err(err)) {
            };

            };
        
        };
        #ok();
    };



    public  shared ({caller}) func storeSEO (postId: Text, delete: Bool ) : async Result.Result<(), Text> {

       var frontEndActor = "";
       let postCanister = Principal.toText(idInternal());

        if (postCanister == localPostCanister) 
        {
            frontEndActor := localFrontEndCanister;
        }
        else if ( postCanister == uatPostCanister )
        {
            frontEndActor := uatFrontend;
        }
        else if ( postCanister == snsPostCanister )
        {
            frontEndActor := snsUATFrontend;
        }
        else //PROD
        {
            frontEndActor := prodFrontend;
        };

       

        if(not isAdmin(caller) and Principal.toText(caller) != postCanister) {
            return #err("Not authorized");
        };

        let FrontEndCanister =  actor (frontEndActor) : actor {
      

    store: ( {
        key: Key;
        content_type: Text;
        content_encoding: Text;
        content: Blob;
        sha256: ?Blob
    }) -> ();

    delete_asset: ( {
        key: Key;
    }) -> ();
        
    
    };
        var post : Post = buildPost(postId);
        var content = await generateContent(postId);

        if (delete) {
            FrontEndCanister.delete_asset( {
                key = "/share" # "/" # postId ;
            });
            return #ok();
        }
        else {
             FrontEndCanister.delete_asset( {
                key = "/share" # "/" # postId ;
            });
            
            FrontEndCanister.store( {
                key = "/share" # "/" # postId ;
                content_type = "text/html";
                content_encoding = "identity";
                content = Text.encodeUtf8(content);
                sha256 = null;
            });
          
        };
   
        #ok();
    };




    //dfx canister call Post getPopular '( 0: nat32, 0: nat32)' 
    public shared query func getPopular (indexFrom: Nat32, indexTo: Nat32 ) : async GetPostsByFollowers {
    Debug.print("Post->getPopular");
       
        let totalCount = popularitySortedArray.size();

        if(totalCount == 0){
            return {
                totalCount = "0";
                posts = [];
            };
        };
        
        let lastIndex : Nat = totalCount - 1;

        let indexStart = Nat32.toNat(indexFrom);
        if (indexStart > lastIndex) {
            return {
                totalCount = "0";
                posts = [];
            };

        };

        var indexEnd = Nat32.toNat(indexTo);
        if (indexEnd > lastIndex) {
            indexEnd := lastIndex;
        };

        var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(10);
        for (i in Iter.range(indexStart, indexEnd)) {
            let post = buildPostListItem(popularitySortedArray[lastIndex - i].0);
            postsBuffer.add(post);
        };

        {
            totalCount = Nat.toText(popularitySortedArray.size());
            posts = Buffer.toArray(postsBuffer);
        };
    };

    public shared query func getPopularToday (indexFrom: Nat32, indexTo: Nat32 ) : async GetPostsByFollowers {
    Debug.print("Post->getPopular");
       
        let totalCount = popularitySortedArrayToday.size();

        if(totalCount == 0){
            return {
                totalCount = "0";
                posts = [];
            };
        };
        
        let lastIndex : Nat = totalCount - 1;

        let indexStart = Nat32.toNat(indexFrom);
        if (indexStart > lastIndex) {
            return {
                totalCount = "0";
                posts = [];
            };

        };

        var indexEnd = Nat32.toNat(indexTo);
        if (indexEnd > lastIndex) {
            indexEnd := lastIndex;
        };

        var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(10);
        for (i in Iter.range(indexStart, indexEnd)) {
            let post = buildPostListItem(popularitySortedArrayToday[lastIndex - i].0);
            postsBuffer.add(post);
        };

        {
            totalCount = Nat.toText(popularitySortedArrayToday.size());
            posts = Buffer.toArray(postsBuffer);
        };
    };

    public shared query func getPopularThisWeek (indexFrom: Nat32, indexTo: Nat32 ) : async GetPostsByFollowers {
    Debug.print("Post->getPopular");
       
        let totalCount = popularitySortedArrayThisWeek.size();

        if(totalCount == 0){
            return {
                totalCount = "0";
                posts = [];
            };
        };
        
        let lastIndex : Nat = totalCount - 1;

        let indexStart = Nat32.toNat(indexFrom);
        if (indexStart > lastIndex) {
            return {
                totalCount = "0";
                posts = [];
            };

        };

        var indexEnd = Nat32.toNat(indexTo);
        if (indexEnd > lastIndex) {
            indexEnd := lastIndex;
        };

        var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(10);
        for (i in Iter.range(indexStart, indexEnd)) {
            let post = buildPostListItem(popularitySortedArrayThisWeek[lastIndex - i].0);
            postsBuffer.add(post);
        };

        {
            totalCount = Nat.toText(popularitySortedArrayThisWeek.size());
            posts = Buffer.toArray(postsBuffer);
        };
    };

    public shared query func getPopularThisMonth (indexFrom: Nat32, indexTo: Nat32 ) : async GetPostsByFollowers {
    Debug.print("Post->getPopular");
       
        let totalCount = popularitySortedArrayThisMonth.size();

        if(totalCount == 0){
            return {
                totalCount = "0";
                posts = [];
            };
        };
        
        let lastIndex : Nat = totalCount - 1;

        let indexStart = Nat32.toNat(indexFrom);
        if (indexStart > lastIndex) {
            return {
                totalCount = "0";
                posts = [];
            };

        };

        var indexEnd = Nat32.toNat(indexTo);
        if (indexEnd > lastIndex) {
            indexEnd := lastIndex;
        };

        var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(10);
        for (i in Iter.range(indexStart, indexEnd)) {
            let post = buildPostListItem(popularitySortedArrayThisMonth[lastIndex - i].0);
            postsBuffer.add(post);
        };

        {
            totalCount = Nat.toText(popularitySortedArrayThisMonth.size());
            posts = Buffer.toArray(postsBuffer);
        };
    };
   
// dfx canister call Post getPostsByFollowers '(vec {"bash-terminal"; "anotherHandle"}, 0: nat32, 0: nat32)'
    public shared query func getPostsByFollowers(handles: [Text], indexFrom: Nat32, indexTo: Nat32) : async GetPostsByFollowers {
        Debug.print("Post->getPostsByFollowers");
        var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(10);
        var postIdsBuffer : Buffer.Buffer<Text> = Buffer.Buffer<Text>(10);

        if (handles.size() > 0) {
            label l for (handle in Iter.fromArray(handles)) {
                let trimmedHandle = U.trim(handle);
                let principalId = U.safeGet(lowercaseHandleReverseHashMap, trimmedHandle, "");
                if (principalId != "") {
                    let userPostIds = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());
                    List.iterate(userPostIds, func (postId : Text) : () {
                        //check if draft
                        let isDraft = U.safeGet(isDraftHashMap, postId, true);
                        if (not isDraft and not rejectedByModClub(postId) and not U.arrayContains(Buffer.toArray(postIdsBuffer),postId)) {
                            postIdsBuffer.add(postId);
                        };
                    }); 
                };
            };
        //page the results from newest to oldest
        let postIds = Array.sort(Iter.toArray(postIdsBuffer.vals()), func(postId_1: Text, postId_2: Text) : {#less; #equal; #greater} {
            let post_1_created = U.safeGet(createdHashMap, postId_1, 0);
            let post_2_created = U.safeGet(createdHashMap, postId_2, 0);
            return Int.compare(post_2_created, post_1_created);
        });
        
        let totalCount = postIds.size();

        if(totalCount == 0){
            return {
                totalCount = "0";
                posts = [];
            };
        };

        let lastIndex : Nat = totalCount - 1;

        let indexStart = Nat32.toNat(indexFrom);
        if (indexStart > lastIndex) {
            return {
                totalCount = "0";
                posts = [];
            };
        };
        
        var indexEnd = Nat32.toNat(indexTo);
        if (indexEnd > lastIndex) {
            indexEnd := lastIndex;
        };

       

        for (i in Iter.range(indexStart, indexEnd)) {
            let post = buildPostListItem(postIds[i]);
            postsBuffer.add(post);
        };


        {
            totalCount = Nat.toText(postIdsBuffer.size());
             posts = Buffer.toArray(postsBuffer);
         };
        }
        //zero followers must return something..
        else {

            {
                totalCount = "0";
                posts = [];
            };
        };
    };
    public shared query func getPostsByCategory(handle:Text, category:Text, indexFrom: Nat32, indexTo: Nat32) : async GetPostsByFollowers {
        
        Debug.print("Post->getMyPosts");

        var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(10);
        let principalId = U.safeGet(lowercaseHandleReverseHashMap, handle, "");
        if(principalId != ""){
            let userPosts = U.safeGet(userPostsHashMap, principalId, List.nil<Text>());

            // filter: draft or published state
            // posts are already stored desc by created time
            let postIds = Array.filter<Text>(List.toArray(userPosts),
                func filter(postId : Text) : Bool {
                    let post = buildPostListItem(postId);
                    not post.isDraft and Text.equal(U.trim_category_name(post.category), category);
                }
            );

            // prevent underflow error
            let l : Nat = postIds.size();
            if (l == 0) {
                return {
                    totalCount = "0";
                    posts = [];
                };
            };

            let lastIndex : Nat = l - 1;

            let indexStart = Nat32.toNat(indexFrom);
            if (indexStart > lastIndex) {
                return {
                    totalCount = "0";
                    posts = [];
                };
            };
        
            var indexEnd = Nat32.toNat(indexTo);
            if (indexEnd > lastIndex) {
                indexEnd := lastIndex;
            };

            for (i in Iter.range(indexStart, indexEnd)) {
                let postListItem = buildPostListItem(postIds[i]);
                postsBuffer.add(postListItem);
            };

            return {
                totalCount = Nat.toText(postIds.size());
                posts = Buffer.toArray(postsBuffer);
            };
        }
        else{
            return {
                    totalCount = "0";
                    posts = [];
                };
        };
    };


    //use this to figure out the commmand line arguments
    public func x(): async [Text]{
    return ["test"];
     };

    public shared ({ caller }) func dumpIds() : async Result.Result<(), Text> {
        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        Debug.print("Post->DumpIds" );
        for ((postId, principalId) in principalIdHashMap.entries()) {
            Debug.print("Post->DumpIds: " # postId);
        };

        #ok();
    };

    public shared ({ caller }) func dumpUserIds() : async Result.Result<(), Text> {
        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        Debug.print("Post->DumpUserIds" );
        for ((postId, principalId) in principalIdHashMap.entries()) {
            Debug.print("Post->DumpUserIds: " # principalId);
        };

        #ok();
    };

    public shared ({ caller }) func dumpPosts() : async Result.Result<(), Text> {
        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        Debug.print("Post->DumpPosts" );
        for ((postId, principalId) in principalIdHashMap.entries()) {
            var post : Post = buildPost(postId);
            Debug.print("Post->DumpUserIds: postId -> " # postId);
            Debug.print("Post->DumpUserIds: principalId -> " # principalId);
            Debug.print("Post->DumpUserIds: title -> " # post.title);
            Debug.print("Post->DumpUserIds: content -> " # post.content);
        };

        #ok();
    };

    //#endregion


    //#region ModClub Management

    private func submitPostToModclub(postId: Text, postModel: PostSaveModel, versionId: Nat) : async () {
        let postIdWithVersion = getPostIdWithVersionId(postId, versionId);
        // On local, don't send posts to Modclub
        if(environment != "local") {
            let _ = await MC.getModClubActor(environment).submitHtmlContent(postIdWithVersion, "<img style='max-height: 500px; max-width: 500px;' src='" # postModel.headerImage # "' />" # postModel.content, ?postModel.title);
        };
        postModerationStatusMap.put(postIdWithVersion, #reviewRequired);
    };

    private func getPostIdWithVersionId(postId: Text, versionId: Nat) : Text {
        postId # "_" # Nat.toText(versionId);
    };

    private func rejectedByModClub(postId: Text) : Bool {
        switch(postVersionMap.get(postId)) {
            case(null)();
            case(?versionId) {
                let postIdWithVersion = getPostIdWithVersionId(postId, versionId);
                switch(postModerationStatusMap.get(postIdWithVersion)) {
                    case(?#rejected) {
                        return true;
                    };
                    case(_)();
                };
            };
        };
        return false;
    };

    public shared ({caller}) func simulateModClub(postId: Text, status: PostModerationStatus) : async () {
        if (not isAdmin(caller)) {
            return;
        };
        let versionId = postVersionMap.get(postId);
        switch(versionId) {
            case(null)();
            case(?versionId) {
                let postIdWithVersion = getPostIdWithVersionId(postId, versionId);
                postModerationStatusMap.put(postIdWithVersion, status);
            };
        };
    };


    public shared ({caller}) func setUpModClub(env: Text) {
        if (not isAdmin(caller)) {
            Prelude.unreachable();
        };

        if(env != "local" and env != "staging" and env != "prod") {
            throw Error.reject("Please Provide correct environment value");
        };
        environment := env;
        // On local don't set up Modclub
        if(environment == "local") {
            return;
        };

        let _ = await MC.getModClubActor(environment).registerProvider("Nuance", "Nuance", null);
        if(not modClubRulesAdded) {
            let rules = ["This post threatens violence against an individual or a group of people",
                "This post glorifies violence",
                "This post threatens or promotes terrorism or violent extremism",
                "This post contains child sexual exploitation",
                "This post contains targeted harassment of someone, or incite other people to do so. This includes wishing or hoping that someone experiences physical harm",
                "This post promotes violence against, threatens, or harasses other people on the basis of race, ethnicity, national origin, caste, sexual orientation, gender, gender identity, religious affiliation, age, disability, or serious disease",
                "This post promotes or encourages suicide or self-harm",
                "This post is excessively gory",
                "This post shares violent or adult content within live video or in profile or image",
                "This post depicts sexual violence and/or assault",
                "This post has an unlawful purpose or facilitates illegal activities. This includes selling, buying, or facilitating transactions in illegal goods or services, as well as certain types of regulated goods or services",
                "This post contains other people's private information (such as home phone number and address) without their express authorization and permission.",
                "This post threatens to expose private information or incentivizes others to do so",
                "This post contains intimate photos or videos of someone that were produced or distributed without their consent",
                "This post artificially amplifies or suppresses information or engages in behavior that manipulates or disrupts people’s experience on Nuance",
                "This post manipulates or interferes in elections or other civic processes. This includes posting or sharing content that may suppress participation or mislead people about when, where, or how to participate in a civic process",
                "This post impersonates individuals, groups, or organizations in a manner that is intended to or does mislead, confuse, or deceive others",
                "This post contains deceptively share synthetic or manipulated media that are likely to cause harm",
                "This post violates others’ intellectual property rights, including copyright and trademark"
            ];
            await MC.getModClubActor(environment).addRules(rules, null);
            modClubRulesAdded := true;
        };
        await MC.getModClubActor(environment).subscribe({callback = modClubCallback;});
    };

    //#endregion


    //#region Tag Management

    private func comparePost(postA : (Text, Int), postB : (Text, Int)) : Order.Order {
        if(postA.1 == postB.1) {
            return #equal;
        };

        if(postA.1 < postB.1) {
            return #greater;
        };
        
        return #less;
    };

    private func createNewRelationship(tagIdNew : Text) : PostTag {
        let now = U.epochTime();

        {
            tagId = U.trim(tagIdNew);
            isActive = true;
            createdDate = now;
            modifiedDate = now;
        };
    };

    private func arrayContains(x : Text, xs : [Text]) : Bool {
        func isX(y: Text): Bool { x == y };
        switch (Array.find<Text>(xs, isX)) {
            case (null) { false };
            case (_) { true };
        };
    };

    private func addOrUpdatePostTag((postId : Text, tagIds : [Text])) : () {
       // var postsBuffer : Buffer.Buffer<Post> = Buffer.Buffer<Post>(userPostsHashMap.size());
        var changes : Buffer.Buffer<PostTag> = Buffer.Buffer<PostTag>(tagIds.size());
        
        switch (relationships.get(postId)) {
            case (?rels) { 
                for (rel in Iter.fromArray(rels)) {

                    // if the existing tag is not listed in the new tags, de-activate
                    changes.add({
                        tagId = rel.tagId;
                        isActive = arrayContains(rel.tagId, tagIds);
                        createdDate = rel.createdDate;
                        modifiedDate = U.epochTime();
                    });
                };

                // filter out existing tags
                let newTagIds = Array.filter<Text>(tagIds, func (newTagId) {
                    null == Array.find<PostTag>(rels, func (existingTag) { existingTag.tagId == newTagId });
                });

                // create new relationship for any new tags (not found above in existing relationships)
                for (newTagId in Iter.fromArray(newTagIds)) {
                    changes.add(createNewRelationship(newTagId)) ;
                };               
            };
            case (null) {
                // create new relationships since all the tags are new
                for(newTagId in Iter.fromArray(tagIds)) {
                    changes.add(createNewRelationship(newTagId));
                };
            };
        };
        
        let changesArray = Buffer.toArray(changes);
        relationships.put(postId, changesArray);
    };

    private func addOrUpdatePostCategory(postId: Text, category: Text) : () {

        let updatingPost = buildPost(postId);
        if(updatingPost.isPublication){
            categoryHashMap.put(postId, category);
        };
    };

    public shared ({caller}) func removePostCategory(postId: Text) : async Result.Result<Post, Text> {


        let updatingPost = buildPost(postId);

        if(not isAuthor(caller, postId)){
            return #err(Unauthorized);
        };

        if(not Bool.equal(updatingPost.isPublication, true)){
            return #err(NotPublicationPost)
        };



        let now = U.epochTime();
        modifiedHashMap.put(postId, now);

        categoryHashMap.delete(postId);
        #ok(buildPost(postId));
    };

    public shared ({caller}) func addPostCategory(postId: Text, category: Text) : async Result.Result<Post, Text> {

        let updatingPost = buildPost(postId);

        if(not isAuthor(caller, postId)){
            return #err(Unauthorized);
        };

        if(not Bool.equal(updatingPost.isPublication, true)){
            return #err(NotPublicationPost)
        };



        let now = U.epochTime();
        modifiedHashMap.put(postId, now);

        categoryHashMap.put(postId, category);
        
        #ok(buildPost(postId));
    };

    public shared ({caller}) func updatePostDraft(postId: Text, isDraft: Bool) : async Result.Result<Post, Text> {

        let updatingPost = buildPost(postId);

        if(not isAuthor(caller, postId)){
            return #err(Unauthorized);
        };

        if(not Bool.equal(updatingPost.isPublication, true)){
            return #err(NotPublicationPost)
        }; 

        //restrict editing the premium articles
        if(U.safeGet(isPremiumHashMap, postId, false) and not updatingPost.isDraft){
            return #err(ArticleNotEditable);
        };


        let now = U.epochTime();
        modifiedHashMap.put(postId, now);
        isDraftHashMap.put(postId, isDraft);
        let writerHandle = updatingPost.creator;
        let writerPrincipalId = U.safeGet(handleReverseHashMap, writerHandle, "");
        if(isDraft){
            if(writerPrincipalId != "" and Text.notEqual(Principal.toText(caller), writerPrincipalId)){
                let writerPosts = U.safeGet(userPostsHashMap, writerPrincipalId, List.nil<Text>());
                let filteredPostsWriter = List.filter<Text>(writerPosts, func(val: Text) : Bool { val != postId });
                userPostsHashMap.put(writerPrincipalId, filteredPostsWriter);
            };
        }
        else{
            if(not U.arrayContains(Iter.toArray(latestPostsHashmap.vals()),postId)){
                latestPostsHashmap.put(Int.toText(latestPostsHashmap.size()), postId);
            };
            if(Text.notEqual(Principal.toText(caller), writerPrincipalId)){
                var writerPostIds = U.safeGet(userPostsHashMap, writerPrincipalId, List.nil<Text>());
                let exists = List.find<Text>(writerPostIds, func(val: Text) : Bool {val == postId });
                if (exists == null) {
                    let updatedWriterPostIds = List.push(postId, writerPostIds);
                    userPostsHashMap.put(writerPrincipalId, updatedWriterPostIds);
                };
            };
            
        };

        ignore storeSEO(postId, isDraft);
        
        #ok(buildPost(postId));
    };

    private func tagExists(tagName: Text) : Bool {
        var lowerCaseTagName = U.lowerCase(tagName);

        for ((key: Text, existingTag: Tag) in tagsHashMap.entries()) {
            if (lowerCaseTagName == U.lowerCase(existingTag.value)) {
                Debug.print("Post->TagName already exists: " # tagName);
                return true;
            };
        };
        return false;
    };

    private func getTagNamesByTagIds(tagIds: [Text]) : [Text] {
        // return array of tag names
        Array.map<Text, Text>(tagIds, func (tagId) {
            switch(tagsHashMap.get(tagId)) {
                case (null) "";
                case (?tag) tag.value;
            };
        });
    };

    private func getTagNamesByPostId(postId: Text) : [Text] {
        let rels = U.safeGet(relationships, postId, []);
        let activeRels = Array.filter<PostTag>(rels, func (rel) { rel.isActive; });

        // return array of tag names
        Array.map<PostTag, Text>(activeRels, func (rel) {
            switch(tagsHashMap.get(rel.tagId)) {
                case (null) ""; //should never happen
                case (?tag) tag.value;
            };
        });
    };

    private func getTagModelsByPost(postId: Text) : [PostTagModel] {
        let rels = U.safeGet(relationships, postId, []);
        let activeRels = Array.filter<PostTag>(rels, func (rel) { rel.isActive; });

        // return array of tag models with id and name for the UI
        Array.map<PostTag, PostTagModel>(activeRels, func (rel) {
            switch(tagsHashMap.get(rel.tagId)) {
                case (null) ({
                    tagId = rel.tagId;
                    tagName = ""; //should never happen
                });
                case (?tag) ({
                    tagId = rel.tagId;
                    tagName = tag.value;
                });
            };
        });
    };

    public shared ({ caller }) func createTag(tagName: Text) : async Result.Result<TagModel, Text> {
        canistergeekMonitor.collectMetrics();

        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };
        
        let tagNameTrimmed = U.trim(tagName);

        if (tagExists(tagNameTrimmed)) {
            Debug.print("Post->createTag tag already exists: " # tagName);
            return #err(TagAlreadyExists # ": " # tagNameTrimmed);
        };
    
        Debug.print("Post->createTag creating new tag: " # tagName);

        tagIdCounter := tagIdCounter + 1;

        let newTag: Tag = {
            id = Nat.toText(tagIdCounter);
            value = tagNameTrimmed;
            createdDate = U.epochTime();
        };

        tagsHashMap.put(Nat.toText(tagIdCounter), newTag);

        let model: TagModel = {
            id = newTag.id;
            value = newTag.value;
            createdDate = Int.toText(newTag.createdDate);
        };

        #ok(model);
    };

    public shared query func getAllTags() : async [TagModel] {
        canistergeekMonitor.collectMetrics();
        Debug.print("Tags->getAllTags");

        var listTags : List.List<TagModel> = List.nil<TagModel>();
        for ((key : Text, tag : Tag) in tagsHashMap.entries())
        { 
            let model: TagModel = {
                id = tag.id;
                value = tag.value;
                createdDate = Int.toText(tag.createdDate);
            };
            listTags := List.push(model, listTags);  
        };

        List.toArray(listTags);
    };

    public shared query func getTagsByUser(userPrincipalId: Text) : async [PostTag]{
        var postTags = userTagRelationships.get(userPrincipalId);
        switch (postTags) {
            case (?postTags) { 
                //improve return only isActive tags
                var postTags = userTagRelationships.get(userPrincipalId);
                switch (postTags) {
                    case (?postTags) { postTags };
                    case (null) { [] }
                }
            };
            case(null){ [] };
        };           
    };

    public shared query ({ caller }) func getMyTags() : async [PostTagModel] {

        // Should be called from user's browser.
        let userPrincipalId = Principal.toText(caller);

        var postTags = userTagRelationships.get(userPrincipalId);
        switch (postTags) {
            case (?postTags) { 
                var activePostTags = Array.filter<PostTag>(postTags, func isEq(x : PostTag) : Bool { x.isActive == true });

                Array.map<PostTag, PostTagModel>(activePostTags, func (postTag) {
                    switch(tagsHashMap.get(postTag.tagId)) {
                        case (null) ({
                            tagId = postTag.tagId;
                            tagName = ""; //should never happen
                        });
                        case (?tag) ({
                            tagId = postTag.tagId;
                            tagName = tag.value;
                        });
                    };
                });
            };
            case (null) {
                [];
            };
        };
    };

    public shared ({caller}) func followTag(tagId : Text) : async Result.Result<(), Text>
    {
        canistergeekMonitor.collectMetrics();

        if (isAnonymous(caller)) {
            return #err(Unauthorized);
        };

        // Should be called from user's browser.
        let userPrincipalId = Principal.toText(caller);

        var postTags = userTagRelationships.get(userPrincipalId);
        
        

        switch (postTags) {
            case (?postTags) { 
                //check if the tag is already being followed
                var tagIdTrimmed = U.trim(tagId);

                var followedTag : ?PostTag = Array.find<PostTag>(postTags, func isEq(x: PostTag): Bool { x.tagId == tagIdTrimmed });
                switch (followedTag) {
                    case (null) {
                    
                     let newTag = [createNewRelationship(tagId)];

                     //empty buffer
                     //var changes : Buffer.Buffer<PostTag> = Buffer.Buffer<PostTag>(tagIds.size());
                     var followedTagBuffer : Buffer.Buffer<PostTag> = Buffer.Buffer<PostTag>(1);
                       for (tag in Iter.fromArray(postTags)) {
                             followedTagBuffer.add(tag);
                         };
                         followedTagBuffer.add(newTag[0]);

                       //userTagRelationships.put(userPrincipalId, Array.append(postTags, [createNewRelationship(tagId)]));
                        userTagRelationships.put(userPrincipalId, Buffer.toArray(followedTagBuffer));
                    };
                    case (?tag) {
                        if (not tag.isActive) {
                            let updatedPostTags = Array.map<PostTag, PostTag>(postTags, func (t : PostTag) {
                                if (t.tagId == tag.tagId) {
                                    {
                                        tagId = tag.tagId;
                                        isActive = true;
                                        createdDate = tag.createdDate;
                                        modifiedDate = U.epochTime();
                                    };
                                } else {
                                    t;
                                };
                            });

                            userTagRelationships.put(userPrincipalId, updatedPostTags);
                        } else {
                            return #err(TagAlreadyFollowed);
                        };
                    };
                };
            };
            case (null) {
                //create new relationship
                userTagRelationships.put(userPrincipalId, [createNewRelationship(tagId)]);
            };
        };
        
        #ok();     
    };

    public shared ({caller}) func unfollowTag(tagId : Text) : async Result.Result<(), Text>
    {
        canistergeekMonitor.collectMetrics();
        
        if (isAnonymous(caller)) {
            return #err(Unauthorized);
        };
        
        // Should be called from user's browser.
        let userPrincipalId = Principal.toText(caller);
        
        var postTags = userTagRelationships.get(userPrincipalId);
        switch (postTags) {
            case (?postTags) { 
                //check if the tag is already being followed
                var tagIdTrimmed = U.trim(tagId);
                
                var followedTag : ?PostTag = Array.find<PostTag>(postTags, func isEq(x: PostTag): Bool { x.tagId == tagIdTrimmed });
                
                switch (followedTag) {
                    case (null) {
                        return #err("TagNotFollowed");
                    };
                    case (?tag) {
                        if (tag.isActive) {
                            let updatedPostTags = Array.map<PostTag, PostTag>(postTags, func (t : PostTag) {
                                if (t.tagId == tag.tagId) {
                                    {
                                        tagId = tag.tagId;
                                        isActive = false;
                                        createdDate = tag.createdDate;
                                        modifiedDate = U.epochTime();
                                    };
                                } else {
                                    t;
                                };
                            });
                            
                            userTagRelationships.put(userPrincipalId, updatedPostTags);
                        } else {
                            return #err("TagNotFollowed");
                        };
                    };
                };
            };
            case (null) {
                return #err("TagNotFollowed");
            };
        };
        
        #ok();     
    };

    public shared ({caller}) func modClubCallback(postStatus: MC.ContentResult) {
        // HardCoded ModClub Canister Prod Id
        if(not isAdmin(caller) and (Principal.toText(caller) != MC.getModClubId(environment))) {
            Prelude.unreachable();
        };
        
        switch(postModerationStatusMap.get(postStatus.sourceId)) {
            case(null)();
            case(_) {
                postModerationStatusMap.put(postStatus.sourceId, postStatus.status);
                if (postStatus.status != #approved) {
                    await removePostFromIndex(postStatus.sourceId);
                    await generateLatestPosts();

                };
            };
        };
    };

    private func removePostFromIndex(sourceId : Text) : async () {

        let postId = getPostIdFromVersionId(sourceId);

        if (postId.size() > 0) {

            var post : Post = buildPost(postId);

            let handle = U.safeGet(handleHashMap, postId, "");
            let prevTitle = U.safeGet(titleHashMap, postId, "");
            let prevSubtitle = U.safeGet(subtitleHashMap, postId, "");
            let prevContent = U.safeGet(contentHashMap, postId, "");
            let previous = handle # " " # prevTitle # " " # prevSubtitle # " " # prevContent;
            let prevTags = getTagNamesByPostId(postId);
            let PostIndexCanister = CanisterDeclarations.getPostIndexCanister(postIndexCanisterId);
            var indexResult = await PostIndexCanister.indexPost(postId, previous, "", prevTags, [""]);
        };
    };

    private func getPostIdFromVersionId(postIdWithVersion: Text) : Text {
        // postid & version are concatenated using postId # "_" # Nat.toText(versionId);
        let fields: Iter.Iter<Text> = Text.split(postIdWithVersion, #text("_"));
        let fieldArray = Iter.toArray(fields);
        if (fieldArray.size() == 2) {
            return fieldArray[0];
        };
        "";
    };

    public shared ({caller}) func addNewRules(rules: [Text]) : async () {
        if (not isAdmin(caller)) {
            Prelude.unreachable();
        };
        if(rules.size() > 0) {
            await MC.getModClubActor(environment).addRules(rules, null);
        };
    };

    public shared ({caller}) func removeExistingRules(ruleIds: [Text]) : async () {
        if (not isAdmin(caller)) {
            Prelude.unreachable();
        };
        if(ruleIds.size() > 0) {
            await MC.getModClubActor(environment).removeRules(ruleIds);
        };
    };

    public shared ({caller}) func getRegisteredRules() : async [MC.Rule] {
        if (not isAdmin(caller)) {
            Prelude.unreachable();
        };
        await MC.getModClubActor(environment).getProviderRegisteredRules();
    };


    // NFT functions

    public shared ({caller}) func makePostPremium(postId: Text) : async Bool{
        if(not isAuthor(caller, postId) or not isNuanceCanister(caller)){
            return false;
        };
        if(not U.safeGet(isPremiumHashMap, postId, true)){
            isPremiumHashMap.put(postId, true);
            publishedDateHashMap.put(postId, U.epochTime());
            return true;
        };

        
        return false;
        
    };

    public shared ({caller}) func simulatePremiumArticle(postId:Text, isPremium:Bool) : async (){
        if(isAdmin(caller)){
            isPremiumHashMap.put(postId, isPremium);
        };
    };

    public shared query ({caller}) func getMetadata(postId: Text, totalSupply: Nat): async Result.Result<Metadata, Text>{
        let principalId = U.safeGet(principalIdHashMap, postId, "");
        if(principalId == ""){
            return #err(ArticleNotFound);
        };

        let post = buildPost(postId);

        if(post.isDraft and not isAuthor(caller, postId) and not isAdmin(caller)){
            return #err(Unauthorized);
        };
        
        
        var metadataValuesBuffer = Buffer.Buffer<MetadataValue>(0);

        let postIdMetadataValue : MetadataValue = ("Post id" , #text(post.postId));
        let headerImageMetadataValue : MetadataValue = ("Header image" , #text(post.headerImage));
        let titleMetadataValue : MetadataValue = ("Title" , #text(post.title));
        let introMetadataValue : MetadataValue = ("Intro" , #text(post.subtitle));
        let writerMetadataValue : MetadataValue = if(post.isPublication){("Writer", #text(post.creator))}else{("Writer", #text(post.handle))};
        let handleMetadataValue : MetadataValue = ("Handle",#text(post.handle));
        let totalSupplyMetadataValue : MetadataValue = ("Total supply", #text(Int.toText(totalSupply)));
        let urlMetadataValue : MetadataValue = ("Url", #text(post.url));
        let mintDateMetadataValue : MetadataValue = ("Date", #text(Int.toText(U.epochTime())));

        metadataValuesBuffer.add(postIdMetadataValue);
        metadataValuesBuffer.add(headerImageMetadataValue);
        metadataValuesBuffer.add(titleMetadataValue);
        metadataValuesBuffer.add(introMetadataValue);
        metadataValuesBuffer.add(writerMetadataValue);
        metadataValuesBuffer.add(handleMetadataValue);
        metadataValuesBuffer.add(totalSupplyMetadataValue);
        metadataValuesBuffer.add(urlMetadataValue);
        metadataValuesBuffer.add(mintDateMetadataValue);

        return #ok(#nonfungible(
            {
                name = post.title;
                asset = post.headerImage;
                thumbnail = post.headerImage;
                metadata = ?#data(Buffer.toArray(metadataValuesBuffer))
            }

        ));
    };


    //NFT canister registration

    //register nft canister id from publication canister
    public shared ({caller}) func registerNftCanisterIdAdminFunction(canisterId: Text, handle: Text) : async Result.Result<Text, Text>{
        if(not isAdmin(caller)){
            return #err(Unauthorized);
        };
        nftCanisterIdsHashmap.put(handle, canisterId);
        return #ok("success");
    };

    //register nft canister id from publication canister
    public shared ({caller}) func registerNftCanisterId(canisterId: Text) : async Result.Result<Text, Text>{
        if(not isNuanceCanister(caller)){
            return #err(Unauthorized);
        };
        let callerPrincipal = Principal.toText(caller);
        let handle = handleHashMap.get(callerPrincipal);
        switch(handle){
            case(?handle){
                nftCanisterIdsHashmap.put(handle, canisterId);
                #ok(canisterId);

            };
            case(null){
                return #err(UserNotFound);
            };
        }
    };

    public shared query func getNftCanisters() :  async [NftCanisterEntry]{
        var existingCanistersList = List.nil<NftCanisterEntry>();

        for(handle in nftCanisterIdsHashmap.keys()){
            let canister_id = U.safeGet(nftCanisterIdsHashmap, handle, "");
            existingCanistersList := List.push<NftCanisterEntry>({canisterId= canister_id; handle= handle;}, existingCanistersList);
        };
        List.toArray(existingCanistersList);
    };


    //#endregion

//#assets canister funcs

    type BatchId = Nat;
type ChunkId = Nat;
type Key = Text;
type Time = Int;

// type CreateAssetArguments =  {
//   key: Key;
//   content_type: Text;
//   max_age: ?Nat64;
//   headers: ?[HeaderField];
// };

// Add or change content for an asset, by content encoding
type SetAssetContentArguments =  {
  key: Key;
  content_encoding: Text;
  chunk_ids:  [ChunkId];
  sha256: ?Blob;
};

// Remove content for an asset, by content encoding
type UnsetAssetContentArguments =  {
  key: Key;
  content_encoding: Text;
};

// Delete an asset
type DeleteAssetArguments =  {
  key: Key;
};

// Reset everything
type ClearArguments =  {};

// type BatchOperationKind =  {
//   CreateAsset: CreateAssetArguments;
//   SetAssetContent: SetAssetContentArguments;

//   UnsetAssetContent: UnsetAssetContentArguments;
//   DeleteAsset: DeleteAssetArguments;

//   Clear: ClearArguments;
// };

// type HeaderField =  { text; text; };

// type HttpRequest =  {
//   method: text;
//   url: text;
//   headers: vec HeaderField;
//   body: blob;
// };

// type HttpResponse =  {
//   status_code: nat16;
//   headers: vec HeaderField;
//   body: blob;
//   streaming_strategy: opt StreamingStrategy;
// };

// type StreamingCallbackHttpResponse =  {
//   body: blob;
//   token: opt StreamingCallbackToken;
// };

// type StreamingCallbackToken =  {
//   key: Key;
//   content_encoding: text;
//   index: nat;
//   sha256: opt blob;
// };

// type StreamingStrategy = variant {
//   Callback:  {
//     callback: func (StreamingCallbackToken) -> (opt StreamingCallbackHttpResponse) query;
//     token: StreamingCallbackToken;
//   };
// };

//todo how to make this work on multiple canisters

    

    
    public shared func generateContent (postId : Text ) : async  Text {
        
        var post : Post = buildPost(postId);
        var principalId = U.safeGet(principalIdHashMap, postId, "");
        var creator = post.creator;
        var postContent = post.content;

        //restricting access for NFTs and Drafts
        if (post.isDraft or post.isPremium) {
            postContent := "";
        };
        
        if (post.creator == "") {
            creator :=  U.safeGet(handleHashMap, principalId, "");
        };
      
        var content = " <!DOCTYPE html> <html lang=\"en\"> <head> <meta charset=\"UTF-8\"> <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\"> <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"> <title>" # post.title # " </title>  <meta name=\"title\" content=\"" # post.title # "\"> <meta name=\"description\" content=\"" # post.subtitle # "\"></meta> <meta name=\"author\" content=\"" # creator # "\"></meta> <meta itemProp=\"name\" content=\"" # post.title # "\" /> <meta itemProp=\"description\" content=\"" # post.subtitle # "\" /> <meta itemProp=\"image\" content=\"" # post.headerImage # "\" /> <meta property=\"og:title\" content=\"" # post.title # "\" /> <meta property=\"og:description\" content=\"" # post.subtitle # "\" /> <meta property=\"og:url\" content=\"nuance.xyz" # post.url # "\" /> <meta property=\"og:type\" content=\"article\" /> <meta property=\"og:image\" content=\"" # post.headerImage # "\" /> <meta name=\"twitter:card\" content=\"summary_large_image\" /> <meta name=\"twitter:title\" content=\"" # post.title # "\" /> <meta name=\"twitter:description\" content=\"" # post.subtitle # "\" /> <meta name=\"twitter:image\" content=\"" # post.headerImage # "\" /> <meta name=\"twitter:creator\" content=\"@nuancedapp\" /> <meta http-equiv=\"refresh\" content=\"0; URL='" # post.url # "'\" /> </head> <body>" # postContent # "</body> </html>";

        return content;
    };


    private func idInternal() : Principal {
        //change to actor when we have dynamic canister
        Principal.fromActor(Post);
    };

//#endregion
    
    //#region Canister Geek

    public shared query ({caller}) func getCanisterMetrics(parameters: Canistergeek.GetMetricsParameters): async ?Canistergeek.CanisterMetrics {
        if (not isCgUser(caller) and not isAdmin(caller))  {
            Prelude.unreachable();
        };
        Debug.print("Post->getCanisterMetrics: The method getCanistermetrics was called from the UI successfully");
        canistergeekMonitor.getMetrics(parameters);
    };

    public shared ({caller}) func collectCanisterMetrics(): async () {
        if (not isCgUser(caller) and not isAdmin(caller))  {
            Prelude.unreachable();
        };
        canistergeekMonitor.collectMetrics();
        Debug.print("Post->collectCanisterMetrics: The method collectCanisterMetrics was called from the UI successfully");
    };

    //#endregion

    //temp function to migrate to case insensitive urls
    public shared ({caller}) func generateLowercaseHandles() : async (Text, [Text]){
        var counter = 0;
        var duplicateHandles = Buffer.Buffer<Text>(0);

        for((principalId: Text, handle: Text) in handleHashMap.entries()){
            let principalOfExistingDuplicateHandle = U.safeGet(lowercaseHandleReverseHashMap, U.lowerCase(handle), "");
            //if there's no duplicate handle, proceed normally
            if(principalOfExistingDuplicateHandle == ""){
                lowercaseHandleHashMap.put(principalId, U.lowerCase(handle));
                lowercaseHandleReverseHashMap.put(U.lowerCase(handle), principalId);
                counter += 1;
            }
            //if there's, don't do anything and return the duplicate handles
            else{
                duplicateHandles.add(handle);
            };
        };

        (Nat.toText(counter), Buffer.toArray(duplicateHandles));
    };


    //#views metrics region

    private func trimDateDay( date: Int) : (DateTimeParts) {
        var dateParts = DateTime.getDateTimeParts(Int.abs(date));
        
        dateParts :=  {
        year = dateParts.year;
        month = dateParts.month;
        day = dateParts.day;
        wday = dateParts.wday;
        hours = 0;
        minutes = 0;
        seconds = 0;
        milliseconds = 0;
        };
       dateParts;
    };

    private func formatDateForStorage (date : DateTimeParts) : (Text) {
      //ex 20230101  
        let year =  Nat.toText(date.year);
        let month = if (date.month < 10) {"0" # Nat.toText(date.month)} else {Nat.toText(date.month)};
        let day = if (date.day < 10) {"0" # Nat.toText(date.day)} else {Nat.toText(date.day)};

        let dateText = year # month # day;
        dateText;
    };
    
    //recall by date funcs
    public shared query func getViewsByRange(recallOptions : RecallOptions) : async (Int) {
       
        let today : DateTimeParts = trimDateDay(Time.now());
        let todayFormattedDate = formatDateForStorage(today);
        let viewBuffer =  Iter.toArray(dailyViewHistoryHashMap.entries());
        
        switch recallOptions {
            case (#today) {
               let today = totalViewsToday;
                today;
            };

            case (#thisWeek) {
                var thisWeekViews = 0;
                var i = 0;
                let duration = if (viewBuffer.size() < 7) {viewBuffer.size()} else 7;
                //each day is stored, so just need to add up the first 7 days
                while (i < duration ) {
                    let formattedDate = viewBuffer[i].0;
                    let dayViews = U.safeGet(dailyViewHistoryHashMap, formattedDate, 0);
                    thisWeekViews := thisWeekViews + dayViews;
                    i := i + 1;
                };
                thisWeekViews;
            };

            case (#thisMonth) {
                var thisMonthViews = 0;
                var i = 0;
                let duration = if (viewBuffer.size() < 30) {viewBuffer.size()} else 30;
                
                while (i < duration ) {
                    let formattedDate = viewBuffer[i].0;
                    let dayViews = U.safeGet(dailyViewHistoryHashMap, formattedDate, 0);
                    thisMonthViews := thisMonthViews + dayViews;
                    i := i + 1;
                };
                thisMonthViews;
            };

            case (#sixtydays) {
                var sixtyDaysViews = 0;
                var i = 0;
                let duration = if (viewBuffer.size() < 60) {viewBuffer.size()} else 60;
               
                while (i < duration ) {
                    let formattedDate = viewBuffer[i].0;
                    let dayViews = U.safeGet(dailyViewHistoryHashMap, formattedDate, 0);
                    sixtyDaysViews := sixtyDaysViews + dayViews;
                    i := i + 1;
                };
                sixtyDaysViews;
            };

            case (#ninetydays) {
                var ninetyDaysViews = 0;
                var i = 0;
                let duration = if (viewBuffer.size() < 90) {viewBuffer.size()} else 90;
               
                while (i < duration) {
                    let formattedDate = viewBuffer[i].0;
                    let dayViews = U.safeGet(dailyViewHistoryHashMap, formattedDate, 0);
                    ninetyDaysViews := ninetyDaysViews + dayViews;
                    i := i + 1;
                };
                ninetyDaysViews;
            };  

            case (#thisYear) {
                var thisYearViews = 0;
                var i = 0;
                let duration = if (viewBuffer.size() < 365) {viewBuffer.size()} else 365;
              
                while (i < duration ) {
                    let formattedDate = viewBuffer[i].0;
                    let dayViews = U.safeGet(dailyViewHistoryHashMap, formattedDate, 0);
                    thisYearViews := thisYearViews + dayViews;
                    i := i + 1;
                    Debug.print("Date: " # viewBuffer[i].0 # "  views:" # Nat.toText(dayViews));
                    Debug.print ("CheckSum: " # Nat.toText(viewBuffer[i].1));
                };
                thisYearViews;
            };

            case (#allTime) {
                var counter = 0;
                for(view in viewsHashMap.vals()){
                    counter += view;
                };
                return counter
            };
        };


    };


//use this to setup the tests to recall by date 
    // public shared func addDebugVals () : async () {

    //     var i = 0;
    //     while (i < 365) {
    //         let today : DateTimeParts = await trimDateDay(Time.now() - (i * 86400000000000));
    //          let todayFormattedDate = await formatDateForStorage(today);
    //          Debug.print("Date: " # todayFormattedDate);
    //         dailyViewHistoryHashMap.put(todayFormattedDate, i);
    //         i := i + 1;
    //     };
    // }; 

    private func incrementDailyViewsDate() : async () {

        let unixTimeStamp = Time.now();
        let trimDate : DateTimeParts = trimDateDay(unixTimeStamp);
        let storageFormattedDate = formatDateForStorage(trimDate);

        let today : DateTimeParts = trimDateDay(Time.now());
        let todayFormattedDate = formatDateForStorage(today);

        if (todayFormattedDate != totalDailyViewsDate) { 

        //store historic views for the day.
        dailyViewHistoryHashMap.put(todayFormattedDate, totalViewsToday);

        //clear views, start new day        
            totalDailyViewsDate := storageFormattedDate; 
            totalViewsToday := 0;   
        } else {
            Debug.print("Today is the same as stored date no need to increment");
       
        };
        
    };

    stable var isStoreSEOcalled = false;
    stable var storeSEO2x = 0;

    public func acceptCycles() : async () {
        let available = Cycles.available();
        let accepted = Cycles.accept(available);
        assert (accepted == available);
    };

    public shared query func availableCycles() : async Nat {
        Cycles.balance()
    };

    //#region System Hooks

    system func preupgrade() {
        
        // transfer canister state to swap variables so data is not lost during upgrade
        Debug.print("Post->preupgrade: hashmap size: " # Nat.toText(titleHashMap.size()));
        _canistergeekMonitorUD := ? canistergeekMonitor.preupgrade();
        Debug.print("Post->preupgrade:Inside Canistergeek preupgrade method");
        principalIdEntries :=  Iter.toArray(principalIdHashMap.entries());
        userPostsEntries :=  Iter.toArray(userPostsHashMap.entries());
        handleEntries := Iter.toArray(handleHashMap.entries());
        handleReverseEntries := Iter.toArray(handleReverseHashMap.entries());
        lowercaseHandleEntries := Iter.toArray(lowercaseHandleHashMap.entries());
        lowercaseHandleReverseEntries := Iter.toArray(lowercaseHandleReverseHashMap.entries());
        titleEntries := Iter.toArray(titleHashMap.entries());
        subtitleEntries := Iter.toArray(subtitleHashMap.entries());
        headerImageEntries := Iter.toArray(headerImageHashMap.entries());
        contentEntries := Iter.toArray(contentHashMap.entries());
        isDraftEntries := Iter.toArray(isDraftHashMap.entries());
        createdEntries := Iter.toArray(createdHashMap.entries());
        publishedDateEntries := Iter.toArray(publishedDateHashMap.entries());
        latestPostsEntries := Iter.toArray(latestPostsHashmap.entries());
        modifiedEntries := Iter.toArray(modifiedHashMap.entries());
        viewsEntries := Iter.toArray(viewsHashMap.entries());
        dailyViewHistory := Iter.toArray(dailyViewHistoryHashMap.entries());
        postModerationStatusEntries := Iter.toArray(postModerationStatusMap.entries());
        postVersionEntries := Iter.toArray(postVersionMap.entries());
        tagEntries := Iter.toArray(tagsHashMap.entries());
        relationshipEntries := Iter.toArray(relationships.entries());
        userTagRelationshipEntries := Iter.toArray(userTagRelationships.entries());
        clapsEntries := Iter.toArray(clapsHashMap.entries());
        popularity := Iter.toArray(popularityHashMap.entries());
        popularityToday := Iter.toArray(popularityTodayHashMap.entries());
        popularityThisWeek := Iter.toArray(popularityThisWeekHashMap.entries());
        popularityThisMonth := Iter.toArray(popularityThisMonthHashMap.entries());
        creatorEntries := Iter.toArray(creatorHashMap.entries());
        isPublicationEntries := Iter.toArray(isPublicationHashMap.entries());
        categoryEntries := Iter.toArray(categoryHashMap.entries());
        wordCountsEntries := Iter.toArray(wordCountsHashmap.entries());
        isPremiumEntries := Iter.toArray(isPremiumHashMap.entries());
        nftCanisterIds := Iter.toArray(nftCanisterIdsHashmap.entries());
        accountIdsToHandleEntries := Iter.toArray(accountIdsToHandleHashMap.entries());

    };

    
    system func postupgrade() {
        // invoke canister geek postupgrade logic 
        Debug.print(debug_show ("Post->postupgrade: hashmap size: " # Nat.toText(titleHashMap.size())));
        canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
        Debug.print("Post->postupgrade:Inside Canistergeek postupgrade method");

        // clear in-memory state swap variables after upgrade
        _canistergeekMonitorUD := null;
        principalIdEntries := [];
        userPostsEntries := [];
        handleEntries := [];
        handleReverseEntries := [];
        lowercaseHandleEntries := [];
        lowercaseHandleReverseEntries := [];
        titleEntries := [];
        subtitleEntries := [];
        headerImageEntries := [];
        contentEntries := [];
        isDraftEntries := [];
        createdEntries := [];
        publishedDateEntries := [];
        latestPostsEntries := [];
        modifiedEntries := [];
        viewsEntries := [];
        dailyViewHistory := [];
        postModerationStatusEntries := [];
        postVersionEntries := [];
        tagEntries := [];
        relationshipEntries := [];
        userTagRelationshipEntries := [];
        clapsEntries := [];
        popularity := [];
        popularityToday := [];
        popularityThisWeek := [];
        popularityThisMonth := [];
        creatorEntries := [];
        isPublicationEntries := [];
        categoryEntries := [];
        wordCountsEntries := [];
        isPremiumEntries := [];
        nftCanisterIds := [];
        accountIdsToHandleEntries := [];
        isStoreSEOcalled := false;
        storeSEO2x := 0;
        
    };



    //#timers region

    
//right now displays stored 2 times, if it does it again we need a new solution.
    

    system func timer(setGlobalTimer : Nat64 -> ()) : async () {
        try{
          
                await storeSeoTimer();
                isStoreSEOcalled := true;
        }
        catch(e){
            Debug.print("Post -> timer storeSeoTimer trapped.");
        };
        try{
            await indexPopularPosts();
        }
        catch(e){
            Debug.print("Post -> timer indexPopularPosts trapped.")
        };
        try{
            await incrementDailyViewsDate();
        }
        catch(e){
            Debug.print("Post -> timer incrementDailyViewsDate trapped.")
        };
        
        let next = Nat64.fromIntWrap(Time.now()) + 240_000_000_000;
        setGlobalTimer(next); // absolute time in nanoseconds
    };

    //#endregion


    

    //test region
    

    public shared ({caller}) func testInstructionSize () : async Text {
        
        if (isAdmin(caller) != true) {
            return "You are not authorized to run this method";
        };

        //👀👀👀 warning IC.countInstructions executes the functions passed to it
       let preupgradeCount = IC.countInstructions(func () { preupgrade(); });
       let postupgradeCount = IC.countInstructions(func () { postupgrade(); });

        // "the limit for a canister install and upgrade is 200 billion instructions."
        // "the limit for an update message is 20 billion instructions"



       return "Preupgrade Count: " # Nat64.toText(preupgradeCount) # "\n Postupgrade Count: " # Nat64.toText(postupgradeCount) # "\n Preupgrade remaining instructions: " # Nat64.toText(200000000000 - preupgradeCount) # "\n Postupgrade remaining instructions: " # Nat64.toText(200000000000 - postupgradeCount);

    }; 



};



