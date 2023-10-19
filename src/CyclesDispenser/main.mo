import List "mo:base/List";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
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

actor CyclesDispenser {
  let maxHashmapSize = 1000000;

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
    topUps : [TopUp];
  };

  public type AddCanisterModel = {
    canisterId : Text;
    minimumThreshold : Nat;
    topUpAmount : Nat;
  };

  public type CheckCanisterBalanceResponse = {
    #AlreadyToppedUp;
    #UnsufficientCycles;
    #Success : TopUp;
  };

  public type TimeRange = {
    #day : Nat;
    #hour : Nat;
  };

  public type GeneralActorType = actor {
    availableCycles : () -> async Nat;
    acceptCycles : () -> async ();
  };

  public type AdminActorType = actor {
    getAdmins : () -> async [Text];
    registerAdmin : (Text) -> async Result.Result<(), Text>;
    unregisterAdmin : (Text) -> async Result.Result<(), Text>;
    getPlatformOperators : () -> async [Text];
    registerPlatformOperator : (Text) -> async Result.Result<(), Text>;
    unregisterPlatformOperator : (Text) -> async Result.Result<(), Text>;
  };

  stable var admins : List.List<Text> = List.nil<Text>();
  stable var platformOperators : List.List<Text> = List.nil<Text>();
  stable var cgusers : List.List<Text> = List.nil<Text>();
  stable var nuanceCanisters : List.List<Text> = List.nil<Text>();
  stable var topUpId : Nat = 0;
  stable var CYCLES_DISPENSER_MINIMUM = 10_000_000_000_000;

  stable var canisterIdToMinimumAmountOfCyclesEntries : [(Text, Nat)] = [];
  stable var canisterIdToTopUpAmountEntries : [(Text, Nat)] = [];
  stable var canisterIdToBalanceEntries : [(Text, Nat)] = [];
  stable var canisterIdToTopUpIdsEntries : [(Text, [Text])] = [];

  stable var topUpIdToCanisterIdEntries : [(Text, Text)] = [];
  stable var topUpIdToTimeEntries : [(Text, Int)] = [];
  stable var topUpIdToAmountEntries : [(Text, Nat)] = [];
  stable var topUpIdToCanisterBalanceBeforeEntries : [(Text, Nat)] = [];
  stable var topUpIdToCanisterBalanceAfterEntries : [(Text, Nat)] = [];

  //registered canister hashmaps
  var canisterIdToMinimumAmountOfCyclesHashmap = HashMap.fromIter<Text, Nat>(canisterIdToMinimumAmountOfCyclesEntries.vals(), maxHashmapSize, Text.equal, Text.hash);
  var canisterIdToTopUpAmountHashmap = HashMap.fromIter<Text, Nat>(canisterIdToTopUpAmountEntries.vals(), maxHashmapSize, Text.equal, Text.hash);
  var canisterIdToBalanceHashmap = HashMap.fromIter<Text, Nat>(canisterIdToBalanceEntries.vals(), maxHashmapSize, Text.equal, Text.hash);
  var canisterIdToTopUpIdsHashmap = HashMap.fromIter<Text, [Text]>(canisterIdToTopUpIdsEntries.vals(), maxHashmapSize, Text.equal, Text.hash);

  //logged top-ups hashmaps
  var topUpIdToCanisterIdHashmap = HashMap.fromIter<Text, Text>(topUpIdToCanisterIdEntries.vals(), maxHashmapSize, Text.equal, Text.hash);
  var topUpIdToTimeHashmap = HashMap.fromIter<Text, Int>(topUpIdToTimeEntries.vals(), maxHashmapSize, Text.equal, Text.hash);
  var topUpIdToAmountHashmap = HashMap.fromIter<Text, Nat>(topUpIdToAmountEntries.vals(), maxHashmapSize, Text.equal, Text.hash);
  var topUpIdToCanisterBalanceBeforeHashmap = HashMap.fromIter<Text, Nat>(topUpIdToCanisterBalanceBeforeEntries.vals(), maxHashmapSize, Text.equal, Text.hash);
  var topUpIdToCanisterBalanceAfterHashmap = HashMap.fromIter<Text, Nat>(topUpIdToCanisterBalanceAfterEntries.vals(), maxHashmapSize, Text.equal, Text.hash);

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

    if (not isAdmin(caller) and not isNuanceCanister(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    //check if the given canister contains the availableCycles method and the canister id is valid
    try {
      let addingCanister : GeneralActorType = actor (canister.canisterId);
      let balance = await addingCanister.availableCycles();
      canisterIdToMinimumAmountOfCyclesHashmap.put(canister.canisterId, canister.minimumThreshold);
      canisterIdToTopUpAmountHashmap.put(canister.canisterId, canister.topUpAmount);
      canisterIdToBalanceHashmap.put(canister.canisterId, balance);
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
    if (not isAdmin(caller) and not isNuanceCanister(caller)) {
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
    #ok();
  };

  //checks the cycles balance of the given canister - private method
  private func checkCanisterBalance(canisterId : Text) : async CheckCanisterBalanceResponse {
    Debug.print("CyclesDispenser -> checkCanisterBalance: " # canisterId);
    let registeredCanister = buildRegisteredCanister(canisterId);
    let registeredCanisterActor : GeneralActorType = actor (canisterId);

    let balance = await registeredCanisterActor.availableCycles();
    canisterIdToBalanceHashmap.put(canisterId, balance);
    let cyclesDispenserBalance = Cycles.balance();

    // if there're not enough cycles to add, don't add cycles
    if (Nat.sub(cyclesDispenserBalance, registeredCanister.topUpAmount) < CYCLES_DISPENSER_MINIMUM) {
      return #UnsufficientCycles;
    };

    if (balance < registeredCanister.minimumThreshold) {
      //below the threshold and the CyclesDispenser has enough cycles

      //try to add cycles
      try {
        Cycles.add(registeredCanister.topUpAmount);
        await registeredCanisterActor.acceptCycles();
        //if here, it went well, store the data in hashmaps
        let topUpId = getNextTopUpId();
        let newBalance = await registeredCanisterActor.availableCycles();

        //put the new balance
        canisterIdToBalanceHashmap.put(canisterId, newBalance);

        //add the top-up id to canister's top-ups
        let existingTopUpIds = List.fromArray(U.safeGet(canisterIdToTopUpIdsHashmap, canisterId, []));
        let newTopUpIds = List.toArray(List.push(topUpId, existingTopUpIds));
        canisterIdToTopUpIdsHashmap.put(canisterId, newTopUpIds);

        //put top-up data to hashmaps
        topUpIdToCanisterIdHashmap.put(topUpId, canisterId);
        topUpIdToTimeHashmap.put(topUpId, Time.now());
        topUpIdToAmountHashmap.put(topUpId, registeredCanister.topUpAmount);
        topUpIdToCanisterBalanceBeforeHashmap.put(topUpId, balance);
        topUpIdToCanisterBalanceAfterHashmap.put(topUpId, newBalance);

        return #Success(buildTopUp(topUpId));
      } catch (e) {
        //if here, there was an error during adding the cycles, don't do anything
        return #UnsufficientCycles;
      };
    };
    return #AlreadyToppedUp;
  };

  private func checkCanisters(canisterIds : [Text]) : async () {
    for (canisterId in canisterIds.vals()) {
      ignore checkCanisterBalance(canisterId);
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
        };
      };
      case (null) {
        return #err("Given canister id is not registered yet.");
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

    let MINUTE = 60000000000;

    if (Time.now() - lastTimerCalled > 10 * MINUTE) {
      return "There's a problem! Timer method is not working for more than 10 minutes! CyclesDispenser has " #
      Float.toText(Float.fromInt(cyclesDispenserBalance) / 1000000000000) # "T cycles.";
    };

    if (cyclesDispenserBalance > CYCLES_DISPENSER_MINIMUM) {
      if (neededCycles == 0) {
        return "Everything is fine. All the registered canisters has enough cycles. CyclesDispenser has " #
        Float.toText(Float.fromInt(cyclesDispenserBalance) / 1000000000000) # "T cycles.";
      } else {
        if (neededCycles + CYCLES_DISPENSER_MINIMUM > cyclesDispenserBalance) {
          return "There is a problem. CyclesDispenser has " # Float.toText(Float.fromInt(cyclesDispenserBalance) / 1000000000000) # "T cycles. It needs at least " #
          Float.toText((Float.fromInt(neededCycles) / 1000000000000) +20) # "T cycles to continue its function.";
        } else {
          return "Everything is fine. Even some of the registered canisters needs cycles, there're enough cycles to top them up. It'll be sorted out in 4 minutes after the timer method works. CyclesDispenser has " #
          Float.toText(Float.fromInt(cyclesDispenserBalance) / 1000000000000) # "T cycles.";
        };
      };
    } else {
      if (neededCycles == 0) {
        return "There's a problem! Even though all the registered canisters has enough cycles for now, CyclesDispenser canister needs at least 20T cycles to continue its function.";
      } else {
        return "There's a problem! There're some canisters below the minimum threshold and CyclesDispenser has not enough cycles the top-up. " #
        "CyclesDispenser's current balance is " # Float.toText(Float.fromInt(cyclesDispenserBalance) / 1000000000000) # "T cycles. " # "It needs " #
        Float.toText(Float.fromInt((neededCycles + Nat.sub(CYCLES_DISPENSER_MINIMUM, cyclesDispenserBalance)) / 1000000000000 + 20)) # "T cycles to continue its function.";
      };
    };
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
    Versions.CYCLESDISPENSER_VERSION;
  };

  system func preupgrade() {
    // transfer canister state to swap variables so data is not lost during upgrade
    Debug.print("CyclesDispenser->preupgrade");

    canisterIdToMinimumAmountOfCyclesEntries := Iter.toArray(canisterIdToMinimumAmountOfCyclesHashmap.entries());
    canisterIdToTopUpAmountEntries := Iter.toArray(canisterIdToTopUpAmountHashmap.entries());
    canisterIdToBalanceEntries := Iter.toArray(canisterIdToBalanceHashmap.entries());
    canisterIdToTopUpIdsEntries := Iter.toArray(canisterIdToTopUpIdsHashmap.entries());
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
      Debug.print("CyclesDispenser -> checkAllRegisteredCanisters method was trapped.");
    };

    let now = Time.now();
    lastTimerCalled := now;

    cyclesBalanceWhenTimerIsCalledLastTime := Cycles.balance();

    let next = Nat64.fromIntWrap(now) + 240_000_000_000;
    setGlobalTimer(next); // absolute time in nanoseconds
  };
};
