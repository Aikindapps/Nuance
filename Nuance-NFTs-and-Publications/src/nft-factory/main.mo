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


actor NftFactory {

    var initCapacity = 0;

    stable var admins : List.List<Text> = List.nil<Text>();
    stable var platformOperators : List.List<Text> = List.nil<Text>();

    stable var allNuanceNftCanisterIds = List.nil<(Text, Text)>();

    private let ic : IC.Self = actor "aaaaa-aa";

    public type InitNftCanisterData = CanisterDeclarations.InitNftCanisterData;

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

        Cycles.add(10_000_000_000_000);
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
        let accepted = Cycles.accept(available);
        assert (accepted == available);
    };

    public shared query func availableCycles() : async Nat {
        Cycles.balance();
    };

    public shared query func getCanisterVersion() : async Text {
        Versions.NFTFACTORY_VERSION;
    };

};
