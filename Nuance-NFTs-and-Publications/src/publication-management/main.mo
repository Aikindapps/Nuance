import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Error "mo:base/Error";

import IC "./ic.types";

import Publisher "../Publisher/main";
import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import List "mo:base/List";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Types "types";
import Buffer "mo:base/Buffer";
import U "../shared/utils";
import Char "mo:base/Char";
import Prim "mo:prim";
import CanisterDeclarations "../shared/CanisterDeclarations";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Versions "../shared/versions";
import ENV "../shared/env";

actor class Management() = this {

    var maxHashmapSize = 1000000;

    stable var admins : List.List<Text> = List.nil<Text>();
    stable var platformOperators : List.List<Text> = List.nil<Text>();

    stable var publicationCanisterIdsEntries : [(Text, Text)] = [];

    //key: publisher handle, value: canister id
    var publicationCanisterIdsHashmap = HashMap.fromIter<Text, Text>(publicationCanisterIdsEntries.vals(), maxHashmapSize, Text.equal, Text.hash);
    private let ic : IC.Self = actor "aaaaa-aa";

    private func isAnonymous(caller : Principal) : Bool {
        Principal.equal(caller, Principal.fromText("2vxsx-fae"));
    };

    type RegisterUserReturn = Types.RegisterUserReturn;

    //should be called once to initialize the canister
    public shared ({ caller }) func initManagementCanister() : async RegisterUserReturn {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err("Unauthorized!");
        };
        let UserCanister = CanisterDeclarations.getUserCanister();
        return await UserCanister.registerUser("publication-factory", "management canister", "");
    };

    public shared ({ caller }) func initializeCanister(postCoreCai : Text, userCai : Text, nftFactoryCai : Text) : async Result.Result<Text, Text> {
        #err("Deprecated function.")
    };

    //register the publishers created before the management canisters
    public shared ({ caller }) func registerExistingPublisher(handle : Text, canisterId : Text) : async Result.Result<(Text, Text), Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (not isAdmin(caller)) {
            return #err("Unauthorized!");
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        let canisterIdValidation = Principal.fromText(canisterId);

        publicationCanisterIdsHashmap.put(handle, canisterId);
        //ensure that publication canisters are trusted canisters
        await ensurePublishersAreTrustedCanisters();
        return #ok(handle, canisterId);
    };

    private func isValidHandle(value : Text) : Bool {
        var seg = "";
        let cs = value.chars();
        var l : Nat = value.size();
        var i : Nat = 0;

        while (i < l) {
            switch (cs.next()) {
                case null {
                    return false;
                };
                case (?c) {
                    if (not Char.isAlphabetic(c) and not Char.isDigit(c) and c != '-') {
                        return false;
                    };
                };
            };
            i += 1;
        };

        true;
    };

    //should be called after initialising the management canister
    public shared ({ caller }) func createPublication(publicationHandle : Text, displayName : Text, firstEditorHandle : Text) : async Result.Result<(Text, Text), Text> {

        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err("Unauthorized!");
        };
        ignore U.logMetrics("createPublication", Principal.toText(caller));

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
        };

        let UserCanister = CanisterDeclarations.getUserCanister();

        let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();

        let managementCanisterId = Principal.fromActor(this);
        let adminPrincipal = caller;

        if (not isValidHandle(publicationHandle)) {
            return #err("Invalid handle!");
        };

        //check if the handle exists
        switch (await UserCanister.getPrincipalByHandle(publicationHandle)) {
            case (#ok(principal)) {
                return #err("Handle exists!");
            };
            case (_) {};
        };

        //check if the given first editor handle exists

        switch (await UserCanister.getPrincipalByHandle(firstEditorHandle)) {
            case (#ok(principal)) {};
            case (_) {
                return #err("given editor handle doesn't exist!");
            };
        };

        //create publisher canisters and add 20T cycles
        Cycles.add(5_000_000_000_000);
        let newPublisher = await Publisher.Publisher();
        let newPublisherCanisterId = ?Principal.fromActor(newPublisher);

        switch (newPublisherCanisterId) {
            case (null) {
                return #err("Error while creating the canister!");
            };
            case (?canisterId) {
                //publication canister is created successfully
                //add all the admins as controller to the canister
                let adminsBuffer = Buffer.Buffer<Principal>(0);
                for (admin in List.toArray(admins).vals()) {
                    adminsBuffer.add(Principal.fromText(admin));
                };
                adminsBuffer.add(Principal.fromText(idInternal()));
                let controllers : ?[Principal] = ?Buffer.toArray(adminsBuffer);
                await ic.update_settings(({
                    canister_id = canisterId;
                    settings = {
                        controllers = controllers;
                        freezing_threshold = null;
                        memory_allocation = null;
                        compute_allocation = null;
                    };
                }));

                //canister is created and admins has been set as controller to canister
                let registerAdminReturn = await newPublisher.registerAdmin(idInternal());
                //add admins to newly created publisher canister
                for (controller in List.toArray(admins).vals()) {
                    ignore await newPublisher.registerAdmin(controller);
                };


                //register the publication canister as trusted canister
                let publicationCanisterId = Principal.toText(canisterId);
                let registerUserCanisterReturn = await UserCanister.registerCanister(publicationCanisterId);
                let registerPostCanisterReturn = await PostCoreCanister.registerCanister(publicationCanisterId);

                ignore PostCoreCanister.addCanisterToCyclesDispenser(publicationCanisterId, 10_000_000_000_000, 5_000_000_000_000);

                //register publication

                let registerPublicationReturn = await newPublisher.registerPublication(publicationHandle, displayName);

                switch (registerPublicationReturn) {
                    case (#err(error)) {
                        return #err(error # " " # publicationCanisterId);
                    };
                    case (#ok(publication)) {
                        let addEditorReturn = await newPublisher.addEditor(firstEditorHandle);
                        publicationCanisterIdsHashmap.put(publicationHandle, publicationCanisterId);
                        //ensure that all the publication canisters are trusted canisters
                        await ensurePublishersAreTrustedCanisters();
                        #ok(publicationHandle, publicationCanisterId);
                    };
                };

            };
        };

    };

    public shared query func getPublishers() : async [(Text, Text)] {
        Iter.toArray(publicationCanisterIdsHashmap.entries());
    };

    public shared query func getAllPublisherIds() : async [Text] {
        Iter.toArray(publicationCanisterIdsHashmap.vals());
    };
    //upgrade publication canisters
    //holds wasm for upgrade
    private stable var wasmChunks : Blob = Blob.fromArray([]);

    //adds wasm chunk to wasmChunks
    public shared ({ caller }) func addWasmChunk(chunk : Blob) : async Result.Result<(), Text> {

        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (not isThereEnoughMemoryPrivate()) {
            return #err("Canister reached the maximum memory threshold. Please try again later.");
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
        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            //TODO and not SNS governance canister, do any other canisters need this method???

            return #err("Unauthorized");
        };
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
    public shared ({ caller }) func upgradeAllBuckets(canisterId : Text, arg : [Nat8]) : async Result.Result<(), Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        if (not isAdmin(caller) and not isPlatformOperator(caller)) {
            return #err("Unauthorized");
        };

        //TODO: add indexing for large number of buckets

        for (bucketCanisterId in publicationCanisterIdsHashmap.vals()) {
            switch (await upgradeBucket(bucketCanisterId, arg)) {
                case (ok) {
                    //TODO: add logging
                };
            };
        };

        #ok();
    };

    public query func idQuick() : async Principal {
        return Principal.fromActor(this);
    };

    public shared ({ caller }) func registerPublisherCanisters() : async () {
        if (isAnonymous(caller)) {
            return;
        };

        if (isAdmin(caller)) {
            await ensurePublishersAreTrustedCanisters();
        };
    };

    private func ensurePublishersAreTrustedCanisters() : async () {
        let UserCanister = CanisterDeclarations.getUserCanister();
        let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
        //check post canister trusted canisters
        switch (await PostCoreCanister.getTrustedCanisters()) {
            case (#ok(canisters)) {
                for (publicationCanisterId in publicationCanisterIdsHashmap.vals()) {
                    if (not U.arrayContains(canisters, publicationCanisterId)) {
                        ignore await PostCoreCanister.registerCanister(publicationCanisterId);
                    };
                };
            };
            case (#err(err)) {};
        };
        //check user canister trusted canisters
        switch (await UserCanister.getTrustedCanisters()) {
            case (#ok(canisters)) {
                for (publicationCanisterId in publicationCanisterIdsHashmap.vals()) {
                    if (not U.arrayContains(canisters, publicationCanisterId)) {
                        ignore await UserCanister.registerCanister(publicationCanisterId);
                    };
                };
            };
            case (#err(err)) {};
        };

        //check nftFactory canister trusted canisters
        let NftFactory = CanisterDeclarations.getNftFactoryCanister();
        let whitelistedCanisterIds = List.map<(Text, Text), Text>(List.fromArray(await NftFactory.getWhitelistedPublishers()), func(val : (Text, Text)) : Text { val.1 });

        for (publication in publicationCanisterIdsHashmap.entries()) {
            if (not U.arrayContains(List.toArray(whitelistedCanisterIds), publication.1)) {
                ignore await NftFactory.whitelistPublication(publication.0, publication.1);
            };
        };

    };
    private func isAdmin(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        U.arrayContains(ENV.PUBLICATION_MANAGEMENT_CANISTER_ADMINS, c);
    };

    public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
        if (isAnonymous(caller)) {
            return #err("Cannot use this method anonymously.");
        };

        #ok(ENV.PUBLICATION_MANAGEMENT_CANISTER_ADMINS);
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

    private func idInternal() : Text {
        Principal.toText(Principal.fromActor(this));
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
        Versions.PUBLICATIONMANAGEMENT_VERSION;
    };

    system func preupgrade() {
        publicationCanisterIdsEntries := Iter.toArray(publicationCanisterIdsHashmap.entries());
    };

    system func postupgrade() {
        publicationCanisterIdsEntries := [];
    };

};
