import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import List "mo:base/List";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Bool "mo:base/Bool";

module {
    
    public type UserId = Principal;
    public type Followers = List.List<Text>;
    public type RegisterUserReturn = Result.Result<User, Text>;
    public type AddPublicationReturn = Result.Result<User, Text>;
    public type RemovePublicationReturn = Result.Result<User, Text>;
    public type GetPrincipalByHandleReturn = Result.Result<?Text, Text>;
    public type GetHandleByPrincipalReturn = Result.Result<?Text, Text>;
    public type User = {
        handle: Text;
        displayName: Text;
        avatar: Text;
        bio: Text;
        accountCreated: Text;
        followers: Followers;
        followersArray: [Text];
        publicationsArray: [PublicationObject];
        website: Text;
        socialChannels: [Text];
        nuaTokens: Float;
        followersCount: Nat32;
    };

    // Currently useful for getting avatar URLs
    // for multiple user handles, but extendable.
    public type UserListItem = {
        handle: Text;
        avatar: Text;
        displayName: Text;
        fontType: Text;
        bio: Text;
        principal:Text;
    };

    public type PublicationObject = {
        publicationName: Text;
        isEditor: Bool;
    };

    public type NftCanisterEntry = {
        canisterId: Text;
        handle: Text;
    };

};