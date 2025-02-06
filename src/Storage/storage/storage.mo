import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Cycles "mo:base/ExperimentalCycles";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import StorageTypes "./types";
import Bucket "./buckets";
import StorageState "./storageState";
import IC "../remote_canisters/IC";
import Types "./types";


module StorageModule {


public class StorageSolution(storageStableState : StorageState.DataCanisterStateStable, mainCanisterInitializer: Principal, 
          mainCanisterActorPrincipal: Principal) {

    let DATA_CANISTER_MAX_STORAGE_LIMIT = 2147483648; //  ~2GB

    let storageState = StorageState.getState(storageStableState);
    public func getBlob(contentId: Text, offset:Nat): async ?Blob {
      do? {
        let contentCanisterId = storageState.contentIdToCanisterId.get(contentId)!;
        let b : ?Bucket.Bucket = storageState.dataCanisters.get(contentCanisterId);
        (await b!.getChunks(contentId, offset))!;
      };
    };

    public func dataCanisterId(contentId: Text): async ?Types.DataCanisterId {
      storageState.contentIdToCanisterId.get(contentId);
    };

    public func registerAdmin(id: Text) : async () {
      for((cId, bucket) in storageState.dataCanisters.entries()) {
        storageState.admins.add(id);
        let _ = await bucket.registerAdmin(id);
      };
    };

    // persist chunks in bucket
    public func putBlobsInDataCanister(contentId: Text, chunkData : Blob, offset: Nat, numOfChunks: Nat, mimeType: Text, dataSize: Nat) : async Text {
      let contentCanisterId = storageState.contentIdToCanisterId.get(contentId);
      var dataCanisterId = "";
      switch(contentCanisterId) {
        case(null) {
          let b : Bucket.Bucket = await getEmptyBucket(?dataSize);
          let a = await b.putChunks(contentId, offset, chunkData, numOfChunks, mimeType);
          storageState.contentIdToCanisterId.put(contentId, Principal.fromActor(b));
          dataCanisterId := Principal.toText(Principal.fromActor(b));
        };
        case(?canisterId) {
          switch(storageState.dataCanisters.get(canisterId)) {
            case(null)();
            case(?bucket) {
                let _ = await bucket.putChunks(contentId, offset, chunkData, numOfChunks, mimeType);
                dataCanisterId := Principal.toText(Principal.fromActor(bucket));
            };
          }
        };
      };
      return dataCanisterId;
    };
    
    public func retiredDataCanisterId(canisterId: Text) {
      storageState.retiredDataCanisterId.put(canisterId, canisterId);
    };

    public func getRetiredDataCanisterIdsStable() : [Text] {
      let buff = Buffer.Buffer<Text>(storageState.retiredDataCanisterId.size());
      for((id, _) in storageState.retiredDataCanisterId.entries()) {
        buff.add(id);
      };
      return Buffer.toArray(buff);
    };

    public func getAllDataCanisterIds() : [Principal] {
      let buff = Buffer.Buffer<Principal>(storageState.dataCanisters.size());
      for((id, _) in storageState.dataCanisters.entries()) {
        buff.add(id);
      };
      return Buffer.toArray(buff);
    };

    // check if there's an empty bucket we can use
    // create a new one in case none's available or have enough space 
    private func getEmptyBucket(s : ?Nat): async Bucket.Bucket {
      let fs: Nat = switch (s) {
        case null { 0 };
        case (?s) { s }
      };

      for((pId, bucket) in storageState.dataCanisters.entries()) {
        switch(storageState.retiredDataCanisterId.get(Principal.toText(pId))) {
          case(null) {
            let size = await bucket.getSize();
            if(size + fs < DATA_CANISTER_MAX_STORAGE_LIMIT) {
              return bucket;
            }
          };
          case(_)();
        };
      };
      await newEmptyBucket();
    };

    // dynamically install a new Bucket
    private func newEmptyBucket(): async Bucket.Bucket {
      Cycles.add(2000000000000);
      let b = await Bucket.Bucket();
      let _ = await updateCanister(b); // update canister permissions and settings
      Debug.print("new canister principal is " # debug_show(Principal.toText(Principal.fromActor(b))) );
      storageState.dataCanisters.put(Principal.fromActor(b), b);
      return b;
    };



    public func addStorageBucket(canisterId: Principal) : async Text {
      
      let b = actor (Principal.toText(canisterId)) : Bucket.Bucket;
      storageState.dataCanisters.put(canisterId, b);
      return Principal.toText(canisterId) # " added";
    };

    // canister memory is set to 4GB and compute allocation to 5 as the purpose 
    // of this canisters is mostly storage
    // set canister owners to the wallet canister and the container canister ie: this
    private func updateCanister(a: actor {}) : async () {
      Debug.print("balance before: " # Nat.toText(Cycles.balance()));
      let cid = { canister_id = Principal.fromActor(a)};
      Debug.print("IC status..."  # debug_show(await IC.IC.canister_status(cid)));
      
      await (IC.IC.update_settings( {
        canister_id = cid.canister_id; 
        settings = { 
          controllers = ?[mainCanisterInitializer, mainCanisterActorPrincipal]; 
          compute_allocation = null;
          memory_allocation = null; // 4GB
          freezing_threshold = ?31_540_000} })
      );
    };

    public func getStableState() : StorageState.DataCanisterStateStable {
      return StorageState.getStableState(storageState);
    };

};

    

};