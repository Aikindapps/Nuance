module {

    public type Content = {
        contentId: Text;
        chunkData: Blob;
        offset: Nat;
        totalChunks: Nat;
        mimeType: Text;
        contentSize: Nat;
    };

};