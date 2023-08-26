#Creates articles for local testing
# Usage (run from nuance root folder)
# sudo sh ./scripts/CreateArticles.sh

# IMPORTANT: TO RUN THIS SCRIPT, FIRST COMMENT OUT THE FOLLOWING LINE
# IN THE POST CANISTER, THEN RUN THE BuildNuance.sh SCRIPT.
# await submitPostToModclub(postId, postModel, postVersion);

echo "Create articles"

POST1="(record {
    postId=\"\";
    title=\"Design Decoded: The Top 12 Easy to Read Fonts\";
    headerImage=\"/basketball.png\";
    subtitle=\"The subtitle\";
    content=\"How important is it to choose the right font for your website?
        With a legible font, your business’s message comes through loud and clear.\";
    isDraft=false;
    tagIds=vec {
        \"1\";
        \"2\";
    };
    creator=\"\";
    isPublication=false;
    category=\"\";
})"

echo "Creating article 1"
echo ""
dfx canister call Post save $(./scripts/didc encode "$POST1") --type=raw
echo ""

echo "Creating article 2"
echo ""
POST2="(record {
    postId=\"\";
    title=\"How To Train a Dragon\";
    headerImage=\"/Interior11.png\";
    subtitle=\"The subtitle\";
    content=\"The most important skill for training a dragon is knowing when to feed it.
        Dragons like to eat before, during and after a trick.\";
    isDraft=false;
    tagIds=vec {
        \"3\";
        \"4\";
    };
    creator=\"\";
    isPublication=false;
    category=\"\";
})"
dfx canister call Post save $(./scripts/didc encode "$POST2") --type=raw
echo ""

echo "Creating article 3"
echo ""
POST3="(record {
    postId=\"\";
    title=\"NFTs on the Internet Computer\";
    headerImage=\"/Paris-street-of-small-stores.png\";
    subtitle=\"The subtitle\";
    content=\"The Internet Computer stores NFTs completely on-chain, not just URLs
        to metadata with URLs to images that are actually hosted on AWS.\";
    isDraft=false;
    tagIds=vec {
        \"5\";
        \"6\";
    };
        creator=\"\";
    isPublication=false;
    category=\"\";
})"
dfx canister call Post save $(./scripts/didc encode "$POST3") --type=raw
echo ""

echo "Creating article 4"
echo ""
POST4="(record {
    postId=\"\";
    title=\"Coffee or Tea?\";
    headerImage=\"/Rectangle258.png\";
    subtitle=\"The subtitle\";
    content=\"Neither. Exercise, sleep and a healthy diet will give you far more energy than coffee or tea.\";
    isDraft=false;
    tagIds=vec {
        \"7\";
        \"8\";
    };
        creator=\"\";
    isPublication=false;
    category=\"\";
})"
dfx canister call Post save $(./scripts/didc encode "$POST4") --type=raw
echo ""

echo "Creating article 5"
echo ""
POST5="(record {
    postId=\"\";
    title=\"There are many truths\";
    headerImage=\"/image10.png\";
    subtitle=\"Truth in philosophy and logic\";
    content=\"Truth is the aim of belief; falsity is a fault. People need the truth about the world in order to thrive. Truth is important. Believing what is not true is apt to spoil people’s plans and may even cost them their lives. Telling what is not true may result in legal and social penalties. Conversely, a dedicated pursuit of truth characterizes the good scientist, the good historian, and the good detective. So what is truth, that it should have such gravity and such a central place in people’s lives?\";
    isDraft=false;
    tagIds=vec {
        \"9\";
        \"10\";
    };
        creator=\"\";
    isPublication=false;
    category=\"\";
})"
dfx canister call Post save $(./scripts/didc encode "$POST5") --type=raw
echo ""

echo "Creating article 6"
echo ""
POST6="(record {
    postId=\"\";
    title=\"To Become A Good Writer, You Must First Become An Artist\";
    headerImage=\"/image12.png\";
    subtitle=\"Writing lessons we can learn from Vincent Van Gogh\";
    content=\"Writing, for some, for those who do a lot of it, may seem like a mechanical process. A formulaic procedure, a technical exercise. But for those who do it not as a profession, but a pleasurable pursuit, writing takes time, inspiration, and great thought. Writing, for those who truly love it, is a humanist endeavour: a way of making sense of the world in which they live. In this way it is art, and should be treated and understood as such.
        Vincent van Gogh was an artist, but was also a writer. His heartfelt letters to his brother have been heralded for their use of “personal tone, evocative style, and lively language”. They truly gave insight into Van Gogh’s life, and the inner workings of his soul. W. H. Auden, an Anglo-American poet who contributed to an anthology on Van Gogh, writes, “there is scarcely one letter by Van Gogh which I, who am certainly no expert, do not find fascinating”.\";
    isDraft=false;
    tagIds=vec {
        \"11\";
        \"12\";
    };
        creator=\"\";
    isPublication=false;
    category=\"\";
})"
dfx canister call Post save $(./scripts/didc encode "$POST6") --type=raw
echo ""

echo "Get latest posts"
echo ""
#dfx canister call Post getLatestPosts 

echo "Completed!"

#endregion