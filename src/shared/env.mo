import Principal "mo:base/Principal";
import CanisterIds "canisterIds";
module {
  public let IS_LOCAL = false;
  public let USER_CANISTER_ID = CanisterIds.USER_CANISTER_ID;
  public let POST_CORE_CANISTER_ID = CanisterIds.POST_CORE_CANISTER_ID;
  public let KINIC_ENDPOINT_CANISTER_ID = CanisterIds.KINIC_ENDPOINT_CANISTER_ID;
  public let FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID = CanisterIds.FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID;
  public let POST_RELATIONS_CANISTER_ID = CanisterIds.POST_RELATIONS_CANISTER_ID;
  public let STORAGE_CANISTER_ID = CanisterIds.STORAGE_CANISTER_ID;
  public let CYCLES_DISPENSER_CANISTER_ID = CanisterIds.CYCLES_DISPENSER_CANISTER_ID;
  public let NUANCE_ASSETS_CANISTER_ID = CanisterIds.NUANCE_ASSETS_CANISTER_ID;
  public let METRICS_CANISTER_ID = CanisterIds.METRICS_CANISTER_ID;
  public let PUBLICATION_MANAGEMENT_CANISTER_ID = CanisterIds.PUBLICATION_MANAGEMENT_CANISTER_ID;
  public let NFT_FACTORY_CANISTER_ID = CanisterIds.NFT_FACTORY_CANISTER_ID;
  public let NOTIFICATIONS_CANISTER_ID = CanisterIds.NOTIFICATIONS_CANISTER_ID;
  public let SUBSCRIPTION_CANISTER_ID = CanisterIds.SUBSCRIPTION_CANISTER_ID;
  public let SNS_GOVERNANCE_CANISTER = "rqch6-oaaaa-aaaaq-aabta-cai";
  public let SNS_GOVERNANCE_IC_ACCOUNT = "f77cc353c778b02ad26974891950e4cb3ae1203e5cd8218e1b99bfc4f316d897";
  public let PAUL_PRINCIPAL_ID = "keqno-ecosc-a47cf-rk2ui-5ehla-noflk-jj4it-h6nku-smno2-fucgs-cae";
  public let PAUL_DASHBOARD_PRINCIPAL_ID = "wfcdk-bgpsf-gghqn-m5v6j-454p2-n4aco-e2fd3-lsg6u-g7nns-az2bm-pqe";
  public let MITCH_PRINCIPAL_ID = "3v3rk-jx25f-dl43p-osgkw-6dm7b-wguwy-kjcun-lyo3w-lsuev-kcdnp-7qe";
  public let MITCH_DASHBOARD_PRINCIPAL_ID = "rzft3-wnao6-7wepo-5asq7-ou2p3-u35pg-jbtul-b2puf-fr24l-iyyjr-5ae";
  public let BARAN_PRINCIPAL_ID = "p5x7e-xqqb3-orerc-tmqof-rnhhy-5y7r7-vpoog-bpqrf-6cuki-bwdpd-3ae";
  public let BARAN_DASHBOARD_PRINCIPAL_ID = "cy7n3-o7lpm-lij55-yisew-ubfjf-bjq5a-46vej-2xw3d-5hjxs-znnvm-eae";
  public let BARAN_DASHBOARD_PRINCIPAL_ID_LOCAL = "z6siy-nz3zx-njbew-yoypf-fn2ti-nkfej-zz2vy-zmy5f-kdzez-ojapo-bqe";
  public let BARAN_SCRIPT_PRINCIPAL_ID = "sm66y-rvdjg-xmwtd-ri3pf-ryf7b-otbxg-5yvfx-lobwu-a3zwp-nd24f-vqe";
  public let ILYAS_PRINCIPAL_ID = "c3ex3-xqejx-wbada-ly2rt-j4djv-w6hp6-lcv4j-jm7wy-mg23w-vqzya-lqe";
  public let NICK_PRINCIPAL_ID = "lak3h-wosi7-pjqxd-fpluz-2etul-g7zza-fvm56-tz3sc-efctb-a3qp6-2qe";
  public let NICK_DASHBOARD_PRINCIPAL_ID = "67owo-lqhq6-2vsvz-ne4qm-g4e2q-2kasi-at36g-zppj6-obsdc-d32rg-jqe";
  public let RHIANNON_PRINCIPAL_ID = "cqt7v-ben4o-y335u-srt3v-nzd6e-wknuf-2t2mb-mji7i-ar3bf-7ysop-2qe";
  public let KYLE_PRINCIPAL_ID = "ftiej-pml6t-p3n5s-afoi2-ksnxp-3yyis-lzg6v-mwdwn-evzhq-6j56q-xqe";
  public let VM_1_PRINCIPAL_ID = "btrx2-makdj-pw2cp-u264a-cntkp-2mzjv-56oqc-6r7uu-ocexg-mf3sn-qqe";
  public let VM_2_PRINCIPAL_ID = "gs5lq-gst3q-56phb-4sxwu-eo4nu-fqe3z-k2euk-5okx7-tguxu-x7nkr-nae";
  public let VM_3_PRINCIPAL_ID = "lwff2-ldzrq-mjfix-dde3y-tnczf-ju3zj-riwla-y6cvv-pxxmn-hokps-oqe";

  public let PLATFORM_OPERATORS = [
    PAUL_PRINCIPAL_ID,
    PAUL_DASHBOARD_PRINCIPAL_ID,

    MITCH_PRINCIPAL_ID,
    MITCH_DASHBOARD_PRINCIPAL_ID,

    BARAN_PRINCIPAL_ID,
    BARAN_DASHBOARD_PRINCIPAL_ID,
    BARAN_DASHBOARD_PRINCIPAL_ID_LOCAL,
    BARAN_SCRIPT_PRINCIPAL_ID,

    ILYAS_PRINCIPAL_ID,

    NICK_PRINCIPAL_ID,
    NICK_DASHBOARD_PRINCIPAL_ID,
    
    RHIANNON_PRINCIPAL_ID,
    KYLE_PRINCIPAL_ID,
    VM_1_PRINCIPAL_ID,
    VM_2_PRINCIPAL_ID,
    VM_3_PRINCIPAL_ID
  ];

  public func isPlatformOperator(caller : Principal) : Bool {
    let c = Principal.toText(caller);
    for (operator in PLATFORM_OPERATORS.vals()) {
      if (operator == c) {
        return true;
      };
    };
    return false;
  };

  public let CYCLES_DISPENSER_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
    POST_CORE_CANISTER_ID,
    NFT_FACTORY_CANISTER_ID
  ];

  public let FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
  ];

  public let KINIC_ENDPOINT_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
  ];

  public let METRICS_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
    POST_CORE_CANISTER_ID,
  ];

  public let POSTBUCKET_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
    POST_CORE_CANISTER_ID,
    PUBLICATION_MANAGEMENT_CANISTER_ID,
    USER_CANISTER_ID,
  ];

  public let POSTCORE_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
    USER_CANISTER_ID,
    PUBLICATION_MANAGEMENT_CANISTER_ID,
  ];

  public let POSTINDEX_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
    POST_CORE_CANISTER_ID,
  ];

  public let STORAGE_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
  ];

  public let USER_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
    USER_CANISTER_ID,
    PUBLICATION_MANAGEMENT_CANISTER_ID,
  ];

  public let NOTIFICATIONS_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
    POST_CORE_CANISTER_ID,
    USER_CANISTER_ID,
  ];

  public let POST_RELATIONS_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    POST_CORE_CANISTER_ID,
  ];

  //publication canisters
  public let PUBLISHER_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
    PUBLICATION_MANAGEMENT_CANISTER_ID,
    USER_CANISTER_ID,
  ];

  public let PUBLICATION_MANAGEMENT_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
    PUBLICATION_MANAGEMENT_CANISTER_ID,
  ];

  public let NFT_FACTORY_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    CYCLES_DISPENSER_CANISTER_ID,
    PUBLICATION_MANAGEMENT_CANISTER_ID,
  ];

  public let EXT_NFT_CANISTER_ADMINS = [
    SNS_GOVERNANCE_CANISTER,
    NFT_FACTORY_CANISTER_ID,
    POST_CORE_CANISTER_ID
  ];

  

  

  //tipping feature variables

  public let TIPPING_TOKENS = ["NUA", "ICP", "ckBTC", "GHOST"];
  //means 10%
  public let SUBSCRIPTION_FEE_AMOUNT = 10.0;
  public let TIP_FEE_AMOUNT = 10.0;
  public let TIP_FEE_RECEIVER_PRINCIPAL_ID = SNS_GOVERNANCE_CANISTER;
  public let TIP_FEE_RECEIVER_SUBACCOUNT : [Nat8] = [102, 220, 17, 70, 218, 116, 14, 60, 212, 188, 181, 179, 119, 252, 105, 10, 10, 131, 95, 223, 76, 125, 151, 200, 83, 208, 10, 80, 18, 198, 50, 254];

  public let NUA_TOKEN_CANISTER_ID = "rxdbk-dyaaa-aaaaq-aabtq-cai";
  public let NUA_TOKEN_DECIMALS = 8;
  public let NUA_TOKEN_FEE = 100_000;

  public let CKBTC_TOKEN_CANISTER_ID = "mxzaz-hqaaa-aaaar-qaada-cai";
  public let CKBTC_TOKEN_DECIMALS = 8;
  public let CKBTC_TOKEN_FEE = 10;

  public let ICP_TOKEN_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
  public let ICP_TOKEN_DECIMALS = 8;
  public let ICP_TOKEN_FEE = 10_000;

  public let GHOST_TOKEN_CANISTER_ID = "4c4fd-caaaa-aaaaq-aaa3a-cai";
  public let GHOST_TOKEN_DECIMALS = 8;
  public let GHOST_TOKEN_FEE = 100_000_000;

  public type TippingToken = {
    canisterId: Text;
    fee: Nat;
    decimals: Nat;
  };

  public func getTippingTokenBySymbol(symbol: Text) : TippingToken {
    switch(symbol) {
      case("NUA") {
        return {
          canisterId = NUA_TOKEN_CANISTER_ID;
          fee = NUA_TOKEN_FEE;
          decimals = NUA_TOKEN_DECIMALS;
        }
      };
      case("ICP") {
        return {
          canisterId = ICP_TOKEN_CANISTER_ID;
          fee = ICP_TOKEN_FEE;
          decimals = ICP_TOKEN_DECIMALS;
        }
      };
      case("ckBTC"){
        return {
          canisterId = CKBTC_TOKEN_CANISTER_ID;
          fee = CKBTC_TOKEN_FEE;
          decimals = CKBTC_TOKEN_DECIMALS;
        }
      };
      case("GHOST"){
        return {
          canisterId = GHOST_TOKEN_CANISTER_ID;
          fee = GHOST_TOKEN_FEE;
          decimals = GHOST_TOKEN_DECIMALS;
        }
      };
      case(_){
        //not possible -> return an empty object
        return {
          canisterId = "";
          poolCanisterId = "";
          fee = 0;
          decimals = 0;
        }
      };

    };
  };

};
