import Principal "mo:base/Principal";
import CanisterIds "../../../src/shared/canisterIds";
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
  public let SNS_GOVERNANCE_CANISTER = "rqch6-oaaaa-aaaaq-aabta-cai";
  public let PAUL_PRINCIPAL_ID = "keqno-ecosc-a47cf-rk2ui-5ehla-noflk-jj4it-h6nku-smno2-fucgs-cae";
  public let MITCH_PRINCIPAL_ID = "3v3rk-jx25f-dl43p-osgkw-6dm7b-wguwy-kjcun-lyo3w-lsuev-kcdnp-7qe";
  public let BARAN_PRINCIPAL_ID = "p5x7e-xqqb3-orerc-tmqof-rnhhy-5y7r7-vpoog-bpqrf-6cuki-bwdpd-3ae";
  public let ILYAS_PRINCIPAL_ID = "c3ex3-xqejx-wbada-ly2rt-j4djv-w6hp6-lcv4j-jm7wy-mg23w-vqzya-lqe";
  public let NICK_PRINCIPAL_ID = "lak3h-wosi7-pjqxd-fpluz-2etul-g7zza-fvm56-tz3sc-efctb-a3qp6-2qe";
  public let RHIANNON_PRINCIPAL_ID = "cqt7v-ben4o-y335u-srt3v-nzd6e-wknuf-2t2mb-mji7i-ar3bf-7ysop-2qe";
  public let KYLE_PRINCIPAL_ID = "ftiej-pml6t-p3n5s-afoi2-ksnxp-3yyis-lzg6v-mwdwn-evzhq-6j56q-xqe";
  public let VM_1_PRINCIPAL_ID = "btrx2-makdj-pw2cp-u264a-cntkp-2mzjv-56oqc-6r7uu-ocexg-mf3sn-qqe";
  public let VM_2_PRINCIPAL_ID = "gs5lq-gst3q-56phb-4sxwu-eo4nu-fqe3z-k2euk-5okx7-tguxu-x7nkr-nae";
  public let VM_3_PRINCIPAL_ID = "lwff2-ldzrq-mjfix-dde3y-tnczf-ju3zj-riwla-y6cvv-pxxmn-hokps-oqe";

  public let PLATFORM_OPERATORS = [
    PAUL_PRINCIPAL_ID,
    MITCH_PRINCIPAL_ID,
    BARAN_PRINCIPAL_ID,
    ILYAS_PRINCIPAL_ID,
    NICK_PRINCIPAL_ID,
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

  //icrc10 standards
  public let supportedStandards = 
    [
      {
          url = "https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-10/ICRC-10.md";
          name = "ICRC-10";
      },
      {
          url = "https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_28_trusted_origins.md";
          name = "ICRC-28";
      }
    ];

  //get trusted origins
  public func getTrustedOrigins(): [Text] {
    if (IS_LOCAL) {
      [
        "http://exwqn-uaaaa-aaaaf-qaeaa-cai.localhost:8080",
        "http://localhost:8081"
      ]
    } else {
      [
        "https://exwqn-uaaaa-aaaaf-qaeaa-cai.raw.ic0.app",
        "https://www.nuance.xyz",
        "https://nuance.xyz",
        "https://distrikt.app",
        "https://az5sd-cqaaa-aaaae-aaarq-cai.ic0.app",
        "https://am2do-dyaaa-aaaae-aaasa-cai.ic0.app",
        "https://distrikt.work",
        "https://" # NUANCE_ASSETS_CANISTER_ID # ".ic0.app"
      ]
    }
  };

};
