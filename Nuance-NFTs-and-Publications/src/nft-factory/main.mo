import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Error "mo:base/Error";

import IC "./ic.types";

import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import List "mo:base/List";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import EXTNFT "../ext_v2/v2";
import Prim "mo:prim";
import Versions "../shared/versions";
import U "../shared/utils";
import ENV "../shared/env";

actor NftFactory {

    var initCapacity = 0;

    stable var admins : List.List<Text> = List.nil<Text>();
    stable var platformOperators : List.List<Text> = List.nil<Text>();

    stable var publicationCanisterIdsEntries : [(Text, Text)] = [];

    //key: publisher handle, value: canister id
    var publicationCanisterIdsHashmap = HashMap.fromIter<Text, Text>(publicationCanisterIdsEntries.vals(), initCapacity, Text.equal, Text.hash);
    private let ic : IC.Self = actor "aaaaa-aa";

    //whitelist the publishers to allow create NFT canisters
    public shared ({ caller }) func whitelistPublication(handle : Text, canisterId : Text) : async Result.Result<(Text, Text), Text> {
        if (not isAdmin(caller)) {
            return #err("Unauthorized!");
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        publicationCanisterIdsHashmap.put(handle, canisterId);
        return #ok(handle, canisterId);
    };

    //publications can call this method to create an nft canister and get the canister id of the NFT canister
    public shared ({ caller }) func createNftCanister() : async Result.Result<Text, Text> {
        if (not isAdmin(caller) and not isWhitelisted(caller) and not isPlatformOperator(caller)) {
            return #err("Unauthorized!");
        };
        ignore U.logMetrics("createNftCanister", Principal.toText(caller));

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        Cycles.add(10_000_000_000_000);
        let nftCanister = await EXTNFT.EXTNFT(caller);

        await nftCanister.acceptCycles();

        return #ok(Principal.toText(Principal.fromActor(nftCanister)));
    };

    //returns whitelisted publishers
    public shared query func getWhitelistedPublishers() : async [(Text, Text)] {
        Iter.toArray(publicationCanisterIdsHashmap.entries());
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


    private func isWhitelisted(caller : Principal) : Bool {
        let principal = Principal.toText(caller);
        for (whitelisted in publicationCanisterIdsHashmap.vals()) {
            if (whitelisted == principal) {
                return true;
            };
        };
        return false;

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

    //#region memory management
    stable var MAX_MEMORY_SIZE = 380000000;

    public shared ({ caller }) func setMaxMemorySize(newValue : Nat) : async Result.Result<Nat, Text> {

        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err("Unauthorized");
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
        Versions.NFTFACTORY_VERSION;
    };

    system func preupgrade() {
        publicationCanisterIdsEntries := Iter.toArray(publicationCanisterIdsHashmap.entries());
    };

    system func postupgrade() {
        publicationCanisterIdsEntries := [];
    };

};
