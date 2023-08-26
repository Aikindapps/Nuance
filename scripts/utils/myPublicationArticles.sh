dfx identity new 1
echo "Created identity 1"
dfx identity use 1  # switch to the first wallet
echo "Switched to identity 1"
dfx canister call User registerUser '("one1", "one1", "")' --type idl
echo "Registered user one1"
dfx identity use default 
echo "Switched to default identity to add to publication (ensure default is an editor of the publication)"
dfx canister call Publisher0 addEditor '("one1", "one1")' --type idl
echo "Added editor one1 to publication"
dfx identity new 2
echo "Created identity 2"
dfx identity use 2  # switch to the second wallet
echo "Switched to identity 2"
dfx canister call User registerUser '("two2", "two2", "")' --type idl
echo "Registered user two2"
dfx identity use default
echo "Switched to default identity to add to publication (ensure default is an editor of the publication)"
dfx canister call Publisher0 addEditor '("two2", "two2")' --type idl
echo "Added editor two2 to publication"
dfx identity use 1
echo "Switched to identity 1 to create articles"

for i in {234..244} ; do
    echo "Creating article $i"
    echo ""
    POST="(record {
        postId=\"\";
        title=\"PUBLICATION $i \";
        headerImage=\"\";
        subtitle=\"$i\";
        content=\"$i\";
        isDraft=false;
        creator=\"one1\";
        category=\"\";
        isPublication=false;
        tagIds=vec {
            \"1\";
            \"2\";
        };
    })"
    dfx canister call Publisher0 publicationPost $(./scripts/didc encode "$POST") --type=raw
done
echo "Articles created switching wallets"

dfx identity new 2 
dfx identity use 2  # switch to the first wallet

# for i in {212..222} ; do
#     echo "Creating article $i"
#     echo ""
#     POST="(record {
#         postId=\"\";
#         title=\"PUBLICATION $i \";
#         headerImage=\"\";
#         subtitle=\"$i\";
#         content=\"$i\";
#         isDraft=false;
#         creator=\"\";
#         isPublication=false;
#         category=\"\";
#         tagIds=vec {
#             \"1\";
#             \"2\";
#         };
#     })"
#     dfx canister call Publisher0 publicationPost $(./scripts/didc encode "$POST") --type=raw
# done
# echo "Articles created switching wallets back to default"
# dfx identity use default
