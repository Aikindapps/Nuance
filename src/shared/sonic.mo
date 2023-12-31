import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Float "mo:base/Float";
import Int "mo:base/Int";
import ENV "env";
module{
    public type PairInfoExt = {
    id : Text;
    price0CumulativeLast : Nat;
    creator : Principal;
    reserve0 : Nat;
    reserve1 : Nat;
    lptoken : Text;
    totalSupply : Nat;
    token0 : Text;
    token1 : Text;
    price1CumulativeLast : Nat;
    kLast : Nat;
    blockTimestampLast : Int;
  };
  let Sonic = actor("3xwpq-ziaaa-aaaah-qcn4a-cai") : actor{
    getPair : shared query (Principal, Principal) -> async ?PairInfoExt;
  };
  private func getPriceBetweenTokens(token0: Text, token1: Text, amount: Nat) : async Result.Result<Nat, Text>{
    let pool = await Sonic.getPair(Principal.fromText(token0), Principal.fromText(token1));
    switch(pool) {
      case(?poolValue) {
        let reserveIn = if(poolValue.token0 == ENV.ICP_TOKEN_CANISTER_ID){poolValue.reserve0}else{poolValue.reserve1};
        let reserveOut = if(poolValue.token1 != ENV.ICP_TOKEN_CANISTER_ID){poolValue.reserve1}else{poolValue.reserve0};
        var amountInWithFee = Nat.pow(10, 8) * 997;
        var numerator = amountInWithFee * reserveOut;
        var denominator = reserveIn * 1000 + amountInWithFee;
        var amountOut = (numerator / denominator);
        //amountOut means the ICP equivalance of the other token
        if(token0 == ENV.ICP_TOKEN_CANISTER_ID){
          return #ok(Int.abs(Float.toInt((Float.fromInt(amount) / Float.pow(10, 8)) * Float.fromInt(amountOut))));
        }
        else{
          return #ok(Int.abs(Float.toInt(Float.fromInt(amount) / Float.fromInt(amountOut) * Float.pow(10, 8))))
        }
        
      };
      case(null) {
        return #err("Pool not found")
      };
    };
  };

  //this function will be implemented once we determine which dex will be used
  public func getNuaEquivalentOfTippingToken(symbol: Text, amount: Nat) : async Result.Result<Nat, Text>{
    switch(symbol) {
      //The logic for getting the NUA equivalent will be here
      //it's returning 10 for every call for now
      case("ICP") {
        return await getPriceBetweenTokens(ENV.ICP_TOKEN_CANISTER_ID, ENV.NUA_TOKEN_CANISTER_ID, amount);
      };
      case("ckBTC") {
        //get the ICP equivalent of the ckBTC first
        let icpEquivalent = await getPriceBetweenTokens(ENV.CKBTC_TOKEN_CANISTER_ID, ENV.ICP_TOKEN_CANISTER_ID, amount);
        switch(icpEquivalent) {
          case(#ok(value)) {
            //ckBTC converted to ICP
            //now use ICP/NUA pool to get the equivalance
            return await getNuaEquivalentOfTippingToken("ICP", value);
          };
          case(#err(error)) {
            //should never happen
            //if occurs, return an error
            return #err(error)
          };
        };
      };
      case("GHOST") {
        //get the ICP equivalent of the ckBTC first
        let icpEquivalent = await getPriceBetweenTokens(ENV.GHOST_TOKEN_CANISTER_ID, ENV.ICP_TOKEN_CANISTER_ID, amount);
        switch(icpEquivalent) {
          case(#ok(value)) {
            //GHOST converted to ICP
            //now use ICP/NUA pool to get the equivalance
            return await getNuaEquivalentOfTippingToken("ICP", value);
          };
          case(#err(error)) {
            //should never happen
            //if occurs, return an error
            return #err(error)
          };
        };
      };
      case(_){
        //not possible to reach here -> just return 0
        return #err("Invalid symbol!");
      };
    };

    
  };
}