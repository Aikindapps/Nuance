import Char "mo:base/Char";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";

import Types "./types";
import Prelude "mo:base/Prelude";
import Canistergeek "../canistergeek/canistergeek";
import StorageState "./storage/storageState";
import StorageSolution "./storage/storage";
import Cycles "mo:base/ExperimentalCycles";
import IC "./ic.types";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Versions "../shared/versions";
import ENV "../shared/env";
import U "../shared/utils";
import TypesStandards "../shared/TypesStandards";


// actor Storage {
shared ({caller = initializer}) actor class Storage () = this {
    let Unauthorized = "Unauthorized";
    private let ic : IC.Self = actor "aaaaa-aa";
    stable var globalIdMapEntries: [(Text, Nat)] = [];
    let initCapacity = 0;
    func isEq(x: Text, y: Text): Bool { x == y };

    //var globalIdMap = HashMap.HashMap<Text, Nat>(5000, Text.equal, Text.hash);
    var globalIdMap = HashMap.fromIter<Text, Nat>(globalIdMapEntries.vals(), initCapacity, isEq, Text.hash);

    //icrc standards types
    type SupportedStandard = TypesStandards.SupportedStandard;
    type Icrc28TrustedOriginsResponse = TypesStandards.Icrc28TrustedOriginsResponse;    

    let canistergeekMonitor = Canistergeek.Monitor();
    stable var _canistergeekMonitorUD: ? Canistergeek.UpgradeData = null;

    stable var storageStateStable  = StorageState.emptyStableState();
    var storageSolution = StorageSolution.StorageSolution(storageStateStable, initializer, initializer);

    public shared ({caller}) func addStorageBucket (canisterId: Text) : async Result.Result<(), Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err("Unauthorized");
        };

        switch (await storageSolution.addStorageBucket(Principal.fromText(canisterId))) {
            case (ok) {
                return #ok();
            };
        };
        #ok();
    };

    //SNS
    public type Validate =  {
        #Ok : Text;
        #Err : Text;
    };

