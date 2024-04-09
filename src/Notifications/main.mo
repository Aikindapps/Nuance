import Debug "mo:base/Debug";
import Bool "mo:base/Bool";
import Char "mo:base/Char";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import List "mo:base/List";
import HashMap "mo:base/HashMap";
import Map "mo:hashmap/Map"; 
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Prelude "mo:base/Prelude";
import U "../shared/utils";
import Types "./types";
import UserTypes "../User/types";
import Canistergeek "../canistergeek/canistergeek";
import PostTypes "../PostCore/types";
import Cycles "mo:base/ExperimentalCycles";
import Prim "mo:prim";
import CanisterDeclarations "../shared/CanisterDeclarations";
import Versions "../shared/versions";
import ENV "../shared/env";
import Time "mo:base/Time";
import Hash "mo:base/Hash";
import Int "mo:base/Int";
import Order "mo:base/Order";

actor Notifications {
  // local variables
  let canistergeekMonitor = Canistergeek.Monitor();
  func isEq(x : Text, y : Text) : Bool { x == y };
  var initCapacity = 0;

  // error messages
  let Unauthorized = "Unauthorized";
  let NotTrustedPrincipal = "Not a trusted principal, unauthorized";

  //data type aliases
  type List<T> = List.List<T>;
  type UserNotificationSettings = Types.UserNotificationSettings;
  type NotificationType = Types.NotificationType;
  type Notifications = Types.Notifications;
  type NotificationContent = Types.NotificationContent;
  type UserListItem = UserTypes.UserListItem;
  
  // permanent in-memory state (data types are not lost during upgrades)
  stable var _canistergeekMonitorUD : ?Canistergeek.UpgradeData = null;
  stable var cgusers : List.List<Text> = List.nil<Text>();

  stable var index : [(Text, [Text])] = [];

  stable var notificationId = 0;

public func testnewnotifications2() : async Result.Result<(), Text> {
  return #err("????");
};

  // admin and canister functions
  
  private func isAnonymous(caller : Principal) : Bool {
    Principal.equal(caller, Principal.fromText("2vxsx-fae"));
  };

  public shared query ({ caller }) func getCgUsers() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };
    if (not isAdmin(caller)) {
      return #err(Unauthorized);
    };

    #ok(List.toArray(cgusers));
  };

  public shared ({ caller }) func registerCgUser(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    if (not isThereEnoughMemoryPrivate()) {
      return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    canistergeekMonitor.collectMetrics();
    if (List.size<Text>(cgusers) > 0 and not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    if (not List.some<Text>(cgusers, func(val : Text) : Bool { val == id })) {
      cgusers := List.push<Text>(id, cgusers);
    };

    #ok();
  };

  public shared ({ caller }) func unregisterCgUser(id : Text) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };
    canistergeekMonitor.collectMetrics();
    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };
    cgusers := List.filter<Text>(cgusers, func(val : Text) : Bool { val != id });
    #ok();
  };

  private func isAdmin(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    U.arrayContains(ENV.NOTIFICATIONS_CANISTER_ADMINS, c);
  };

  public shared query ({ caller }) func getAdmins() : async Result.Result<[Text], Text> {
    if (isAnonymous(caller)) {
      return #err("Cannot use this method anonymously.");
    };

    #ok(ENV.NOTIFICATIONS_CANISTER_ADMINS);
  };

  private func isPlatformOperator(caller : Principal) : Bool {
    ENV.isPlatformOperator(caller)
  };

  public shared query func getPlatformOperators() : async List.List<Text> {
    List.fromArray(ENV.PLATFORM_OPERATORS);
  };

  func isCgUser(caller : Principal) : Bool {
    var c = Principal.toText(caller);
    var exists = List.find<Text>(cgusers, func(val : Text) : Bool { val == c });
    exists != null;
  };

  let UserCanister = CanisterDeclarations.getUserCanister();

  
  //#region Canister Geek

  public shared query ({ caller }) func getCanisterMetrics(parameters : Canistergeek.GetMetricsParameters) : async ?Canistergeek.CanisterMetrics {

    if (not isCgUser(caller) and not isAdmin(caller)) {
      Prelude.unreachable();
    };
    canistergeekMonitor.getMetrics(parameters);
  };

  public shared ({ caller }) func collectCanisterMetrics() : async () {
    if (not isCgUser(caller) and not isAdmin(caller)) {
      Prelude.unreachable();
    };
    canistergeekMonitor.collectMetrics();
  };

  //#region memory management/ #Canister utils/ #Cycles management

  stable var MAX_MEMORY_SIZE = 380000000;

  public shared ({ caller }) func setMaxMemorySize(newValue : Nat) : async Result.Result<Nat, Text> {

    if (isAnonymous(caller)) {
      return #err("Anonymous user cannot run this method");
    };

    if (not isAdmin(caller) and not isPlatformOperator(caller)) {
      return #err(Unauthorized);
    };

    ignore U.logMetrics("setMaxMemorySize", Principal.toText(caller));
    MAX_MEMORY_SIZE := newValue;

    #ok(MAX_MEMORY_SIZE);
  };

  public shared query func getMaxMemorySize() : async Nat {
    MAX_MEMORY_SIZE;
  };

  public shared query func isThereEnoughMemory() : async Bool {
    isThereEnoughMemoryPrivate();
  };

  private func isThereEnoughMemoryPrivate() : Bool {
    MAX_MEMORY_SIZE > getMemorySizePrivate();
  };

  public shared query func getMemorySize() : async Nat {
    getMemorySizePrivate();
  };

  private func getMemorySizePrivate() : Nat {
    Prim.rts_memory_size();
  };

 

  public func acceptCycles() : async () {
    let available = Cycles.available();
    let accepted = Cycles.accept(available);
    assert (accepted == available);
  };

  public shared query func availableCycles() : async Nat {
    Cycles.balance();
  };

  public shared query func getCanisterVersion() : async Text {
    Versions.NOTIFICATIONS_VERSION;
  };

   //#endregion


