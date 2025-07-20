import Buffer "mo:base/Buffer";
import Error "mo:base/Error";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";

import CanisterDecls "../shared/CanisterDeclarations";
import DateTime "../shared/DateTime";
import ENV "../shared/env";
import Types "./types";

module CacheInitializer {

  type TransactionData = Types.TransactionData;
  type UserActivity = Types.UserActivity;
  type HourlyUserActivity = Types.HourlyUserActivity;

  // Threshold for switching between archive and main ledger
  // This will be passed as a parameter to functions that need it

  public type ProcessResult = {
    processedTransactions: Nat;
    dailyEntries: [(Text, Text)];
    hourlyEntries: [(Text, Text)];
  };

  private func timestampToDateString(ts : Int) : Text {
    let dt = DateTime.DateTime(?Int.abs(ts));
    dt.showYear() # "-" # dt.showMonth() # "-" # dt.showDay()
  };

  private func timestampToDateTimeString(ts : Int) : Text {
    let dt = DateTime.DateTime(?Int.abs(ts));
    dt.showYear() # "-" # dt.showMonth() # "-" # dt.showDay() # " " # dt.showHours() # ":00:00"
  };

  private func processTransactionBatch(txs: [CanisterDecls.Transaction]) : [TransactionData] {
    let buf = Buffer.Buffer<TransactionData>(txs.size());
    for (tx in txs.vals()) {
      switch (tx.transfer) {
        case (?tr) buf.add({ 
          timestamp = tx.timestamp; 
          user = tr.to.owner; 
          amount = tr.amount; 
          transactionType = "transfer" 
        });
        case null { /* skip */ };
      };
      switch (tx.mint) {
        case (?m) buf.add({ 
          timestamp = tx.timestamp; 
          user = m.to.owner; 
          amount = m.amount; 
          transactionType = "mint" 
        });
        case null { /* skip */ };
      };
    };
    Buffer.toArray(buf)
  };

