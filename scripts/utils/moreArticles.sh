

# a functions which loops through the list of posts and creates a new post for each one
# for i in $(i )
dfx identity new 1
dfx identity use 1  # switch to the first wallet
dfx canister call User registerUser '("one1", "one1", "")' --type idl
for i in {1..100} ; do
    echo "Creating article $i"
    echo ""
    POST="(record {
        postId=\"\";
        title=\" $i \";
        headerImage=\"\";
        subtitle=\"$i\";
        content=\"$i\";
        isDraft=false;
        creator=\"\";
        isPublication=false;
        isPremium=false;
        category=\"\";
        tagIds=vec {
            \"1\";
            \"2\";
        };
    })"
    dfx canister call Post save $(./scripts/didc encode "$POST") --type=raw
done
echo "Articles created switching wallets"

dfx identity new 2 
dfx identity use 2  # switch to the first wallet


# register on nuance
dfx canister call User registerUser '("two2", "two2", "")' --type idl


for i in {101..200} ; do
    echo "Creating article $i"
    echo ""
    POST="(record {
        postId=\"\";
        title=\" $i \";
        headerImage=\"\";
        subtitle=\"$i\";
        content=\"$i\";
        isDraft=false;
        creator=\"\";
        isPublication=false;
        isPremium=false;
        category=\"\";
        tagIds=vec {
            \"1\";
            \"2\";
        };
    })"
    dfx canister call Post save $(./scripts/didc encode "$POST") --type=raw
done
echo "Articles created switching wallets back to default"
dfx identity use default
