import List "mo:base/List";
import Text "mo:base/Text";
import Int "mo:base/Int";

module {
    
    type List<T> = List.List<T>;

    public type PostIndexEntry = {
        rank: Int;
        PostIds: List<Text>;
    };


    public type SearchResultData = {
        totalCount: Text;
        postIds: [Text];
    };

    public type IndexPostModel = {
        postId : Text;
        oldHtml : Text; 
        newHtml : Text; 
        oldTags: [Text]; 
        newTags: [Text];
    };

};
