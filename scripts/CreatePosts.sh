network=$1

echo ""
echo "Create 10 new users and create 2 posts for each new user."
echo ""
counter=1
postCounter=0
while [ $counter -lt 11 ]
do
  dfx identity new nuance-identity-$counter 2>/dev/null
  if [ $? -eq 0 ]; then
    dfx identity use nuance-identity-$counter
  else
    dfx identity use nuance-identity-$counter
  fi
  echo ""
  echo "##### Register User #####"
  echo ""
  handle=nuance-identity-$counter
  displayName=identity-$counter
  dfx canister --network $network call User registerUser '("'$handle'", "'$displayName'", "")' --type idl
  
  counterLocal=0
  while [ $counterLocal -lt 2 ]
  do
    title=DevInstall-article-$postCounter
    subtitle=Subtitle-$postCounter
    content=DevInstall-$postCounter-content
    dfx canister call --network $network PostCore save '(record {
        postId=""; 
        title="'$title'"; 
        subtitle="'$subtitle'"; 
        headerImage=""; 
        content="'$content'"; 
        isDraft=false; 
        tagIds= vec{"1"; "5";}; 
        creatorPrincipal="";
        creatorHandle=""; 
        isPublication=false; 
        category=""; 
        premium=null;
        handle="";
        isMembersOnly=false;
        scheduledPublishedDate=null;
    })'

    counterLocal=$((counterLocal + 1))
    postCounter=$((postCounter + 1))
  done

  counter=$((counter + 1))
done