  private func aggregateTransactionsByDate(txs: [TransactionData]) : ([(Text, [UserActivity])], [(Text, [HourlyUserActivity])]) {
    let dailyMap = HashMap.HashMap<Text, HashMap.HashMap<Text, {var n:Nat; var v:Nat}>>(32, Text.equal, Text.hash);
    let hourlyMap = HashMap.HashMap<Text, HashMap.HashMap<Text, {var n:Nat; var v:Nat; user:Text}>>(64, Text.equal, Text.hash);

    // Process transactions and group by date/hour
    for (tx in txs.vals()) {
      let txDate = timestampToDateString(Int.abs(Nat64.toNat(tx.timestamp)));
      let txDateTime = timestampToDateTimeString(Int.abs(Nat64.toNat(tx.timestamp)));
      let userKey = Principal.toText(tx.user);

      // Daily aggregation
      switch (dailyMap.get(txDate)) {
        case (?dayMap) {
          switch (dayMap.get(userKey)) {
            case (?userData) { userData.n += 1; userData.v += tx.amount };
            case null dayMap.put(userKey, {var n = 1; var v = tx.amount});
          }
        };
        case null {
          let newDayMap = HashMap.HashMap<Text, {var n:Nat; var v:Nat}>(16, Text.equal, Text.hash);
          newDayMap.put(userKey, {var n = 1; var v = tx.amount});
          dailyMap.put(txDate, newDayMap);
        };
      };

      // Hourly aggregation
      let hourlyKey = txDateTime # "_" # userKey;
      switch (hourlyMap.get(txDate)) {
        case (?hourMap) {
          switch (hourMap.get(hourlyKey)) {
            case (?hourData) { hourData.n += 1; hourData.v += tx.amount };
            case null hourMap.put(hourlyKey, {var n = 1; var v = tx.amount; user = userKey});
          }
        };
        case null {
          let newHourMap = HashMap.HashMap<Text, {var n:Nat; var v:Nat; user:Text}>(16, Text.equal, Text.hash);
          newHourMap.put(hourlyKey, {var n = 1; var v = tx.amount; user = userKey});
          hourlyMap.put(txDate, newHourMap);
        };
      };
    };

    // Convert to arrays with simplified format (no USD conversion for cache)
    let dailyResults = Buffer.Buffer<(Text, [UserActivity])>(dailyMap.size());
    for ((date, userMap) in dailyMap.entries()) {
      let users = Buffer.Buffer<UserActivity>(userMap.size());
      for ((user, data) in userMap.entries()) {
        let vol = { tokenAddress = ENV.NUA_TOKEN_CANISTER_ID; amount = data.v; usdAmount = 0.0 };
        users.add({ user = user; transactions = data.n; volume = [vol] });
      };
      dailyResults.add((date, Buffer.toArray(users)));
    };

    let hourlyResults = Buffer.Buffer<(Text, [HourlyUserActivity])>(hourlyMap.size());
    for ((date, hourMap) in hourlyMap.entries()) {
      let hours = Buffer.Buffer<HourlyUserActivity>(hourMap.size());
      for ((key, data) in hourMap.entries()) {
        let parts = Iter.toArray(Text.split(key, #char '_'));
        let dateTime = if (parts.size() > 0) parts[0] else "";
        let vol = { tokenAddress = ENV.NUA_TOKEN_CANISTER_ID; amount = data.v; usdAmount = 0.0 };
        hours.add({ dateTime = dateTime; user = data.user; transactions = data.n; volume = [vol] });
      };
      hourlyResults.add((date, Buffer.toArray(hours)));
    };

    (Buffer.toArray(dailyResults), Buffer.toArray(hourlyResults))
  };

  private func formatCacheEntries(dailyData: [(Text, [UserActivity])], hourlyData: [(Text, [HourlyUserActivity])]) : ([(Text, Text)], [(Text, Text)]) {
    let dailyEntries = Buffer.Buffer<(Text, Text)>(dailyData.size());
    let hourlyEntries = Buffer.Buffer<(Text, Text)>(hourlyData.size());

    // Format daily entries as JSON
    for ((date, activities) in dailyData.vals()) {
      let jsonData = "{\"results\":" # debug_show(activities) # ",\"pageCount\":1}";
      dailyEntries.add((date, jsonData));
    };

    // Format hourly entries as JSON  
    for ((date, activities) in hourlyData.vals()) {
      let jsonData = "{\"results\":" # debug_show(activities) # ",\"pageCount\":1}";
      hourlyEntries.add((date, jsonData));
    };

    (Buffer.toArray(dailyEntries), Buffer.toArray(hourlyEntries))
  };

  // Process a specific range of transactions with archive support
  public func processTransactionRange(start: Nat, length: Nat, archiveThreshold: Nat) : async Result.Result<ProcessResult, Text> {
    try {
      let txBuffer = Buffer.Buffer<CanisterDecls.Transaction>(length);
      
      // Determine if we should fetch from archive or main ledger
      // Archive handles transactions below threshold, main ledger handles threshold+
      if (start < archiveThreshold) {
        // Fetch from archive canister directly
        let archiveCanister = actor("ssx2b-6qaaa-aaaaq-aabya-cai") : actor {
          get_transactions : shared query ({ start : Nat; length : Nat }) -> async ({ transactions : [CanisterDecls.Transaction] });
        };
        
        let resp = try {
          await archiveCanister.get_transactions({ start = start; length = length })
        } catch (error) {
          return #err("Archive get_transactions failed for range " # Nat.toText(start) # "-" # Nat.toText(start + length) # ": " # Error.message(error));
        };
        
        // Add archive transactions
        for (tx in resp.transactions.vals()) {
          txBuffer.add(tx);
        };
        
      } else {
        // Fetch from main ledger for recent transactions (92k+)
        let ledger = CanisterDecls.getIcrc1Canister(ENV.NUA_TOKEN_CANISTER_ID);
        
        let resp = try {
          await ledger.get_transactions({ start = start; length = length })
        } catch (error) {
          return #err("Ledger get_transactions failed for range " # Nat.toText(start) # "-" # Nat.toText(start + length) # ": " # Error.message(error));
        };
        
        // Add main ledger transactions
        for (tx in resp.transactions.vals()) {
          txBuffer.add(tx);
        };
        
        // Note: We skip archived_transactions from the main ledger response
        // since we're handling archives separately
      };

      // Process collected transactions with error handling
      let processedTxs = try {
        processTransactionBatch(Buffer.toArray(txBuffer))
      } catch (error) {
        return #err("Transaction batch processing failed: " # Error.message(error));
      };
      
      let (dailyData, hourlyData) = try {
        aggregateTransactionsByDate(processedTxs)
      } catch (error) {
        return #err("Transaction aggregation failed: " # Error.message(error));
      };
      
      let (dailyEntries, hourlyEntries) = try {
        formatCacheEntries(dailyData, hourlyData)
      } catch (error) {
        return #err("Cache entry formatting failed: " # Error.message(error));
      };

      let source = if (start < archiveThreshold) "archive" else "ledger";
      let _resultMessage = "Processed " # Nat.toText(txBuffer.size()) # " transactions from " # source # " range " # Nat.toText(start) # "-" # Nat.toText(start + length);

      #ok({
        processedTransactions = txBuffer.size();
        dailyEntries = dailyEntries;
        hourlyEntries = hourlyEntries;
      })

    } catch (error) {
      #err("Unexpected error in processTransactionRange: " # Error.message(error))
    }
  };

};
