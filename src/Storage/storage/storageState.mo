import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Buckets "./buckets";
import Types "./types";

module StorageState {
  type Bucket = Buckets.Bucket;

  public type DataCanisterState = {
    // data canisters to hold data
    dataCanisters: HashMap.HashMap<Types.DataCanisterId, Bucket>;
    contentIdToCanisterId: HashMap.HashMap<Text, Types.DataCanisterId>;
    retiredDataCanisterId: HashMap.HashMap<Text, Text>;
    admins: Buffer.Buffer<Text>;
  };

  public type DataCanisterStateStable = {
    dataCanisters: [(Types.DataCanisterId, Bucket)];
    contentIdToCanisterId: [(Text, Types.DataCanisterId)];
    retiredDataCanisterId: [(Text, Text)];
    admins: [Text];
  };

  public func emptyState() : DataCanisterState {
    var st : DataCanisterState = {
      dataCanisters = HashMap.HashMap<Types.DataCanisterId, Bucket> (1, Principal.equal, Principal.hash);
      contentIdToCanisterId = HashMap.HashMap<Text, Types.DataCanisterId> (1, Text.equal, Text.hash);
      retiredDataCanisterId = HashMap.HashMap<Text, Text>(1, Text.equal, Text.hash);
      admins = Buffer.Buffer<Text>(1);
    };
    st;
  };

  public func emptyStableState(): DataCanisterStateStable {
    var st : DataCanisterStateStable = {
      dataCanisters = [];
      contentIdToCanisterId = [];
      retiredDataCanisterId = [];
      admins = [];
    };
    st;
  };

  public func getStableState(state: DataCanisterState) : DataCanisterStateStable {
    let st : DataCanisterStateStable = {
      dataCanisters = Iter.toArray(state.dataCanisters.entries());
      contentIdToCanisterId = Iter.toArray(state.contentIdToCanisterId.entries());
      retiredDataCanisterId = Iter.toArray(state.retiredDataCanisterId.entries());
      admins = state.admins.toArray();
    };
    st;
  };

  public func getState(stateShared: DataCanisterStateStable) : DataCanisterState {
    let state = emptyState();
    for( (id, pid) in stateShared.dataCanisters.vals()) {
      state.dataCanisters.put(id, pid);
    };
    for( (id, pid) in stateShared.contentIdToCanisterId.vals()) {
      state.contentIdToCanisterId.put(id, pid);
    };
    for( (id, pid) in stateShared.retiredDataCanisterId.vals()) {
      state.retiredDataCanisterId.put(id, pid);
    };
    for( id in stateShared.admins.vals()) {
      state.admins.add(id);
    };
    return state;
  };


};
