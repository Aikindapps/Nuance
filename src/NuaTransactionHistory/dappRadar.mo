import _Debug            "mo:base/Debug";
import Buffer            "mo:base/Buffer";
import HashMap           "mo:base/HashMap";
import Nat               "mo:base/Nat";
import Int               "mo:base/Int";
import Nat64             "mo:base/Nat64";
import Principal         "mo:base/Principal";
import Result            "mo:base/Result";
import Text              "mo:base/Text";
import Float             "mo:base/Float";
import Error             "mo:base/Error";
import Time              "mo:base/Time";
import DateTime          "../shared/DateTime";
import ENV               "../shared/env";
import CanisterDecls     "../shared/CanisterDeclarations";
import Sonic             "../shared/sonic";
import Iter              "mo:base/Iter";
import Array             "mo:base/Array";
import Types             "./types";

module DappRadar {

  //----------------------  TYPES  ----------------------//
  type Tx              = CanisterDecls.Transaction;
  type LedgerInterface = CanisterDecls.ICRC1CanisterInterface;

  type TokenVolume = Types.TokenVolume;
  type UserActivity = Types.UserActivity;
  type HourlyUserActivity = Types.HourlyUserActivity;
  type DailyDataResponse = Types.DailyDataResponse;
  type HourlyDataResponse = Types.HourlyDataResponse;
  type BalanceResponse = Types.BalanceResponse;
  type TransactionData = Types.TransactionData;
  type MetricsSummary = Types.MetricsSummary;
  type HttpRequest = Types.HttpRequest;
  type HttpResponse = Types.HttpResponse;

  //----------------------  CONSTANTS  -------------------------//
  let _PAGE_SIZE           = 100;
  let _NUA_TOKEN_ADDRESS   = ENV.NUA_TOKEN_CANISTER_ID;
  let _ICP_TOKEN_ADDRESS   = ENV.ICP_TOKEN_CANISTER_ID;
  let _CKBTC_TOKEN_ADDRESS = ENV.CKBTC_TOKEN_CANISTER_ID;

  // Sonic pools - aligned with tokens.constants.ts
  let CKUSDC_ICP_POOL_ID  = "drywa-daaaa-aaaak-qlsbq-cai";  // ckUSDC/ICP pool for USD pricing

  //----------------------  USD RATE HELPERS  ------------------//

