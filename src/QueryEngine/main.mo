import PostCanister "canister:Post";
import UserCanister "canister:User";
import PostIndex "canister:PostIndex";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import List "mo:base/List";
import Text "mo:base/Text";

actor QueryEngine {

/*
    public shared(msg) func CreateUser(emailAddress: Text, userName: Text, password: Text) : async UserCanister.CreateUserResult {
        Debug.print("QueryEngine->CreateUser");
        await UserCanister.Create(emailAddress, userName, password);
    };
*/
/*
    public shared(msg) func LoginUser(emailAddress: Text, password: Text) : async UserCanister.CreateUserResult {
        Debug.print("QueryEngine->LoginUser");
        await UserCanister.Login(emailAddress, password);
    };
*/
/*
    public shared(msg) func UpdateUser(emailAddress: Text, password: Text,confirmPassword: Text) : async UserCanister.UpdatePasswordResult {
        Debug.print("QueryEngine->updateUser");
        await UserCanister.forgotPassword(emailAddress, password, confirmPassword);
    };

    public shared(msg) func ActivateUser(emailAddress: Text) : async UserCanister.UpdatePasswordResult {
        Debug.print("QueryEngine->ActivateUser");
        await UserCanister.activeUser(emailAddress);
    };
*/

/*
    public func GetUserCount() : async Nat {
        Debug.print("QueryEngine->GetUserCount");
        await UserCanister.Count();
    };

    public func GetUserPosts(userId : Text) : async [PostCanister.Post] {
        Debug.print("QueryEngine->GetUserPosts");
        await PostCanister.GetUserPosts(userId);
    };

    public func Search(term : Text, emailAddress : Text, pageNumber : Int) : async [PostCanister.Post] {
        Debug.print("QueryEngine->Search.Start");
        await PostCanister.Search(term);
    };

    public shared(msg) func IndexPost(postId : Text, oldPostContent : Text, newPostContent : Text) : async Nat {
        Debug.print("QueryEngine->IndexPost postId: " # postId);
        await PostIndex.IndexPost(postId, oldPostContent, newPostContent);
    };

    public shared (msg) func whoami() : async Principal {
        Debug.print("QueryEngine->WhoAmI");
        msg.caller
    };

    public func DoStuff() : async Text {
         Debug.print("QueryEngine->DoStuff");
         "QueryEngine->DoStuff!";
    };
*/
};