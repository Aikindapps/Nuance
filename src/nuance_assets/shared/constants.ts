const imagesPath = '/assets/images/';
const iconsPath = imagesPath + 'icons/';
const loadersPath = imagesPath + 'loaders/';
const isLocal = window.location.origin.includes('local');

export const images = {
  IC_BADGE: imagesPath + 'ic-badge.png',
  AIKIN_LOGO: imagesPath + 'aikin_logo.png',
  AIKIN_LOGO_HORIZONTAL: imagesPath + 'aikin_logo_horiz.png',
  NUANCE_LOGO: imagesPath + 'nuance-logo.svg',
  NUANCE_LOGO_BLUE_TEXT: imagesPath + 'nuance_logo_blue_text.png',
  DEFAULT_AVATAR: imagesPath + 'default-avatar.jpeg',
  NUANCE_FLAG: imagesPath + 'nuance-flag.png',
  PHOTO_BACKGROUND: imagesPath + 'photo-bg.png',
  PHOTO_CAMERA: imagesPath + 'photo-camera.png',
  NUANCE_LOGO_PUBLICATION: imagesPath + 'nuance_logo_publication.svg',
  loaders: {
    NUANCE_LOADER: loadersPath + 'nuance-loader.gif',
    BUTTON_SPINNER: loadersPath + 'button-spinner.gif',
    NUANCE_LOADER_DARK: loadersPath + 'nuance-loader-dark.gif',
  },
  NUANCE_LOGO_NFT: imagesPath + 'nuance_logo_with_nft.svg',
  NUANCE_LOGO_NFT_PURCHASED: imagesPath + 'nuance-logo-nft-purchased.svg',
  NUANCE_LOGO_UNSUFFICIENT_BALANCE:
    imagesPath + 'nuance_unsufficient_balance.svg',
  NUANCE_LOGO_MASK_GROUP: imagesPath + 'backgrounds/mask-group.svg',
  NUANCE_LOGO_AND_NFT_ICON: imagesPath + 'nuance_logo_and_nft_icon.svg',
};

export const icons = {
  EDIT: iconsPath + 'edit.svg',
  EDIT_WHITE: iconsPath + 'edit-white.svg',
  SEARCH_WHITE: iconsPath + 'search-white.svg',
  SEARCH_BLACK: iconsPath + 'search-black.svg',
  CLOSE_SEARCH: iconsPath + 'close-search.svg',
  NOTIFICATION: iconsPath + 'notification.svg',
  THUMBS_UP: iconsPath + 'thumbs-up.svg',
  THUMBS_DOWN: iconsPath + 'thumbs-down.svg',
  REPLY: iconsPath + 'reply.svg',
  SHARE: iconsPath + 'share.svg',
  REPORT: iconsPath + 'reportComment.svg',
  EDIT_COMMENT: iconsPath + 'edit-comment.svg',
  TAG: iconsPath + 'tag.svg',
  UPLOAD_PICTURE: iconsPath + 'upload-picture.svg',
  CHANGE_PHOTO: iconsPath + 'change-photo.svg',
  THREE_DOTS: iconsPath + 'three-dots.svg',
  THREE_DOTS_BLUE: iconsPath + 'three-dots-blue.png',
  THREE_DOTS_WHITE: iconsPath + 'three-dots-white.svg',
  THREE_DOTS_DARK: iconsPath + 'three-dots-dark.svg',
  COPY: iconsPath + 'copy.svg',
  COPY_BLUE: iconsPath + 'copy-blue.svg',
  USER: iconsPath + 'user.svg',
  USER_BLUE: iconsPath + 'user-blue.svg',
  USER_HOVER: iconsPath + 'user-hover.png',
  USER_DOWN: iconsPath + 'user-down.png',
  USER_WHITE: iconsPath + 'user-white.svg',
  USER_WHITE_MOBILE: iconsPath + 'user-white-mobile.svg',
  CLAP_WHITE: iconsPath + 'clap-white.svg',
  CLAP_BLUE: iconsPath + 'clap-blue.png',
  PUBLICATION_ICON: iconsPath + 'publication-icon.svg',
  EMAIL_OPT_IN: iconsPath + 'email-opt-in.png',
  EMAIL_OPT_IN_SUCCESS: iconsPath + 'email-opt-in-success.png',
  NFT_LOCK_ICON: iconsPath + 'NFT-Lock-Icon.svg',
  NUANCE_NFT_LG: iconsPath + 'Nuance-NFT-LG.svg',
  USER_WHITE_DARK: iconsPath + 'user-white-dark.svg',
  DARK_MODE_TOGGLE: iconsPath + 'Dark-mode-toggle.svg',
  DARK_MODE_TOGGLE_WHITE: iconsPath + 'Dark-mode-toggle-white.svg',
  editor: {
    BREAK: 'break.svg',
    BOLD: 'bold.svg',
    ITALIC: 'italic.svg',
    LINK: 'link.svg',
    LIST: 'list.svg',
    LIST_NUMBERS: 'list-numbers.svg',
    PHOTO: 'photo.svg',
    QUOTES: 'quotes.svg',
    SIZE: 'size.svg',
  },
  COPY_ICON: iconsPath + 'copy_icon.svg',
  TRANSFER_ICON: iconsPath + 'transfer_icon.svg',
  ICP_LOGO: iconsPath + 'icp_logo.svg',
  ckBTC_LOGO: iconsPath + 'ckbtc_logo.svg',
  CLAP_ICON: iconsPath + 'clap-icon.svg',
  CLAP_BLACK: iconsPath + 'clap-black.svg',
  NFT_ICON: iconsPath + 'nft-icon.svg',
  CLAP_WHITE_2: iconsPath + 'clap-white-2.svg',
  PROFILE_ICON: iconsPath + 'profile-icon.svg',
  PROFILE_ICON_DARK: iconsPath + 'profile-icon-dark.svg',
  EMPTY_BOX: iconsPath + 'empty_box.svg',
  WEBSITE_ICON: iconsPath + 'website.svg',
  WEBSITE_ICON_DARK: iconsPath + 'website_dark.svg',
  CLOSE_BUTTON: iconsPath + 'close-button.svg',
};

