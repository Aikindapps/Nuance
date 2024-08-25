import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Error "mo:base/Error";

import IC "./ic.types";

import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import List "mo:base/List";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import EXTNFT "../ext_v2/v2";
import Prim "mo:prim";
import Versions "../../../src/shared/versions";
import U "../../../src/shared/utils";
import ENV "../../../src/shared/env";
import CanisterDeclarations "../../../src/shared/CanisterDeclarations";
import Buffer "mo:base/Buffer";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Debug "mo:base/Debug";


actor NftFactory {

    var initCapacity = 0;

    stable var admins : List.List<Text> = List.nil<Text>();
    stable var platformOperators : List.List<Text> = List.nil<Text>();

    stable var allNuanceNftCanisterIds = List.nil<(Text, Text)>();

    private let ic : IC.Self = actor "aaaaa-aa";

    public type InitNftCanisterData = CanisterDeclarations.InitNftCanisterData;

    func isNftFactoryCanister(caller : Principal) : Bool {
        Principal.equal(caller, Principal.fromActor(NftFactory));
    };

   

    //publications can call this method to create an nft canister and get the canister id of the NFT canister
    public shared ({ caller }) func createNftCanister(initData: InitNftCanisterData) : async Result.Result<Text, Text> {
        var isCallerBucketCanister = false;
        let allBucketCanisters = await CanisterDeclarations.getPostCoreCanister().getBucketCanisters();
        for(bucketCanisterEntry in allBucketCanisters.vals()){
            if(Principal.toText(caller) == bucketCanisterEntry.0){
                isCallerBucketCanister := true;
            }
        };
        if (not isAdmin(caller) and not isPlatformOperator(caller) and not isCallerBucketCanister) {
            return #err("Unauthorized!");
        };
        ignore U.logMetrics("createNftCanister", Principal.toText(caller));

        Cycles.add<system>(10_000_000_000_000);
        let nftCanister = await EXTNFT.EXTNFT();

        await nftCanister.acceptCycles();



        //if here, canister created
        //pass the initial data
        switch(await nftCanister.setConfigData(initData)) {
            case(#ok()) {
                //canister created, initial data passed to the canister successfully
                //before returning the canister id register the canister to the CyclesDispenser first

                let canisterId = Principal.toText(Principal.fromActor(nftCanister));

                switch(await CanisterDeclarations.getCyclesDispenserCanister().addCanister({
                    canisterId;
                    isStorageBucket = false;
                    minimumThreshold = 10_000_000_000_000; 
                    topUpAmount = 5_000_000_000_000;
                })) {
                    case(#ok(value)) {
                        //everything worked fine
                        //just return the canister id
                        allNuanceNftCanisterIds := List.push<(Text, Text)>((initData.postId, canisterId), allNuanceNftCanisterIds);
                        return #ok(canisterId)
                    };
                    case(#err(error)) {
                        //there was an error while adding canister to the cyclesDispenser (Not possible either)
                        return #err(error)
                    };
                };

                
            };
            case(#err(error)) {
                //not possible but still return the error
                return #err(error)
            };
        };

        
    };

    public shared ({caller}) func stop_canister(canisterId: Text) : async Result.Result<(), Text> {
        if(not isPlatformOperator(caller)){
            return #err("Unauthorized.")
        };
        
        return #ok(await ic.stop_canister({
            canister_id=Principal.fromText(canisterId)
        }));
    };

    public shared ({caller}) func setExtCanisterConfigData(canisterId: Text, configData: InitNftCanisterData) : async Result.Result<(), Text> {
        if(isAdmin(caller) or isPlatformOperator(caller)){
            let nftCanister = CanisterDeclarations.getExtCanister(canisterId);
            return await nftCanister.setConfigData(configData);
        }
        else{
            return #err("Unauthorized.")
        }
    };

    public shared query func getAllNftCanisterIds() : async [(Text, Text)] {
        List.toArray(allNuanceNftCanisterIds)
    };

  //holds wasm for upgrade
  private stable var wasmChunks : Blob = Blob.fromArray([]);

  //adds wasm chunk to wasmChunks
  public shared ({ caller }) func addWasmChunk(chunk : Blob) : async Result.Result<(), Text> {

    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    // if (not isThereEnoughMemoryPrivate()) {
    //   return #err("Canister reached the maximum memory threshold. Please try again later.");
    // };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err("Unauthorized Caller")
    };

    wasmChunks := Blob.fromArray(Array.append(Blob.toArray(wasmChunks), Blob.toArray(chunk)));
    #ok();
  };

  public shared ({ caller }) func getWasmChunks() : async Result.Result<Blob, Text> {

    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err("Unauthorized Caller")
    };
    #ok(wasmChunks);
  };

  public shared ({ caller }) func upgradeBucket(canisterId : Text, arg : [Nat8]) : async Result.Result<(), Text> {

    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    let wasm = wasmChunks;
    if (not isAdmin(caller) and not isPlatformOperator(caller) and not isNftFactoryCanister(caller)) {
      return #err("Unauthorized caller");
    };
     Debug.print("Upgrading canister: " # canisterId # " with wasm size: " # debug_show(Blob.toArray(wasm)));
    switch (await ic.install_code { arg = arg; wasm_module = wasm; mode = #upgrade; canister_id = Principal.fromText(canisterId) }) {
       
      case ((_)) {
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

  // 👋 if you need to clear buckets for local test, reactivate this function
  // public shared ({caller}) func temporaryDeleteAllBuckets() : async Result.Result<(), Text> {
  //     if (not isAdmin(caller)) {
  //         return #err(Unauthorized);
  //     };
  //     let bucketCanisterIdsEntries =  Iter.toArray(bucketCanisterIdsHashMap.entries());
  //     for (bucketCanisterId in bucketCanisterIdsEntries.vals()) {
  //         await IC.IC.stop_canister{canister_id = Principal.fromText(bucketCanisterId.1)};
  //         switch (await IC.IC.delete_canister{canister_id = Principal.fromText(bucketCanisterId.1)}) {
  //             case(_) {
  //                 bucketCanisterIdsHashMap.delete(bucketCanisterId.0);
  //             };
  //         };
  //     };
  //     #ok();
  // };

  public shared ({ caller }) func getAllBuckets() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    var canisterBuffer = Buffer.Buffer<Text>(1);

    let bucketCanisters = await getAllNftCanisterIds();


    for (bucketCanisterId in Iter.fromArray(bucketCanisters)) {
      canisterBuffer.add(bucketCanisterId.1);
    };
    #ok(Buffer.toArray(canisterBuffer));
  };

  public shared ({ caller }) func upgradeAllBuckets(canisterId : Text, arg : [Nat8]) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err("Unauthorized caller");
    };

    //TODO: add indexing for large number of buckets

    for (bucketCanisterId in Iter.fromArray(List.toArray(allNuanceNftCanisterIds))) {
      switch (await upgradeBucket(bucketCanisterId.1, arg)) {
        case (ok) {
          //TODO: add logging
          Debug.print("Upgrading bucket canister: " # bucketCanisterId.1);
        };
      };
    };

    #ok();
  };


    private func isAnonymous(caller : Principal) : Bool {
        Principal.equal(caller, Principal.fromText("2vxsx-fae"));
    };

    private func isAdmin(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        U.arrayContains(ENV.NFT_FACTORY_CANISTER_ADMINS, c);
    };

    public shared query ({ caller }) func getAdmins() : async Result.Result<List.List<Text>, Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        #ok(List.fromArray(ENV.NFT_FACTORY_CANISTER_ADMINS));
    };

    private func isPlatformOperator(caller : Principal) : Bool {
        ENV.isPlatformOperator(caller)
    };

    public shared query func getPlatformOperators() : async List.List<Text> {
        List.fromArray(ENV.PLATFORM_OPERATORS);
    };

    private func idInternal() : Text {
        Principal.toText(Principal.fromActor(NftFactory));
    };

    public func acceptCycles() : async () {
        let available = Cycles.available();
        let accepted = Cycles.accept<system>(available);
        assert (accepted == available);
    };

    public shared query func availableCycles() : async Nat {
        Cycles.balance();
    };

    public shared query func getCanisterVersion() : async Text {
        Versions.NFTFACTORY_VERSION;
    };

};
