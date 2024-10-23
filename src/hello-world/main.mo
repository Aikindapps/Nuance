import Principal "mo:base/Principal";
actor{
    public shared query ({caller}) func hello() : async Text {
        "Hello " # Principal.toText(caller)
    };

    public shared ({caller}) func hello_update() : async Text {
        "Hello " # Principal.toText(caller)
    };

    public type Icrc28TrustedOriginsResponse = {
        trusted_origins: [Text]
    };

    public shared func icrc28_trusted_origins() : async Icrc28TrustedOriginsResponse{
        return {
            trusted_origins= [
                "https://q5gt5-niaaa-aaaak-qciba-cai.icp0.io"
            ]
        }
    };
}