import Principal "mo:base/Principal";
module {
  public let USER_CANISTER_ID = "rtqeo-eyaaa-aaaaf-qaana-cai";
  public let POST_CORE_CANISTER_ID = "322sd-3iaaa-aaaaf-qakgq-cai";
  public let KINIC_ENDPOINT_CANISTER_ID = "4m3sz-lqaaa-aaaaf-qagza-cai";
  public let FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID = "dgwwd-jaaaa-aaaaf-qai7a-cai";
  public let POST_INDEX_CANISTER_ID = "r5sjg-7iaaa-aaaaf-qaama-cai";
  public let STORAGE_CANISTER_ID = "y2pkg-ciaaa-aaaaf-qagbq-cai";
  public let CYCLES_DISPENSER_CANISTER_ID = "353ux-wqaaa-aaaaf-qakga-cai";
  public let NUANCE_ASSETS_CANISTER_ID = "exwqn-uaaaa-aaaaf-qaeaa-cai";
  public let METRICS_CANISTER_ID = "xjlvo-hyaaa-aaaam-qbcga-cai";
  public let PUBLICATION_MANAGEMENT_CANISTER_ID = "kq23y-aiaaa-aaaaf-qajmq-cai";
  public let NFT_FACTORY_CANISTER_ID = "kc4mb-myaaa-aaaaf-qajpq-cai";
  public let SNS_GOVERNANCE_CANISTER = "rqch6-oaaaa-aaaaq-aabta-cai";
  public let PAUL_PRINCIPAL_ID = "keqno-ecosc-a47cf-rk2ui-5ehla-noflk-jj4it-h6nku-smno2-fucgs-cae";
  public let MITCH_PRINCIPAL_ID = "nfcvh-tajgf-yg2zg-hd62j-7lrtq-vltzp-kvnyb-knvah-tkwbl-jybux-7ae";
  public let BARAN_PRINCIPAL_ID = "wvhee-rnvlo-p6u4o-6fm55-jmxlu-yy2yt-dx47v-rxswo-u7kuk-dofj5-aae";
  public let NICK_PRINCIPAL_ID = "lak3h-wosi7-pjqxd-fpluz-2etul-g7zza-fvm56-tz3sc-efctb-a3qp6-2qe";

  public let PLATFORM_OPERATORS = [
    PAUL_PRINCIPAL_ID,
    MITCH_PRINCIPAL_ID,
    BARAN_PRINCIPAL_ID,
    NICK_PRINCIPAL_ID,
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

};
