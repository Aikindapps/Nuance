import Map "mo:hashmap/Map";
import Principal "mo:base/Principal";
import Float "mo:base/Float";
import Option "mo:base/Option";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Order "mo:base/Order";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import U "../shared/utils";
import ENV "../shared/env";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Nat32 "mo:base/Nat32";
import Text "mo:base/Text";
import Cycles "mo:base/ExperimentalCycles";
import CanisterDeclarations "../shared/CanisterDeclarations";
import Prim "mo:prim";
import Versions "../shared/versions";

actor PostRelations {
    let {nhash; thash; } = Map;

    type IndexPostModel = {
        postId: Text;
        content: Text;
        title: Text;
        subtitle: Text;
        tags: [Text];
    };

    type SearchByTagsResponse = {
        totalCount: Text;
        postIds: [Text];
    };

    //key: postId, value: [key: word, value: total number of the word in the post]
    stable var postIdToWordsMap = Map.new<Text, Map.Map<Text, Nat>>();
    //key: postId, value: total word count in the post
    stable var postIdToTotalWordCount = Map.new<Text, Nat>();
    //key: word, value: [key: ratio (0 to 100 -> 1 means the ratio is between 0.01 and 0.02), value: [key: postId, value: postId -> the map is used just because it's more efficient to add & remove values]]
    stable var wordToRatioMap = Map.new<Text, Map.Map<Nat, Map.Map<Text, Text>>>();
    //maps related to the searchByTag function
    //key: postId, value: tag (starting with #)
    stable var postIdToTagsMap = Map.new<Text, [Text]>();
    //key: tag, value: postIds map (they only store the postId values. used map just to make it more efficient to delete & add values)
    stable var tagToPostIdsMap = Map.new<Text, Map.Map<Text, Text>>();

    private func isAdmin(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        U.arrayContains(ENV.POST_RELATIONS_CANISTER_ADMINS, c);
    };

    //indexes a post using the IndexPostModel
    public shared ({caller}) func indexPost(indexPostModel: IndexPostModel) : async () {
        if(not isAdmin(caller)){
            return;
        };

        if (not isThereEnoughMemoryPrivate()) {
            return;
        };

        let {postId; content; title; subtitle; tags} = indexPostModel;

        let oldWordsMap = Option.get(Map.get(postIdToWordsMap, thash, postId), Map.new<Text, Nat>());
        let oldTotalWordCount = Option.get(Map.get(postIdToTotalWordCount, thash, postId), 0);
        let (wordsMap, totalWordCount) = U.extract_words_from_html(content, title, subtitle);
        Map.set(postIdToWordsMap, thash, postId, wordsMap);
        Map.set(postIdToTotalWordCount, thash, postId, totalWordCount);

        //delete all the existing entries in the wordToRatioMap
        for((oldWord, oldCount) in Map.entries(oldWordsMap)){
            let oldRatio = Int.abs(Float.toInt(Float.floor(Float.fromInt(oldCount) / Float.fromInt(oldTotalWordCount) * 100)));
            let wordRatioMap = Option.get(Map.get(wordToRatioMap, thash, oldWord), Map.new<Nat, Map.Map<Text, Text>>());
            let postIdsMap = Option.get(Map.get(wordRatioMap, nhash, oldRatio), Map.new<Text, Text>());
            Map.delete(postIdsMap, thash, postId);
            Map.set(wordRatioMap, nhash, oldRatio, postIdsMap);
            Map.set(wordToRatioMap, thash, oldWord, wordRatioMap);
        };

        //recalculate the new ratio values and then update the internal maps
        for((word, count) in Map.entries(wordsMap)){
            let ratio = Int.abs(Float.toInt(Float.floor(Float.fromInt(count) / Float.fromInt(totalWordCount) * 100)));
            let wordRatioMap = Option.get(Map.get(wordToRatioMap, thash, word), Map.new<Nat, Map.Map<Text, Text>>());
            let postIdsMap = Option.get(Map.get(wordRatioMap, nhash, ratio), Map.new<Text, Text>());
            Map.set(postIdsMap, thash, postId, postId);
            Map.set(wordRatioMap, nhash, ratio, postIdsMap);
            Map.set(wordToRatioMap, thash, word, wordRatioMap);
        };

        //tags management
        //store the old tags in a temp variable
        let oldTags = Option.get(Map.get(postIdToTagsMap, thash, postId), []);
        //set the new tags in the postIdToTagsMap
        Map.set(postIdToTagsMap, thash, postId, tags);
        //remove the postId from the old tags in the tagToPostIdsMap
        for(oldTag in oldTags.vals()){
            let postIdsMap = Option.get(Map.get(tagToPostIdsMap, thash, oldTag), Map.new<Text, Text>());
            Map.delete(postIdsMap, thash, postId);
            Map.set(tagToPostIdsMap, thash, oldTag, postIdsMap);
        };
        //add the postId to the new tags
        for(tag in tags.vals()){
            let postIdsMap = Option.get(Map.get(tagToPostIdsMap, thash, tag), Map.new<Text, Text>());
            Map.set(postIdsMap, thash, postId, postId);
            Map.set(tagToPostIdsMap, thash, tag, postIdsMap);
        };
    };
    //indexes more than one posts with a single call
    public shared ({caller}) func indexPosts(indexPostModels: [IndexPostModel]) : async () {
        if(not isAdmin(caller) and not isPlatformOperator(caller)){
            return;
        };
        if (not isThereEnoughMemoryPrivate()) {
            return;
        };
        for(indexPostModel in indexPostModels.vals()){
            let {postId; content; title; subtitle; tags} = indexPostModel;

            let oldWordsMap = Option.get(Map.get(postIdToWordsMap, thash, postId), Map.new<Text, Nat>());
            let oldTotalWordCount = Option.get(Map.get(postIdToTotalWordCount, thash, postId), 0);
            let (wordsMap, totalWordCount) = U.extract_words_from_html(content, title, subtitle);
            Map.set(postIdToWordsMap, thash, postId, wordsMap);
            Map.set(postIdToTotalWordCount, thash, postId, totalWordCount);

            //delete all the existing entries in the wordToRatioMap
            for((oldWord, oldCount) in Map.entries(oldWordsMap)){
                let oldRatio = Int.abs(Float.toInt(Float.floor(Float.fromInt(oldCount) / Float.fromInt(oldTotalWordCount) * 100)));
                let wordRatioMap = Option.get(Map.get(wordToRatioMap, thash, oldWord), Map.new<Nat, Map.Map<Text, Text>>());
                let postIdsMap = Option.get(Map.get(wordRatioMap, nhash, oldRatio), Map.new<Text, Text>());
                Map.delete(postIdsMap, thash, postId);
                Map.set(wordRatioMap, nhash, oldRatio, postIdsMap);
                Map.set(wordToRatioMap, thash, oldWord, wordRatioMap);
            };

            //recalculate the new ratio values and then update the internal maps
            for((word, count) in Map.entries(wordsMap)){
                let ratio = Int.abs(Float.toInt(Float.floor(Float.fromInt(count) / Float.fromInt(totalWordCount) * 100)));
                let wordRatioMap = Option.get(Map.get(wordToRatioMap, thash, word), Map.new<Nat, Map.Map<Text, Text>>());
                let postIdsMap = Option.get(Map.get(wordRatioMap, nhash, ratio), Map.new<Text, Text>());
                Map.set(postIdsMap, thash, postId, postId);
                Map.set(wordRatioMap, nhash, ratio, postIdsMap);
                Map.set(wordToRatioMap, thash, word, wordRatioMap);
            };

            //tags management
            //store the old tags in a temp variable
            let oldTags = Option.get(Map.get(postIdToTagsMap, thash, postId), []);
            //set the new tags in the postIdToTagsMap
            Map.set(postIdToTagsMap, thash, postId, tags);
            //remove the postId from the old tags in the tagToPostIdsMap
            for(oldTag in oldTags.vals()){
                let postIdsMap = Option.get(Map.get(tagToPostIdsMap, thash, oldTag), Map.new<Text, Text>());
                Map.delete(postIdsMap, thash, postId);
                Map.set(tagToPostIdsMap, thash, oldTag, postIdsMap);
            };
            //add the postId to the new tags
            for(tag in tags.vals()){
                let postIdsMap = Option.get(Map.get(tagToPostIdsMap, thash, tag), Map.new<Text, Text>());
                Map.set(postIdsMap, thash, postId, postId);
                Map.set(tagToPostIdsMap, thash, tag, postIdsMap);
            };
        };
    };
    //removes the post from the internal hashmaps
    public shared ({caller}) func removePost(postId: Text) : async () {
        if(not isAdmin(caller)){
            return;
        };
        let wordsMap = Option.get(Map.get(postIdToWordsMap, thash, postId), Map.new<Text, Nat>());
        let totalWordCount = Option.get(Map.get(postIdToTotalWordCount, thash, postId), 0);
        for((word, count) in Map.entries(wordsMap)){
            let ratio = Int.abs(Float.toInt(Float.floor(Float.fromInt(count) / Float.fromInt(totalWordCount) * 100)));
            let wordRatioMap = Option.get(Map.get(wordToRatioMap, thash, word), Map.new<Nat, Map.Map<Text, Text>>());
            let postIdsMap = Option.get(Map.get(wordRatioMap, nhash, ratio), Map.new<Text, Text>());
            Map.delete(postIdsMap, thash, postId);
            Map.set(wordRatioMap, nhash, ratio, postIdsMap);
            Map.set(wordToRatioMap, thash, word, wordRatioMap);
        };
        Map.delete(postIdToWordsMap, thash, postId);
        Map.delete(postIdToTotalWordCount, thash, postId);
        //temp var to hold the tags
        let tags = Option.get(Map.get(postIdToTagsMap, thash, postId), []);
        Map.delete(postIdToTagsMap, thash, postId);
        for(tag in tags.vals()){
            let postIdsMap = Option.get(Map.get(tagToPostIdsMap, thash, tag), Map.new<Text, Text>());
            Map.delete(postIdsMap, thash, postId);
            Map.set(tagToPostIdsMap, thash, tag, postIdsMap);
        };
    };

    public shared query func getRelatedPosts(postId: Text) : async [Text] {
        let totalWordCount = Option.get(Map.get(postIdToTotalWordCount, thash, postId), 0);
        let wordsMap = Option.get(Map.get(postIdToWordsMap, thash, postId), Map.new<Text, Nat>());
        let wordsArrayNotSorted = Iter.toArray(Map.entries(wordsMap));
        let wordsArraySorted = Array.sort(wordsArrayNotSorted, func (wordEntry_1: (Text, Nat), wordEntry_2: (Text, Nat)) : Order.Order {
            Nat.compare(wordEntry_1.1, wordEntry_2.1)
        });
        if(wordsArraySorted.size() == 0 or totalWordCount == 0){
            return [];
        };
        //iterate on the sorted array reversely
        var postIdsMap = Map.new<Text, Text>();
        var i : Int = Nat.sub(wordsArraySorted.size(), 1);
        while(i >= 0 and Map.size(postIdsMap) <= 50){
            //for every word, do some estimate and add the potential postId values to the postIdsBuffer
            let (word, count) = wordsArraySorted[Int.abs(i)];
            let ratio = Int.abs(Float.toInt(Float.floor(Float.fromInt(count) / Float.fromInt(totalWordCount) * 100)));
            let ratioToPostIdsMap = Option.get(Map.get(wordToRatioMap, thash, word), Map.new<Nat, Map.Map<Text, Text>>());
            
            var start : Int = if(ratio > 80) {100} else {ratio + 20};
            var end : Int = if(ratio < 10) {0} else {Nat.sub(ratio, 10)};
            while(start >= end and Map.size(postIdsMap) <= 50){
                let postIds = Option.get(Map.get(ratioToPostIdsMap, nhash, Int.abs(start)), Map.new<Text, Text>());
                let postIdsArray = Iter.toArray(Map.keys(postIds));
                var i : Int = postIdsArray.size() - 1;
                while(i >= 0 and Map.size(postIdsMap) <= 50){
                    let postId = postIdsArray[Int.abs(i)];
                    Map.set(postIdsMap, thash, postId, postId);
                    i -= 1;
                };
                start -= 1;
            };
            i -= 1;
        };

        Debug.print("here is the potential post ids: " # debug_show(Iter.toArray(Map.entries(postIdsMap))));
        //populated the postIdsMap with the potential postId values
        //sort the postIdsMap using the getDistanceBetweenPosts function and then return the post ids as an array
        let postIdsArrayNotSorted = Iter.toArray(Map.keys(postIdsMap));
        Debug.print("here is the potential post ids array: " # debug_show(postIdsArrayNotSorted));
        Debug.print("here is the size: " # debug_show(postIdsArrayNotSorted.size()));
        let postIdsArraySorted = Array.sort(postIdsArrayNotSorted, func(firstPostId: Text, secondPostId: Text) : Order.Order {
            let distanceBetweenFirstPost = getDistanceBetweenPosts(postId, firstPostId);
            let distanceBetweenSecondPost = getDistanceBetweenPosts(postId, secondPostId);
            Float.compare(distanceBetweenFirstPost, distanceBetweenSecondPost)
        });
        //returns the related post ids in sorted
        //returns max 100 posts, will decide how many of them will be used in frontend
        return postIdsArraySorted;
    };

    private func getDistanceBetweenPosts(firstPostId: Text, secondPostId: Text) : Float {
        let firstPostWordsMap = Option.get(Map.get(postIdToWordsMap, thash, firstPostId), Map.new<Text, Nat>());
        let firstPostTotalWordCount = Option.get(Map.get(postIdToTotalWordCount, thash, firstPostId), 0);
        let secondPostWordsMap = Option.get(Map.get(postIdToWordsMap, thash, secondPostId), Map.new<Text, Nat>());
        let secondPostTotalWordCount = Option.get(Map.get(postIdToTotalWordCount, thash, secondPostId), 0);

        var distance = 0.0;
        if(Map.size(firstPostWordsMap) < Map.size(secondPostWordsMap)){
            //firstPostWordsMap is easier to iterate
            for((word, count) in Map.entries(firstPostWordsMap)){
                let firstPostRatio = Float.fromInt(count) / Float.fromInt(firstPostTotalWordCount);
                let secondPostCount = Option.get(Map.get(secondPostWordsMap, thash, word), 0);
                let secondPostRatio = Float.fromInt(secondPostCount) / Float.fromInt(secondPostTotalWordCount);
                distance += Float.pow(secondPostRatio - firstPostRatio, 2);
            };

        }
        else{
            //secondPostWordsMap is easier to iterate
            for((word, count) in Map.entries(secondPostWordsMap)){
                let secondPostRatio = Float.fromInt(count) / Float.fromInt(secondPostTotalWordCount);
                let firstPostCount = Option.get(Map.get(firstPostWordsMap, thash, word), 0);
                let firstPostRatio = Float.fromInt(firstPostCount) / Float.fromInt(firstPostTotalWordCount);
                distance += Float.pow(secondPostRatio - firstPostRatio, 2);
            };
        };

        distance := Float.sqrt(distance);
        distance := distance;
        distance
    };

    public shared query func searchPost(searchTerm: Text) : async [Text] {
        let words = U.getWordsFromText(searchTerm);
        //for every word, store the number of occurence in the searchTerm
        let searchTermWordsMap = Map.new<Text, Nat>();
        for(word in words.vals()){
            switch(Map.get(searchTermWordsMap, thash, word)) {
                case(?value) {
                    Map.set(searchTermWordsMap, thash, word, value + 1);
                };
                case(null) {
                    Map.set(searchTermWordsMap, thash, word, 1);
                };
            };
        };
        //for every word in search term, there will be maximum of 50 results
        //so, get the most relevant postIds using the words in the searchTermWordsMap
        var numberOfResultMultiplier = 50;
        var postIdsMap = Map.new<Text, Text>();
        for((word, numberOfOccurenceInSearchTerm) in Map.entries(searchTermWordsMap)){
            let maxNumberOfPosts = numberOfResultMultiplier * numberOfOccurenceInSearchTerm;
            let ratioMap = Option.get(Map.get(wordToRatioMap, thash, word), Map.new<Nat, Map.Map<Text, Text>>());
            var postCounter = 0;
            var ratioCounter : Int = 100;
            while(ratioCounter >= 0 and maxNumberOfPosts > postCounter){
                let ratioPostIds = Option.get(Map.get(ratioMap, nhash, Int.abs(ratioCounter)), Map.new<Text, Text>());
                postCounter += Map.size(ratioPostIds);
                //add every post in ratioPostIds to the postIds buffer
                for(postId in Map.keys(ratioPostIds)){
                    Map.set(postIdsMap, thash, postId, postId);
                };
                ratioCounter -= 1;
            };
        };
        //here, we have all the postId values in the postIds buffer
        //sort them using the getDistanceBetweenSearchTermAndPost function and then return the values
        let postIdsArrayNotSorted = Iter.toArray(Map.keys(postIdsMap));
        let postIdsArraySorted = Array.sort<Text>(postIdsArrayNotSorted, func(firstPostId: Text, secondPostId: Text) : Order.Order {
            let distanceBetweenFirstPost = getRelationBetweenSearchTermAndPost(searchTermWordsMap, firstPostId);
            let distanceBetweenSecondPost = getRelationBetweenSearchTermAndPost(searchTermWordsMap, secondPostId);
            switch(Float.compare(distanceBetweenFirstPost, distanceBetweenSecondPost)) {
                case(#less) {#greater};
                case(#equal) {#equal};
                case(#greater) {#less};
            };
        });
        postIdsArraySorted
    };

    public shared composite query func searchPublicationPosts(searchTerm: Text, publicationHandle: Text) : async [Text] {
        let words = U.getWordsFromText(searchTerm);
        //for every word, store the number of occurence in the searchTerm
        let searchTermWordsMap = Map.new<Text, Nat>();
        for(word in words.vals()){
            switch(Map.get(searchTermWordsMap, thash, word)) {
                case(?value) {
                    Map.set(searchTermWordsMap, thash, word, value + 1);
                };
                case(null) {
                    Map.set(searchTermWordsMap, thash, word, 1);
                };
            };
        };
        //for every word in search term, there will be maximum of 50 results
        //so, get the most relevant postIds using the words in the searchTermWordsMap
        var numberOfResultMultiplier = 50;
        var postIdsMap = Map.new<Text, Text>();
        for((word, numberOfOccurenceInSearchTerm) in Map.entries(searchTermWordsMap)){
            let maxNumberOfPosts = numberOfResultMultiplier * numberOfOccurenceInSearchTerm;
            let ratioMap = Option.get(Map.get(wordToRatioMap, thash, word), Map.new<Nat, Map.Map<Text, Text>>());
            var postCounter = 0;
            var ratioCounter : Int = 100;
            while(ratioCounter >= 0 and maxNumberOfPosts > postCounter){
                let ratioPostIds = Option.get(Map.get(ratioMap, nhash, Int.abs(ratioCounter)), Map.new<Text, Text>());
                postCounter += Map.size(ratioPostIds);
                //add every post in ratioPostIds to the postIds buffer
                for(postId in Map.keys(ratioPostIds)){
                    Map.set(postIdsMap, thash, postId, postId);
                };
                ratioCounter -= 1;
            };
        };

        //get the postIds of the given publication
        let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
        let response = await PostCoreCanister.getUserPostIds(U.lowerCase(publicationHandle));
        switch(response) {
            case(#ok(publicationPostIdsArray)) {
                //here, we have all the postId values in the postIds buffer
                //sort them using the getDistanceBetweenSearchTermAndPost function and then return the values
                //filter the publication postIds first
                let postIdsArrayNotSorted = Array.filter<Text>(Iter.toArray(Map.keys(postIdsMap)), func (postId) {
                    U.arrayContainsGeneric(publicationPostIdsArray, postId, Text.equal);
                });
                let postIdsArraySorted = Array.sort<Text>(postIdsArrayNotSorted, func(firstPostId: Text, secondPostId: Text) : Order.Order {
                    let distanceBetweenFirstPost = getRelationBetweenSearchTermAndPost(searchTermWordsMap, firstPostId);
                    let distanceBetweenSecondPost = getRelationBetweenSearchTermAndPost(searchTermWordsMap, secondPostId);
                    switch(Float.compare(distanceBetweenFirstPost, distanceBetweenSecondPost)) {
                        case(#less) {#greater};
                        case(#equal) {#equal};
                        case(#greater) {#less};
                    };
                });
                postIdsArraySorted
            };
            case(#err(_)) {
                return []
            };
        };
        
    };
    //returns the distance between a post and a searchTerm
    //will be used in searchPost function to sort the postIds
    private func getRelationBetweenSearchTermAndPost(searchTermWordsMap: Map.Map<Text, Nat>, postId: Text) : Float {        
        var result = 0.0;
        let postWordsMap = Option.get(Map.get(postIdToWordsMap, thash, postId), Map.new<Text, Nat>());
        let postTotalWordCount = Option.get(Map.get(postIdToTotalWordCount, thash, postId), 0);
        if(postTotalWordCount == 0){
            return 0;
        };
        //for every word, calculate the relation and then add the value to the result var
        for((word, numberOfOccurenceInSearchTerm) in Map.entries(searchTermWordsMap)){
            let wordCount = Option.get(Map.get(postWordsMap, thash, word), 0);
            let ratio = Float.fromInt(wordCount) / Float.fromInt(postTotalWordCount);
            result += ratio * Float.fromInt(numberOfOccurenceInSearchTerm);
        };
        return result;
    };

    public shared query func searchByTag(tagName: Text) : async [Text] {
        switch(Map.get(tagToPostIdsMap, thash, tagName)) {
            case(?postIdsMap) {
                Array.sort(Iter.toArray(Map.keys(postIdsMap)), func (postId_1: Text, postId_2: Text) : Order.Order {
                    switch(Nat.compare(U.textToNat(postId_1), U.textToNat(postId_2))) {
                        case(#less) {#greater};
                        case(#equal) {#equal};
                        case(#greater) {#less};
                    };
                });
            };
            case(null) {
                []
            };
        };
    };

    public shared composite query func searchByTagWithinPublication(tagName: Text, publicationHandle: Text) : async [Text] {
        switch(Map.get(tagToPostIdsMap, thash, tagName)) {
            case(?postIdsMap) {
                //get the postIds of the given publication
                let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
                let response = await PostCoreCanister.getUserPostIds(U.lowerCase(publicationHandle));
                switch(response) {
                    case(#ok(publicationPostIdsArray)) {
                        let filteredPostIds = Array.filter<Text>(Iter.toArray(Map.keys(postIdsMap)), func (postId) {
                            U.arrayContainsGeneric(publicationPostIdsArray, postId, Text.equal);
                        });
                        Array.sort(filteredPostIds, func (postId_1: Text, postId_2: Text) : Order.Order {
                            switch(Nat.compare(U.textToNat(postId_1), U.textToNat(postId_2))) {
                                case(#less) {#greater};
                                case(#equal) {#equal};
                                case(#greater) {#less};
                            };
                        });
                    };
                    case(#err(_)) {
                        return []
                    };
                };
            };
            case(null) {
                []
            };
        };
    };

    public shared query func searchByTags(tagNames: [Text], indexFrom: Nat32, indexTo: Nat32) : async SearchByTagsResponse {
        let postIdsBuffer = Buffer.Buffer<Text>(0);
        for(tagName in tagNames.vals()) {
            switch(Map.get(tagToPostIdsMap, thash, tagName)) {
                case(?postIdsMap) {
                    for(postId in Map.keys(postIdsMap)){
                        postIdsBuffer.add(postId);
                    }
                };
                case(null) {
                    
                };
            };
        };
        postIdsBuffer.sort(func (postId_1, postId_2) {
            switch(Nat.compare(U.textToNat(postId_1), U.textToNat(postId_2))) {
                case(#less) {#greater};
                case(#equal) {#equal};
                case(#greater){#less}
            };
        });

        // prevent underflow error
        let l : Nat = postIdsBuffer.size();
        if (l == 0) {
            return {
                totalCount = "0";
                postIds = [];
            }
        };

        let lastIndex : Nat = l - 1;

        let indexStart = Nat32.toNat(indexFrom);
        if (indexStart > lastIndex) {
            return {
                totalCount = "0";
                postIds = [];
            };
        };

        var indexEnd = Nat32.toNat(indexTo) - 1;
        if (indexEnd > lastIndex) {
            indexEnd := lastIndex;
        };

        let result = Buffer.Buffer<Text>(0);

        for (i in Iter.range(indexStart, indexEnd)) {
            result.add(postIdsBuffer.get(i));
        };

        return {
            totalCount = Nat.toText(postIdsBuffer.size());
            postIds = Buffer.toArray(result)
        }

        
    };

    public shared query ({caller}) func debug_print_everything() : async () {
        if(not isPlatformOperator(caller)){
            return;
        };
        Debug.print("postIdToWordsMap:");
        for((postId, wordsMap) in Map.entries(postIdToWordsMap)){
            Debug.print("--wordsMap");
            Debug.print("--" # postId # ":");
            for((word, count) in Map.entries(wordsMap)){
                Debug.print("----" # word # ": " # Nat.toText(count))
            };
        };
        //key: postId, value: total word count in the post
        //stable var postIdToTotalWordCount = Map.new<Text, Nat>();
    
        Debug.print("postIdToTotalWordCount:");
        for((postId, totalWordCount) in Map.entries(postIdToTotalWordCount)){
            Debug.print("--" # postId # ": " # Nat.toText(totalWordCount));
        };
        //key: word, value: [key: ratio (0 to 100 -> 1 means the ratio is between 0.01 and 0.02), value: [key: postId, value: postId -> the map is used just because it's more efficient to add & remove values]]
        //stable var wordToRatioMap = Map.new<Text, Map.Map<Nat, Map.Map<Text, Text>>>();
        Debug.print("wordToRatioMap:");
        for((word, ratioMap) in Map.entries(wordToRatioMap)){
            Debug.print("--ratioMap:");
            Debug.print("--" # word # ":");
            for((ratio, postIdsMap) in Map.entries(ratioMap)){
                Debug.print("----postIdsMap:");
                Debug.print("----" # Nat.toText(ratio) # ":");
                for(postId in Map.keys(postIdsMap)){
                    Debug.print("------" # postId)
                };
            };
        };
        //maps related to the searchByTag function
        //key: postId, value: tag (starting with #)
        //stable var postIdToTagsMap = Map.new<Text, [Text]>();
        Debug.print("postIdToTagsMap:");
        for((postId, tags) in Map.entries(postIdToTagsMap)){
            Debug.print("--" # postId # ": " # debug_show(tags));
        };
    
        //key: tag, value: postIds map (they only store the postId values. used map just to make it more efficient to delete & add values)
        //stable var tagToPostIdsMap = Map.new<Text, Map.Map<Text, Text>>();
        Debug.print("tagToPostIdsMap:");
        for((tag, postIdsMap) in Map.entries(tagToPostIdsMap)){
            Debug.print("postIdsMap:");
            Debug.print("--" # tag # ":");
            for(postId in Map.keys(postIdsMap)){
                Debug.print("------" # postId)
            };
        };
    };

    //generic functions which needs to be implemented in all Nuance canisters
    public func acceptCycles() : async () {
        let available = Cycles.available();
        let accepted = Cycles.accept<system>(available);
        assert (accepted == available);
    };

    public shared query func availableCycles() : async Nat {
        Cycles.balance();
    };

    private func isPlatformOperator(caller: Principal) : Bool {
        ENV.isPlatformOperator(caller)
    };

    //#region trusted origin

    public type Icrc28TrustedOriginsResponse = {
        trusted_origins: [Text]
    };

    public shared func icrc28_trusted_origins() : async Icrc28TrustedOriginsResponse{
        return {
        trusted_origins= [
            "https://exwqn-uaaaa-aaaaf-qaeaa-cai.raw.ic0.app"
        ]
        }
    };

    // #endregion

    //memory management
    //2GB default
    stable var MAX_MEMORY_SIZE = 2000000000;

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
        Versions.POST_RELATIONS_VERSION;
    };


}