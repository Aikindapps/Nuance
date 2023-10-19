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
import Time "mo:base/Time";
import Hash "mo:base/Hash";
import ENV "../shared/env";

actor Metrics {

  //types
  type OperationLog = Types.OperationLog;
  type RegisteredCanister = Types.RegisteredCanister;
  // local variables
  func isEq(x : Text, y : Text) : Bool { x == y };
  private func isAnonymous(caller : Principal) : Bool {
    Principal.equal(caller, Principal.fromText("2vxsx-fae"));
  };
  var maxHashmapSize = 1000000;

  // error messages
  let Unauthorized = "Unauthorized";

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
  stable var nuanceCanisters : [Text] = [];

  stable var index : [(Text, [Text])] = [];
  var hashMap = HashMap.HashMap<Text, [Text]>(maxHashmapSize, isEq, Text.hash);

  public type CyclesDispenserActorType = actor {
    getAllRegisteredCanisters : () -> async [RegisteredCanister];
  };

  public shared ({ caller }) func initNuanceCanisters() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    let cyclesdispenser : CyclesDispenserActorType = actor (ENV.CYCLES_DISPENSER_CANISTER_ID);
    let registeredCanisters = await cyclesdispenser.getAllRegisteredCanisters();
    let canisterBuffer = Buffer.Buffer<Text>(1);
    for (registeredCanister in Iter.fromArray(registeredCanisters)) {
      let canisterId = registeredCanister.canisterId;
      canisterBuffer.add(canisterId);
    };

    nuanceCanisters := Buffer.toArray(canisterBuffer);
    #ok(nuanceCanisters);
  };

  private func isAdmin(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    U.arrayContains(ENV.METRICS_CANISTER_ADMINS, c);
  };

  public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    #ok(ENV.METRICS_CANISTER_ADMINS);
  };

  public shared query ({ caller }) func getNuanceCanisters() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    #ok(nuanceCanisters);
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

  private func isNuanceCanister(canisterId : Text) : Bool {
    var exists = Array.find<Text>(nuanceCanisters, func(val : Text) : Bool { val == canisterId });
    exists != null;
  };

  public shared ({ caller }) func registerCanister(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    if (not U.arrayContains(nuanceCanisters, id)) {
      nuanceCanisters := List.toArray(List.push<Text>(id, List.fromArray(nuanceCanisters)));
    };

    #ok();
  };

  public shared ({ caller }) func unregisterCanister(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };
    nuanceCanisters := Array.filter<Text>(nuanceCanisters, func(val : Text) : Bool { val != id });
    #ok();
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
    Versions.METRICS_VERSION;
  };

  stable var platformOperatorsLog : [OperationLog] = [];

  public shared query ({ caller }) func getPlatformOperatorsLog() : async Result.Result<[OperationLog], Text> {
    #ok(platformOperatorsLog);
  };

  public shared ({ caller }) func logCommand(commandName : Text, operator : Text) : async Result.Result<(), Text> {
    if (not isAdmin(caller) and not isNuanceCanister(Principal.toText(caller))) {
      return #err(Unauthorized);
    };

    let timestamp = Time.now();
    let log = {
      operation = commandName;
      principal = operator;
      timestamp = timestamp;
    };
    let logBuffer = Buffer.fromArray<OperationLog>(platformOperatorsLog);
    logBuffer.add(log);
    platformOperatorsLog := Buffer.toArray(logBuffer);
    #ok();
  };

  //Pre and post upgrades, currently here for future use if we need to store data.
  system func preupgrade() {

    index := Iter.toArray(hashMap.entries());
  };

  system func postupgrade() {
    hashMap := HashMap.fromIter(index.vals(), maxHashmapSize, isEq, Text.hash);
    index := [];
  };
};