// #region Notifications

// key: principalId, value: UserNotificationSettings
stable var userNotificationSettings = Map.new<Principal, UserNotificationSettings>();

// notifications are direct or broadcast, both are stored in nested hashmaps, sorted by principalId

//Broadcasts will be added to seperate hashmaps for bulk distribution when we have a lot of users
// but the notification itself will be added to userbroadcastNotifications hashmap directly for now. 


//key: principalId, value: directnotifications hashmap per user (key: NotificationId, value: Notification)
type DirectNotifications = {
  notifications : Map.Map<Text, Notifications>;
};

 stable var userDirectNotifications = Map.new<Principal,DirectNotifications>();

//key principalId, value: broadcastNotifications hashmap per user (key: NotificationId, value: Notification)
 var userBroadcastNotifications = HashMap.HashMap<Principal, HashMap.HashMap<Text, Notifications>>(initCapacity, Principal.equal, Principal.hash);

//broadcasts
// key: articleId, value: array of principalIds who've commented on the article. 
var articleCommenters = HashMap.HashMap<Text, [Principal]>(initCapacity, Text.equal, Text.hash);

//writer and tag followers are derived from the user canister and postcore canister respectively
//for single source of truth, we will not store them here. These notifications are also not time sensitive.


//events
//events are singular actions that trigger multiple notifications, ex. an article creates multiple notifications for followers of the writer and tags
public shared ({caller}) func newArticle(notification: NotificationContent) : async Result.Result<(), Text> {
  
  // order of operations is followers of writer, then followers of tags
  // followers of writer will be checked against when adding to followers of tags to prevent duplicates
  let author = notification.authorHandle;
  let userCanister = CanisterDeclarations.getUserCanister();
  let followers = await userCanister.getUserFollowers(U.lowerCase(author));
  let followersBuffer = Buffer.Buffer<Text>(0);

  for (f in Iter.fromArray(followers)) {
      followersBuffer.add(f.principal);
  };

  switch (followers) {
      case (followers) {
            Debug.print("newArticle: followers: " # debug_show(followers));
          for (f in Iter.fromArray(followers)) {
              let receiver = f;
              let newNotification = {
                  id = Nat.toText(notificationId);
                  notificationType = #NewArticleByFollowedWriter;
                  content = notification;
                  timestamp = Int.toText(Time.now());
                  read = false;
              };
              switch (await updateUserBroadcastNotification(Principal.fromText(receiver.principal), newNotification)) {
                  case (#err(err)) {
                      Debug.print("newArticle: error: " # debug_show(err));
                      return #err(err);
                  };
                  case (#ok()) {
              notificationId += 1;
              Debug.print("newArticle: added notification to " # receiver.principal);
              };
          };
      };
  };
  };

  //get followers of tags
  let postCore = CanisterDeclarations.getPostCoreCanister();
  let tags = notification.tags;
  for (tag in Iter.fromArray(tags)) {
  let  followers = await postCore.getTagFollowers(tag);
  switch (followers) {
      case (#ok(followers)) {
          for (f in Iter.fromArray(followers)) {
              if (Buffer.contains<Text>(followersBuffer, f, Text.equal)) {
                 Debug.print("newArticle: duplicate found: " # f);
              }else {
              
              let receiver = f;
              let newNotification = {
                  id = Nat.toText(notificationId);
                  notificationType = #NewArticleByFollowedTag;
                  content = notification;
                  timestamp = Int.toText(Time.now());
                  read = false;
              };
              
              if (Principal.fromText(receiver) != notification.authorPrincipal) {
              switch (await updateUserBroadcastNotification(Principal.fromText(receiver), newNotification)) {
                  case (#err(err)) {
                      Debug.print("newArticle: error: " # debug_show(err));
                      return #err(err);
                  };
                  case (#ok()) {
              notificationId += 1;
              //add to followers hashmap
              followersBuffer.add(receiver);
              };
          };
              };
              };
      };
  };
  case (#err(err)) {
      Debug.print("newArticle: error: " # debug_show(err));
      return #err(err);
  };
  };
  };
  return #ok();
};  

let { ihash; nhash; thash; phash; calcHash } = Map;


//utility functions
func filterForNotificationSettings(n : Notifications, caller: Principal) : Bool {

    let settings = Map.get(userNotificationSettings, phash, caller);
    
     switch (settings) {
        case null {
          return true;

        };
        case (?settings) {
     switch (n.notificationType) {
        case (#NewCommentOnMyArticle) {
          return settings.newCommentOnMyArticle;
        };
        case (#NewCommentOnFollowedArticle) {
          return settings.newCommentOnFollowedArticle;
        };
        case (#NewArticleByFollowedWriter) {
          return settings.newArticleByFollowedWriter;
        };
        case (#NewArticleByFollowedTag) {
          return settings.newArticleByFollowedTag;
        };
        case (#NewFollower) {
          return settings.newFollower;
        };
        case (#TipReceived) {
         return settings.tipReceived;
        };
        case (#PremiumArticleSold) {
          return settings.premiumArticleSold;
        };
      };
      return false;
    };
        };
    };

    func sortNotificationsById(a: Notifications, b: Notifications): Order.Order {
    if (U.textToNat(a.id) < U.textToNat(b.id)) {
      return #less;
    } else if (U.textToNat(a.id) > U.textToNat(b.id)) {
      return #greater;
    } else {
      return #equal;
    }
  };






public shared query ({caller}) func getUserNotifications(from : Text, to : Text) : async Result.Result<([Notifications], Nat), Text> {
    // Check for anonymous callers
    if (isAnonymous(caller)) {
        return #err("Cannot use this method anonymously.");
    };

    // Collect metrics
    canistergeekMonitor.collectMetrics();

    // Attempt to get user's direct and broadcast notifications
    let directNotifications = Map.get(userDirectNotifications, phash, caller);
    let broadcastNotifications = userBroadcastNotifications.get(caller);

    // Initialize a buffer for notifications
    var notifications = Buffer.Buffer<Notifications>(0);
    
    // Process direct notifications
    switch (directNotifications) {
        case null {};
        case (?directNotifications) {
            for (n in (Map.vals(directNotifications.notifications))) {
                if (filterForNotificationSettings(n, caller)) {
                    notifications.add(n);
                };
            };
        };
    };

    // Process broadcast notifications
    switch (broadcastNotifications) {
        case null {};
        case (?broadcastNotifications) {
            for (n in (broadcastNotifications.vals())) {
                if (filterForNotificationSettings(n, caller)) {
                    notifications.add(n);
                };  
            };
        };
    };

    // Sort notifications by ID
    notifications.sort(sortNotificationsById);
    let allNotifications = Array.reverse(Buffer.toArray(notifications));

    let fromIndex = U.textToNat(from);
    let toIndex = U.textToNat(to);

    var adjustedToIndex = toIndex;

    if (toIndex < Array.size(allNotifications)) {
        adjustedToIndex := toIndex + 1;
        Debug.print("adjustedToIndex: " # Nat.toText(adjustedToIndex));
    } else {
        adjustedToIndex := Array.size(allNotifications);
        Debug.print("adjustedToIndex: " # Nat.toText(adjustedToIndex));
    };

    let notificationsSlice = Iter.toArray(Array.slice(allNotifications, fromIndex, adjustedToIndex));


    switch(notificationsSlice) {
        case (notificationsSlice) {
            return #ok((notificationsSlice, Array.size(allNotifications)));
        };
    };
};



//mark notification as read
public shared ({caller}) func markNotificationAsRead( notificationIds : [Text]) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
        return #err("Cannot use this method anonymously.");
    };


    if (not isThereEnoughMemoryPrivate()) {
        return #err("Canister reached the maximum memory threshold. Please try again later.");
    };


  for (notificationId in Iter.fromArray(notificationIds)) {
    let directNotifications = Map.get(userDirectNotifications, phash, caller);
    switch (directNotifications) {
        case null {};
        case (?directNotifications) {
         
            switch (Map.remove(directNotifications.notifications, thash, notificationId)) {
                case null {};
                case (?notification) {
                  var n = notification;
                  n := {
                    id = n.id;
                    notificationType = n.notificationType;
                    content = n.content;
                    timestamp = n.timestamp;
                    read = true;
                  };

                  Map.set(directNotifications.notifications, thash, notificationId, n);
                };
            };
        };
    };

    let broadcastNotifications = userBroadcastNotifications.get(caller);
    switch (broadcastNotifications) {
        case null {};
        case (?broadcastNotifications) {
            switch (broadcastNotifications.remove(notificationId)) {
                case null {};
                case (?notification) {
                  var n = notification;
                  n := {
                    id = n.id;
                    notificationType = n.notificationType;
                    content = n.content;
                    timestamp = n.timestamp;
                    read = true;
                  };

                  broadcastNotifications.put(notificationId, n);
                };
            };
        };
    };
  };

    #ok();
};


public shared ({caller}) func updateUserNotificationSettings(notificationSettings : UserNotificationSettings) : async Result.Result<(), Text> {
    if (isAnonymous(caller)) {
        return #err("Cannot use this method anonymously.");
    };

    if (not isThereEnoughMemoryPrivate()) {
        return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    canistergeekMonitor.collectMetrics();

   Map.set(userNotificationSettings, phash, caller, notificationSettings);

return #ok();
};








//general utility to create a notification
public shared ({caller}) func  createNotification(notificationType : NotificationType, content : NotificationContent) : async Result.Result<(), Text> {

    let isNuanceCanister = func(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        U.arrayContains(ENV.NOTIFICATIONS_CANISTER_ADMINS, c);
    };

    let postBuckets = await CanisterDeclarations.getPostCoreCanister().getBucketCanisters();

    let isPostBucket = func(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        for (bucket in Iter.fromArray(postBuckets)) {
            if (bucket.0 == c) {
                return true;
            };
        };
        return false;
    };

    let nft = await CanisterDeclarations.getNftFactoryCanister().getAllNftCanisterIds();

    let isNftCanister = func(caller : Principal) : Bool {
        var c = Principal.toText(caller);
        for (canister in Iter.fromArray(nft)) {
            if (canister.1 == c) {
                return true;
            };
        };
        return false;
    };




    if ( not isNuanceCanister(caller) and not isPostBucket(caller) and not isNftCanister(caller)) {
        return #err("Cannot use this method anonymously.");
    };

    if (isAnonymous(caller)) {
        return #err("Cannot use this method anonymously.");
    };

   

    if (not isThereEnoughMemoryPrivate()) {
        return #err("Canister reached the maximum memory threshold. Please try again later.");
    };

    canistergeekMonitor.collectMetrics();

    var notification = {
        id = Nat.toText(notificationId);
        notificationType = notificationType;
        content = {
            url = content.url;
            senderPrincipal = content.senderPrincipal;
            senderHandle = content.senderHandle;
            receiverPrincipal = content.receiverPrincipal;
            receiverHandle = content.receiverHandle;
            tags = content.tags;
            articleId = content.articleId;
            articleTitle = content.articleTitle;
            authorPrincipal = content.authorPrincipal;
            authorHandle = content.authorHandle;
            comment = content.comment;
            isReply = content.isReply;
            tipAmount = content.tipAmount;
            token = content.token;
        };
        timestamp = Int.toText(Time.now());
        read = false;
    };

    
    if (notification.content.senderHandle == "") {
        let sender = await UserCanister.getUserByPrincipalId(Principal.toText(notification.content.senderPrincipal));
        switch (sender) {
            case (#ok(user)) {
              notification := {
                id = Nat.toText(notificationId);
                notificationType = notificationType;
                content = {
                    url = content.url;
                    senderPrincipal = content.senderPrincipal;
                    senderHandle = user.handle;
                    receiverPrincipal = content.receiverPrincipal;
                    receiverHandle = content.receiverHandle;
                    tags = content.tags;
                    articleId = content.articleId;
                    articleTitle = content.articleTitle;
                    authorPrincipal = content.authorPrincipal;
                    authorHandle = content.authorHandle;
                    comment = content.comment;
                    isReply = content.isReply;
                    tipAmount = content.tipAmount;
                    token = content.token;
                };
                timestamp = Int.toText(Time.now());
                read = false;
              };
            };
            case (#err(err)) {
            };
        };
        
    };

    switch (notificationType) {
        case (#NewCommentOnMyArticle) {
            //shouldn't happen because it is handled in comment broadcast
            //direct
            switch( await createDirectNotificationInternal(notification)) {
                case (#ok()) {
                    return #ok();
                };
                case (#err(err)) {
                    return #err(err);
                };
                
            };

        };

        case (#NewFollower) {
            //direct
            switch( await createDirectNotificationInternal(notification)) {
                case (#ok()) {
                    return #ok();
                };
                case (#err(err)) {
                    return #err(err);
                };
                
            };
        };
        case (#TipReceived) {
            //direct
            switch( await createDirectNotificationInternal(notification)) {
                case (#ok()) {
                    return #ok();
                };
                case (#err(err)) {

                    return #err(err);
                };
                
            };
        };
        case (#PremiumArticleSold) {
           
          //generate handles for frontend
            var authorHandle = "";
            var senderHandle = "";
            switch (await UserCanister.getUserByPrincipalId(Principal.toText(content.authorPrincipal))) {
                case (#ok(user)) {
                 
                    authorHandle := user.handle;
                  };
                case (#err(err)) {
                  Debug.print("createNotification: error: " # debug_show(err));

                    return #err(err);
                };
            };

            //Comment when sender bug is solved in NFT canister
            //Currently the NFT canister sends its own address as the senderPrincipal
            // switch (await UserCanister.getUserByPrincipalId(Principal.toText(content.senderPrincipal))) {
            //     case (#ok(user)) {
            //         senderHandle := user.handle;
            //       };
            //     case (#err(err)) {
            //       Debug.print("createNotification: error: " # debug_show(err));

            //         return #err(err);
            //     };
            // };


          //get article details
            var url = "";
            var articleTitle = "";
            var tags = Buffer.Buffer<Text>(0);

         let postCore = CanisterDeclarations.getPostCoreCanister();
         switch(await postCore.getPostKeyProperties(content.articleId)) {
            case(#ok(keyProperties)) {
              let PostBucketCanister = CanisterDeclarations.getPostBucketCanister(keyProperties.bucketCanisterId);
              switch(await PostBucketCanister.getPost(content.articleId)) {
                case(#ok(post)) {
                  
                  url := post.url;
                  articleTitle := post.title;
                  for (tag in Iter.fromArray(keyProperties.tags)) {
                    tags.add(tag.tagName);
                  };
                };
                case(#err(error)) {
                  //nothing to see here
                };
              };
            };
            case(#err(error)) {
              //nothing to see here
            };
          };

           
          
            notification := {
                id = Nat.toText(notificationId);
                notificationType = notificationType;
                content = {
                    url = url;
                    senderPrincipal = content.senderPrincipal;
                    senderHandle = senderHandle;
                    receiverPrincipal = content.receiverPrincipal;
                    receiverHandle = authorHandle;
                    tags = Buffer.toArray(tags);
                    articleId = content.articleId;
                    articleTitle = articleTitle;
                    authorPrincipal = content.authorPrincipal;
                    authorHandle = authorHandle;
                    comment = content.comment;
                    isReply = content.isReply;
                    tipAmount = content.tipAmount;
                    token = content.token;
                };
                timestamp = Int.toText(Time.now());
                read = false;
            };


            
            switch( await createDirectNotificationInternal(notification)) {
                case (#ok()) {
                    return #ok();
                };
                case (#err(err)) {

                    return #err(err);
                };
                
            };
        };
        case (#NewCommentOnFollowedArticle) {
        
            switch (await addBroadcast(notification)) {
                case (#ok()) {
                    switch (await createBroadcastNotification(notification)) {
                        case (#ok()) {
                            return #ok();
                        };
                        case (#err(err)) {

                            return #err("Distribution of notifications failed: " # err);
                        };
                    };
                };
                case (#err(err)) {

                    return #err( "Failed to addBroadcast event: " # err);
                };
            };

        };
        case (#NewArticleByFollowedWriter) {
            
            switch (await createBroadcastNotification(notification)) {
                case (#ok()) {
                    return #ok();
                };
                case (#err(err)) {

                    return #err(err);
                };
            };
        };
        case (#NewArticleByFollowedTag) {
            switch (await createBroadcastNotification(notification)) {
                case (#ok()) {
                    return #ok();
                };
                case (#err(err)) {

                    return #err(err);
                };
            };
        };
    };

    #ok();
};









////////////////////////direct notifications////////////////////////////////////
func createDirectNotificationInternal(notification : Notifications) : async Result.Result<(), Text> {
  
    let receiver = notification.content.receiverPrincipal;

        switch (await updateUserDirectNotification(receiver, notification)) {
            case (#err(err)) {
                return #err(err);
                
            };
            case (#ok()) {
               notificationId += 1;
                return #ok();
            };
        };
       
      
};

func updateUserDirectNotification(receiver : Principal, notification : Notifications) : async Result.Result<(), Text> {
    
        let directNotifications = Map.get(userDirectNotifications, phash, receiver);
        switch (directNotifications) {
            case null {
                let newDirectNotificationHashmap = Map.new<Text, Notifications>();
                Map.set(newDirectNotificationHashmap, thash, Nat.toText(notificationId), notification);
                Map.set(userDirectNotifications, phash, receiver, {notifications = newDirectNotificationHashmap}); 
            };
            case (?directNotifications) {
               Map.set(directNotifications.notifications, thash, Nat.toText(notificationId), notification);
            };
        };

#ok();
};










////////////////////////broadcast notifications////////////////////////////////////

func updateUserBroadcastNotification(receiver : Principal, notification : Notifications) : async Result.Result<(), Text> {
    let broadcastNotifications = userBroadcastNotifications.get(receiver);
    switch (broadcastNotifications) {
        case null {
            let newBroadcastNotificationHashmap = HashMap.HashMap<Text, Notifications>(initCapacity, Text.equal, Text.hash);
            newBroadcastNotificationHashmap.put(Nat.toText(notificationId), notification);
            userBroadcastNotifications.put(receiver, newBroadcastNotificationHashmap);
        };
        case (?broadcastNotifications) {
            broadcastNotifications.put(Nat.toText(notificationId), notification);
        };
    };
    #ok();
};

//Adds to internal hashmap for bulk distribution
func addBroadcast (notification : Notifications) : async Result.Result<(), Text> {
  switch (notification.notificationType) {
    case (#NewCommentOnFollowedArticle) {
    //add sender to articleCommenters hashmap
    let articleId = notification.content.articleId;
    let sender = notification.content.senderPrincipal;
    let author = notification.content.authorPrincipal;
    let commenters = articleCommenters.get(articleId);
    switch (commenters) {
        case null {
          if (sender != author) {
            articleCommenters.put(articleId, [sender]);
           };
        };
        case (?commenters) {
            let commentersBuffer = Buffer.Buffer<Principal>(0);
            for (c in Iter.fromArray(commenters)) {
              //prevent double notifications to author or previous sender
              if (c != sender and c != author) {
                commentersBuffer.add(c);
              } else {
               return #ok();
              };
            };
            commentersBuffer.add(sender);
            articleCommenters.put(articleId, Buffer.toArray(commentersBuffer));
        };
    };
     return #ok();
    };
    case (#NewArticleByFollowedWriter) {      
      let author = notification.content.authorHandle;
      // get user canister to update followers
      let userCanister = CanisterDeclarations.getUserCanister();
      let followers = await userCanister.getUserFollowers(author);
     

      switch (followers) {
          case (followers) {
              for (f in Iter.fromArray(followers)) {
                  let receiver = f;
                  let newNotification = {
                      id = Nat.toText(notificationId);
                      notificationType = notification.notificationType;
                      content = notification.content;
                      timestamp = Int.toText(Time.now());
                      read = false;
                  };
                  switch (await updateUserBroadcastNotification(Principal.fromText(receiver.principal), newNotification)) {
                      case (#err(err)) {
                          return #err(err);
                      };
                      case (#ok()) {
                  notificationId += 1;
                  };
              };
          };
      };
    };
    return #ok();
    };
    case (#NewArticleByFollowedTag) {

      //postcore
      let postCore = CanisterDeclarations.getPostCoreCanister();


      let tags = notification.content.tags;
      for (tag in Iter.fromArray(tags)) {
      let  followers = await postCore.getTagFollowers(tag);
      switch (followers) {
         
          case (#ok(followers)) {
              for (f in Iter.fromArray(followers)) {
                  let receiver = f;
                  let newNotification = {
                      id = Nat.toText(notificationId);
                      notificationType = notification.notificationType;
                      content = notification.content;
                      timestamp = Int.toText(Time.now());
                      read = false;
                  };
                  switch (await updateUserBroadcastNotification(Principal.fromText(receiver), newNotification)) {
                      case (#err(err)) {
                          return #err(err);
                      };
                      case (#ok()) {
                  notificationId += 1;
                  };

              };
          };
      };
      case (#err(err)) {
          return #err(err);
      };
    };
      };
    return #ok();
    };
  case (#NewFollower) {
    return #err("Broadcast notifications for new followers are not supported");
  };
  case (#TipReceived) {
    return #err("Broadcast notifications for tips are not supported");
  };
  case (#PremiumArticleSold) {
    return #err("Broadcast notifications for premium articles are not supported");
  };
  case (#NewCommentOnMyArticle) {
    return #err("Broadcast notifications for comments on my article are not supported");
  };
  };
};

func createBroadcastNotification (notification : Notifications) : async Result.Result<(), Text> {
  switch (notification.notificationType) {
    case (#NewCommentOnFollowedArticle) {
  let articleId = notification.content.articleId;
  let commenters = articleCommenters.get(articleId);
  switch (commenters) {
      case null {};
      case (?commenters) {
          for (c in Iter.fromArray(commenters)) {
              let receiver = c;
              let newNotification = {
                  id = Nat.toText(notificationId);
                  notificationType = notification.notificationType;
                  content = notification.content;
                  timestamp = Int.toText(Time.now());
                  read = false;
              };
              if (receiver != notification.content.senderPrincipal and receiver != notification.content.authorPrincipal) {
              switch (await updateUserBroadcastNotification(receiver, newNotification)) {
                  case (#err(err)) {
                      return #err(err);
                  };
                  case (#ok()) {
              notificationId += 1;
        };
       };
              };
      };  

            //special cases, for when a broadcast is also a direct notification
            //give the author a direct notification but only if they are not the sender
            if (notification.content.authorPrincipal != notification.content.senderPrincipal) {
            let notificationContent : NotificationContent = {
                url = notification.content.url;
                senderPrincipal = notification.content.senderPrincipal;
                senderHandle = notification.content.senderHandle;
                receiverPrincipal = notification.content.authorPrincipal;
                receiverHandle = notification.content.authorHandle;
                tags = [];
                articleId = notification.content.articleId;
                articleTitle = notification.content.articleTitle;
                authorPrincipal = notification.content.authorPrincipal;
                authorHandle = notification.content.authorHandle;
                comment = notification.content.comment;
                isReply = notification.content.isReply;
                tipAmount = "";
                token = "";
            };
            let newNotification : Notifications = {
                id = Nat.toText(notificationId);
                notificationType = #NewCommentOnMyArticle;
                content = notificationContent;
                timestamp = Int.toText(Time.now());
                read = false;
            };
            switch (await createDirectNotificationInternal(newNotification)) {
                case (#err(err)) {
                    return #err(err);
                };
                case (#ok()) {
                    notificationId += 1;
                };
            };
            };
    };

  };
  return #ok();
    };
    case (#NewArticleByFollowedWriter) {
      let author = notification.content.authorHandle;
      
      let userCanister = CanisterDeclarations.getUserCanister();
      let followers = await userCanister.getUserFollowers(author);

      switch (followers) {
          case (followers) {
              for (f in Iter.fromArray(followers)) {
                  let receiver = f;
                  let newNotification = {
                      id = Nat.toText(notificationId);
                      notificationType = notification.notificationType;
                      content = notification.content;
                      timestamp = Int.toText(Time.now());
                      read = false;
                  };
                  switch (await updateUserBroadcastNotification(Principal.fromText(receiver.principal), newNotification)) {
                      case (#err(err)) {
                          return #err(err);
                      };
                      case (#ok()) {
                  notificationId += 1;
                  };
              };
          };
      };
    };
    return #ok();
    };
    case (#NewArticleByFollowedTag) {

      let postCore = CanisterDeclarations.getPostCoreCanister();
      

      let tags = notification.content.tags;
      for (tag in Iter.fromArray(tags)) {
      let  followers = await postCore.getTagFollowers(tag);
      switch (followers) {
          case (#ok(followers)) {
              for (f in Iter.fromArray(followers)) {
                  let receiver = f;
                  let newNotification = {
                      id = Nat.toText(notificationId);
                      notificationType = notification.notificationType;
                      content = notification.content;
                      timestamp = Int.toText(Time.now());
                      read = false;
                  };
                  switch (await updateUserBroadcastNotification(Principal.fromText(receiver), newNotification)) {
                      case (#err(err)) {
                          return #err(err);
                      };
                      case (#ok()) {
                  notificationId += 1;
                  };
              };
          };
      };
      case (#err(err)) {
          return #err(err);
      };
      };
      };
      return #ok();
      
    };
  case (#NewFollower) {
    return #err("Broadcast notifications for new followers are not supported");
  };
  case (#TipReceived) {
    return #err("Broadcast notifications for tips are not supported");
  };
  case (#PremiumArticleSold) {
    return #err("Broadcast notifications for premium articles are not supported");
  };
  case (#NewCommentOnMyArticle) {
    return #err("Broadcast notifications for comments on my article are not supported");

  };
  };
};






// #endregion

private stable var userDirectNotificationsEntries : [(Principal, [(Text, Notifications)])] = [];
private stable var userBroadcastNotificationsEntries : [(Principal, [(Text, Notifications)])] = [];
private stable var userNotificationSettingsEntries : [(Principal, UserNotificationSettings)] = [];
private stable var articleCommentersEntries : [(Text, [Principal])] = [];


system func preupgrade() {
    
    // Repeat for userBroadcastNotifications if needed
    userBroadcastNotificationsEntries := [];
    for ((user, notifications) in userBroadcastNotifications.entries()) {
        var userEntries : [(Text, Notifications)] = [];
        for ((notifId, notif) in notifications.entries()) {
            userEntries := Array.append(userEntries, [(notifId, notif)]);
        };
        userBroadcastNotificationsEntries := Array.append(userBroadcastNotificationsEntries, [(user, userEntries)]);
    };

    articleCommentersEntries := Iter.toArray(articleCommenters.entries());




};


 system func postupgrade() {

    

    

    for ((user, notifEntries) in Iter.fromArray(userBroadcastNotificationsEntries)) {
        let notifsHashMap = HashMap.HashMap<Text, Notifications>(notifEntries.size(), Text.equal, Text.hash);
        for ((notifId, notif) in Iter.fromArray(notifEntries)) {
            notifsHashMap.put(notifId, notif);
        };
        //top-level hashmap
        userBroadcastNotifications.put(user, notifsHashMap);
    };


      articleCommenters := HashMap.HashMap<Text, [Principal]>(articleCommentersEntries.size(),Text.equal,Text.hash);

      userNotificationSettingsEntries := [];
      articleCommentersEntries := [];
};
            };