export const colors = {
  primaryTextColor: '#151451',
  accentColor: '#02c3a1',
  highlightTwo: '#1bc0f2',
  primaryBackgroundColor: '#ffffff',
  tagTokenBackGround: '#f2f2f2',
  tagTextColor: '#666666',
  editProfileInputTextColor: '#19192E',
  darkerBorderColor: '#999999',
  primaryButtonColor: '#151451',
  errorColor: '#cc4747',

  //dark mode
  darkModePrimaryTextColor: '#ffffff',
  darkModeAccentColor: '#43DFBA',
  darkModeHighlightTwo: '#1bc0f2',
  darkModePrimaryBackgroundColor: '#151451',
  darkModeTagTokenBackGround: '#f2f2f2',
  darkModeTagColor: '#485B8D',
  darkModeSecondaryButtonColor: '#485B8D',
  darkModeEditProfileInputTextColor: '#19192E',
  darkModeDarkerBorderColor: '#999999',
  darkSecondaryTextColor: '#B2B2B2',

  //FastBlocks
  FBprimaryColor: '#500e50',
  FBprimaryTextColor: 'black',
  FBsubtitleColor: '#687487',
  FBaccentColor: '#8e72e0',
  FBhighlightTwo: '#500e50',
  FBprimaryBackgroundColor: '#ffffff',
  FBtagTokenBackGround: '#f2f2f2',
  FBtagTextColor: '#666666',
  FBeditProfileInputTextColor: '#19192E',
  FBdarkerBorderColor: '#999999',
  FBemailOptInButtonColor: '#722680',
};

export const premiumArticlePlaceHolder =
  '<h1><strong>The standard Lorem Ipsum passage, used since the 1500s</strong></h1><p><br></p><p>"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."</p><p><br></p><h1><strong>Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC</strong></h1><p><br></p><p>"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"</p><h3><strong>1914 translation by H. Rackham</strong></h3><p><br></p><p>"But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?"</p><h3><strong>Section 1.10.33 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC</strong></h3><p>"At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."</p><h2><strong>1914 translation by H. Rackham</strong></h2><p><br></p><p>"On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains."</p><p><br></p>';

export type SupportedTokenSymbol = 'ICP' | 'ckBTC' | 'NUA';
export type SupportedToken = {
  canisterId: string;
  logo: string;
  decimals: number;
  name: string;
  symbol: SupportedTokenSymbol;
  fee: number;
};
export type TokenBalance = {
  balance: number;
  token: SupportedToken;
};

export const ICP_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
export const ckBTC_CANISTER_ID = 'mxzaz-hqaaa-aaaar-qaada-cai';
export const ckBTC_INDEX_CANISTER_ID = 'n5wcd-faaaa-aaaar-qaaea-cai';

export const NUA_CANISTER_ID = 'rxdbk-dyaaa-aaaaq-aabtq-cai';
export const SUPPORTED_CANISTER_IDS = [
  ICP_CANISTER_ID,
  ckBTC_CANISTER_ID,
  NUA_CANISTER_ID,
];

export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    canisterId: isLocal ? ICP_CANISTER_ID : NUA_CANISTER_ID,
    logo: images.NUANCE_LOGO,
    decimals: 8,
    name: 'Nuance',
    symbol: 'NUA',
    fee: isLocal ? 10000 : 100000,
  },
  {
    canisterId: ICP_CANISTER_ID,
    logo: icons.ICP_LOGO,
    decimals: 8,
    name: 'Internet Computer',
    symbol: 'ICP',
    fee: 10000,
  },
  {
    canisterId: isLocal ? ICP_CANISTER_ID : ckBTC_CANISTER_ID,
    logo: icons.ckBTC_LOGO,
    decimals: 8,
    name: 'Bitcoin',
    symbol: 'ckBTC',
    fee: isLocal ? 10000 : 10,
  },
];

export const getDecimalsByTokenSymbol = (symbol: SupportedTokenSymbol) => {
  for (const supported of SUPPORTED_TOKENS) {
    if (supported.symbol === symbol) {
      return supported.decimals;
    }
  }
  //if not found (not possible), return 8 as default
  return 8;
};