public shared ({ caller }) func validate(input : Any) : async Validate {
        if (isAdmin(caller)) {
            return #Ok("success");
        }else {

    return #Err("Cannot use this method anonymously.");}
    };
    //#region Security Management
    
    stable var admins : List.List<Text> = List.fromArray(ENV.PLATFORM_OPERATORS);
    stable var platformOperators : List.List<Text> = List.fromArray(ENV.PLATFORM_OPERATORS);
    stable var cgusers : List.List<Text> = List.nil<Text>();

    public func acceptCycles() : async () {
        let available = Cycles.available();
        let accepted = Cycles.accept<system>(available);
        assert (accepted == available);
    };

    public shared query func availableCycles() : async Nat {
        Cycles.balance()
    };

    func isAnonymous(caller : Principal) : Bool {
        Principal.equal(caller, Principal.fromText("2vxsx-fae"));
    };

    private func isAdmin(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        U.arrayContains(ENV.PLATFORM_OPERATORS, c);
    };

    public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
        if (isAnonymous(caller)) {
        return #err("Cannot use this method anonymously.");
        };

        #ok(ENV.STORAGE_CANISTER_ADMINS);
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


    public shared query ({ caller }) func getCgUsers() : async Result.Result<[Text], Text> {
         if (isAnonymous(caller)) {
            return #err("Anonymous cannot call this method");
        };

        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };

        #ok(List.toArray(cgusers));
    };

    func isCgUser(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        var exists = List.find<Text>(cgusers, func(val: Text) : Bool { val == c });
        exists != null;
    };

    public shared ({ caller }) func registerCgUser(id : Text) : async Result.Result<(), Text> {
         if (isAnonymous(caller)) {
            return #err("Anonymous cannot call this method");
        };

        canistergeekMonitor.collectMetrics();
        if (List.size<Text>(cgusers) > 0 and not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err(Unauthorized);
        };

        if (not List.some<Text>(cgusers, func(val: Text) : Bool { val == id })) {
            cgusers := List.push<Text>(id, cgusers);
        };

        #ok();
    };

    public shared ({ caller }) func unregisterCgUser(id : Text) : async Result.Result<(), Text> {
         if (isAnonymous(caller)) {
            return #err("Anonymous cannot call this method");
        };

        canistergeekMonitor.collectMetrics();
        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err(Unauthorized);
        };
        cgusers := List.filter<Text>(cgusers, func(val: Text) : Bool { val != id });
        #ok();
    };



    // admin function to retire any data canister for writing. It will still be used for  reading
    public shared({caller}) func retiredDataCanisterIdForWriting(canisterId: Text) : async Result.Result<(), Text> {
         if (isAnonymous(caller)) {
            return #err("Anonymous cannot call this method");
        };

        canistergeekMonitor.collectMetrics();
        if (not isAdmin(caller)) {
            return #err(Unauthorized);
        };
        storageSolution.retiredDataCanisterId(canisterId);
        #ok();
    };

    public shared({caller}) func getAllDataCanisterIds() : async Result.Result<([Principal], [Text]), Text>  {
         if (isAnonymous(caller)) {
            return #err("Anonymous cannot call this method");
        };

        canistergeekMonitor.collectMetrics();
        let allDataCanisterId = storageSolution.getAllDataCanisterIds();
        let retired = storageSolution.getRetiredDataCanisterIdsStable();
        #ok((allDataCanisterId, retired));
    };
    //#endregion

    public shared({caller}) func getNewContentId() : async Result.Result<Text, Text> {
        canistergeekMonitor.collectMetrics();
        /*if (isAnonymous(caller)) {
            return #err(Unauthorized);
        };*/
        #ok(generateId(caller, "image"));
    };

    public shared({caller}) func uploadBlob(content : Types.Content) : async Result.Result<Text, Text>  {
        canistergeekMonitor.collectMetrics();
        /*if (isAnonymous(caller)) {
            return #err(Unauthorized);
        };*/
        let dataCanisterId = await storageSolution.putBlobsInDataCanister(content.contentId, content.chunkData, content.offset, content.totalChunks, content.mimeType, content.contentSize);
        #ok(dataCanisterId);
    };

    // Generates a semi unique ID
   func generateId(caller: Principal, category: Text): Text {
        var count : Nat = 5000;
        switch(globalIdMap.get(category)){
        case(?result){
            count := result;
        };
        case(_) ();
        };
        count := count + 1;
        globalIdMap.put(category, count);
        return Principal.toText(caller) # "-" # category # "-" # (Nat.toText(count));
    };
   

    public query ({caller}) func getCanisterMetrics(parameters: Canistergeek.GetMetricsParameters): async ?Canistergeek.CanisterMetrics {
        if (not isCgUser(caller) and not isAdmin(caller))  {
            Prelude.unreachable();
        };
        Debug.print("Storage->getCanisterMetrics: The method getCanistermetrics was called from the UI successfully");
        canistergeekMonitor.getMetrics(parameters);
    };

    public shared ({caller}) func collectCanisterMetrics(): async () {
         if (isAnonymous(caller)) {
            return;
        };
        if (not isCgUser(caller) and not isAdmin(caller))  {
            Prelude.unreachable();
        };
        canistergeekMonitor.collectMetrics();
        Debug.print("Storage->collectCanisterMetrics: The method collectCanisterMetrics was called from the UI successfully");
    };

    //upgrade Storage canisters
    //holds wasm for upgrade
    private stable var wasmChunks : Blob = Blob.fromArray([]);

    //adds wasm chunk to wasmChunks
    public shared ({ caller }) func addWasmChunk(chunk : Blob) : async Result.Result<(), Text> {

        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err("Unauthorized");
        };

        wasmChunks := Blob.fromArray(Array.append(Blob.toArray(wasmChunks), Blob.toArray(chunk)));
        #ok();
    };

    public shared ({ caller }) func getWasmChunks() : async Result.Result<Blob, Text> {

        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err("Unauthorized");
        };
        #ok(wasmChunks);
    };

    public shared ({ caller }) func upgradeBucket(canisterId : Text, arg : [Nat8]) : async Result.Result<(), Text> {

        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        let wasm = wasmChunks;
        if (not isAdmin(caller) and Principal.fromActor(this) != caller and not isPlatformOperator(caller)) {

            return #err("Unauthorized");
        };
        switch (await ic.install_code { arg = arg; wasm_module = wasm; mode = #upgrade; canister_id = Principal.fromText(canisterId) }) {
            
            case ((_)) {
                Debug.print("Storage->upgradeBucket: Upgraded bucket: " # canisterId);
                #ok();
            };
        };
    };

    public shared ({ caller }) func resetWasmChunks() {
        if (isAnonymous(caller)) {
            return;
        };

        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            return;
        };
        wasmChunks := Blob.fromArray([]);
    };
    public shared ({ caller }) func upgradeAllBuckets(canisterId : Text, arg : [Nat8]) : async Result.Result<(), Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err("Unauthorized");
        };
        
        let canisterIds = storageSolution.getAllDataCanisterIds();
        //TODO: add indexing for large number of buckets

        //need to get all buckets from storage to
        for (bucketCanisterId in canisterIds.vals()) {
            Debug.print("Storage->upgradeAllBuckets: Upgrading bucket: " # Principal.toText(bucketCanisterId));
            switch (await upgradeBucket(Principal.toText(bucketCanisterId), arg)) {
                case (ok) {
                    Debug.print("Storage->upgradeAllBuckets: Upgraded bucket: " # Principal.toText(bucketCanisterId));
                    //TODO: add logging
                };
            };
        };

        #ok();
    };

    public query func idQuick() : async Principal {
        return Principal.fromActor(this);
    };

    public shared query func getCanisterVersion() : async Text{
        Versions.STORAGE_VERSION;
    };

    //#region trusted origin

    public query func icrc10_supported_standards() : async [SupportedStandard] {
        return ENV.supportedStandards;
    };

    public shared func icrc28_trusted_origins() : async Icrc28TrustedOriginsResponse{
        return {
            trusted_origins= ENV.getTrustedOrigins();
        }
    };

    // #endregion

    system func preupgrade() {
        _canistergeekMonitorUD := ? canistergeekMonitor.preupgrade();
        storageStateStable := storageSolution.getStableState();
        globalIdMapEntries := Iter.toArray(globalIdMap.entries());

    };

    system func postupgrade() {
        canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
        _canistergeekMonitorUD := null;
        storageSolution := StorageSolution.StorageSolution(storageStateStable, initializer, Principal.fromActor(this));
        storageStateStable := StorageState.emptyStableState();
        globalIdMapEntries := [];
    };
}

