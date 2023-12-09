This document will cover how the new architecture will replace the old Post canister. In order to do that, will list all the public methods in old Post canister and explain how the PostCore and PostBucket canisters will replace them.

Modclub management:
addNewRules -> Kept in PostCore, no change.
addPostCategory -> Implemented in both canisters. Category management will be handled by PostBucket canister but in order to filter the posts by category in the category landing page for publications, PostCore canister also keeps the categories of the posts. Users can update the category of the post by calling save method in PostCore or calling the addPostCategory-removePostCategory methods in bucket canisters.
clapPost -> Popularity indexing is only handled by PostCore. Implemented only there.
collectCanisterMetrics -> implemented in both bucket and core canisters.
copyPostsFromHandleToPublication -> It was a migration post, out of scope.
createTag -> Tag management is handled by PostCore. Implemented only there. Initial configuration method.
currentId -> Kept in PostCore only.
delete -> Implemented in both bucket and core canisters. Calling it from PostCore canister also deletes the post from the bucket canisters. Use PostCore method.
deleteUserPosts -> Implemented in both bucket and core canisters. Calling it from PostCore canister also deletes the user posts from the bucket canisters. Use PostCore method.
dumpIds -> Implemented in both. Returns the ids of the posts kept in Bucket canister. If you call it from PostCore, returns all the postIds.
dumpPosts -> Implemented in both.
dumpUserIds -> Implemented in both.
followTag -> Tag management is handled by PostCore. Implemented only there.
generateAccountIds -> It was a migration post, out of scope.
generateContent -> it's only implemented in bucket canisters. It's used for storeSEO method.
generateLatestPosts -> new posts management is handled by the PostCore canister. It's only in the generateLatestPosts method
generateLowercaseHandles -> it was a migration method. out of scope
generatePublishedDates -> it's used for latest posts management. Only implemented in PostCore
generateWordCounts -> it was a migration method. out of scope
get -> It's implemented both in Core and bucket canisters. Core canister returns the key properties only. Bucket canister returns the full article.
getAdmins -> Admin management method. Both canisters have it.
getAllTags -> Tag management is handled by PostCore. Only present in PostCore canister.
getCanisterMetrics -> Both has it.
getCgUsers -> Both has it.
getKinicList -> Implemented both in PostCore and bucket canisters. PostCore version will be used.
getLatestPosts -> Implemented only in PostCore canister. PostCore canister returns the key properties and the user will do parallel calls to the bucket canisters with the method getPostsByPostIds to fetch the article list items.
getList -> Implemented both in PostCore and bucket canisters. PostCore canister will return the key properties and the user will do parallel calls to the bucket canister to get the full versions.
getMetadata -> Implemented only in bucket canister because it needs the full post.
getMoreLatestPosts -> Implemented both in PostCore and bucket canisters. PostCore canister will return the key properties and the user will do parallel calls to the bucket canister to get the full versions.
getMyPosts -> Implemented both in PostCore and bucket canisters. PostCore canister will return the key properties and the user will do parallel calls to the bucket canister to get the full versions.
getMyTags -> Tag management is handled by PostCore. Only implemented there.
getNftCanisters -> implemented in both canisters. returns all the nft canister ids with the publication handles.
getPopular -> Popular post indexing is handled by PostCore. It returns a list of key properties and users can do parallel calls to different bucket canisters to fetch the full posts.
getPopularThisMonth -> Popular post indexing is handled by PostCore. It returns a list of key properties and users can do parallel calls to different bucket canisters to fetch the full posts.
getPopularThisWeek -> Popular post indexing is handled by PostCore. It returns a list of key properties and users can do parallel calls to different bucket canisters to fetch the full posts.
getPopularToday -> Popular post indexing is handled by PostCore. It returns a list of key properties and users can do parallel calls to different bucket canisters to fetch the full posts.
getPostUrls -> Implemented in both. Bucket canister version works as it is in the old Post canister. PostCore canister gets the urls from each bucket canister and adds them up.
getPostWithPublicationControl -> Only implemented in bucket canister. Works same.
getPostsByCategory -> Implemented only in PostCore. PostCore canister will return the key properties and the user will do parallel calls to the bucket canisters by calling the getPostsByPostIds method to get the full versions.
getPostsByFollowers -> Implemented only in PostCore. PostCore canister will return the key properties and the user will do parallel calls to the bucket canisters by calling the getPostsByPostIds method to get the full versions.
getPostsByPostIds -> Implemented both in PostCore and bucket canisters. PostCore canister returns only the key properties and the bucket canister returns the full version. Added the includeDraft argument to bucket canister version to allow users to get their draft posts by calling this method.
getPremiumArticle -> Implemented only in bucket canisters. Works as it is in the old Post canister.
getRegisteredRules -> Kept in PostCore, no change.
getTagsByUser -> Kept in PostCore, no change.
getTotalArticleViews -> Kept in PostCore, no change.
getTotalPostCount -> Implemented in both canisters. Bucket canister returns only the post count in the bucket canister. PostCore returns the full number.
getTrustedCanisters -> Admin management method. Both canisters have it.
getUserPostCounts -> Kept in PostCore. No change.
getUserPostIds -> Kept in PostCore. No change.
getUserPosts -> Implemented both in PostCore and bucket canisters. PostCore canister will return the key properties and the user will do parallel calls to the bucket canister to get the full versions.
getViewsByRange -> Only in PostCore. No change.
getWordCount -> Only in PostBucket - retired.
latestPostsMigration -> it was a migration method. out of scope
linkWritersToPublicationPosts -> it was a migration method. out of scope
makePostPremium -> Only in PostBucket. No change.
migratePostsFromFastblocks -> it was a migration method. out of scope
migratePostToPublication -> It's NOT a migration post. Kept in PostBucket canister. no change.
modClubCallback -> Kept in PostCore. No change.
registerAdmin -> Admin management method. Both canisters have it.
registerCanister -> Admin management method. Both canisters have it.
registerCgUser -> Admin management method. Both canisters have it.
registerNftCanisterId -> Implemented in both. PostCore version calls the method in all the bucket canister. While creating a new NFT canister, only calling the PostCore version will work fine.
registerNftCanisterIdAdminFunction -> Admin management method. Both canisters have it.
registerPublisher -> Kept in PostCore. No change.
reindex -> Implemented in both. PostCore version calls the method in all the bucket canisters. PostCore version should be used.
removeExistingRules -> Only in PostCore. No change.
removePostCategory -> Implemented only in bucket canisters. Category management will be handled by PostBucket canister but in order to filter the posts by category in the category landing page for publications, PostCore canister also keeps the categories of the posts. Users can update the category of the post by calling save method in PostCore or calling the addPostCategory-removePostCategory methods in bucket canisters.
save -> save method is implemented in both canisters but users HAVE TO call the PostCore version. PostBucket canister rejects all the calls that's not coming from PostCore canister. PostCore canister version works same as the existing one. It handles the splitting logic.
setUpModClub -> Kept in PostCore. No change.
simulateModClub -> Kept in PostCore. No change.
simulatePremiumArticle -> Kept in bucket canister. Works fine.
storeAllSEO -> Implemented in both. PostCore version calls all the bucket canister methods too. Use PostCore version.
storeSEO -> Only implemented in bucket cansiter. No change.
testInstructionSize -> Implemented in both. No change.
unregisterAdmin -> Admin management method. Both canisters have it.
unregisterCanister -> Admin management method. Both canisters have it.
unregisterCgUser -> Admin management method. Both canisters have it.
updatePostDraft -> draft management is handled by bucket canisters but PostCore canister also needs to store the values. Users will only use the bucket canister version and the PostCore canister version will be called by the bucket canisters.
viewPost -> Kept in PostCore. No change.


Additional methods:

PostBucket:
initializeBucketCanister -> Called right after the canister is deployed. Handles the initial configuration.
setMaxMemorySize -> Sets the threshold to decide if the bucket canister is still active or not - admin function
getMaxMemorySize -> returns the threshold.
isBucketCanisterActivePublic -> a public method that returns true if the canister is still active. Returns false if it's not.
getMemorySize -> returns the used memory of the bucket canister
getPostKeyProperties -> returns the key properties of the given postId


PostCore:
createNewBucketCanister -> Only admins or the PostCore's itself can call it. Creates a new bucket canister and make it active.
getBucketCanisters -> Returns all the bucket cansiters with the first postId of the bucket canister.



