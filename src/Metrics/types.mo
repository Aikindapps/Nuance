/// A module containing Types used by the DateTime module

module {
  public type TopUp = {
    canisterId : Text;
    time : Int;
    amount : Nat;
    balanceBefore : Nat;
    balanceAfter : Nat;
  };
  public type RegisteredCanister = {
    canisterId : Text;
    minimumThreshold : Nat;
    topUpAmount : Nat;
    balance : Nat;
    topUps : [TopUp];
  };

  public type OperationLog = {
    operation : Text;
    principal : Text;
    timestamp : Int;
  };
};
