import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Float "mo:base/Float";
import Int "mo:base/Int";
import CanisterDeclarations "CanisterDeclarations";
module{
  
  public type TokenPair = {
    #IcpNua;
    #CkBtcIcp;
  };

  public let ICP_NUA_POOL_CANISTER_ID = "ng4fu-zaaaa-aaaak-qtsaq-cai";
  public let CKBTC_ICP_POOL_CANISTER_ID = "uluvj-yiaaa-aaaak-qlr6a-cai";


  private func getPriceBetweenTokens(pair: TokenPair, amount: Nat) : async Result.Result<Nat, Text>{
    switch(pair) {
      case(#IcpNua) {
        let PoolCanister = CanisterDeclarations.getSonicPoolCanister(ICP_NUA_POOL_CANISTER_ID);
        let response = await PoolCanister.quote({
          amountIn = Nat.toText(Nat.pow(10, 8));
          zeroForOne = false;
          amountOutMinimum = ""
        });
        switch(response) {
          case(#ok(oneIcpEquivalance)) {
            let amountFloat = Float.fromInt(amount);
            let oneIcpEquivalanceFloat = Float.fromInt(oneIcpEquivalance);
            let resultFloat = amountFloat / Float.pow(10, 8) * oneIcpEquivalanceFloat;
            return #ok(Int.abs(Float.toInt(resultFloat)))
          };
          case(#err(error)) {
            return #err(debug_show(error))
          };
        };
      };
      case(#CkBtcIcp) {
        let PoolCanister = CanisterDeclarations.getSonicPoolCanister(CKBTC_ICP_POOL_CANISTER_ID);
        let response = await PoolCanister.quote({
          amountIn = Nat.toText(Nat.pow(10, 8));
          zeroForOne = false;
          amountOutMinimum = ""
        });
        switch(response) {
          case(#ok(oneIcpEquivalance)) {
            let amountFloat = Float.fromInt(amount);
            let oneCkBtcEquivalanceFloat = Float.pow(10, 8) / Float.fromInt(oneIcpEquivalance);
            let resultFloat = amountFloat * oneCkBtcEquivalanceFloat;
            return #ok(Int.abs(Float.toInt(resultFloat)))
          };
          case(#err(error)) {
            return #err(debug_show(error))
          };
        };
      };
    };
    #err("")
  };

  public func getNuaEquivalentOfTippingToken(symbol: Text, amount: Nat) : async Result.Result<Nat, Text>{
    switch(symbol) {
      case("ICP") {
        return await getPriceBetweenTokens(#IcpNua, amount);
      };
      case("ckBTC") {
        //get the ICP equivalent of the ckBTC first
        let icpEquivalent = await getPriceBetweenTokens(#CkBtcIcp, amount);
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
      case(_){
        //not possible to reach here -> just return 0
        return #err("Invalid symbol!");
      };
    };

    
  };
}