  // Simple USD rate fetchers without caching for module compatibility
  private func getIcpUsdRate() : async Result.Result<Float, Text> {
    try {
      let Pool = CanisterDecls.getSonicPoolCanister(CKUSDC_ICP_POOL_ID);
      let rq   = { amountIn = "100000000"; zeroForOne = true; amountOutMinimum = "" }; // 1 ICP (e8) → ckUSDC (e6)
      switch (await Pool.quote(rq)) {
        case (#ok(ckUsdcE6)) {
          let rate = Float.fromInt(ckUsdcE6) / Float.pow(10, 6); // Convert ckUSDC e6 to USD
          #ok(rate)
        };
        case (#err(e)) #err("ICP/USD quote failed: " # debug_show(e));
      }
    } catch _ { #err("ICP/USD rate exception") }
  };

  // Function to get USD rate for a specific NUA amount
  private func getNuaUsdRateSimple(_nuaAmount : Nat) : async Result.Result<Float, Text> {
    try {
      // Use the same approach as the existing Sonic module
      // First get: how much NUA do you get for 1 ICP?
      let Pool = CanisterDecls.getSonicPoolCanister(Sonic.ICP_NUA_POOL_CANISTER_ID);
      let oneIcpRq = { amountIn = Nat.toText(100_000_000); zeroForOne = false; amountOutMinimum = "" }; // 1 ICP
      switch (await Pool.quote(oneIcpRq)) {
        case (#ok(nuaPerIcp)) { // This is how much NUA you get for 1 ICP
          switch (await getIcpUsdRate()) {
            case (#ok(icpUsdRate)) {
              // icpUsdRate = USD per ICP
              // nuaPerIcp = NUA units per ICP
              // So: USD per NUA unit = icpUsdRate / nuaPerIcp
              let usdPerNuaUnit = icpUsdRate / Float.fromInt(nuaPerIcp);
              #ok(usdPerNuaUnit)
            };
            case (#err(e)) #err("Failed to get ICP/USD rate: " # e);
          }
        };
        case (#err(e)) #err("ICP/NUA quote failed: " # debug_show(e));
      }
    } catch _ { #err("NUA/USD rate exception") }
  };

  // Fast USD conversion using rate fetchers
  func getTokenVolumeOptimized(amount : Nat, token : Text) : async Result.Result<TokenVolume, Text> {
    if (token == ENV.NUA_TOKEN_CANISTER_ID) {
      switch (await getNuaUsdRateSimple(100_000_000)) { // 1 NUA = 100M units
        case (#ok(ratePerSmallestUnit)) {
          // ratePerSmallestUnit is USD per smallest unit (e8), so multiply directly
          let usd = Float.fromInt(amount) * ratePerSmallestUnit;
          #ok({ tokenAddress = token; amount = amount; usdAmount = usd });
        };
        case (#err(e)) #err("NUA USD conversion failed: " # e);
      }
    } else if (token == ENV.ICP_TOKEN_CANISTER_ID) {
      switch (await getIcpUsdRate()) { 
        case (#ok(icpUsdRate)) {
          // icpUsdRate is USD per ICP token, convert amount to tokens then to USD
          let icpTokens = Float.fromInt(amount) / Float.pow(10, 8);
          let usd = icpTokens * icpUsdRate;
          #ok({ tokenAddress = token; amount = amount; usdAmount = usd });
        };
        case (#err(e)) #err("ICP USD conversion failed: " # e);
      }
    } else if (token == ENV.CKBTC_TOKEN_CANISTER_ID) {
      // Get ckBTC price via ICP conversion using Sonic pools
      switch (await Sonic.getNuaEquivalentOfTippingToken("ckBTC", amount)) {
        case (#ok(nuaAmount)) {
          switch (await getNuaUsdRateSimple(nuaAmount)) {
            case (#ok(ratePerSmallestUnit)) {
              let usd = Float.fromInt(nuaAmount) * ratePerSmallestUnit;
              #ok({ tokenAddress = token; amount = amount; usdAmount = usd });
            };
            case (#err(e)) #err("ckBTC->NUA->USD conversion failed: " # e);
          }
        };
        case (#err(e)) #err("ckBTC->NUA conversion failed: " # debug_show(e));
      }
    } else {
      #err("Unknown token address: " # token)
    }
  };

  //----------------------  HELPERS  ---------------------------//

  func timestampToDateTimeString(ts : Int) : Text {
    // Convert nanoseconds timestamp to proper datetime string using DateTime library
    let dt = DateTime.DateTime(?Int.abs(ts));
    dt.showYear() # "-" # dt.showMonth() # "-" # dt.showDay() # " " # dt.showHours() # ":00:00"
  };

  func timestampToDateString(ts : Int) : Text {
    // Convert nanoseconds timestamp to proper date string using DateTime library
    let dt = DateTime.DateTime(?Int.abs(ts));
    dt.showYear() # "-" # dt.showMonth() # "-" # dt.showDay()
  };

  func getCurrentDateString() : Text {
    // Get today's date as YYYY-MM-DD string
    let now = Time.now();
    let dt = DateTime.DateTime(?Int.abs(now));
    dt.showYear() # "-" # dt.showMonth() # "-" # dt.showDay()
  };

  func getDate60DaysAgo() : Text {
    // Get date 60 days ago as YYYY-MM-DD string
    let now = Time.now();
    let sixtyDaysInNanos = 60 * 24 * 60 * 60 * 1_000_000_000; // 60 days in nanoseconds
    let nowAbs = Int.abs(now);
    let pastDate = if (nowAbs >= sixtyDaysInNanos) {
      Int.abs(nowAbs - sixtyDaysInNanos)
    } else {
      0 // Fallback to epoch if somehow we're less than 60 days from epoch
    };
    let dt = DateTime.DateTime(?pastDate);
    dt.showYear() # "-" # dt.showMonth() # "-" # dt.showDay()
  };

  func pageSlice<T>(xs : [T], page : Nat) : [T] {
    if (page < 1) return [];
    let start = if (page == 1) { 0 } else {
      let pageMinusOne = page - 1 : Nat;
      pageMinusOne * 100
    };
    let stop  = Nat.min(xs.size(), start + 100);
    Array.subArray<T>(xs, start, stop - start)
  };

  func pages(total : Nat) : Nat { (total + 100 - 1) / 100 };

  //----------------------  TX PROCESSING  ----------------------//

  private func _processTxs(txs : [Tx]) : [TransactionData] {
    let buf = Buffer.Buffer<TransactionData>(txs.size());
    for (tx in txs.vals()) {
      switch (tx.transfer) { 
        case (?tr) buf.add({ timestamp = tx.timestamp; user = tr.to.owner; amount = tr.amount; transactionType = "transfer" });
        case null { /* skip */ };
      };
      switch (tx.mint) { 
        case (?m) buf.add({ timestamp = tx.timestamp; user = m.to.owner; amount = m.amount; transactionType = "mint" });
        case null { /* skip */ };
      };
      // burns intentionally skipped (no `from` info)
    };
    Buffer.toArray(buf)
  };
  
  //----------------------  AGGREGATION  ------------------------//

  func _aggregateDaily(txs : [TransactionData], targetDate : Text) : async Result.Result<[UserActivity], Text> {
    let map = HashMap.HashMap<Text,{var n:Nat;var v:Nat}>(32, Text.equal, Text.hash);
    
    // Filter transactions for the specific target date and aggregate by user
    for (t in txs.vals()) {
      let txDate = timestampToDateString(Int.abs(Nat64.toNat(t.timestamp)));
      if (txDate == targetDate) {
        let k = Principal.toText(t.user);
        switch (map.get(k)) {
          case (?m) { m.n += 1; m.v += t.amount };
          case null map.put(k, { var n = 1; var v = t.amount });
        }
      }
    };

    // Fetch USD rate once and reuse for all conversions to avoid excessive calls
    switch (await getNuaUsdRateSimple(100_000_000)) { // 1 NUA = 100M units
      case (#ok(ratePerSmallestUnit)) {
        let buf = Buffer.Buffer<UserActivity>(map.size());
        for ((u,d) in map.entries()) {
          let usd = Float.fromInt(d.v) * ratePerSmallestUnit;
          let vol = { tokenAddress = ENV.NUA_TOKEN_CANISTER_ID; amount = d.v; usdAmount = usd };
          buf.add({ user = u; transactions = d.n; volume = [vol] });
        };
        #ok(Buffer.toArray(buf))
      };
      case (#err(e)) #err("Failed to get NUA USD rate for daily aggregation: " # e);
    }
  };

  func _aggregateHourly(txs : [TransactionData], targetDate : Text) : async Result.Result<[HourlyUserActivity], Text> {
    let map = HashMap.HashMap<Text,{var n:Nat;var v:Nat;user:Text}>(64, Text.equal, Text.hash);
    
    // Pre-fetch USD rates once to avoid repeated calls
    let nuaUsdRateResult = await getNuaUsdRateSimple(100_000_000); // 1 NUA = 100M units
    
    let nuaUsdRate = switch (nuaUsdRateResult) {
      case (#ok(rate)) rate;
      case (#err(_)) 0.0; // Fallback to 0 if rate fetch fails
    };
    
    // Filter transactions for the specific target date and aggregate by user and hour
    for (t in txs.vals()) {
      let up = Principal.toText(t.user);
      let fullDateTime = timestampToDateTimeString(Int.abs(Nat64.toNat(t.timestamp)));
      let txDate = timestampToDateString(Int.abs(Nat64.toNat(t.timestamp)));
      
      // Only process transactions from the target date
      if (txDate == targetDate) {
        let key = fullDateTime # "_" # up;
        switch (map.get(key)) {
          case (?m) { m.n += 1; m.v += t.amount };
          case null map.put(key,{var n=1;var v=t.amount;user=up});
        }
      }
    };

    // Build results using pre-fetched USD rates
    let buf = Buffer.Buffer<HourlyUserActivity>(map.size());
    for ((k,d) in map.entries()) {
      let parts = Iter.toArray(Text.split(k, #char '_'));
      let dt = if (parts.size() > 0) parts[0] else "";
      
      // Calculate USD value using pre-fetched rates (assuming NUA token for now)
      let usd = Float.fromInt(d.v) * nuaUsdRate;
      let vol = { tokenAddress = ENV.NUA_TOKEN_CANISTER_ID; amount = d.v; usdAmount = usd };
      buf.add({ dateTime = dt; user = d.user; transactions = d.n; volume = [vol] });
    };
    
    #ok(Buffer.toArray(buf))
  };

  //----------------------  PUBLIC API  -----------------------------//
  
  // Main functions for daily and hourly data
  public func getDailyAggregatedData(date : Text, page : Nat)
        : async Result.Result<DailyDataResponse, Text> {
    if (Text.size(date) != 10) return #err("Invalid date YYYY-MM-DD");
    if (page < 1)             return #err("Page must be ≥ 1");

    try {
      let txs = await fetchTransactionsForDateSmart(date);
      switch (await _aggregateDaily(txs, date)) {
        case (#ok(acts)) #ok({ results = pageSlice(acts,page); pageCount = pages(acts.size()) });
        case (#err(e)) #err("Daily aggregation failed: " # e);
      }
    } catch (error) { #err("Error fetching daily data: " # Error.message(error)) }
  };

  public func getHourlyAggregatedData(date : Text, page : Nat)
        : async Result.Result<HourlyDataResponse, Text> {
    if (Text.size(date) != 10) return #err("Invalid date YYYY-MM-DD");
    if (page < 1)             return #err("Page must be ≥ 1");

    try {
      let txs = await fetchTransactionsForDateSmart(date);
      switch (await _aggregateHourly(txs, date)) {
        case (#ok(acts)) #ok({ results = pageSlice(acts,page); pageCount = pages(acts.size()) });
        case (#err(e)) #err("Hourly aggregation failed: " # e);
      }
    } catch (error) { #err("Error fetching hourly data: " # Error.message(error)) }
  };

  public func getCurrentBalance() : async Result.Result<BalanceResponse, Text> {
    try {
      let ledger : LedgerInterface = actor(ENV.NUA_TOKEN_CANISTER_ID);
      let total  = await ledger.icrc1_total_supply();
      switch (await getTokenVolumeOptimized(total, ENV.NUA_TOKEN_CANISTER_ID)) {
        case (#ok(vol)) #ok({ balance = [vol] });
        case (#err(e)) #err("Balance USD conversion failed: " # e);
      }
    } catch _ { #err("Error fetching balance") }
  };

  public func getMetricsSummary() : async Result.Result<MetricsSummary, Text> {
    try {
      let balRes = await getCurrentBalance();
      let daily  = await getDailyAggregatedData(getCurrentDateString(), 1); // Use current date for real data

      let bal    = switch balRes { case (#ok(b)) b.balance[0].amount; case _ 0 };
      let (u,t,v)= switch daily {
        case (#ok(d)) {
          let users = d.results.size();
          let txs   = Array.foldLeft<UserActivity,Nat>(d.results,0,func(a,b){a+b.transactions});
          let vol   = Array.foldLeft<UserActivity,Nat>(d.results,0,func(a,b){
                        Array.foldLeft<TokenVolume,Nat>(b.volume,a,func(s,x){s+x.amount})});
          (users,txs,vol)
        };
        case _ (0,0,0)
      };
      #ok({ totalUsers=u; totalTransactions=t; totalVolume=v; currentBalance=bal })
    } catch _ { #err("Failed to get metrics summary") }
  };

  //------------------  HTTP HELPERS  ---------------------------//
  
  // JSON response helper
  private func jsonResponse(status : Nat16, body : Text) : HttpResponse {
    {
      status_code = status;
      headers = [("Content-Type", "application/json")];
      body = Iter.toArray(Text.encodeUtf8(body).vals());
      upgrade = null;
    }
  };

  // HTTP request router for DappRadar endpoints
  public func handleHttpRequest(req : HttpRequest) : async HttpResponse {
    let url = req.url;
    
    // Parse URL and extract endpoint
    if (Text.contains(url, #text "/dapp-radar/daily/")) {
      // Extract date and page from URL - simplified parsing
      let date = getDate60DaysAgo(); // Use 60 days ago as default for testing
      let page = 1; // Default page - should parse from URL
      
      switch (await getDailyAggregatedData(date, page)) {
        case (#ok(data)) {
          let json = "{\"results\":" # debug_show(data.results) # 
                    ",\"pageCount\":" # Nat.toText(data.pageCount) # "}";
          jsonResponse(200, json)
        };
        case (#err(err)) jsonResponse(400, "{\"error\":\"" # err # "\"}");
      }
    } else if (Text.contains(url, #text "/dapp-radar/hourly/")) {
      // Extract date and page from URL - simplified parsing
      let date = getDate60DaysAgo(); // Use 60 days ago as default for testing
      let page = 1; // Default page - should parse from URL
      
      switch (await getHourlyAggregatedData(date, page)) {
        case (#ok(data)) {
          let json = "{\"results\":" # debug_show(data.results) # 
                    ",\"pageCount\":" # Nat.toText(data.pageCount) # "}";
          jsonResponse(200, json)
        };
        case (#err(err)) jsonResponse(400, "{\"error\":\"" # err # "\"}");
      }
    } else if (Text.contains(url, #text "/dapp-radar/balance")) {
      switch (await getCurrentBalance()) {
        case (#ok(data)) {
          let json = "{\"balance\":" # debug_show(data.balance) # "}";
          jsonResponse(200, json)
        };
        case (#err(err)) jsonResponse(400, "{\"error\":\"" # err # "\"}");
      }
    }  else {
      jsonResponse(404, "{\"error\":\"Endpoint not found\"}")
    }
  };

  //------------------  JSON FORMAT HELPERS  -------------------//
  
  public func formatDailyDataResponse(data : DailyDataResponse) : Text {
    "{\"results\":" # debug_show(data.results) # 
    ",\"pageCount\":" # Nat.toText(data.pageCount) # "}"
  };

  public func formatHourlyDataResponse(data : HourlyDataResponse) : Text {
    "{\"results\":" # debug_show(data.results) # 
    ",\"pageCount\":" # Nat.toText(data.pageCount) # "}"
  };

  public func formatBalanceResponse(data : BalanceResponse) : Text {
    "{\"balance\":" # debug_show(data.balance) # "}"
  };

  // Debug function to test USD rate calculation
  public func debugUsdRate() : async Text {
    // First let's debug the ICP/USD rate
    switch (await getIcpUsdRate()) {
      case (#ok(icpUsdRate)) {
        let icpInfo = "ICP/USD rate: $" # Float.toText(icpUsdRate) # " per ICP | ";
        
        // Now debug the ICP/NUA pool
        let Pool = CanisterDecls.getSonicPoolCanister(Sonic.ICP_NUA_POOL_CANISTER_ID);
        let oneIcpRq = { amountIn = Nat.toText(100_000_000); zeroForOne = false; amountOutMinimum = "" };
        switch (await Pool.quote(oneIcpRq)) {
          case (#ok(nuaPerIcp)) {
            let poolInfo = "1 ICP = " # Nat.toText(nuaPerIcp) # " NUA units | ";
            let nuaTokensPerIcp = Float.fromInt(nuaPerIcp) / Float.pow(10, 8);
            let tokenInfo = "1 ICP = " # Float.toText(nuaTokensPerIcp) # " NUA tokens | ";
            let usdPerNuaUnit = icpUsdRate / Float.fromInt(nuaPerIcp);
            let usdPerNuaToken = icpUsdRate / nuaTokensPerIcp;
            
            icpInfo # poolInfo # tokenInfo # 
            "USD per NUA unit (e8): " # Float.toText(usdPerNuaUnit) # " | " #
            "USD per NUA token: $" # Float.toText(usdPerNuaToken) # " | " #
            "For 63,381,971 units: $" # Float.toText(Float.fromInt(63_381_971) * usdPerNuaUnit)
          };
          case (#err(e)) { "Pool error: " # debug_show(e) };
        }
      };
      case (#err(e)) { "ICP/USD error: " # e };
    };
  };

  //----------------------  TRANSACTION FETCHING  ----------------------//

  // Optimized function to fetch transactions for a specific date
  public func fetchTransactionsForDateSmart(targetDate: Text) : async [TransactionData] {
    let buffer = Buffer.Buffer<TransactionData>(1000);
    
    try {
      let ledger = CanisterDecls.getIcrc1Canister(ENV.NUA_TOKEN_CANISTER_ID);
      var currentIndex = 0;
      let batchSize = 1000;
      var keepFetching = true;
      var batchCount = 0;
      let maxBatches = 5; // Limit to prevent timeouts
      
      while (keepFetching and batchCount < maxBatches) {
        let request = { start = currentIndex; length = batchSize };
        let response = await ledger.get_transactions(request);
        
        if (response.transactions.size() == 0) {
          keepFetching := false;
        } else {
          var foundTargetDate = false;
          
          for (tx in response.transactions.vals()) {
            let txDate = timestampToDateString(Int.abs(Nat64.toNat(tx.timestamp)));
            
            if (txDate == targetDate) {
              foundTargetDate := true;
              // Process transfer transactions
              switch (tx.transfer) {
                case (?transfer) {
                  buffer.add({
                    timestamp = tx.timestamp;
                    user = transfer.to.owner;
                    amount = transfer.amount;
                    transactionType = "transfer"
                  });
                };
                case null {};
              };
              // Process mint transactions
              switch (tx.mint) {
                case (?mint) {
                  buffer.add({
                    timestamp = tx.timestamp;
                    user = mint.to.owner;
                    amount = mint.amount;
                    transactionType = "mint"
                  });
                };
                case null {};
              };
            } else if (txDate < targetDate and foundTargetDate) {
              // We've passed the target date, stop fetching
              keepFetching := false;
            };
          };
          
          currentIndex += response.transactions.size();
          batchCount += 1;
        };
      };
      
      Buffer.toArray(buffer)
    } catch (error) {
      _Debug.print("Error fetching transactions for date " # targetDate # ": " # Error.message(error));
      []
    }
  };

}
