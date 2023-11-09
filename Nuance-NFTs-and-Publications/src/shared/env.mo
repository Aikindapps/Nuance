import Principal "mo:base/Principal";
import CanisterIds "../../../src/shared/canisterIds";
module {
  public let USER_CANISTER_ID = CanisterIds.USER_CANISTER_ID;
  public let POST_CORE_CANISTER_ID = CanisterIds.POST_CORE_CANISTER_ID;
  public let KINIC_ENDPOINT_CANISTER_ID = CanisterIds.KINIC_ENDPOINT_CANISTER_ID;
  public let FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID = CanisterIds.FASTBLOCKS_EMAIL_OPT_IN_CANISTER_ID;
  public let POST_INDEX_CANISTER_ID = CanisterIds.POST_INDEX_CANISTER_ID;
  public let STORAGE_CANISTER_ID = CanisterIds.STORAGE_CANISTER_ID;
  public let CYCLES_DISPENSER_CANISTER_ID = CanisterIds.CYCLES_DISPENSER_CANISTER_ID;
  public let NUANCE_ASSETS_CANISTER_ID = CanisterIds.NUANCE_ASSETS_CANISTER_ID;
  public let METRICS_CANISTER_ID = CanisterIds.METRICS_CANISTER_ID;
  public let PUBLICATION_MANAGEMENT_CANISTER_ID = CanisterIds.PUBLICATION_MANAGEMENT_CANISTER_ID;
  public let NFT_FACTORY_CANISTER_ID = CanisterIds.NFT_FACTORY_CANISTER_ID;
  public let SNS_GOVERNANCE_CANISTER = "rqch6-oaaaa-aaaaq-aabta-cai";
  public let PAUL_PRINCIPAL_ID = "keqno-ecosc-a47cf-rk2ui-5ehla-noflk-jj4it-h6nku-smno2-fucgs-cae";
  public let MITCH_PRINCIPAL_ID = "3v3rk-jx25f-dl43p-osgkw-6dm7b-wguwy-kjcun-lyo3w-lsuev-kcdnp-7qe";
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
  ]

};
