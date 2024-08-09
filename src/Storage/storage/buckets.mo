import Random "mo:base/Random";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Prim "mo:prim";
import Buffer "mo:base/Buffer";
import Cycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Prelude "mo:base/Prelude";
import Result "mo:base/Result";

import Canistergeek "../../canistergeek/canistergeek";
import ENV "../../shared/env";


import Types "./types";
import Versions "../../shared/versions";


actor class Bucket () = this {

  let Unauthorized = "Unauthorized";

  stable var _canistergeekMonitorUD: ? Canistergeek.UpgradeData = null;
  private let canistergeekMonitor = Canistergeek.Monitor();
  let adminsArr = ENV.PLATFORM_OPERATORS;


   type DataCanisterState = {
      contentInfo : HashMap.HashMap<Text, Types.ContentInfo>;
      chunks : HashMap.HashMap<Types.ChunkId, Types.ChunkData>;
      moderators : HashMap.HashMap<Principal, Principal>;
  };


   type DataCanisterSharedState = {
      contentInfo: [(Text, Types.ContentInfo)];
      chunks : [(Types.ChunkId, Types.ChunkData)];
      moderators : [(Principal, Principal)];
  };

  private func emptyStateForDataCanister () : DataCanisterState {
    var st : DataCanisterState = {
        contentInfo = HashMap.HashMap<Text, Types.ContentInfo>(10, Text.equal, Text.hash);
        chunks = HashMap.HashMap<Types.ChunkId, Types.ChunkData>(10, Text.equal, Text.hash);
        moderators = HashMap.HashMap<Principal, Principal>(10, Principal.equal, Principal.hash);
    };
    st;
  };

  var state: DataCanisterState = emptyStateForDataCanister();

  let limit = 20_000_000_000_000;

  //#region Security Management
  stable var admins : List.List<Text> = List.nil<Text>();

  for(adminId in adminsArr.vals()) {
      admins := List.push<Text>(adminId, admins);
  };

  func isAnonymous(caller : Principal) : Bool {
      Principal.equal(caller, Principal.fromText("2vxsx-fae"))
  };

  func isAdmin(caller : Principal) : Bool {
      var c = Principal.toText(caller);
      var exists = List.find<Text>(admins, func(val: Text) : Bool { val == c });
      exists != null;
  };

  public shared({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
      if (not isAdmin(caller)) {
          return #err(Unauthorized);
      };
      #ok(List.toArray(admins));
  };

  public shared query func getCanisterVersion() : async Text{
        Versions.STORAGE_VERSION;
    };

  //This function should be invoked immediately after the canister is deployed via script.
  public shared({ caller }) func registerAdmin(id : Text) : async Result.Result<(), Text> {
      canistergeekMonitor.collectMetrics();
      if (List.size<Text>(admins) > 0 and not isAdmin(caller)) {
          return #err(Unauthorized);
      };

      if (not List.some<Text>(admins, func(val: Text) : Bool { val == id })) {
          admins := List.push<Text>(id, admins);
      };

      #ok();
  };

  public shared({ caller }) func unregisterAdmin(id : Text) : async Result.Result<(), Text> {
      canistergeekMonitor.collectMetrics();
      if (not isAdmin(caller)) {
          return #err(Unauthorized);
      };
      admins := List.filter<Text>(admins, func(val: Text) : Bool { val != id });
      #ok();
  };

    //#endregion

  public func getSize(): async Nat {
      Debug.print("canister balance: " # Nat.toText(Cycles.balance()));
      Prim.rts_memory_size();
  };

  func chunkId(contentId : Text, chunkNum : Nat) : Types.ChunkId {
      contentId # "-" # (Nat.toText(chunkNum))
  };

  // add chunks 
  // the structure for storing blob chunks is to unse name + chunk num eg: 123a1, 123a2 etc
  public func putChunks(contentId : Text, chunkNum : Nat, chunkData : Blob,
          numOfChunks: Nat, contentType: Text) : async ?() {
    do ? {
      Debug.print("generated chunk id is " # debug_show(chunkId(contentId, chunkNum)) # "from"  #   debug_show(contentId) # "and " # debug_show(chunkNum)  #"  and chunk size..." # debug_show(Blob.toArray(chunkData).size()) );
      if(chunkNum == 1) {
        state.contentInfo.put(contentId, {
        contentId= contentId;
        numOfChunks= numOfChunks;
        contentType= contentType;
      });
    };
      state.chunks.put(chunkId(contentId, chunkNum), chunkData);
    }
  };

  func getFileInfoData(contentId : Text) : async ? Types.ContentInfo {
      do ? {
          let v = state.contentInfo.get(contentId)!;
            {
            contentId = v.contentId;
            numOfChunks = v.numOfChunks;
            contentType = v.contentType;
          }
      }
  };

  public query func getChunks(fileId : Text, chunkNum: Nat) : async ?Blob {
      state.chunks.get(chunkId(fileId, chunkNum))
  };

  public func wallet_receive() : async { accepted: Nat64 } {
    let available = Cycles.available();
    let accepted = Cycles.accept<system>(Nat.min(available, limit));
    { accepted = Nat64.fromNat(accepted) };
  };

  public func wallet_balance() : async Nat {
    return Cycles.balance();
  };

  
   type StreamingCallbackToken = {
    key : Text;
    content_encoding : Text;
    index : Nat; //starts at 1
    sha256: ?[Nat8];
  };
  

   type StreamingCallbackHttpResponse = {
    token : ?StreamingCallbackToken;
    body : Blob;
  };

  // public type StreamingCallback = query StreamingCallbackToken  -> async StreamingCallbackHttpResponse;

 
  type StreamingCallback = shared () -> async ();


   type StreamingStrategy = {
    #Callback: {
      token : StreamingCallbackToken;
      callback : StreamingCallback
    }
  };


   type HttpRequest = {
    method: Text;
    url: Text;
    headers: [(Text, Text)];
    body: Blob;
  };


   
   type HttpResponse = {
    status_code: Nat16;
    headers: [(Text, Text)];
    body: Blob;
    streaming_strategy : ?StreamingStrategy;
  };

  public shared query({caller}) func streamingCallback(token : StreamingCallbackToken,) : async StreamingCallbackHttpResponse {
    Debug.print("Sending chunk " # debug_show(token.key) # debug_show(token.index));
    let body:Blob = switch(state.chunks.get(chunkId(token.key, token.index))) {
      case (?b) b;
      case (null) "404 Not Found";
    };
    let next_token:? StreamingCallbackToken = switch(state.chunks.get(chunkId(token.key, token.index+1))){
      case (?nextbody) ?{
        content_encoding=token.content_encoding;
        key = token.key;
        index = token.index+1;
        sha256 = null;
      };
      case (null) null;
    };

    {
      body=body;
      token=next_token;
    };
  };

  public func registerModerators(moderatorIds: [Principal]):  () {
    for(moderatorId in moderatorIds.vals()) {
      state.moderators.put(moderatorId, moderatorId);
    };
  };

  public func deRegisterModerators(moderatorIds: [Principal]): () {
    for(moderatorId in moderatorIds.vals()) {
      state.moderators.delete(moderatorId);
    };
  };

  // Return the principal identifier of this canister.
  public func whoami () : async Principal {
        Principal.fromActor(this);
  };

  public query func http_request(req: HttpRequest) : async HttpResponse {
    Debug.print("http_request: " # debug_show(req));

    var _headers = [("Content-Type","text/html"), ("Content-Disposition","inline")];
    let self: Principal = Principal.fromActor(this);
    let canisterId: Text = Principal.toText(self);
    let canister = actor (canisterId) : actor { streamingCallback : shared () -> async () };

    var _status_code:Nat16=404;


    var _body:Blob = "404 Not Found";
    var _streaming_strategy:? StreamingStrategy = null;
    let _ = do ? {
      let storageParams:Text = Text.stripStart(req.url, #text("/storage?"))!;
      let fields:Iter.Iter<Text> = Text.split(storageParams, #text("&"));
      var contentId: ?Text = null;
      var chunkNum:Nat=1;
      for(field:Text in fields) {
        let kv:[Text] = Iter.toArray<Text>(Text.split(field,#text("=")));
        if (kv[0]=="contentId"){
          contentId:=?kv[1];
        }
      };

      _body := state.chunks.get(chunkId(contentId!, chunkNum))!;
      let info: ?Types.ContentInfo = state.contentInfo.get(contentId!);
      _headers := [
        ("Content-Type", info!.contentType)
      ];
      _status_code:=200;
      _streaming_strategy := ?#Callback({
        token = {
          content_encoding="gzip";
          key=contentId!;
          index=chunkNum + 1; //starts at 1
          sha256=null;
        };
        callback = canister.streamingCallback;
      });
    };
    return {
      status_code=_status_code;
      headers=_headers;
      body=_body;
      streaming_strategy=_streaming_strategy;
    };
  };

   public query ({caller}) func getCanisterMetrics(parameters: Canistergeek.GetMetricsParameters): async ?Canistergeek.CanisterMetrics {
        if (not isAdmin(caller)) {
            Prelude.unreachable();
        };
        Debug.print("User->getCanisterMetrics: The method getCanistermetrics was called from the UI successfully");
        canistergeekMonitor.getMetrics(parameters);
    };

    public shared ({caller}) func collectCanisterMetrics(): async () {
        if (not isAdmin(caller)) {
            Prelude.unreachable();
        };
        canistergeekMonitor.collectMetrics();
        Debug.print("User->collectCanisterMetrics: The method collectCanisterMetrics was called from the UI successfully");
    };

  private func emptyDataCanisterSharedState(): DataCanisterSharedState {
    var st : DataCanisterSharedState = {
      contentInfo = [];
      chunks= [];
      moderators = [];
    };
    st;
  };
  
  private func fromDataCanisterState(state: DataCanisterState) : DataCanisterSharedState {
    let st : DataCanisterSharedState = {
      contentInfo = Iter.toArray(state.contentInfo.entries());
      chunks = Iter.toArray(state.chunks.entries());
      moderators = Iter.toArray(state.moderators.entries());
    };
    st;
  };

  private func toDataCanisterState(stateShared: DataCanisterSharedState) : DataCanisterState {
    var state:DataCanisterState = emptyStateForDataCanister();

    for( (category, val) in stateShared.chunks.vals()) {
      state.chunks.put(category, val);
    };

    for( (category, val) in stateShared.contentInfo.vals()) {
      state.contentInfo.put(category, val);
    };

    for( (category, val) in stateShared.moderators.vals()) {
      state.moderators.put(category, val);
    };
    state;
  };

  stable var stateShared : DataCanisterSharedState = emptyDataCanisterSharedState();

  system func preupgrade() {
    stateShared := fromDataCanisterState(state);
     _canistergeekMonitorUD := ? canistergeekMonitor.preupgrade();
  };

  system func postupgrade() {
    state := toDataCanisterState(stateShared);
    stateShared := emptyDataCanisterSharedState();
    canistergeekMonitor.postupgrade(_canistergeekMonitorUD);
    _canistergeekMonitorUD := null;
  };

};