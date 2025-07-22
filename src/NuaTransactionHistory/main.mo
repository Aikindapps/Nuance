import Bool "mo:base/Bool";
import Error "mo:base/Error";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Map "mo:hashmap/Map";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Prim "mo:prim";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Timer "mo:base/Timer";

import Cycles "mo:base/ExperimentalCycles";
import CanisterDecls "../shared/CanisterDeclarations";
import CacheInit "./init";
import DappRadar "./dappRadar";
import DateTime "../shared/DateTime";
import ENV "../shared/env";
import Html "./html";
import Types "./types";
import TypesStandards "../shared/TypesStandards";
import U "../shared/utils";
import Versions "../shared/versions";

actor NuaTransactionHistory {

  type OperationLog = Types.OperationLog;
  type SupportedStandard = TypesStandards.SupportedStandard;
  type Icrc28TrustedOriginsResponse = TypesStandards.Icrc28TrustedOriginsResponse;
  type HttpRequest = Types.HttpRequest;
  type HttpResponse = Types.HttpResponse;

  let {thash; phash = _} = Map;
  stable var platformOperatorsLog : [OperationLog] = [];
  stable var MAX_MEMORY_SIZE = 380000000;
  stable var ARCHIVE_LEDGER_THRESHOLD : Nat = 92000;
  
  // Cache initialization state
  stable var dailyAggregatedData = Map.new<Text, Text>();
  stable var hourlyAggregatedData = Map.new<Text, Text>();
  
  // Recent transaction cache state
  stable var lastCacheUpdate : Int = 0;
  stable var lastCachedRange : ?{start: Nat; end: Nat} = null;
  stable var timerStarted : Bool = false;

  private let Unauthorized = "Unauthorized";

  private func isAnonymous(caller : Principal) : Bool {
    Principal.equal(caller, Principal.fromText("2vxsx-fae"));
  };

  private func isAdmin(caller : Principal) : Bool {
    U.arrayContains(ENV.NUA_TRANSACTION_HISTORY_CANISTER_ADMINS, Principal.toText(caller));
  };

  private func isPlatformOperator(caller : Principal) : Bool {
    ENV.isPlatformOperator(caller)
  };

  public shared ({ caller }) func setMaxMemorySize(newValue : Nat) : async Result.Result<Nat, Text> {
    if (isAnonymous(caller) or not (isAdmin(caller) or isPlatformOperator(caller))) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("setMaxMemorySize", Principal.toText(caller));
    MAX_MEMORY_SIZE := newValue;
    #ok(MAX_MEMORY_SIZE);
  };

  public shared ({ caller }) func processTransactionRange(start: Nat, end: Nat) : async Result.Result<Text, Text> {
    if (isAnonymous(caller) or not (isAdmin(caller) or isPlatformOperator(caller))) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("processTransactionRange", Principal.toText(caller));
    
    if (start >= end) {
      return #err("Invalid range: start (" # Nat.toText(start) # ") must be less than end (" # Nat.toText(end) # ")");
    };
    
    let length = Int.abs(end - start);
    if (length > 10000) {
      return #err("Range too large: " # Nat.toText(length) # " transactions (max 10000)");
    };
    
    try {
      switch (await CacheInit.processTransactionRange(start, length, ARCHIVE_LEDGER_THRESHOLD)) {
        case (#ok(result)) {
          // Store processed cache data
          for ((date, data) in result.dailyEntries.vals()) {
            Map.set(dailyAggregatedData, thash, date, data);
          };
          for ((date, data) in result.hourlyEntries.vals()) {
            Map.set(hourlyAggregatedData, thash, date, data);
          };
          
          let message = "Processed " # Nat.toText(result.processedTransactions) # " transactions from " # Nat.toText(start) # " to " # Nat.toText(start + length);
          #ok(message)
        };
        case (#err(e)) {
          #err("Range " # Nat.toText(start) # "-" # Nat.toText(start + length) # " failed: " # e)
        };
      }
    } catch (error) {
      #err("Transaction processing failed for range " # Nat.toText(start) # "-" # Nat.toText(start + length) # ": " # Error.message(error))
    }
  };

  public query func getCacheStatus() : async {
    dailyCacheSize: Nat;
    hourlyCacheSize: Nat;
  } {
    {
      dailyCacheSize = Map.size(dailyAggregatedData);
      hourlyCacheSize = Map.size(hourlyAggregatedData);
    }
  };

  // Recent transaction caching functions
  private func formatTimestamp(timestamp: Int) : Text {
    if (timestamp == 0) {
      "Never"
    } else {
      // Convert Int to Nat nanoseconds for DateTime
      let timestampNat = Int.abs(timestamp);
      let dt = DateTime.DateTime(?timestampNat);
      dt.showYear() # "-" # dt.showMonth() # "-" # dt.showDay() # " " # 
      dt.showHours() # ":" # dt.showMinutes() # ":" # dt.showSeconds() # " UTC"
    }
  };

  private func cacheRecentTransactions() : async () {
    try {
      let ledger = CanisterDecls.getIcrc1Canister(ENV.NUA_TOKEN_CANISTER_ID);
      
      // First, get current transaction range info
      let rangeInfo = await ledger.get_transactions({ start = 0; length = 1 });
      let firstIndex = rangeInfo.first_index;
      let logLength = rangeInfo.log_length;
      
      // Cache transactions from first_index to log_length
      let start = firstIndex;
      let length = Int.abs(logLength - firstIndex);
      
      // Limit to reasonable batch size (max 5000 transactions)
      let batchSize = if (length > 5000) { 5000 } else { length };
      
      if (batchSize > 0) {
        switch (await CacheInit.processTransactionRange(start, batchSize, ARCHIVE_LEDGER_THRESHOLD)) {
          case (#ok(result)) {
            // Store processed cache data (overwrite previous)
            for ((date, data) in result.dailyEntries.vals()) {
              Map.set(dailyAggregatedData, thash, date, data);
            };
            for ((date, data) in result.hourlyEntries.vals()) {
              Map.set(hourlyAggregatedData, thash, date, data);
            };
            
            lastCacheUpdate := Time.now();
            lastCachedRange := ?{start = start; end = start + batchSize};
          };
          case (#err(_)) {
            // Silently handle errors in background timer
          };
        }
      };
    } catch (_) {
      // Silently handle errors in background timer
    }
  };

  public func startRecentTransactionCache() : async Result.Result<Text, Text> {
    if (timerStarted) {
      return #ok("Timer already started");
    };
    
    // Start immediate cache update
    await cacheRecentTransactions();
    
    // Set up 15-minute recurring timer (15 * 60 * 1_000_000_000 nanoseconds)
    let _timerId = Timer.recurringTimer<system>(#nanoseconds(15 * 60 * 1_000_000_000), cacheRecentTransactions);
    timerStarted := true;
    
    #ok("Recent transaction cache timer started (15-minute intervals)")
  };

  public shared ({ caller }) func refreshRecentTransactionCache() : async Result.Result<Text, Text> {
    if (isAnonymous(caller) or not (isAdmin(caller) or isPlatformOperator(caller))) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("refreshRecentTransactionCache", Principal.toText(caller));
    
    try {
      await cacheRecentTransactions();
      #ok("Recent transaction cache refreshed successfully")
    } catch (error) {
      #err("Failed to refresh recent transaction cache: " # Error.message(error))
    }
  };

  public shared ({ caller }) func forceStartTimer() : async Result.Result<Text, Text> {
    if (isAnonymous(caller) or not (isAdmin(caller) or isPlatformOperator(caller))) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("forceStartTimer", Principal.toText(caller));
    
    // Reset the timer state and force start
    timerStarted := false;
    await startRecentTransactionCache()
  };

  public query func getRecentCacheStatus() : async {
    lastUpdate: Text;
    lastCachedRange: ?{start: Nat; end: Nat};
    timerActive: Bool;
  } {
    {
      lastUpdate = if (lastCacheUpdate == 0) { "Never" } else { formatTimestamp(lastCacheUpdate) };
      lastCachedRange = lastCachedRange;
      timerActive = timerStarted;
    }
  };

  public query func getMaxMemorySize() : async Nat { MAX_MEMORY_SIZE };
  public query func isThereEnoughMemory() : async Bool { MAX_MEMORY_SIZE > Prim.rts_memory_size() };
  public query func getMemorySize() : async Nat { Prim.rts_memory_size() };

  public func acceptCycles() : async () {
    let available = Cycles.available();
    let accepted = Cycles.accept<system>(available);
    assert (accepted == available);
  };

  public query func availableCycles() : async Nat { Cycles.balance() };

  //----------------------  CACHE MANAGEMENT  ----------------------//

  public func getDailyData(date: Text, page: Nat) : async {#ok: Text; #err: Text} {
    switch (Map.get(dailyAggregatedData, thash, date)) {
      case (?cachedData) #ok(cachedData);
      case null {
        // Fall back to DappRadar for missing data
        switch (await DappRadar.getDailyAggregatedData(date, page)) {
          case (#ok(data)) {
            let jsonData = DappRadar.formatDailyDataResponse(data);
            Map.set(dailyAggregatedData, thash, date, jsonData);
            #ok(jsonData)
          };
          case (#err(e)) #err(e);
        }
      };
    }
  };
  
  public func getHourlyData(date: Text, page: Nat) : async {#ok: Text; #err: Text} {
    switch (Map.get(hourlyAggregatedData, thash, date)) {
      case (?cachedData) #ok(cachedData);
      case null {
        // Fall back to DappRadar for missing data
        switch (await DappRadar.getHourlyAggregatedData(date, page)) {
          case (#ok(data)) {
            let jsonData = DappRadar.formatHourlyDataResponse(data);
            Map.set(hourlyAggregatedData, thash, date, jsonData);
            #ok(jsonData)
          };
          case (#err(e)) #err(e);
        }
      };
    }
  };
  
  public func getBalanceData() : async {#ok: Text; #err: Text} {
    switch (await DappRadar.getCurrentBalance()) {
      case (#ok(data)) #ok(DappRadar.formatBalanceResponse(data));
      case (#err(e)) #err(e);
    }
  };

  public func getTransactionData() : async {#ok: Text; #err: Text} {
    try {
      let ledger = CanisterDecls.getIcrc1Canister(ENV.NUA_TOKEN_CANISTER_ID);
      let response = await ledger.get_transactions({ start = 0; length = 0 });
      let latestTransactionId = response.log_length;
      let jsonData = "{\"latestTransactionId\":" # Nat.toText(latestTransactionId) # "}";
      #ok(jsonData)
    } catch (_) {
      #err("Failed to fetch latest transaction ID from ledger")
    }
  };

  public func getUawData() : async {#ok: Text; #err: Text} {
    try {
      let userCanister = CanisterDecls.getUserCanister();
      let totalUsers = await userCanister.getNumberOfAllRegisteredUsers();
      let jsonData = "{\"uniqueActiveWallets\":" # Nat.toText(totalUsers) # "}";
      #ok(jsonData)
    } catch (_) {
      #err("Failed to fetch UAW data from User canister")
    }
  };

  private func parseUrlForDateAndPage(url: Text) : ?{date: Text; page: Nat; dataType: Text} {
    let parts = Iter.toArray(Text.split(url, #char '/'));
    if (parts.size() >= 5 and parts[1] == "dapp-radar" and parts[2] == "aggregated-data") {
      let date = parts[3];
      let dataTypeAndQuery = parts[4];
      let dataTypeParts = Iter.toArray(Text.split(dataTypeAndQuery, #char '?'));
      let dataType = dataTypeParts[0];
      let page = if (dataTypeParts.size() > 1 and Text.contains(dataTypeParts[1], #text "page=")) {
        let pageStr = Text.replace(dataTypeParts[1], #text "page=", "");
        switch (Nat.fromText(pageStr)) { case (?p) p; case null 1; }
      } else { 1 };
      ?{ date = date; page = page; dataType = dataType }
    } else { null }
  };

  private func jsonResponse(status: Nat16, data: Text) : HttpResponse {
    {
      status_code = status;
      headers = [("Content-Type", "application/json"), ("Access-Control-Allow-Origin", "*")];
      body = Iter.toArray(Text.encodeUtf8(data).vals());
      upgrade = null;
    }
  };

  private func errorResponse(status: Nat16, message: Text) : HttpResponse {
    jsonResponse(status, "{\"error\":\"" # message # "\"}")
  };

  public query func http_request(_request: HttpRequest) : async HttpResponse {
    {
      status_code = 200;
      headers = [("Content-Type", "text/html")];
      body = Iter.toArray(Text.encodeUtf8("Use http_request_update for real-time data").vals());
      upgrade = ?true;
    }
  };

  public func http_request_update(request: HttpRequest) : async HttpResponse {
    let url = request.url;
    
    if (Text.contains(url, #text "/debug")) {
      return await Html.generateDebugDashboard();
    };

    if (Text.contains(url, #text "/cache-status")) {
      let status = await getCacheStatus();
      let recentStatus = await getRecentCacheStatus();
      let jsonData = "{\"dailyCacheSize\":" # Nat.toText(status.dailyCacheSize) #
                     ",\"hourlyCacheSize\":" # Nat.toText(status.hourlyCacheSize) #
                     ",\"recentCacheLastUpdate\":\"" # recentStatus.lastUpdate # "\"" #
                     ",\"recentCacheTimerActive\":" # Bool.toText(recentStatus.timerActive) #
                     ",\"lastCachedRange\":" # 
                     (switch (recentStatus.lastCachedRange) {
                       case (?range) "{\"start\":" # Nat.toText(range.start) # ",\"end\":" # Nat.toText(range.end) # "}";
                       case null "null";
                     }) # "}";
      return jsonResponse(200, jsonData);
    };
    
    if (Text.contains(url, #text "/dapp-radar/aggregated-data/balance")) {
      switch (await getBalanceData()) {
        case (#ok(data)) jsonResponse(200, data);
        case (#err(e)) errorResponse(500, e);
      }
    } else if (Text.contains(url, #text "/dapp-radar/aggregated-data/transactions")) {
      switch (await getTransactionData()) {
        case (#ok(data)) jsonResponse(200, data);
        case (#err(e)) errorResponse(500, e);
      }
    } else if (Text.contains(url, #text "/dapp-radar/aggregated-data/uaw")) {
      switch (await getUawData()) {
        case (#ok(data)) jsonResponse(200, data);
        case (#err(e)) errorResponse(500, e);
      }
    } else if (Text.contains(url, #text "/dapp-radar/aggregated-data/")) {
      switch (parseUrlForDateAndPage(url)) {
        case (?parsed) {
          if (parsed.dataType == "daily") {
            switch (await getDailyData(parsed.date, parsed.page)) {
              case (#ok(data)) jsonResponse(200, data);
              case (#err(e)) errorResponse(400, e);
            }
          } else if (parsed.dataType == "hourly") {
            switch (await getHourlyData(parsed.date, parsed.page)) {
              case (#ok(data)) jsonResponse(200, data);
              case (#err(e)) errorResponse(400, e);
            }
          } else {
            errorResponse(404, "Invalid data type")
          }
        };
        case null errorResponse(400, "Invalid URL format");
      }
    } else {
      errorResponse(404, "Endpoint not found")
    }
  };

  public query func icrc10_supported_standards() : async [SupportedStandard] {
    ENV.supportedStandards;
  };

  public func icrc28_trusted_origins() : async Icrc28TrustedOriginsResponse {
    { trusted_origins = ENV.getTrustedOrigins(); }
  };

  public query func getCanisterVersion() : async Text {
    Versions.NUA_TRANSACTION_HISTORY_VERSION;
  };

  public query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      #err("Cannot use this method anonymously.")
    } else {
      #ok(ENV.NUA_TRANSACTION_HISTORY_CANISTER_ADMINS)
    }
  };

  public query func getPlatformOperators() : async List.List<Text> {
    List.fromArray(ENV.PLATFORM_OPERATORS);
  };

  public query func getPlatformOperatorsLog() : async Result.Result<[OperationLog], Text> {
    #ok(platformOperatorsLog);
  };

  public shared ({ caller }) func setArchiveLedgerThreshold(newThreshold : Nat) : async Result.Result<Nat, Text> {
    if (isAnonymous(caller) or not (isAdmin(caller) or isPlatformOperator(caller))) {
      return #err(Unauthorized);
    };
    ignore U.logMetrics("setArchiveLedgerThreshold", Principal.toText(caller));
    ARCHIVE_LEDGER_THRESHOLD := newThreshold;
    #ok(ARCHIVE_LEDGER_THRESHOLD);
  };

  public query func getArchiveLedgerThreshold() : async Nat { 
    ARCHIVE_LEDGER_THRESHOLD 
  };

  // Initialize timer on actor startup
  ignore Timer.setTimer<system>(#nanoseconds(5_000_000_000), func() : async () {
    if (not timerStarted) {
      ignore await startRecentTransactionCache();
    };
  });

};
