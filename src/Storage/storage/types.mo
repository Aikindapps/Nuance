import Int "mo:base/Int";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Buffer "mo:base/Buffer";

module {
    public type DataCanisterId = Principal;
    public type ChunkData = Blob;
    public type ChunkId = Text;

    public type ContentInfo = {
        contentId: Text;
        numOfChunks: Nat;
        contentType: Text;
    };
};