import Map "mo:hashmap/Map"; 
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Bool "mo:base/Bool";
import Option "mo:base/Option";
import Array "mo:base/Array";
import Nat32 "mo:base/Nat32";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Nat64 "mo:base/Nat64";
import CanisterDeclarations "../shared/CanisterDeclarations";
import U "../shared/utils";
import ENV "../shared/env";
import Cycles "mo:base/ExperimentalCycles";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Notifications "../Notifications/types";

actor Subscription {
    let { ihash; nhash; thash; phash; calcHash } = Map;
    //the time interval for subscription events
    type SubscriptionTimeInterval = {
        #Weekly;
        #Monthly;
        #Annually;
        #LifeTime;
    };
    //all the details of the writer's subscription info and history
    type WriterSubscriptionDetails = {
        writerPrincipalId: Text;
        weeklyFee: ?Nat32;
        monthlyFee: ?Nat32;
        annuallyFee: ?Nat32;
        lifeTimeFee: ?Nat32;
        isSubscriptionActive: Bool;
        writerSubscriptions: [SubscriptionEvent];
    };
    //all the details of the reader's subscription history
    type ReaderSubscriptionDetails = {
        readerPrincipalId: Text;
        readerSubscriptions: [SubscriptionEvent];
        readerNotStoppedSubscriptionsWriters: [WriterSubscriptionDetails];
    };
    //used as argument in updateSubscriptionDetails function
    type UpdateSubscriptionDetailsModel = {
        publicationInformation: ?(paymentReveiverAddress: Principal, publicationCanisterId: Text);
        weeklyFee: ?Nat32;
        monthlyFee: ?Nat32;
        annuallyFee: ?Nat32;
        lifeTimeFee: ?Nat32;
    };
    //single subscription event
    type SubscriptionEvent = {
        subscriptionEventId: Text;
        writerPrincipalId: Text;
        readerPrincipalId: Text;
        subscriptionTimeInterval: SubscriptionTimeInterval;
        paymentFee: Nat32;
        startTime: Int;
        endTime: Int;
        isWriterSubscriptionActive: Bool;
    };

    //payment request returned to the reader
    type PaymentRequest = {
        subscriptionEventId: Text;
        writerPrincipalId: Text;
        readerPrincipalId: Text;
        subscriptionTimeInterval: SubscriptionTimeInterval;
        paymentFee: Nat32;
        expirationDate: Int;
        subaccount: Blob;
    };
    //unique id for every subscription event
    stable var subscriptionEventCounter = 0;
    //the unix time of the last time the timer has been called
    stable var lastTimerCalled : Int = 0;
    //cycles balance of the canister when the timer method has been called last time
    stable var cyclesBalanceWhenTimerIsCalledLastTime = 0;

    //key: writer principal id, value: isSubscriptionActive
    stable var writerPrincipalIdToIsSubscriptionActive = Map.new<Text, Bool>();
    //key: writer principal id, value: the address that will receive the subscription fee
    stable var writerPrincipalIdToPaymentReceiverAddress = Map.new<Text, Principal>();
    //key: writer principal id, value: weekly subscription fee
    stable var writerPrincipalIdToWeeklySubscriptionFee = Map.new<Text, Nat32>();
    //key: writer principal id, value: monthly subscription fee
    stable var writerPrincipalIdToMonthlySubscriptionFee = Map.new<Text, Nat32>();
    //key: writer principal id, value: annually subscription fee
    stable var writerPrincipalIdToAnnuallySubscriptionFee = Map.new<Text, Nat32>();
    //key: writer principal id, value: life time subscription fee
    stable var writerPrincipalIdToLifeTimeSubscriptionFee = Map.new<Text, Nat32>();
    //key: writer principal id, value: array of subscription events of the writer
    stable var writerPrincipalIdToSubscriptionEventIds = Map.new<Text, [Text]>();

    //key: reader principal id, value: array of subscription events of the reader
    stable var readerPrincipalIdToSubscriptionEventIds = Map.new<Text, [Text]>();
    //key: reader principal id, value: array of writer principal ids that reader has an active subscription
    //user may want to stop the subscription by deleting the writer principal id from here
    //the writer principal id is deleted automatically right after user has been notified
    stable var readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds = Map.new<Text, [Text]>();

    //key: subscription event id, value: the principal id of the writer of the subscription event
    stable var subscriptionEventIdToWriterPrincipalId = Map.new<Text, Text>();
    //key: subscription event id, value: the principal id of the reader of the subscription event
    stable var subscriptionEventIdToReaderPrincipalId = Map.new<Text, Text>();
    //key: subscription event id, value: subscription interval (weekly, monthly etc.)
    stable var subscriptionEventIdToSubscriptionTimeInterval = Map.new<Text, SubscriptionTimeInterval>();
    //key: subscription event id, value: amount of the payment sent at the time of the subscription
    stable var subscriptionEventIdToPaymentFee = Map.new<Text, Nat32>();
    //key: subscription event id, value: unix time of subscription start
    stable var subscriptionEventIdToStartTime = Map.new<Text, Int>();
    //key: subscription event id, value: unix time of subscription end
    stable var subscriptionEventIdToEndTime = Map.new<Text, Int>();

    //key: subscription event id, value: pending payment request writer principal id
    stable var subscriptionEventIdToPaymentRequestWriterPrincipalId = Map.new<Text, Text>();
    //key: subscription event id, value: pending payment request reader principal id
    stable var subscriptionEventIdToPaymentRequestReaderPrincipalId = Map.new<Text, Text>();
    //key: subscription event id, value: pending payment request subscription time interval
    stable var subscriptionEventIdToPaymentRequestSubscriptionTimeInterval = Map.new<Text, SubscriptionTimeInterval>();
    //key: subscription event id, value: pending payment request fee
    stable var subscriptionEventIdToPaymentRequestFee = Map.new<Text, Nat32>();
    //key: subscription event id, value: unix time of payment request expiration date
    stable var subscriptionEventIdToPaymentRequestExpireTime = Map.new<Text, Int>();

    //a map to hold the pending token disbursements for stuck tokens sent by reader
    //key: SubscriptionEventId, value: reader principal id
    stable var pendingStuckTokenDisbursements = Map.new<Text, Text>();
    //a map to hold the regular token disbursements for each subscription event - to writer and the Nuance DAO
    //key: subscriptionEventId, value: [(receiver account principal id, receiver subaccount, amount)]
    stable var pendingTokenDisbursements = Map.new<Text, [(Text, ?Blob, Nat32)]>();

    //#region - public query functions

    //enables PostBucket canister to determine if the reader is an active subscriber of the writer
    public shared query func isReaderSubscriber(writerPrincipalId: Text, readerPrincipalId: Text) : async Bool {
        let readerDetails = buildReaderSubscriptionDetails(readerPrincipalId);
        let readerSubscriptionEvents = readerDetails.readerSubscriptions;
        let now = U.epochTime();
        for(subscriptionEvent in readerSubscriptionEvents.vals()){
            if(writerPrincipalId == subscriptionEvent.writerPrincipalId and now < subscriptionEvent.endTime){
                return true;
            };
        };
        false
    };

    //enables PostBucket canister to determine if the reader is an active subscriber of the writer
    public shared query func isWriterActivatedSubscription(writerPrincipalId: Text) : async Bool {
        Option.get(Map.get(writerPrincipalIdToIsSubscriptionActive, thash, writerPrincipalId), false);
    };

    //a function to query the subscription details and the history of the writer
    //should be called by the writer or editor
    //a regular writer should not provide any argument
    //an editor should provide the publicationCanisterId as the argument
    public shared composite query ({caller}) func getWriterSubscriptionDetails(publicationPrincipalId: ?Text) : async Result.Result<WriterSubscriptionDetails, Text> {
        switch(publicationPrincipalId) {
            case(?publicationCanisterId) {
                let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
                if(not (await PostCoreCanister.isEditorPublic(publicationCanisterId, caller))){
                    //not authorized to get the subscription details of the publication (including the subscription history)
                    return #err("Unauthorized.");
                }
                else{
                    //caller is the editor of the given publication
                    //if there exists any subscription detail, return the object
                    switch(Map.get(writerPrincipalIdToIsSubscriptionActive, thash, publicationCanisterId)) {
                        case(?value) {
                            return #ok(buildWriterSubscriptionDetails(publicationCanisterId))
                        };
                        case(null) {
                            return #err("No subscription record found.")
                        };
                    };
                }

            };
            case(null) {
                //the argument is null
                //if there exists any subscription detail for the writer, return it
                let principal = Principal.toText(caller);
                switch(Map.get(writerPrincipalIdToIsSubscriptionActive, thash, principal)) {
                    case(?value) {
                        return #ok(buildWriterSubscriptionDetails(principal))
                    };
                    case(null) {
                        return #err("No subscription record found.")
                    };
                };
            };
        };
    };

    //a function to query the subscription details of the writer
    //can be called by anyone - doesn't return the subscription history
    public shared query func getWriterSubscriptionDetailsByPrincipalId(principal: Text) : async Result.Result<WriterSubscriptionDetails, Text> {
        switch(Map.get(writerPrincipalIdToIsSubscriptionActive, thash, principal)) {
            case(?value) {
                return #ok(buildWriterSubscriptionDetailsLighter(principal))
            };
            case(null) {
                return #err("No subscription record found.")
            };
        };
    };

    //a function to query the subscription history of the reader
    //should be called by the reader
    public shared query ({caller}) func getReaderSubscriptionDetails() : async Result.Result<ReaderSubscriptionDetails, Text> {
        let principal = Principal.toText(caller);
        switch(Map.get(readerPrincipalIdToSubscriptionEventIds, thash, principal)) {
            case(?value) {
                return #ok(buildReaderSubscriptionDetails(principal))
            };
            case(null) {
                return #err("No subscription record found.")
            };
        };
    };

    //#region - public update functions
    //a function that allows writers to update their subscription details
    public shared ({caller}) func updateSubscriptionDetails(subscriptionDetails: UpdateSubscriptionDetailsModel) : async Result.Result<WriterSubscriptionDetails, Text> {
        let callerPrincipalId = Principal.toText(caller);
        var writerPrincipalId = callerPrincipalId;
        var paymentReceiverPrincipalId = caller;

        switch(subscriptionDetails.publicationInformation) {
            case(?publicationInformation) {
                //publication related info provided
                //check if the caller is an editor
                let PostCoreCanister = CanisterDeclarations.getPostCoreCanister();
                if(not (await PostCoreCanister.isEditorPublic(publicationInformation.1, caller))){
                    //caller is not an editor
                    //return an error
                    return #err("Unauthorized.");
                }
                else{
                    //caller is an editor
                    //update the writerPrincipalId value
                    writerPrincipalId := publicationInformation.1;
                    paymentReceiverPrincipalId := publicationInformation.0;
                }
            };
            case(null) {
                //publication related info not provided
                //a regular user called this method for his/her own account
                //check if the caller is a Nuance user
                let UserCanister = CanisterDeclarations.getUserCanister();
                switch(await UserCanister.getUserByPrincipalId(callerPrincipalId)) {
                    case(#ok(value)) {};
                    case(#err(error)) {
                        //caller doesn't exist in User canister
                        return #err("No Nuance account found!")
                    };
                };
            };
        };
        
        //if here, caller is a Nuance user or an editor if it's a publication subscription

        //if all the fee fields are empty, remove the subscription option from the writer
        if(subscriptionDetails.weeklyFee == null and subscriptionDetails.monthlyFee == null and subscriptionDetails.annuallyFee == null and subscriptionDetails.lifeTimeFee == null){
            switch(Map.get(writerPrincipalIdToIsSubscriptionActive, thash, writerPrincipalId)) {
                case(?isActive) {
                    //the writer exists as a subscription enabled writer
                    //update the internal state
                    //set the isActive status to false
                    Map.set(writerPrincipalIdToIsSubscriptionActive, thash, writerPrincipalId, false);
                    //delete all the fields except the subscription event ids
                    Map.delete(writerPrincipalIdToWeeklySubscriptionFee, thash, writerPrincipalId);
                    Map.delete(writerPrincipalIdToMonthlySubscriptionFee, thash, writerPrincipalId);
                    Map.delete(writerPrincipalIdToAnnuallySubscriptionFee, thash, writerPrincipalId);
                    Map.delete(writerPrincipalIdToLifeTimeSubscriptionFee, thash, writerPrincipalId);
                    Map.delete(writerPrincipalIdToPaymentReceiverAddress, thash, writerPrincipalId);
                    return #ok(buildWriterSubscriptionDetails(writerPrincipalId))
                };
                case(null) {
                    //the writer doesn't have any existing configuration
                    //do nothing and return the WriterSubscriptionDetailsObject
                    return #ok(buildWriterSubscriptionDetails(writerPrincipalId));
                };
            };
        };

        //if here, input is valid
        //update the hashmaps
        //activate the subscription
        Map.set(writerPrincipalIdToIsSubscriptionActive, thash, writerPrincipalId, true);

        //set the weekly fee if provided
        switch(subscriptionDetails.weeklyFee) {
            case(?weeklyFee) {
                Map.set(writerPrincipalIdToWeeklySubscriptionFee, thash, writerPrincipalId, weeklyFee);
            };
            case(null) {
                //weekly fee has not been provided
                //do nothing
            };
        };

        //set the monthly fee if provided
        switch(subscriptionDetails.monthlyFee) {
            case(?monthlyFee) {
                Map.set(writerPrincipalIdToMonthlySubscriptionFee, thash, writerPrincipalId, monthlyFee);
            };
            case(null) {
                //monthly fee has not been provided
                //do nothing
            };
        };

        //set the annually fee if provided
        switch(subscriptionDetails.annuallyFee) {
            case(?annuallyFee) {
                Map.set(writerPrincipalIdToAnnuallySubscriptionFee, thash, writerPrincipalId, annuallyFee);
            };
            case(null) {
                //annually fee has not been provided
                //do nothing
            };
        };

        //set the lifetime fee if provided
        switch(subscriptionDetails.lifeTimeFee) {
            case(?lifeTimeFee) {
                Map.set(writerPrincipalIdToLifeTimeSubscriptionFee, thash, writerPrincipalId, lifeTimeFee);
            };
            case(null) {
                //lifetime fee has not been provided
                //do nothing
            };
        };
        //set the payment receiver principal id
        Map.set(writerPrincipalIdToPaymentReceiverAddress, thash, writerPrincipalId, paymentReceiverPrincipalId);
    
        #ok(buildWriterSubscriptionDetails(writerPrincipalId))
    };

    //reader calls this method with the principal id of the writer and the time interval
    //if the request is valid, it returns the PaymentRequest object
    //reader then uses this object to send the funds and complete the payment
    public shared ({caller}) func createPaymentRequestAsReader(writerPrincipalId: Text, timeInterval: SubscriptionTimeInterval, amount: Nat32) : async Result.Result<PaymentRequest, Text> {
        //before any payment request creation, make sure there is no expired request
        deleteExpiredPaymentRequests();

        //check if the writer and the given time interval exists as a subscription option
        let callerPrincipalId = Principal.toText(caller);
        let writerSubscriptionDetails = buildWriterSubscriptionDetails(writerPrincipalId);
        if(not writerSubscriptionDetails.isSubscriptionActive){
            return #err("Any subscription option not found for the given writer.")
        }
        else{
            switch(timeInterval) {
                case(#Weekly) {
                    switch(writerSubscriptionDetails.weeklyFee) {
                        case(?fee) {
                            if(fee != amount){
                                return #err("Invalid fee!");
                            }
                        };
                        case(null) {
                            return #err("Invalid time interval!");
                        };
                    };
                };
                case(#Monthly) {
                    switch(writerSubscriptionDetails.monthlyFee) {
                        case(?fee) {
                            if(fee != amount){
                                return #err("Invalid fee!");
                            }
                        };
                        case(null) {
                            return #err("Invalid time interval!");
                        };
                    };
                };
                case(#Annually){
                    switch(writerSubscriptionDetails.annuallyFee) {
                        case(?fee) {
                            if(fee != amount){
                                return #err("Invalid fee!");
                            }
                        };
                        case(null) {
                            return #err("Invalid time interval!");
                        };
                    };
                };
                case(#LifeTime){
                    switch(writerSubscriptionDetails.lifeTimeFee) {
                        case(?fee) {
                            if(fee != amount){
                                return #err("Invalid fee!");
                            }
                        };
                        case(null) {
                            return #err("Invalid time interval!");
                        };
                    };
                };
            };
        };
        //if here, writerPrincipal id and the timeInterval values are valid
        //check if the caller is a Nuance user
        let UserCanister = CanisterDeclarations.getUserCanister();
        switch(await UserCanister.getUserByPrincipalId(callerPrincipalId)) {
            case(#ok(value)) {};
            case(#err(error)) {
                //caller doesn't exist in User canister
                return #err("Caller is not a Nuance user.")
            };
        };

        //check if the caller already have an active subscription to the writer
        let readerDetails = buildReaderSubscriptionDetails(callerPrincipalId);
        let readerSubscriptionEvents = readerDetails.readerSubscriptions;
        let now = U.epochTime();
        for(subscriptionEvent in readerSubscriptionEvents.vals()){
            if(writerPrincipalId == subscriptionEvent.writerPrincipalId and now < subscriptionEvent.endTime){
                return #err("Reader already have an active subscription to the writer.");
            };
        };


        //if here, both caller and the writer is valid
        //create the payment request
        #ok(putPaymentRequest(writerPrincipalId, callerPrincipalId, timeInterval));
    };

    //reader should call this function after sending the tokens to the subaccount returned by the createPaymentRequestAsReader function
    //this function will complete the subscription event if the reader has sent the tokens to the subaccount and then add the
    //token disbursement entry to pendingTokenDisbursements map
    public shared ({caller}) func completeSubscriptionEvent(eventId: Text) : async Result.Result<ReaderSubscriptionDetails, Text> {
        deleteExpiredPaymentRequests();
        switch(Map.get(subscriptionEventIdToPaymentRequestExpireTime, thash, eventId)) {
            case(?expireTime) {
                //if here, there is an active request with the given id
                let paymentRequestDetails = buildPaymentRequest(eventId);
                //get the balance of the token receiver subaccount from the NUA token canister
                let NuaCanister = CanisterDeclarations.getIcrc1Canister(ENV.NUA_TOKEN_CANISTER_ID);
                let balance = await NuaCanister.icrc1_balance_of({
                    owner = Principal.fromActor(Subscription);
                    subaccount = ?paymentRequestDetails.subaccount;
                });

                if(Nat32.fromNat(balance) == paymentRequestDetails.paymentFee){
                    //if here, reader has sent the exact amount of tokens to the receiver account
                    //delete the payment request first
                    deletePaymentRequest(eventId);
                    //update the internal state and add the token disbursements
                    completePaymentRequest(paymentRequestDetails);
                    return #ok(buildReaderSubscriptionDetails(paymentRequestDetails.readerPrincipalId));

                }
                else{
                    //the balance in the token receiver account doesn't match with the payment fee
                    //delete the payment request and add the reader's principal to pendingStuckTokenDisbursements to 
                    //send back the stuck tokens to the reader
                    deleteExpiredPaymentRequest(eventId);
                    //return the error
                    return #err("Invalid amount of tokens in the receiver account.")
                }
            };
            case(null) {
                //not found any active payment request with the given id
                //return the error
                return #err("There is no active payment request with the given id.");
            };
        };
    };

    //the reader can always call this function to get the notifications for the expired subscriptions
    public shared ({caller}) func checkMyExpiredSubscriptionsNotifications() : async () {
        let readerPrincipalId = Principal.toText(caller);
        let writerPrincipalIds = Option.get(Map.get(readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds, thash, readerPrincipalId), []);
        let now = U.epochTime();
        let readerDetails = buildReaderSubscriptionDetails(readerPrincipalId);
        for(writerPrincipalId in writerPrincipalIds.vals()){
            var latestSubscriptionEvent : ?SubscriptionEvent = null;
            //find the latest subscription event to the writer
            for(readerSubscriptionEvent in readerDetails.readerSubscriptions.vals()){
                if(readerSubscriptionEvent.writerPrincipalId == writerPrincipalId){
                    switch(latestSubscriptionEvent) {
                        case(?currentLatestSubscriptionEvent) {
                            if(currentLatestSubscriptionEvent.endTime < readerSubscriptionEvent.endTime){
                                latestSubscriptionEvent := ?readerSubscriptionEvent;
                            }
                        };
                        case(null) {
                            latestSubscriptionEvent := ?readerSubscriptionEvent;
                        };
                    };
                };
            };

            //if the subscription has expired, remove the writer principal id from the readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds map
            //also send the notification
            switch(latestSubscriptionEvent) {
                case(?event) {
                    if(event.endTime < now){
                        //ToDo: Add all the #ExpiredNotification notifications to a local notifications array and then send them all to the Notifications
                        //canister 

                        //remove the writer principal id from the readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds map
                        let filteredWriterPrincipalIds = Array.filter(writerPrincipalIds, func(principalId : Text) : Bool {
                            writerPrincipalId != principalId
                        });
                        Map.set(readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds, thash, readerPrincipalId, filteredWriterPrincipalIds);
                    }
                    else{
                        //the subscription has not been expired yet
                        //nothing to do
                    };
                    
                };
                case(null) {
                    //not possible to be here
                    //nothing to do
                };
            };
        };
        //ToDo: Send all the notifications to the Notifications canister with a single call here
    };

    //stop the existing subscription
    public shared ({caller}) func stopSubscription(writerPrincipalId: Text) : async Result.Result<ReaderSubscriptionDetails, Text> {
        let readerPrincipalId = Principal.toText(caller);
        let writerPrincipalIds = Option.get(Map.get(readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds, thash, readerPrincipalId), []);

        if(U.arrayContainsGeneric(writerPrincipalIds, writerPrincipalId, Text.equal)){
            let filteredWriterPrincipalIds = Array.filter(writerPrincipalIds, func(principalId : Text) : Bool {
                writerPrincipalId != principalId
            });
            Map.set(readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds, thash, readerPrincipalId, filteredWriterPrincipalIds);
            return #ok(buildReaderSubscriptionDetails(readerPrincipalId));
        }
        else{
            return #err("Reader doesn't have any active subscription to the given writer!")
        };
    };


    //#region - private functions to change the state of the internal hashmaps

    //create a new payment request and fill the corresponding hashmaps
    private func putPaymentRequest(writerPrincipalId: Text, readerPrincipalId: Text, timeInterval: SubscriptionTimeInterval) : PaymentRequest {
        let MINUTE = 60000;
        let now = U.epochTime();
        //any payment request is only
        let expriationDate = now + MINUTE;
        let writerDetails = buildWriterSubscriptionDetails(writerPrincipalId);
        
        var fee = Nat32.fromNat(0);
        switch(timeInterval) {
            case(#Weekly) {
                fee := Option.get(writerDetails.weeklyFee, Nat32.fromNat(0));
            };
            case(#Monthly) {
                fee := Option.get(writerDetails.monthlyFee, Nat32.fromNat(0));
            };
            case(#Annually){
                fee := Option.get(writerDetails.annuallyFee, Nat32.fromNat(0));
            };
            case(#LifeTime){
                fee := Option.get(writerDetails.lifeTimeFee, Nat32.fromNat(0));
            };
        };

        let currentEventId = Nat.toText(subscriptionEventCounter);
        subscriptionEventCounter += 1;


        Map.set(subscriptionEventIdToPaymentRequestWriterPrincipalId, thash, currentEventId, writerPrincipalId);
        Map.set(subscriptionEventIdToPaymentRequestReaderPrincipalId, thash, currentEventId, readerPrincipalId);
        Map.set(subscriptionEventIdToPaymentRequestSubscriptionTimeInterval, thash, currentEventId, timeInterval);
        Map.set(subscriptionEventIdToPaymentRequestFee, thash, currentEventId, fee);
        Map.set(subscriptionEventIdToPaymentRequestExpireTime, thash, currentEventId, expriationDate);

        buildPaymentRequest(currentEventId);
    };

    //deletes the expired payment requests
    //adds an entry to pendingStuckTokenDisbursements array in case the reader has sent the tokens but didn't complete the subscription
    private func deleteExpiredPaymentRequests() : () {
        let now = U.epochTime();
        for((eventId, expirationDate) in Map.entries(subscriptionEventIdToPaymentRequestExpireTime)){
            if(expirationDate < now){
                deleteExpiredPaymentRequest(eventId);
            };
        };
    };
    //deletes the payment request and adds the reader's principal id to pendingStuckTokenDisbursements in case there's stuck tokens there
    private func deleteExpiredPaymentRequest(eventId: Text) : () {
        //store the values to a local variable to use after deleting them
        let paymentRequestDetails = buildPaymentRequest(eventId);
        //delete the payment request
        Map.delete(subscriptionEventIdToPaymentRequestWriterPrincipalId, thash, eventId);
        Map.delete(subscriptionEventIdToPaymentRequestReaderPrincipalId, thash, eventId);
        Map.delete(subscriptionEventIdToPaymentRequestSubscriptionTimeInterval, thash, eventId);
        Map.delete(subscriptionEventIdToPaymentRequestFee, thash, eventId);
        Map.delete(subscriptionEventIdToPaymentRequestExpireTime, thash, eventId);
        //add the subscription event id and the reader principal id to the pendingStuckTokenDisbursements map to 
        //send the tokens back to the reader in case the reader has failed to complete the subscription
        Map.set(pendingStuckTokenDisbursements, thash, eventId, paymentRequestDetails.readerPrincipalId);

    };

    //deletes the payment request without adding the reader's principal to the pendingStuckTokenDisbursements
    private func deletePaymentRequest(eventId: Text) : () {
        //delete the payment request
        Map.delete(subscriptionEventIdToPaymentRequestWriterPrincipalId, thash, eventId);
        Map.delete(subscriptionEventIdToPaymentRequestReaderPrincipalId, thash, eventId);
        Map.delete(subscriptionEventIdToPaymentRequestSubscriptionTimeInterval, thash, eventId);
        Map.delete(subscriptionEventIdToPaymentRequestFee, thash, eventId);
        Map.delete(subscriptionEventIdToPaymentRequestExpireTime, thash, eventId);

    };

    //updates the corresponding hashmaps to complete the subscription
    //also adds the token disbursements to the pendingTokenDisbursements map
    private func completePaymentRequest(paymentRequest: PaymentRequest) : () {
        let subscriptionEventId = paymentRequest.subscriptionEventId;
        let MINUTE = 60000;
        let now = U.epochTime();
        //add the subscription event id to writer's subscription event ids array
        let writerExistingSubscriptionEventIdsArray = Option.get(Map.get(writerPrincipalIdToSubscriptionEventIds, thash, paymentRequest.writerPrincipalId), []);
        let writerExistingSubscriptionEventIdsBuffer = Buffer.fromArray<Text>(writerExistingSubscriptionEventIdsArray);
        writerExistingSubscriptionEventIdsBuffer.add(subscriptionEventId);
        Map.set(writerPrincipalIdToSubscriptionEventIds, thash, paymentRequest.writerPrincipalId, Buffer.toArray(writerExistingSubscriptionEventIdsBuffer));

        //add the subscription event id to reader's subscription event ids array
        let readerExistingSubscriptionEventIdsArray = Option.get(Map.get(readerPrincipalIdToSubscriptionEventIds, thash, paymentRequest.readerPrincipalId), []);
        let readerExistingSubscriptionEventIdsBuffer = Buffer.fromArray<Text>(readerExistingSubscriptionEventIdsArray);
        readerExistingSubscriptionEventIdsBuffer.add(subscriptionEventId);
        Map.set(readerPrincipalIdToSubscriptionEventIds, thash, paymentRequest.readerPrincipalId, Buffer.toArray(readerExistingSubscriptionEventIdsBuffer));

        //add the writer principal id to reader's subscribed principal ids
        let readerExistingSubscribedPrincipalIdsArray = Option.get(Map.get(readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds, thash, paymentRequest.readerPrincipalId), []);
        let readerExistingSubscribedPrincipalIdsBuffer = Buffer.fromArray<Text>(readerExistingSubscribedPrincipalIdsArray);
        readerExistingSubscribedPrincipalIdsBuffer.add(paymentRequest.writerPrincipalId);
        Map.set(readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds, thash, paymentRequest.readerPrincipalId, Buffer.toArray(readerExistingSubscribedPrincipalIdsBuffer));

        //map the data to subscription event id
        Map.set(subscriptionEventIdToWriterPrincipalId, thash, subscriptionEventId, paymentRequest.writerPrincipalId);
        Map.set(subscriptionEventIdToReaderPrincipalId, thash, subscriptionEventId, paymentRequest.readerPrincipalId);
        Map.set(subscriptionEventIdToSubscriptionTimeInterval, thash, subscriptionEventId, paymentRequest.subscriptionTimeInterval);
        Map.set(subscriptionEventIdToPaymentFee, thash, subscriptionEventId, paymentRequest.paymentFee);
        Map.set(subscriptionEventIdToStartTime, thash, subscriptionEventId, now);
        Map.set(subscriptionEventIdToEndTime, thash, subscriptionEventId, getSubscriptionEndTimeByTimeInterval(now, paymentRequest.subscriptionTimeInterval));

        //add the token disbursements to pendingTokenDisbursements map
        let nuaTokenFeeFloat = Float.fromInt(ENV.NUA_TOKEN_FEE);
        let totalPaymentAmountFloat = Float.fromInt(Nat32.toNat(paymentRequest.paymentFee)) - 2 * nuaTokenFeeFloat;
        let nuanceDaoShareFloat = totalPaymentAmountFloat * ENV.SUBSCRIPTION_FEE_AMOUNT / 100;
        let writerShareFloat = totalPaymentAmountFloat - nuanceDaoShareFloat;
        let nuanceDaoShareNat = Option.get(Nat.fromText(Int.toText(Float.toInt(nuanceDaoShareFloat))), ENV.NUA_TOKEN_FEE);
        let writerShareNat = Option.get(Nat.fromText(Int.toText(Float.toInt(writerShareFloat))), ENV.NUA_TOKEN_FEE);
        let disbursements : [(Text, ?Blob, Nat32)] = [
            (paymentRequest.writerPrincipalId, null, Nat32.fromNat(writerShareNat)),
            (ENV.TIP_FEE_RECEIVER_PRINCIPAL_ID, ?Blob.fromArray(ENV.TIP_FEE_RECEIVER_SUBACCOUNT), Nat32.fromNat(nuanceDaoShareNat))
        ];
        Map.set(pendingTokenDisbursements, thash, subscriptionEventId, disbursements);

        //add the notifications
    };

    private func getSubscriptionEndTimeByTimeInterval(now: Int, timeInterval: SubscriptionTimeInterval) : Int {
        let MINUTE = 60000;

        switch(timeInterval) {
            case(#Weekly) {
                return now + MINUTE * 60 * 24 * 7;
            };
            case(#Monthly) {
                return now + MINUTE * 60 * 24 * 30;
            };
            case(#Annually) {
                return now + MINUTE * 60 * 24 * 365;
            };
            case(#LifeTime){
                //200 years later
                //let's fix this in 2224
                return now + MINUTE * 60 * 24 * 365 * 200;
            };
        };
    };


    //an helper private function to send the stuck tokens in the given subaccount back to the reader
    private func sendBackTokensToReader(eventId: Text, readerPrincipalId: Text) : async () {
        let subaccountId = U.textToNat(eventId);
        let subaccount = Blob.fromArray(U.natToSubAccount(subaccountId));
        let nuaTokenFee = ENV.NUA_TOKEN_FEE;
        let NuaCanister = CanisterDeclarations.getIcrc1Canister(ENV.NUA_TOKEN_CANISTER_ID);

        let balance = await NuaCanister.icrc1_balance_of({
            owner = Principal.fromActor(Subscription);
            subaccount = ?subaccount;
        });

        if(balance > nuaTokenFee){
            //if here, there're some tokens stuck
            //send the tokens back
            try{
                let transferResult = await NuaCanister.icrc1_transfer({
                    amount = balance - nuaTokenFee;
                    created_at_time = null;
                    fee = ?nuaTokenFee;
                    from_subaccount = ?subaccount;
                    memo = null;
                    to = {
                        owner = Principal.fromText(readerPrincipalId);
                        subaccount = null;
                    }
                });
                //if here, transfer went well if the logic is correct
                //delete the pending disbursement
                Map.delete(pendingStuckTokenDisbursements, thash, eventId);
            }
            catch(e){
                //the inter canister call failed
                //don't delete the disbursement
            }
        }
        else{
            //if here, there is no stuck token in the subaccount
            //delete the pending disbursement
            Map.delete(pendingStuckTokenDisbursements, thash, eventId);
        }
    };

    //an helper private function to disperse the tokens to Nuance DAO and writer
    //takes an eventId as an argument and handles the disbursements mapped to that event id
    private func disperseTokens(eventId: Text) : async () {
        let subaccountId = U.textToNat(eventId);
        let subaccount = Blob.fromArray(U.natToSubAccount(subaccountId));
        let nuaTokenFee = ENV.NUA_TOKEN_FEE;
        let NuaCanister = CanisterDeclarations.getIcrc1Canister(ENV.NUA_TOKEN_CANISTER_ID);

        let disbursements = Option.get(Map.get(pendingTokenDisbursements, thash, eventId), []);
        let successfulDisbursementIndexes = Buffer.Buffer<Nat>(0);
        var counter = 0;
        for(disbursement in disbursements.vals()) {
            try{
                let transferResult = await NuaCanister.icrc1_transfer({
                    amount = Nat32.toNat(disbursement.2);
                    created_at_time = null;
                    fee = ?nuaTokenFee;
                    from_subaccount = ?subaccount;
                    memo = null;
                    to = {
                        owner = Principal.fromText(disbursement.0);
                        subaccount = disbursement.1;
                    }
                });
                //if here, transfer is successful if the logic is correct
                successfulDisbursementIndexes.add(counter);
            }
            catch(e){
                //if here, transfer is not successful
                //don't add the index to successfulDisbursementIndexes buffer -> do nothing
            };
            counter += 1;
        };

        //filter the disbursements using the successfulDisbursementIndexes
        let filteredDisbursements = Buffer.Buffer<(Text, ?Blob, Nat32)>(0);
        counter := 0;
        for(disbursement in disbursements.vals()) {
            if(not U.arrayContainsGeneric(Buffer.toArray(successfulDisbursementIndexes), counter, Nat.equal)){
                filteredDisbursements.add(disbursement);
            };
            counter += 1;
        };

        if(filteredDisbursements.size() == 0){
            //all the disbursements were successful
            //delete the value with the eventId
            Map.delete(pendingTokenDisbursements, thash, eventId);
            //ToDo: send the new subscription notifications to both writer and the reader
            //#AuthorGainsNewSubscriber and #YouSubscribedToAuthor
            let event = buildSubscriptionEvent(eventId);

            ignore U.createNotification(#YouSubscribedToAuthor, {
                url = "";
                articleId = "";
                articleTitle = "";
                authorPrincipal = Principal.fromText(event.writerPrincipalId);
                authorHandle = "";
                comment = "";
                isReply = false;
                receiverPrincipal = Principal.fromText(event.readerPrincipalId);
                receiverHandle = "";
                senderPrincipal = Principal.fromText("2vxsx-fae"); 
                senderHandle = "";
                tags = [];
                tipAmount = "0";
                token = "";
            });
            
            ignore U.createNotification(#AuthorGainsNewSubscriber, {
                url = "";
                articleId = "";
                articleTitle = "";
                authorPrincipal = Principal.fromText(event.writerPrincipalId);
                authorHandle = "";
                comment = "";
                isReply = false;
                receiverPrincipal = Principal.fromText(event.writerPrincipalId);
                receiverHandle = "";
                senderPrincipal = Principal.fromText(event.readerPrincipalId);
                senderHandle = "";
                tags = [];
                tipAmount = "0";
                token = "";
            });

        }
        else{
            //the size is not equal to 0
            //there were some unsuccessful disbursements
            //update the value with the filtered array
            Map.set(pendingTokenDisbursements, thash, eventId, Buffer.toArray(filteredDisbursements));
        }
    };

    //#region - private functions to build data types
    //build a WriterSubscriptionDetails from the principal id of the writer
    private func buildWriterSubscriptionDetails(principal: Text) : WriterSubscriptionDetails {
        {
            annuallyFee = Map.get(writerPrincipalIdToAnnuallySubscriptionFee, thash, principal);
            lifeTimeFee = Map.get(writerPrincipalIdToLifeTimeSubscriptionFee, thash, principal);
            monthlyFee = Map.get(writerPrincipalIdToMonthlySubscriptionFee, thash, principal);
            weeklyFee = Map.get(writerPrincipalIdToWeeklySubscriptionFee, thash, principal);
            writerPrincipalId = principal;
            isSubscriptionActive = Option.get(Map.get(writerPrincipalIdToIsSubscriptionActive, thash, principal), false);
            writerSubscriptions = Array.map<Text, SubscriptionEvent>(Option.get(Map.get(writerPrincipalIdToSubscriptionEventIds, thash, principal), []), func(subscriptionEventId : Text) : SubscriptionEvent {
                buildSubscriptionEvent(subscriptionEventId)
            });
        }
    };

    //build a WriterSubscriptionDetails from the principal id of the writer without the subscription history
    private func buildWriterSubscriptionDetailsLighter(principal: Text) : WriterSubscriptionDetails {
        {
            annuallyFee = Map.get(writerPrincipalIdToAnnuallySubscriptionFee, thash, principal);
            lifeTimeFee = Map.get(writerPrincipalIdToLifeTimeSubscriptionFee, thash, principal);
            monthlyFee = Map.get(writerPrincipalIdToMonthlySubscriptionFee, thash, principal);
            weeklyFee = Map.get(writerPrincipalIdToWeeklySubscriptionFee, thash, principal);
            writerPrincipalId = principal;
            isSubscriptionActive = Option.get(Map.get(writerPrincipalIdToIsSubscriptionActive, thash, principal), false);
            writerSubscriptions = [];
        }
    };

    //build a ReaderSubscriptionDetails from the principal id of the reader
    private func buildReaderSubscriptionDetails(principal: Text) : ReaderSubscriptionDetails {
        {
            readerPrincipalId = principal;
            readerSubscriptions = Array.map<Text, SubscriptionEvent>(Option.get(Map.get(readerPrincipalIdToSubscriptionEventIds, thash, principal), []), func(subscriptionEventId : Text) : SubscriptionEvent {
                buildSubscriptionEvent(subscriptionEventId)
            });
            readerNotStoppedSubscriptionsWriters = Array.map<Text, WriterSubscriptionDetails>(Option.get(Map.get(readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds, thash, principal), []), func(writerPrincipalId : Text) : WriterSubscriptionDetails {
                buildWriterSubscriptionDetailsLighter(writerPrincipalId)
            });
        }
    };

    //builds the details of a subscription event by its unique id
    private func buildSubscriptionEvent(eventId: Text) : SubscriptionEvent {
        let writerPrincipalId = Option.get(Map.get(subscriptionEventIdToWriterPrincipalId, thash, eventId), "");
        {
            subscriptionEventId = eventId;
            writerPrincipalId;
            readerPrincipalId = Option.get(Map.get(subscriptionEventIdToReaderPrincipalId, thash, eventId), "");
            subscriptionTimeInterval = Option.get(Map.get(subscriptionEventIdToSubscriptionTimeInterval, thash, eventId), #Weekly);
            paymentFee = Option.get(Map.get(subscriptionEventIdToPaymentFee, thash, eventId), Nat32.fromNat(0));
            startTime = Option.get(Map.get(subscriptionEventIdToStartTime, thash, eventId), 0);
            endTime = Option.get(Map.get(subscriptionEventIdToEndTime, thash, eventId), 0);
            isWriterSubscriptionActive = Option.get(Map.get(writerPrincipalIdToIsSubscriptionActive, thash, writerPrincipalId), false);
        }
    };

    //build a PaymentRequest from the unique id
    private func buildPaymentRequest(eventId: Text) : PaymentRequest {
        {
            subscriptionEventId = eventId;
            writerPrincipalId = Option.get(Map.get(subscriptionEventIdToPaymentRequestWriterPrincipalId, thash, eventId), "");
            readerPrincipalId = Option.get(Map.get(subscriptionEventIdToPaymentRequestReaderPrincipalId, thash, eventId), "");
            subscriptionTimeInterval = Option.get(Map.get(subscriptionEventIdToPaymentRequestSubscriptionTimeInterval, thash, eventId), #Weekly);
            paymentFee = Option.get(Map.get(subscriptionEventIdToPaymentRequestFee, thash, eventId), Nat32.fromNat(0));
            expirationDate = Option.get(Map.get(subscriptionEventIdToPaymentRequestExpireTime, thash, eventId), 0);
            subaccount = Blob.fromArray(U.natToSubAccount(U.textToNat(eventId)));
        }
    };

    //#region public heartbeat functions

    //this function will periodically be called to make sure no token is stuck because of the incomplete subscription events
    public shared func pendingStuckTokensHeartbeatExternal() : async () {
        var counter = 0;
        for((eventId, readerPrincipalId) in Map.entries(pendingStuckTokenDisbursements)){
            if(counter < 10){
                await sendBackTokensToReader(eventId, readerPrincipalId);
            }
            else{
                //handle maximum of 10 pending disbursements in a single call to make sure the instruction limit won't be exceeded
                return;
            };
            counter += 1;
        };
    };

    //this function will periodically be called to make sure both writers and the Nuance DAO gets the tokens from the subscriptions
    public shared func pendingTokensHeartbeatExternal() : async () {
        var counter = 0;
        for(eventId in Map.keys(pendingTokenDisbursements)){
            if(counter < 10){
                await disperseTokens(eventId);
            }
            else{
                //handle maximum of 10 pending disbursements in a single call to make sure the instruction limit won't be exceeded
                return;
            };
            counter += 1;
        };
    };

    stable var bulkNotifications : [(Notifications.NotificationType, Notifications.NotificationContent)] = [];

    func addBulkNotification(notificationType : Notifications.NotificationType, notification : Notifications.NotificationContent) : () {
        
        let notificationsBuffer = Buffer.Buffer<(Notifications.NotificationType,Notifications.NotificationContent)>(0);
        for(notif in Iter.fromArray(bulkNotifications)){
            notificationsBuffer.add((notif.0, notif.1));
        };
        notificationsBuffer.add((notificationType, notification));
        bulkNotifications := Buffer.toArray(notificationsBuffer);
    };

    public shared func expiredNotificationsHeartbeatExternal() : async () {
        let now = U.epochTime();
        for((readerPrincipalId, writerPrincipalIds) in Map.entries(readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds)){
            let readerDetails = buildReaderSubscriptionDetails(readerPrincipalId);
            for(writerPrincipalId in writerPrincipalIds.vals()){
                var latestSubscriptionEvent : ?SubscriptionEvent = null;
                //find the latest subscription event to the writer
                for(readerSubscriptionEvent in readerDetails.readerSubscriptions.vals()){
                    if(readerSubscriptionEvent.writerPrincipalId == writerPrincipalId){
                        switch(latestSubscriptionEvent) {
                            case(?currentLatestSubscriptionEvent) {
                                if(currentLatestSubscriptionEvent.endTime < readerSubscriptionEvent.endTime){
                                    latestSubscriptionEvent := ?readerSubscriptionEvent;
                                }
                            };
                            case(null) {
                                latestSubscriptionEvent := ?readerSubscriptionEvent;
                            };
                        };
                    };
                };

                //if the subscription has expired, remove the writer principal id from the readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds map
                //also send the notification
                switch(latestSubscriptionEvent) {
                    case(?event) {
                        if(event.endTime < now){
                            //ToDo: Add all the #ExpiredNotification notifications to a local notifications array and then send them all to the Notifications
                            //canister 
                            // #AuthorExpiredSubscription and #ReaderExpiredSubscription;
                            addBulkNotification(#AuthorExpiredSubscription, {
                                url = "";
                                articleId = "";
                                articleTitle = "";
                                authorPrincipal = Principal.fromText(event.writerPrincipalId);
                                authorHandle = "";
                                comment = "";
                                isReply = false;
                                receiverPrincipal = Principal.fromText(event.writerPrincipalId);
                                receiverHandle = "";
                                senderPrincipal = Principal.fromText("2vxsx-fae");
                                senderHandle = "";
                                tags = [];
                                tipAmount = "0";
                                token = "";
                            });

                            addBulkNotification(#ReaderExpiredSubscription, {
                                url = "";
                                articleId = "";
                                articleTitle = "";
                                authorPrincipal = Principal.fromText(event.writerPrincipalId);
                                authorHandle = "";
                                comment = "";
                                isReply = false;
                                receiverPrincipal = Principal.fromText(event.readerPrincipalId);
                                receiverHandle = "";
                                senderPrincipal = Principal.fromText("2vxsx-fae");
                                senderHandle = "";
                                tags = [];
                                tipAmount = "0";
                                token = "";
                            });

                            //remove the writer principal id from the readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds map
                            let filteredWriterPrincipalIds = Array.filter(writerPrincipalIds, func(principalId : Text) : Bool {
                                writerPrincipalId != principalId
                            });
                            Map.set(readerPrincipalIdToNotStoppedAndSubscribedWriterPrincipalIds, thash, readerPrincipalId, filteredWriterPrincipalIds);
                        }
                        else{
                            //the subscription has not been expired yet
                            //nothing to do
                        };
                    
                    };
                    case(null) {
                        //not possible to be here
                        //nothing to do
                    };
                };
            };
        };
        //ToDo: Send all the notifications to the Notifications canister
        ignore U.disperseBulkSubscriptionNotifications(bulkNotifications);

    };
 
    public shared func disperseTokensForSuccessfulSubscription(eventId: Text) : async Result.Result<(), Text> {
        switch(Map.get(pendingTokenDisbursements, thash, eventId)) {
            case(?disbursement) {
                //there exist a pending disbursement
                //trigger the helper private function
                await disperseTokens(eventId);
                return #ok();
            };
            case(null) {
                //not found
                return #err("Not found any pending disbursement.");
            };
        };
    };

    public shared query func getLatestTimerCall() : async (Text, Text) {
        (Int.toText(lastTimerCalled), Nat.toText(cyclesBalanceWhenTimerIsCalledLastTime));
    };

    system func timer(setGlobalTimer : Nat64 -> ()) : async () {
        try {
            ignore pendingStuckTokensHeartbeatExternal();
        } catch (e) {
        };

        try {
            ignore pendingTokensHeartbeatExternal();
        } catch (e) {
        };

        try {
            ignore expiredNotificationsHeartbeatExternal();
        } catch (e) {
        };

        let now = U.epochTime();
        lastTimerCalled := now;

        cyclesBalanceWhenTimerIsCalledLastTime := Cycles.balance();
        //call every minute
        let next = Nat64.fromIntWrap(now) + 60_000_000_000;
        setGlobalTimer(next); // absolute time in nanoseconds
    };
};