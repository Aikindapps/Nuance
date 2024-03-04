import Debug "mo:base/Debug";
import Bool "mo:base/Bool";
import Char "mo:base/Char";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import List "mo:base/List";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Int "mo:base/Int";
import Prelude "mo:base/Prelude";
import U "../shared/utils";
import Types "./types";
import Cycles "mo:base/ExperimentalCycles";
import Prim "mo:prim";
import Versions "../shared/versions";
import ENV "../shared/env";

actor FastBlocks_EmailOptIn {
  // local variables
  func isEq(x : Text, y : Text) : Bool { x == y };
  private func isAnonymous(caller : Principal) : Bool {
    Principal.equal(caller, Principal.fromText("2vxsx-fae"));
  };
  var initCapacity = 0;

  // error messages
  let Unauthorized = "Unauthorized";
  let EmailAddressUnavailable = "No email address provided";
  let NotTrustedPrincipal = "Not a trusted principal, unauthorized";

  //SNS
  public type Validate = {
    #Ok : Text;
    #Err : Text;
  };

  public shared ({ caller }) func validate(input : Any) : async Validate {
    if (isAdmin(caller)) {
      return #Ok("success");
    } else {

      return #Err("Cannot use this method anonymously.");
    };
  };

  //data type aliases
  type List<T> = List.List<T>;

  // permanent in-memory state (data types are not lost during upgrades)
  stable var admins : List.List<Text> = List.nil<Text>();
  stable var platformOperators : List.List<Text> = List.nil<Text>();
  stable var emailIdEntries : [(Text, Text)] = [];

  stable var index : [(Text, [Text])] = [];
  var hashMap = HashMap.HashMap<Text, [Text]>(initCapacity, isEq, Text.hash);
  var emailIdHashMap = HashMap.fromIter<Text, Text>(emailIdEntries.vals(), initCapacity, isEq, Text.hash);

  private func isAdmin(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    U.arrayContains(ENV.FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ADMINS, c);
  };

  public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    #ok(ENV.FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ADMINS);
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


  public shared ({ caller }) func createEmailOptInAddress(emailAddress : Text) : async Result.Result<(), Text> {
    //canistergeekMonitor.collectMetrics();

    //validate input
    if (not U.isTextLengthValid(emailAddress, 100)) {
      return #err("invalid email address");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    let now = Int.toText(U.epochTime());

    if (emailAddress == "") {
      Debug.print("EmailOptIn->createEmailOptInAddress: Invalid email address");
      return #err(EmailAddressUnavailable);
    };

    emailIdHashMap.put(emailAddress, now);
    Debug.print("EmailOptIn->createEmailOptInAddress: New User Detected - Signed up successfully");
    #ok();
  };

  public shared query ({ caller }) func dumpOptInEmailAddress() : async Text {
    if (isAnonymous(caller)) {
      return ("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller)) {
      return "Unauthorized";
    };
    var optInEmailAddress : Text = "";
    for ((emailAddress, now) in emailIdHashMap.entries()) {
      optInEmailAddress := optInEmailAddress # " USER: OptInEmailAddress: " # emailAddress;
    };
    optInEmailAddress;
  };

  public func acceptCycles() : async () {
    let available = Cycles.available();
    let accepted = Cycles.accept(available);
    assert (accepted == available);
  };

  public shared query func availableCycles() : async Nat {
    Cycles.balance();
  };

  //#region memory management
  stable var MAX_MEMORY_SIZE = 380000000;

  public shared ({ caller }) func setMaxMemorySize(newValue : Nat) : async Result.Result<Nat, Text> {

    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("setMaxMemorySize", Principal.toText(caller));
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
    Versions.FASTBLOCKSEMAILOPTIN_VERSION;
  };

  //Pre and post upgrades, currently here for future use if we need to store data.
  system func preupgrade() {
    Debug.print("EmailOptIn->preupgrade: hashmap size: " # Nat.toText(index.size()));
    Debug.print("EmailOptIn->preupgrade:Inside preupgrade method");
    index := Iter.toArray(hashMap.entries());
  };

  system func postupgrade() {
    Debug.print("EmailOptIn->postupgrade: hashmap size: " # Nat.toText(index.size()));
    Debug.print("EmailOptIn->postupgrade:Inside postupgrade method");
    hashMap := HashMap.fromIter(index.vals(), initCapacity, isEq, Text.hash);
    index := [];
  };
};
