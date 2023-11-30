import Text "mo:base/Text";
import Nat "mo:base/Nat";

// This is the interface to modclub for providers
module {

  type ContentId = Text;
  public type ContentStatus = {
    #approved;
    #rejected;
    #reviewRequired;
  };

  public type ContentResult = {
    sourceId : Text;
    status : ContentStatus;
  };

  public type ProviderSettings = {
    minVotes : Nat;
    minStaked : Nat;
  };

  public type Image = {
    data : [Nat8];
    imageType : Text;
  };

  public type SubscribeMessage = { callback : shared ContentResult -> () };

  public type PohVerificationResponse = {
    requestId : Text;
    providerUserId : Principal;
    status : PohChallengeStatus;
    // status at each challenge level
    challenges : [ChallengeResponse];
    providerId : Principal;
    requestedOn : Int;
  };

  public type ChallengeResponse = {
    challengeId : Text;
    status : PohChallengeStatus;
    completedOn : ?Int;
  };

  public type PohChallengeStatus = {
    #notSubmitted;
    #pending;
    #verified;
    #rejected;
    #expired;
  };

  public type PohUniqueToken = {
    token : Text;
  };

  public type Rule = {
    id : Text;
    description : Text;
  };

  public type Level = {
    #simple;
    #normal;
    #hard;
    #xhard;
  };

  public type ModClubActorType = actor {
    registerProvider : (Text, Text, ?Image) -> async Text;
    deregisterProvider : () -> async Text;
    addRules : ([Text], ?Principal) -> async ();
    removeRules : ([Text]) -> async ();
    getProviderRegisteredRules : () -> async [Rule];
    updateSettings : (ProviderSettings) -> async ();
    submitText : (Text, Text, ?Text) -> async Text;
    submitImage : (Text, [Nat8], Text, ?Text) -> async Text;
     submitHtmlContent : (Text, Text, ?Text, ?Level, ?Text) -> async Text;
    subscribe : (SubscribeMessage) -> async ();
    // Proof of Humanity APIs
    pohVerificationRequest : (Principal) -> async PohVerificationResponse;
    pohGenerateUniqueToken : (Principal) -> async PohUniqueToken;
  };

  public let MODCLUB_CANISTER_ID_DEV = "d7isk-4aaaa-aaaah-qdbsa-cai";
  public let ModClub_DEV_ACTOR = actor "d7isk-4aaaa-aaaah-qdbsa-cai" : actor {
    registerProvider : (Text, Text, ?Image) -> async Text;
    deregisterProvider : () -> async Text;
    addRules : ([Text], ?Principal) -> async ();
    removeRules : ([Text]) -> async ();
    getProviderRegisteredRules : () -> async [Rule];
    updateSettings : (ProviderSettings) -> async ();
    submitText : (Text, Text, ?Text) -> async Text;
    submitImage : (Text, [Nat8], Text, ?Text) -> async Text;
     submitHtmlContent : (Text, Text, ?Text, ?Level, ?Text) -> async Text;
    subscribe : (SubscribeMessage) -> async ();
    // Proof of Humanity APIs
    pohVerificationRequest : (Principal) -> async PohVerificationResponse;
    pohGenerateUniqueToken : (Principal) -> async PohUniqueToken;
  };

  public let MODCLUB_CANISTER_ID_PROD = "gwuzc-waaaa-aaaah-qdboa-cai";
  public let ModClub_PROD_ACTOR = actor "gwuzc-waaaa-aaaah-qdboa-cai" : actor {
    registerProvider : (Text, Text, ?Image) -> async Text;
    deregisterProvider : () -> async Text;
    addRules : ([Text], ?Principal) -> async ();
    removeRules : ([Text]) -> async ();
    getProviderRegisteredRules : () -> async [Rule];
    updateSettings : (ProviderSettings) -> async ();
    submitText : (Text, Text, ?Text) -> async Text;
    submitImage : (Text, [Nat8], Text, ?Text) -> async Text;
     submitHtmlContent : (Text, Text, ?Text, ?Level, ?Text) -> async Text;
    subscribe : (SubscribeMessage) -> async ();
    // Proof of Humanity APIs
    pohVerificationRequest : (Principal) -> async PohVerificationResponse;
    pohGenerateUniqueToken : (Principal) -> async PohUniqueToken;
  };

  public func getModClubId(environment : Text) : Text {
    if (environment == "prod") {
      return MODCLUB_CANISTER_ID_PROD;
    } else {
      return MODCLUB_CANISTER_ID_DEV;
    };
  };

  public func getModClubActor(environment : Text) : ModClubActorType {
    if (environment == "prod") {
      return ModClub_PROD_ACTOR;
    } else {
      return ModClub_DEV_ACTOR;
    };
  };
};
