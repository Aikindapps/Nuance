/// A module containing Types used by the NuaTransactionHistory canister

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

  // DappRadar related types
  public type TokenVolume = { 
    tokenAddress : Text; 
    amount : Nat; 
    usdAmount : Float 
  };
  
  public type UserActivity = { 
    user : Text; 
    transactions : Nat; 
    volume : [TokenVolume] 
  };
  
  public type HourlyUserActivity = { 
    dateTime : Text; 
    user : Text; 
    transactions : Nat; 
    volume : [TokenVolume] 
  };

  public type DailyDataResponse = { 
    results : [UserActivity]; 
    pageCount : Nat 
  };
  
  public type HourlyDataResponse = { 
    results : [HourlyUserActivity]; 
    pageCount : Nat 
  };
  
  public type BalanceResponse = { 
    balance : [TokenVolume] 
  };
  
  public type TransactionData = { 
    timestamp : Nat64; 
    user : Principal; 
    amount : Nat; 
    transactionType : Text 
  };
  
  public type MetricsSummary = { 
    totalUsers : Nat; 
    totalTransactions : Nat; 
    totalVolume : Nat; 
    currentBalance : Nat 
  };

  // HTTP related types
  public type HttpRequest = {
    url : Text;
    method : Text;
    body : [Nat8];
    headers : [(Text, Text)];
  };

  public type HttpResponse = {
    status_code : Nat16;
    headers : [(Text, Text)];
    body : [Nat8];
    upgrade : ?Bool;
  };

  // Cache initialization types
  public type IncrementalCacheResult = {
    startIndex: Nat;
    nextIndex: Nat;
    isComplete: Bool;
    dailyAggregatedData: [(Text, Text)];
    hourlyAggregatedData: [(Text, Text)];
    processedTransactions: Nat;
  };
};
