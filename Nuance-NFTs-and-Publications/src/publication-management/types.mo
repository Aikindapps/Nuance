import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import List "mo:base/List";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Bool "mo:base/Bool";

module {
    public type Followers = List.List<Text>;
    public type RegisterUserReturn = Result.Result<User, Text>;
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
    };


    public type PublicationObject = {
        publicationName: Text;
        isEditor: Bool;
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
    cta : PublicationCta;
  };

  public type PublicationCta = {
    buttonCopy : Text;
    ctaCopy : Text;
    link : Text;
    icon : Text;
  };

  public type PublicationStyling = {
    fontType : Text;
    primaryColor : Text;
    logo : Text;
  };

  public type SocialLinksObject = {
    website : Text;
    twitter : Text;
    dscvr : Text;
    distrikt : Text;
  };


};