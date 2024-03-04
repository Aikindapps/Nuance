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
import Prelude "mo:base/Prelude";
import U "../shared/utils";
import Types "./types";
import Canistergeek "../canistergeek/canistergeek";
import PostTypes "../PostCore/types";
import Cycles "mo:base/ExperimentalCycles";
import Prim "mo:prim";
import CanisterDeclarations "../shared/CanisterDeclarations";
import Versions "../shared/versions";
import ENV "../shared/env";

actor KinicEndpoint {
  // local variables
  let canistergeekMonitor = Canistergeek.Monitor();
  func isEq(x : Text, y : Text) : Bool { x == y };
  var initCapacity = 0;

  // error messages
  let Unauthorized = "Unauthorized";
  let NotTrustedPrincipal = "Not a trusted principal, unauthorized";

  //data type aliases
  type List<T> = List.List<T>;
  type KinicUrls = Types.KinicUrls;
  type KinicReturn = Types.KinicReturn;

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
  // permanent in-memory state (data types are not lost during upgrades)
  stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
  stable var admins : List.List<Text> = List.nil<Text>();
  stable var platformOperators : List.List<Text> = List.nil<Text>();
  stable var cgusers : List.List<Text> = List.nil<Text>();
  stable var kinicPrincipals : List.List<Text> = List.nil<Text>();

  stable var index : [(Text, [Text])] = [];
  var hashMap = HashMap.HashMap<Text, [Text]>(initCapacity, isEq, Text.hash);

  private func isAnonymous(caller : Principal) : Bool {
    Principal.equal(caller, Principal.fromText("2vxsx-fae"));
  };

  //initialize method to store the canister ids that this canister interacts with
  //deprecated
  public shared ({ caller }) func initializeCanister(postCoreCai : Text) : async Result.Result<Text, Text> {
    #err("Deprecated function.")
  };

  // admin and canister functions

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

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    canistergeekMonitor.collectMetrics();
    if (List.size<Text>(cgusers) > 0 and not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
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

  func isKinicPrincipal(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    var exists = List.find<Text>(kinicPrincipals, func(val : Text) : Bool { val == c });
    exists != null;
  };

  public shared ({ caller }) func registerPrincipal(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    let principalFromText = Principal.fromText(id);

    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };
    if (not List.some<Text>(kinicPrincipals, func(val : Text) : Bool { val == id })) {
      kinicPrincipals := List.push<Text>(id, kinicPrincipals);
    };
    #ok();
  };

  public shared ({ caller }) func unregisterPrincipal(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };
    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };
    kinicPrincipals := List.filter<Text>(kinicPrincipals, func(val : Text) : Bool { val != id });
    #ok();
  };

  public shared query ({ caller }) func getTrustedPrincipals() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    #ok(List.toArray(kinicPrincipals));
  };

  private func isAdmin(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    U.arrayContains(ENV.KINIC_ENDPOINT_CANISTER_ADMINS, c);
  };

  public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    #ok(ENV.KINIC_ENDPOINT_CANISTER_ADMINS);
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

  // Kinic function
  public shared ({ caller }) func getKinicUrlList() : async KinicReturn {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };
    let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
    var list : KinicReturn = await PostCoreCanister.getKinicList();
    if (not isKinicPrincipal(caller)) {
      return #err(NotTrustedPrincipal);
    };
    return (list);
  };

  //#region Canister Geek

  public shared query ({ caller }) func getCanisterMetrics(parameters : Canistergeek.GetMetricsParameters) : async ?Canistergeek.CanisterMetrics {

    if (not isCgUser(caller) and not isAdmin(caller)) {
      Prelude.unreachable();
    };
    Debug.print("KinicEndpoint->getCanisterMetrics: The method getCanistermetrics was called from the UI successfully");
    canistergeekMonitor.getMetrics(parameters);
  };

  public shared ({ caller }) func collectCanisterMetrics() : async () {
    if (not isCgUser(caller) and not isAdmin(caller)) {
      Prelude.unreachable();
    };
    canistergeekMonitor.collectMetrics();
    Debug.print("KinicEndpoint->collectCanisterMetrics: The method collectCanisterMetrics was called from the UI successfully");
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

  //#endregion

  public func acceptCycles() : async () {
    let available = Cycles.available();
    let accepted = Cycles.accept(available);
    assert (accepted == available);
  };

  public shared query func availableCycles() : async Nat {
    Cycles.balance();
  };

  public shared query func getCanisterVersion() : async Text {
    Versions.KINICENDPOINT_VERSION;
  };

  //Pre and post upgrades, currently here for future use if we need to store data.
  system func preupgrade() {
    Debug.print("KinicEndpoint->preupgrade: hashmap size: " # Nat.toText(index.size()));
    _canistergeekMonitorUD := ?canistergeekMonitor.preupgrade();
    Debug.print("KinicEndpoint->preupgrade:Inside Canistergeek preupgrade method");
    index := Iter.toArray(hashMap.entries());
  };

  system func postupgrade() {
    Debug.print("KinicEndpoint->postupgrade: hashmap size: " # Nat.toText(index.size()));
    canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
    Debug.print("KinicEndpoint->postupgrade:Inside Canistergeek postupgrade method");
    hashMap := HashMap.fromIter(index.vals(), initCapacity, isEq, Text.hash);
    _canistergeekMonitorUD := null;
    index := [];
  };
};
