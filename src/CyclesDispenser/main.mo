import List "mo:base/List";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Int "mo:base/Int";
import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Nat64 "mo:base/Nat64";
import Iter "mo:base/Iter";
import U "../shared/utils";
import Buffer "mo:base/Buffer";
import Float "mo:base/Float";
import Prim "mo:prim";
import Versions "../shared/versions";
import ENV "../shared/env";
import CanisterDeclarations "../shared/CanisterDeclarations";

actor CyclesDispenser {
  let initCapacity = 0;

  // error messages
  let Unauthorized = "Unauthorized";

  public type TopUp = {
    canisterId : Text;
    time : Int;
    amount : Nat;
    balanceBefore : Nat;
    balanceAfter : Nat;
  };
  public type RegisteredCanister = {
    canisterId : Text;
    minimumThreshold : Nat;
    topUpAmount : Nat;
    balance : Nat;
    isStorageBucket: Bool;
    topUps : [TopUp];
  };

  public type AddCanisterModel = {
    canisterId : Text;
    minimumThreshold : Nat;
    topUpAmount : Nat;
    isStorageBucket: Bool;
  };

  public type CheckCanisterBalanceResponse = {
    #AlreadyToppedUp;
    #UnsufficientCycles;
    #BalanceCheckFailed;
    #Success : TopUp;
  };

  public type TimeRange = {
    #day : Nat;
    #hour : Nat;
  };

  public type GeneralActorType = actor {
    availableCycles : () -> async Nat;
    acceptCycles : () -> async ();
    wallet_receive : () -> async { accepted: Nat64 };
    wallet_balance : () -> async Nat;

  };

  public type AdminActorType = actor {
    getAdmins : () -> async [Text];
    registerAdmin : (Text) -> async Result.Result<(), Text>;
    unregisterAdmin : (Text) -> async Result.Result<(), Text>;
    getPlatformOperators : () -> async [Text];
    registerPlatformOperator : (Text) -> async Result.Result<(), Text>;
    unregisterPlatformOperator : (Text) -> async Result.Result<(), Text>;
  };

  // management canister. deposit_cycles is the only way to add cycles to a canister that has already frozen:
  // the regular top-up path (acceptCycles/wallet_receive) is an update call and a frozen canister rejects those.
  let IC = actor "aaaaa-aa" : actor {
    deposit_cycles : shared { canister_id : Principal } -> async ();
  };

  public type StaleCanister = {
    canisterId : Text;
    consecutiveFailures : Nat;
    lastFailureTime : Int;
    cachedBalance : Nat;
    isStorageBucket : Bool;
  };

  stable var admins : List.List<Text> = List.nil<Text>();
  stable var platformOperators : List.List<Text> = List.nil<Text>();
  stable var cgusers : List.List<Text> = List.nil<Text>();
  stable var nuanceCanisters : List.List<Text> = List.nil<Text>();
  stable var topUpId : Nat = 0;
  stable var CYCLES_DISPENSER_MINIMUM = 10_000_000_000_000;

  // Storage buckets reserve roughly 10T cycles for their own freezing threshold, so a top-up threshold
  // at or below that reserve can never fire: the bucket freezes first, and a frozen canister rejects the
  // balance read (and every other call) that the top-up path depends on. Keep the threshold comfortably
  // above the freezing reserve so buckets are topped up while they are still reachable.
  stable var STORAGE_BUCKET_MINIMUM_THRESHOLD : Nat = 20_000_000_000_000;
  stable var STORAGE_BUCKET_TOP_UP_AMOUNT : Nat = 10_000_000_000_000;
  // buckets.mo caps a single wallet_receive at this much, anything above it would be refunded silently
  let STORAGE_BUCKET_WALLET_RECEIVE_LIMIT : Nat = 20_000_000_000_000;

  stable var canisterIdToMinimumAmountOfCyclesEntries : [(Text, Nat)] = [];
  stable var canisterIdToTopUpAmountEntries : [(Text, Nat)] = [];
  stable var canisterIdToBalanceEntries : [(Text, Nat)] = [];
  stable var canisterIdToTopUpIdsEntries : [(Text, [Text])] = [];
  stable var canisterIdToIsStorageBucketEntries : [(Text, Bool)] = [];
  stable var canisterIdToConsecutiveFailuresEntries : [(Text, Nat)] = [];
  stable var canisterIdToLastFailureTimeEntries : [(Text, Int)] = [];

  stable var topUpIdToCanisterIdEntries : [(Text, Text)] = [];
  stable var topUpIdToTimeEntries : [(Text, Int)] = [];
  stable var topUpIdToAmountEntries : [(Text, Nat)] = [];
  stable var topUpIdToCanisterBalanceBeforeEntries : [(Text, Nat)] = [];
  stable var topUpIdToCanisterBalanceAfterEntries : [(Text, Nat)] = [];

  //registered canister hashmaps
  var canisterIdToMinimumAmountOfCyclesHashmap = HashMap.fromIter<Text, Nat>(canisterIdToMinimumAmountOfCyclesEntries.vals(), initCapacity, Text.equal, Text.hash);
  var canisterIdToTopUpAmountHashmap = HashMap.fromIter<Text, Nat>(canisterIdToTopUpAmountEntries.vals(), initCapacity, Text.equal, Text.hash);
  var canisterIdToBalanceHashmap = HashMap.fromIter<Text, Nat>(canisterIdToBalanceEntries.vals(), initCapacity, Text.equal, Text.hash);
  var canisterIdToTopUpIdsHashmap = HashMap.fromIter<Text, [Text]>(canisterIdToTopUpIdsEntries.vals(), initCapacity, Text.equal, Text.hash);
  var canisterIdToIsStorageBucketHashmap = HashMap.fromIter<Text, Bool>(canisterIdToIsStorageBucketEntries.vals(), initCapacity, Text.equal, Text.hash);
  var canisterIdToConsecutiveFailuresHashmap = HashMap.fromIter<Text, Nat>(canisterIdToConsecutiveFailuresEntries.vals(), initCapacity, Text.equal, Text.hash);
  var canisterIdToLastFailureTimeHashmap = HashMap.fromIter<Text, Int>(canisterIdToLastFailureTimeEntries.vals(), initCapacity, Text.equal, Text.hash);

  // mark a canister as stale after this many consecutive failed balance reads (12 minutes at 4-min ticks)
  let STALE_FAILURE_THRESHOLD : Nat = 3;

  //logged top-ups hashmaps
  var topUpIdToCanisterIdHashmap = HashMap.fromIter<Text, Text>(topUpIdToCanisterIdEntries.vals(), initCapacity, Text.equal, Text.hash);
  var topUpIdToTimeHashmap = HashMap.fromIter<Text, Int>(topUpIdToTimeEntries.vals(), initCapacity, Text.equal, Text.hash);
  var topUpIdToAmountHashmap = HashMap.fromIter<Text, Nat>(topUpIdToAmountEntries.vals(), initCapacity, Text.equal, Text.hash);
  var topUpIdToCanisterBalanceBeforeHashmap = HashMap.fromIter<Text, Nat>(topUpIdToCanisterBalanceBeforeEntries.vals(), initCapacity, Text.equal, Text.hash);
  var topUpIdToCanisterBalanceAfterHashmap = HashMap.fromIter<Text, Nat>(topUpIdToCanisterBalanceAfterEntries.vals(), initCapacity, Text.equal, Text.hash);

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
  //#region Security Management

  private func isAnonymous(caller : Principal) : Bool {
    Principal.equal(caller, Principal.fromText("2vxsx-fae"));
  };

  private func isCanisterItself(caller : Principal) : Bool {
    Principal.equal(caller, Principal.fromActor(CyclesDispenser));
  };

  func isNuanceCanister(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    var exists = List.find<Text>(nuanceCanisters, func(val : Text) : Bool { val == c });
    exists != null;
  };

  public shared ({ caller }) func batchRegisterAdmin(admin : Principal) : async Result.Result<[Text], Text> {

    Debug.print("BatchRegisterAdmin");
    //let nuanceCanisterArray = List.toArray(nuanceCanisters);
    var canisterIds = Buffer.Buffer<Text>(0);
    for (canisterId in canisterIdToMinimumAmountOfCyclesHashmap.keys()) {
      canisterIds.add(canisterId);
    };
    let nuanceCanisterArray = Buffer.toArray(canisterIds);

    Debug.print("canisters: " # debug_show (nuanceCanisterArray));
    let errLog = Buffer.Buffer<Text>(0);

    for (canisterId in Iter.fromArray(nuanceCanisterArray)) {
      Debug.print("Registering admin " # Principal.toText(admin) # " for canister " # canisterId);
      let canister : AdminActorType = actor (canisterId);
      ignore canister.registerAdmin(Principal.toText(admin));
      //    switch ( await canister.registerAdmin(Principal.toText(admin))) {
      //         case (#ok()) {Debug.print("Admin " # Principal.toText(admin) # " registered for canister " # canisterId)};
      //             case(#err(err)) {
      //             Debug.print("Error while registering admin " # Principal.toText(admin) # " for canister " # canisterId # " : " # err);
      //             errLog.add(err # " for canister " # canisterId);
      //         };
      //};
    };

    #ok(Buffer.toArray(errLog));

  };

  public shared ({ caller }) func batchUnregisterAdmin(admin : Principal) : async Result.Result<[Text], Text> {

    Debug.print("BatchUnregisterAdmin");
    //let nuanceCanisterArray = List.toArray(nuanceCanisters);
    var canisterIds = Buffer.Buffer<Text>(0);
    for (canisterId in canisterIdToMinimumAmountOfCyclesHashmap.keys()) {
      canisterIds.add(canisterId);
    };
    let nuanceCanisterArray = Buffer.toArray(canisterIds);

    let errLog = Buffer.Buffer<Text>(0);
    for (canisterId in Iter.fromArray(nuanceCanisterArray)) {
      Debug.print("Unregistering admin " # Principal.toText(admin) # " for canister " # canisterId);
      let canister : AdminActorType = actor (canisterId);
      ignore canister.unregisterAdmin(Principal.toText(admin));
      //    switch ( await canister.unregisterAdmin(Principal.toText(admin))) {
      //         case (#ok()) {Debug.print("Admin " # Principal.toText(admin) # " unregistered for canister " # canisterId)};
      //             case(#err(err)) {
      //             Debug.print("Error while unregistering admin " # Principal.toText(admin) # " for canister " # canisterId # " : " # err);
      //             errLog.add(err # " for canister " # canisterId);
      //         };
      //};
    };

    #ok(Buffer.toArray(errLog));

  };

  public shared ({ caller }) func batchRegisterPlatformOperator(platformOperator : Principal) : async Result.Result<[Text], Text> {

    Debug.print("BatchRegisterPlatformOperator");
    //let nuanceCanisterArray = List.toArray(nuanceCanisters);
    var canisterIds = Buffer.Buffer<Text>(0);
    for (canisterId in canisterIdToMinimumAmountOfCyclesHashmap.keys()) {
      canisterIds.add(canisterId);
    };
    let nuanceCanisterArray = Buffer.toArray(canisterIds);

    let errLog = Buffer.Buffer<Text>(0);
    for (canisterId in Iter.fromArray(nuanceCanisterArray)) {
      Debug.print("Registering platform operator " # Principal.toText(platformOperator) # " for canister " # canisterId);
      let canister : AdminActorType = actor (canisterId);
      ignore canister.registerPlatformOperator(Principal.toText(platformOperator));
    };

    #ok(Buffer.toArray(errLog));

  };

  public shared ({ caller }) func batchUnregisterPlatformOperator(platformOperator : Principal) : async Result.Result<[Text], Text> {

    Debug.print("BatchUnregisterPlatformOperator");
    //let nuanceCanisterArray = List.toArray(nuanceCanisters);
    var canisterIds = Buffer.Buffer<Text>(0);
    for (canisterId in canisterIdToMinimumAmountOfCyclesHashmap.keys()) {
      canisterIds.add(canisterId);
    };
    let nuanceCanisterArray = Buffer.toArray(canisterIds);

    let errLog = Buffer.Buffer<Text>(0);
    for (canisterId in Iter.fromArray(nuanceCanisterArray)) {
      Debug.print("Unregistering platform operator " # Principal.toText(platformOperator) # " for canister " # canisterId);
      let canister : AdminActorType = actor (canisterId);
      ignore canister.unregisterPlatformOperator(Principal.toText(platformOperator));
    };

    #ok(Buffer.toArray(errLog));

  };

  public shared query ({ caller }) func getTrustedCanisters() : async Result.Result<[Text], Text> {
    /*if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };*/

    #ok(List.toArray(nuanceCanisters));
  };

  public shared query ({ caller }) func getCgUsers() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    #ok(List.toArray(cgusers));
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
    if (not List.some<Text>(nuanceCanisters, func(val : Text) : Bool { val == id })) {
      nuanceCanisters := List.push<Text>(id, nuanceCanisters);
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
    nuanceCanisters := List.filter<Text>(nuanceCanisters, func(val : Text) : Bool { val != id });
    #ok();
  };

  func isCgUser(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    var exists = List.find<Text>(cgusers, func(val : Text) : Bool { val == c });
    exists != null;
  };

  public shared ({ caller }) func registerCgUser(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

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

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    cgusers := List.filter<Text>(cgusers, func(val : Text) : Bool { val != id });
    #ok();
  };
  public query func idQuick() : async Principal {
    return Principal.fromActor(CyclesDispenser);
  };

  private func isAdmin(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    U.arrayContains(ENV.CYCLES_DISPENSER_CANISTER_ADMINS, c);
  };

  public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    #ok(ENV.CYCLES_DISPENSER_CANISTER_ADMINS);
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

  //#region top-up management
  private func getNextTopUpId() : Text {
    topUpId += 1;
    return Nat.toText(topUpId);
  };

  private func buildTopUp(topUpId : Text) : TopUp {
    {
      amount = U.safeGet(topUpIdToAmountHashmap, topUpId, 0);
      canisterId = U.safeGet(topUpIdToCanisterIdHashmap, topUpId, "");
      time = U.safeGet(topUpIdToTimeHashmap, topUpId, 0);
      balanceBefore = U.safeGet(topUpIdToCanisterBalanceBeforeHashmap, topUpId, 0);
      balanceAfter = U.safeGet(topUpIdToCanisterBalanceAfterHashmap, topUpId, 0);
    };
  };

  //stores a top-up record for the given canister and returns the id of the new record
  private func logTopUp(canisterId : Text, amount : Nat, balanceBefore : Nat, balanceAfter : Nat) : Text {
    let newTopUpId = getNextTopUpId();

    //add the top-up id to canister's top-ups
    let existingTopUpIds = List.fromArray(U.safeGet(canisterIdToTopUpIdsHashmap, canisterId, []));
    canisterIdToTopUpIdsHashmap.put(canisterId, List.toArray(List.push(newTopUpId, existingTopUpIds)));

    //put top-up data to hashmaps
    topUpIdToCanisterIdHashmap.put(newTopUpId, canisterId);
    topUpIdToTimeHashmap.put(newTopUpId, Time.now());
    topUpIdToAmountHashmap.put(newTopUpId, amount);
    topUpIdToCanisterBalanceBeforeHashmap.put(newTopUpId, balanceBefore);
    topUpIdToCanisterBalanceAfterHashmap.put(newTopUpId, balanceAfter);

    newTopUpId;
  };

  private func buildRegisteredCanister(canisterId : Text) : RegisteredCanister {
    var topUpsBuffer = Buffer.Buffer<TopUp>(0);
    let topUps = U.safeGet(canisterIdToTopUpIdsHashmap, canisterId, []);
    for (topUpId in topUps.vals()) {
      topUpsBuffer.add(buildTopUp(topUpId));
    };
    {
      canisterId = canisterId;
      minimumThreshold = U.safeGet(canisterIdToMinimumAmountOfCyclesHashmap, canisterId, 0);
      topUpAmount = U.safeGet(canisterIdToTopUpAmountHashmap, canisterId, 0);
      balance = U.safeGet(canisterIdToBalanceHashmap, canisterId, 0);
      topUps = Buffer.toArray(topUpsBuffer);
      isStorageBucket = U.safeGet(canisterIdToIsStorageBucketHashmap, canisterId, false);
    };
  };
  //allows admins to add/update canisters. The given canister should contain the availableCycles method.
  public shared ({ caller }) func addCanister(canister : AddCanisterModel) : async Result.Result<RegisteredCanister, Text> {
    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    if (not isAdmin(caller) and not isNuanceCanister(caller) and not isPlatformOperator(caller) and not isCanisterItself(caller)) {
      return #err(Unauthorized);
    };

    //check if the given canister contains the availableCycles method and the canister id is valid
    try {
      let addingCanister : GeneralActorType = actor (canister.canisterId);
      let balance = if(canister.isStorageBucket) {await addingCanister.wallet_balance()} else {await addingCanister.availableCycles()};
      canisterIdToMinimumAmountOfCyclesHashmap.put(canister.canisterId, canister.minimumThreshold);
      canisterIdToTopUpAmountHashmap.put(canister.canisterId, canister.topUpAmount);
      canisterIdToBalanceHashmap.put(canister.canisterId, balance);
      canisterIdToIsStorageBucketHashmap.put(canister.canisterId, canister.isStorageBucket);
      #ok(buildRegisteredCanister(canister.canisterId));
    } catch (e) {
      //if here, canister id is not valid or it doesn't contain the availableCycles method
      return #err("Given canister id is not valid or it doesn't contain a method named availableCycles!");
    };
  };
  //allows admins to remove canisters from CyclesDispenser canister
  public shared ({ caller }) func removeCanister(canisterId : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err(Unauthorized);
    };
    // platform operators are allowed here so retired/dead canisters can be unregistered without an
    // SNS proposal — otherwise they keep failing balance reads forever and mask real stale canisters
    if (not isAdmin(caller) and not isNuanceCanister(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    switch (canisterIdToMinimumAmountOfCyclesHashmap.get(canisterId)) {
      case (?value) {};
      case (null) {
        return #err("Given canister id not found!");
      };
    };

    canisterIdToMinimumAmountOfCyclesHashmap.delete(canisterId);
    canisterIdToTopUpAmountHashmap.delete(canisterId);
    canisterIdToBalanceHashmap.delete(canisterId);
    canisterIdToIsStorageBucketHashmap.delete(canisterId);
    canisterIdToConsecutiveFailuresHashmap.delete(canisterId);
    canisterIdToLastFailureTimeHashmap.delete(canisterId);
    #ok();
  };

  //checks the cycles balance of the given canister - private method
  private func checkCanisterBalance(canisterId : Text) : async CheckCanisterBalanceResponse {
    Debug.print("CyclesDispenser -> checkCanisterBalance: " # canisterId);
    let registeredCanister = buildRegisteredCanister(canisterId);
    let registeredCanisterActor : GeneralActorType = actor (canisterId);

    var balance : Nat = 0;
    var balanceReadFailed = false;
    try {
      balance := if(registeredCanister.isStorageBucket){await registeredCanisterActor.wallet_balance()} else{await registeredCanisterActor.availableCycles()};
      // success — reset the failure counter
      canisterIdToConsecutiveFailuresHashmap.put(canisterId, 0);
    } catch (e) {
      balanceReadFailed := true;
      let prev = U.safeGet(canisterIdToConsecutiveFailuresHashmap, canisterId, 0);
      canisterIdToConsecutiveFailuresHashmap.put(canisterId, prev + 1);
      canisterIdToLastFailureTimeHashmap.put(canisterId, Time.now());
      // surface the failure in the cache so getRegisteredCanister doesn't lie about a healthy balance
      canisterIdToBalanceHashmap.put(canisterId, 0);
      Debug.print("CyclesDispenser -> balance read failed for " # canisterId);
    };
    if (balanceReadFailed) {
      return #BalanceCheckFailed;
    };
    canisterIdToBalanceHashmap.put(canisterId, balance);
    let cyclesDispenserBalance = Cycles.balance();

    // if there're not enough cycles to add, don't add cycles. Written as an addition because Nat.sub traps
    // once the dispenser's own balance falls below a single top-up amount.
    if (cyclesDispenserBalance < registeredCanister.topUpAmount + CYCLES_DISPENSER_MINIMUM) {
      return #UnsufficientCycles;
    };

    if (balance < registeredCanister.minimumThreshold) {
      //below the threshold and the CyclesDispenser has enough cycles

      //try to add cycles
      try {
        Cycles.add<system>(registeredCanister.topUpAmount);
        if(registeredCanister.isStorageBucket){
          let uselessVar = await registeredCanisterActor.wallet_receive();
        }
        else{
          await registeredCanisterActor.acceptCycles();
        };
        
        //if here, it went well, store the data in hashmaps
        let newBalance = if(registeredCanister.isStorageBucket){await registeredCanisterActor.wallet_balance()} else{await registeredCanisterActor.availableCycles()};

        //put the new balance
        canisterIdToBalanceHashmap.put(canisterId, newBalance);

        return #Success(buildTopUp(logTopUp(canisterId, registeredCanister.topUpAmount, balance, newBalance)));
      } catch (e) {
        //if here, there was an error during adding the cycles, don't do anything
        return #UnsufficientCycles;
      };
    };
    return #AlreadyToppedUp;
  };

  // Sequential by design: awaiting each call lets the safety-net catch below actually fire on traps,
  // which a fire-and-forget `ignore checkCanisterBalance(...)` would silently swallow. With ~40 canisters
  // and 1–2s per query call, a full sweep can take 40–80s; the timer runs every 4 minutes, so we have headroom.
  // If the canister count grows materially, switch to bounded-concurrency chunks rather than back to fully concurrent.
  private func checkCanisters(canisterIds : [Text]) : async () {
    for (canisterId in canisterIds.vals()) {
      try {
        ignore await checkCanisterBalance(canisterId);
      } catch (e) {
        // Safety net only: keeps the loop alive if checkCanisterBalance traps after its own try/catch.
        // We do NOT increment the failure counter here — checkCanisterBalance already records balance-read
        // failures in its inner catch, and double-counting would flag canisters as stale at half the threshold.
        Debug.print("CyclesDispenser -> unexpected error in checkCanisterBalance for " # canisterId);
      };
    };
  };
  //public method that checks the cycles balance of all the registered canisters
  public shared ({ caller }) func checkAllRegisteredCanisters() : async Result.Result<(), Text> {
    if (not isAdmin(caller) and not isCanisterItself(caller)) {
      return #err(Unauthorized);
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    //call checkCanisters method by chunks with the size 10

    var canisterIds = Buffer.Buffer<Text>(0);
    for (canisterId in canisterIdToMinimumAmountOfCyclesHashmap.keys()) {
      if (canisterIds.size() == 10) {
        //check the canisters and reset the buffer
        ignore checkCanisters(Buffer.toArray(canisterIds));
        canisterIds.clear();
      };
      canisterIds.add(canisterId);
    };
    ignore checkCanisters(Buffer.toArray(canisterIds));

    #ok();
  };

  public shared ({ caller }) func checkRegisteredCanister(canisterId : Text) : async Result.Result<TopUp, Text> {
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };
    switch (canisterIdToMinimumAmountOfCyclesHashmap.get(canisterId)) {
      case (?val) {
        switch (await checkCanisterBalance(canisterId)) {
          case (#Success(topUp)) {
            return #ok(topUp);
          };
          case (#AlreadyToppedUp) {
            #err("Given canister has more cycles than the minimum threshold.");
          };
          case (#UnsufficientCycles) {
            #err("CyclesDispenser canister has not enough cycles to top-up.");
          };
          case (#BalanceCheckFailed) {
            #err("Failed to read the balance of the given canister. It may be unreachable, frozen, or out of cycles. Cached balance has been set to 0.");
          };
        };
      };
      case (null) {
        return #err("Given canister id is not registered yet.");
      };
    };
  };

  //rescues a registered canister the regular top-up path can no longer reach. A frozen canister rejects
  //acceptCycles/wallet_receive and even the balance read, so checkCanisterBalance can never top it up;
  //the management canister's deposit_cycles doesn't make the target execute anything, so it still lands.
  public shared ({ caller }) func depositCyclesToCanister(canisterId : Text, amount : Nat) : async Result.Result<TopUp, Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    if (canisterIdToMinimumAmountOfCyclesHashmap.get(canisterId) == null) {
      return #err("Given canister id is not registered yet.");
    };

    let cyclesDispenserBalance = Cycles.balance();
    if (cyclesDispenserBalance < amount + CYCLES_DISPENSER_MINIMUM) {
      return #err("CyclesDispenser canister has not enough cycles to deposit " # Nat.toText(amount) # " cycles.");
    };

    ignore U.logMetrics("depositCyclesToCanister", Principal.toText(caller));

    let isStorageBucket = U.safeGet(canisterIdToIsStorageBucketHashmap, canisterId, false);
    let balanceBefore = U.safeGet(canisterIdToBalanceHashmap, canisterId, 0);

    try {
      Cycles.add<system>(amount);
      await IC.deposit_cycles({ canister_id = Principal.fromText(canisterId) });
    } catch (e) {
      return #err("Failed to deposit cycles into the given canister: " # Error.message(e));
    };

    //0 means the balance couldn't be read back, same convention checkCanisterBalance uses for a failed read
    var balanceAfter : Nat = 0;
    try {
      let registeredCanisterActor : GeneralActorType = actor (canisterId);
      balanceAfter := if (isStorageBucket) { await registeredCanisterActor.wallet_balance() } else { await registeredCanisterActor.availableCycles() };
      //the canister answers again -> refresh the cache and let it drop out of getStaleCanisters
      canisterIdToBalanceHashmap.put(canisterId, balanceAfter);
      canisterIdToConsecutiveFailuresHashmap.put(canisterId, 0);
    } catch (e) {
      //the deposit went through but the canister still doesn't answer. Leave the cached balance and the
      //failure counter untouched so it keeps being reported as stale.
      Debug.print("CyclesDispenser -> balance read after the deposit failed for " # canisterId);
    };

    #ok(buildTopUp(logTopUp(canisterId, amount, balanceBefore, balanceAfter)));
  };

  //raises an already registered storage bucket up to the current thresholds. Deliberately written against
  //the hashmaps instead of going through addCanister: addCanister probes the canister's balance first, which
  //fails for exactly the buckets that need the higher threshold - the ones that already froze.
  private func raiseStorageBucketThresholds(canisterId : Text) {
    if (U.safeGet(canisterIdToMinimumAmountOfCyclesHashmap, canisterId, 0) < STORAGE_BUCKET_MINIMUM_THRESHOLD) {
      canisterIdToMinimumAmountOfCyclesHashmap.put(canisterId, STORAGE_BUCKET_MINIMUM_THRESHOLD);
    };
    if (U.safeGet(canisterIdToTopUpAmountHashmap, canisterId, 0) < STORAGE_BUCKET_TOP_UP_AMOUNT) {
      canisterIdToTopUpAmountHashmap.put(canisterId, STORAGE_BUCKET_TOP_UP_AMOUNT);
    };
  };

  //allows admins/platform operators to tune the storage bucket top-up values without an upgrade
  public shared ({ caller }) func setStorageBucketTopUpConfig(minimumThreshold : Nat, topUpAmount : Nat) : async Result.Result<(Nat, Nat), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    if (topUpAmount == 0 or minimumThreshold == 0) {
      return #err("Both values must be greater than 0.");
    };

    if (topUpAmount > STORAGE_BUCKET_WALLET_RECEIVE_LIMIT) {
      return #err("A storage bucket accepts at most " # Nat.toText(STORAGE_BUCKET_WALLET_RECEIVE_LIMIT) # " cycles per top-up.");
    };

    if (minimumThreshold <= topUpAmount) {
      return #err("The minimum threshold must be greater than the top-up amount to keep the bucket above its freezing threshold.");
    };

    ignore U.logMetrics("setStorageBucketTopUpConfig", Principal.toText(caller));
    STORAGE_BUCKET_MINIMUM_THRESHOLD := minimumThreshold;
    STORAGE_BUCKET_TOP_UP_AMOUNT := topUpAmount;

    //registered buckets are raised to the new values by the next checkStorageBucketCanisters run
    #ok((STORAGE_BUCKET_MINIMUM_THRESHOLD, STORAGE_BUCKET_TOP_UP_AMOUNT));
  };

  public shared query func getStorageBucketTopUpConfig() : async (Nat, Nat) {
    (STORAGE_BUCKET_MINIMUM_THRESHOLD, STORAGE_BUCKET_TOP_UP_AMOUNT);
  };

  //private function that controls if there's any new storage bucket canister. If there is, adds it to the registered canisters
  public shared ({caller}) func checkStorageBucketCanisters() : async () {
    if(not isAdmin(caller) and not isPlatformOperator(caller) and not isCanisterItself(caller)){
      //do nothing
      return;
    };
    let storageCanister = CanisterDeclarations.getStorageCanister();
    switch(await storageCanister.getAllDataCanisterIds()) {
      case(#ok((dataCanisterIds, retiredDataCanisterIds))) {
        //check the active canister ids
        for(dataCanisterId in dataCanisterIds.vals()){
          //check if the canister id already exists in the hashmap
          let canisterIdText = Principal.toText(dataCanisterId);
          switch(canisterIdToIsStorageBucketHashmap.get(canisterIdText)) {
            case(?value) {
              //already exists -> make sure it's not registered below the current thresholds
              raiseStorageBucketThresholds(canisterIdText);
            };
            case(null) {
              //doesn't exist -> add it
              ignore addCanister({
                canisterId = canisterIdText;
                minimumThreshold = STORAGE_BUCKET_MINIMUM_THRESHOLD;
                topUpAmount = STORAGE_BUCKET_TOP_UP_AMOUNT;
                isStorageBucket = true;
              })
            };
          };
        };

        //check the retired canister ids
        for(retiredDataCanisterId in retiredDataCanisterIds.vals()){
          //check if the canister id already exists
          switch(canisterIdToMinimumAmountOfCyclesHashmap.get(retiredDataCanisterId)) {
            case(?value) {
              //already exists -> make sure it's not registered below the current thresholds
              raiseStorageBucketThresholds(retiredDataCanisterId);
            };
            case(null) {
              //doesn't exist -> add it
              ignore addCanister({
                canisterId = retiredDataCanisterId;
                minimumThreshold = STORAGE_BUCKET_MINIMUM_THRESHOLD;
                topUpAmount = STORAGE_BUCKET_TOP_UP_AMOUNT;
                isStorageBucket = true;
              })
            };
          };
        };
      };
      case(#err(error)) {
        //storage canister returned an error
        //do nothing
      };
    };
  };

  //#region query data
  //returns the configurable values and top-ups related to the given canister
  public shared query func getRegisteredCanister(canisterId : Text) : async Result.Result<RegisteredCanister, Text> {
    switch (canisterIdToMinimumAmountOfCyclesHashmap.get(canisterId)) {
      case (?val) {
        return #ok(buildRegisteredCanister(canisterId));
      };
      case (null) {
        return #err("Given canister id is not registered yet.");
      };
    };
  };
  //returns all the registered canister's info
  public shared query func getAllRegisteredCanisters() : async [RegisteredCanister] {
    let resultBuffer = Buffer.Buffer<RegisteredCanister>(0);
    for (canisterId in canisterIdToMinimumAmountOfCyclesHashmap.keys()) {
      resultBuffer.add(buildRegisteredCanister(canisterId));
    };

    Buffer.toArray(resultBuffer);
  };

  public shared query func getTopUp(id : Text) : async Result.Result<TopUp, Text> {
    switch (topUpIdToCanisterIdHashmap.get(id)) {
      case (?value) {
        return #ok(buildTopUp(id));
      };
      case (null) {
        #err("Top-up not found.");
      };
    };
  };

  // returns canisters whose balance read has failed STALE_FAILURE_THRESHOLD or more times in a row
  public shared query func getStaleCanisters() : async [StaleCanister] {
    let resultBuffer = Buffer.Buffer<StaleCanister>(0);
    for ((canisterId, failures) in canisterIdToConsecutiveFailuresHashmap.entries()) {
      if (failures >= STALE_FAILURE_THRESHOLD) {
        resultBuffer.add({
          canisterId = canisterId;
          consecutiveFailures = failures;
          lastFailureTime = U.safeGet(canisterIdToLastFailureTimeHashmap, canisterId, 0);
          cachedBalance = U.safeGet(canisterIdToBalanceHashmap, canisterId, 0);
          isStorageBucket = U.safeGet(canisterIdToIsStorageBucketHashmap, canisterId, false);
        });
      };
    };
    Buffer.toArray(resultBuffer);
  };

  public shared query func getAllTopUps() : async [TopUp] {
    let resultBuffer = Buffer.Buffer<TopUp>(0);
    for (id in topUpIdToCanisterIdHashmap.keys()) {
      resultBuffer.add(buildTopUp(id));
    };
    Buffer.toArray(resultBuffer);
  };

  public shared query func getTopUpsByRange(range : TimeRange) : async [TopUp] {
    let DAY = 86400000000000;
    let HOUR = 3600000000000;
    let now = Time.now();
    var minimumTime : Int = 0;
    switch (range) {
      case (#day(val)) {
        minimumTime := now - (val * DAY);
      };
      case (#hour(val)) {
        minimumTime := now - (val * HOUR);
      };
    };
    let resultBuffer = Buffer.Buffer<TopUp>(0);
    for ((id, time) in topUpIdToTimeHashmap.entries()) {
      if (time >= minimumTime) {
        resultBuffer.add(buildTopUp(id));
      };
    };
    Buffer.toArray(resultBuffer);
  };

  public shared query func getCyclesDispenserMinimumValue() : async Nat {
    CYCLES_DISPENSER_MINIMUM;
  };

  public shared query func getStatus() : async Text {
    let cyclesDispenserBalance = Cycles.balance();
    var neededCycles = 0;
    for (canisterId in canisterIdToMinimumAmountOfCyclesHashmap.keys()) {
      let registeredCanister = buildRegisteredCanister(canisterId);
      if (registeredCanister.minimumThreshold > registeredCanister.balance) {
        neededCycles += registeredCanister.topUpAmount;
      };
    };

    var staleCount : Nat = 0;
    for ((_, failures) in canisterIdToConsecutiveFailuresHashmap.entries()) {
      if (failures >= STALE_FAILURE_THRESHOLD) {
        staleCount += 1;
      };
    };
    let stalePrefix = if (staleCount > 0) {
      "WARNING: " # Nat.toText(staleCount) # " canister(s) have failed " #
      Nat.toText(STALE_FAILURE_THRESHOLD) # "+ consecutive balance reads — call getStaleCanisters for details. "
    } else { "" };

    let MINUTE = 60000000000;

    if (Time.now() - lastTimerCalled > 10 * MINUTE) {
      return stalePrefix # "There's a problem! Timer method is not working for more than 10 minutes! CyclesDispenser has " #
      Float.toText(Float.fromInt(cyclesDispenserBalance) / 1000000000000) # "T cycles.";
    };

    if (cyclesDispenserBalance > CYCLES_DISPENSER_MINIMUM) {
      if (neededCycles == 0) {
        return stalePrefix # "Everything is fine. All the registered canisters has enough cycles. CyclesDispenser has " #
        Float.toText(Float.fromInt(cyclesDispenserBalance) / 1000000000000) # "T cycles.";
      } else {
        if (neededCycles + CYCLES_DISPENSER_MINIMUM > cyclesDispenserBalance) {
          return stalePrefix # "There is a problem. CyclesDispenser has " # Float.toText(Float.fromInt(cyclesDispenserBalance) / 1000000000000) # "T cycles. It needs at least " #
          Float.toText((Float.fromInt(neededCycles) / 1000000000000) +20) # "T cycles to continue its function.";
        } else {
          return stalePrefix # "Everything is fine. Even some of the registered canisters needs cycles, there're enough cycles to top them up. It'll be sorted out in 4 minutes after the timer method works. CyclesDispenser has " #
          Float.toText(Float.fromInt(cyclesDispenserBalance) / 1000000000000) # "T cycles.";
        };
      };
    } else {
      if (neededCycles == 0) {
        return stalePrefix # "There's a problem! Even though all the registered canisters has enough cycles for now, CyclesDispenser canister needs at least 20T cycles to continue its function.";
      } else {
        return stalePrefix # "There's a problem! There're some canisters below the minimum threshold and CyclesDispenser has not enough cycles the top-up. " #
        "CyclesDispenser's current balance is " # Float.toText(Float.fromInt(cyclesDispenserBalance) / 1000000000000) # "T cycles. " # "It needs " #
        Float.toText(Float.fromInt((neededCycles + Nat.sub(CYCLES_DISPENSER_MINIMUM, cyclesDispenserBalance)) / 1000000000000 + 20)) # "T cycles to continue its function.";
      };
    };
  };

  // #endregion

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
    Versions.CYCLESDISPENSER_VERSION;
  };

  system func preupgrade() {
    // transfer canister state to swap variables so data is not lost during upgrade
    Debug.print("CyclesDispenser->preupgrade");

    canisterIdToMinimumAmountOfCyclesEntries := Iter.toArray(canisterIdToMinimumAmountOfCyclesHashmap.entries());
    canisterIdToTopUpAmountEntries := Iter.toArray(canisterIdToTopUpAmountHashmap.entries());
    canisterIdToBalanceEntries := Iter.toArray(canisterIdToBalanceHashmap.entries());
    canisterIdToTopUpIdsEntries := Iter.toArray(canisterIdToTopUpIdsHashmap.entries());
    canisterIdToIsStorageBucketEntries := Iter.toArray(canisterIdToIsStorageBucketHashmap.entries());
    canisterIdToConsecutiveFailuresEntries := Iter.toArray(canisterIdToConsecutiveFailuresHashmap.entries());
    canisterIdToLastFailureTimeEntries := Iter.toArray(canisterIdToLastFailureTimeHashmap.entries());
    topUpIdToCanisterIdEntries := Iter.toArray(topUpIdToCanisterIdHashmap.entries());
    topUpIdToTimeEntries := Iter.toArray(topUpIdToTimeHashmap.entries());
    topUpIdToAmountEntries := Iter.toArray(topUpIdToAmountHashmap.entries());
    topUpIdToCanisterBalanceBeforeEntries := Iter.toArray(topUpIdToCanisterBalanceBeforeHashmap.entries());
    topUpIdToCanisterBalanceAfterEntries := Iter.toArray(topUpIdToCanisterBalanceAfterHashmap.entries());

  };

  system func postupgrade() {
    Debug.print(debug_show ("CyclesDispenser->postupgrade"));

    canisterIdToMinimumAmountOfCyclesEntries := [];
    canisterIdToTopUpAmountEntries := [];
    canisterIdToBalanceEntries := [];
    canisterIdToTopUpIdsEntries := [];
    canisterIdToIsStorageBucketEntries := [];
    canisterIdToConsecutiveFailuresEntries := [];
    canisterIdToLastFailureTimeEntries := [];
    topUpIdToCanisterIdEntries := [];
    topUpIdToTimeEntries := [];
    topUpIdToAmountEntries := [];
    topUpIdToCanisterBalanceBeforeEntries := [];
    topUpIdToCanisterBalanceAfterEntries := [];
  };

  //#region timer and cycles management
  stable var lastTimerCalled : Int = 0;
  stable var cyclesBalanceWhenTimerIsCalledLastTime = 0;

  public shared query func getLatestTimerCall() : async (Text, Text) {
    (Int.toText(lastTimerCalled), Nat.toText(cyclesBalanceWhenTimerIsCalledLastTime));
  };

  public func acceptCycles() : async () {
    let available = Cycles.available();
    let accepted = Cycles.accept(available);
    assert (accepted == available);
  };

  public shared query func availableCycles() : async Nat {
    Cycles.balance();
  };

  system func timer(setGlobalTimer : Nat64 -> ()) : async () {
    Debug.print("CyclesDispenser-> timer");

    try {
      ignore checkAllRegisteredCanisters();
    } catch (e) {
      Debug.print("CyclesDispenser -> checkAllRegisteredCanisters method failed.");
    };

    try {
      ignore checkStorageBucketCanisters();
    } catch (e) {
      Debug.print("CyclesDispenser -> checkStorageBucketCanisters method failed.");
    };

    let now = Time.now();
    lastTimerCalled := now;

    cyclesBalanceWhenTimerIsCalledLastTime := Cycles.balance();

    let next = Nat64.fromIntWrap(now) + 240_000_000_000;
    setGlobalTimer(next); // absolute time in nanoseconds
  };
};