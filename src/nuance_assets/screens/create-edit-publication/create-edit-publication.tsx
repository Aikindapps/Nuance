import React, {
  Fragment,
  useEffect,
  useState,
  useRef,
  useContext,
} from 'react';
import { useAuthStore, useUserStore, usePublisherStore } from '../../store';
import Button from '../../UI/Button/Button';
import InputField2 from '../../UI/InputField2/InputField2';
import Footer from '../../components/footer/footer';
import Header from '../../components/header/header';
import ProfilePictureButton from '../../UI/profile-picture-button/profile-picture-button';
import AvatarEditor from 'react-avatar-editor';
import Loader from '../../UI/loader/Loader';
import {
  formatDate,
  getEmbeddedImages,
  getIconForSocialChannel,
  parseEmbeddedImage,
} from '../../shared/utils';

import { getNewContentId, uploadBlob } from '../../services/storageService';
import { downscaleImage } from '../../components/quill-text-editor/modules/quill-image-compress/downscaleImage.js';
import { toast, toastError, ToastType } from '../../services/toastService';
import { useParams, useNavigate } from 'react-router-dom';
import { PublicationCta, SocialLinksObject } from '../../types/types';
import RequiredFieldMessage from '../../components/required-field-message/required-field-message';

import { colors, icons, images } from '../../shared/constants';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleXmark,
  IconDefinition,
  IconName,
} from '@fortawesome/free-regular-svg-icons';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { Context } from '../../contextes/Context';
import { BlockPicker } from 'react-color';
import SelectFontType from '../../components/select-font-type/select-font-type';
import { useTheme } from '../../contextes/ThemeContext';

import PublicationIconSelector from '../../components/publication-icon-selector/publication-icon-selector';
import PublicationCallToAction from '../../components/publication-call-to-action/publication-call-to-action';
import { string } from 'prop-types';
import BreadCrumbCropper from '../../UI/breadCrumbCropper/breadCrumbCropper';
import { Toggle } from '../../UI/toggle/toggle';
import SubscriptionSettings from './subscription-settings';
import { WriterSubscriptionDetails } from 'src/declarations/Subscription/Subscription.did';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { SubscriptionStore } from '../../store/subscriptionStore';
import { Principal } from '@dfinity/principal';
import { set } from 'lodash';

const CreateEditPublication = () => {
  const { handle } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const context = useContext(Context);

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { getUser, user, getUsersByHandles, usersByHandles } = useUserStore(
    (state) => ({
      getUser: state.getUser,
      user: state.user,
      getUsersByHandles: state.getUsersByHandles,
      usersByHandles: state.usersByHandles,
    })
  );
  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };

  const {
    publication,
    getPublication,
    getPublicationError,
    updatePublicationDetails,
    updatePublicationStyling,
    updatePublicationCta,
    removeEditor,
    removeWriter,
    getCanisterIdByHandle,
  } = usePublisherStore((state) => ({
    getPublication: state.getPublication,
    publication: state.publication,
    updatePublicationDetails: state.updatePublicationDetails,
    updatePublicationCta: state.updatePublicationCta,
    removeEditor: state.removeEditor,
    removeWriter: state.removeWriter,
    getPublicationError: state.getPublicationError,
    updatePublicationStyling: state.updatePublicationStyling,
    getCanisterIdByHandle: state.getCanisterIdByHandle,
  }));

  const {
    getWriterSubscriptionDetailsByPrincipalId,
    getPublicationSubscriptionDetailsAsEditor,
    updateSubscriptionDetails,
  } = useSubscriptionStore((state: SubscriptionStore) => ({
    getWriterSubscriptionDetailsByPrincipalId:
      state.getWriterSubscriptionDetailsByPrincipalId,
    getPublicationSubscriptionDetailsAsEditor:
      state.getPublicationSubscriptionDetailsAsEditor,
    updateSubscriptionDetails: state.updateSubscriptionDetails,
  }));

  const featureIsLive = useContext(Context).publicationFeature;

  const publicationHandle = location.pathname.split('/').pop() as string;
  const [socialLinks, setSocialLinks] = useState<SocialLinksObject>();

  const [loading, setLoading] = useState(false);
  const [loadingPublication, setLoadingPublication] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);
  const [postHtml, setPostHtml] = useState('');

  const [publicationBannerImage, setPublicationBannerImage] = useState(
    publication?.headerImage || ''
  );
  const [publicationTitle, setPublicationTitle] = useState(
    publication?.publicationTitle || ''
  );
  const [publicationSubtitle, setPublicationSubtitle] = useState(
    publication?.subtitle || ''
  );
  const [publicationDescription, setPublicationDescription] = useState(
    publication?.description || ''
  );
  const [publicationWebsite, setPublicationWebsite] = useState(
    publication?.socialLinks.website || ''
  );

  const [publicationSocialChannelUrls, setPublicationSocialChannelUrls] =
    useState(publication?.socialLinks.socialChannels || []);

  const [avatar, setAvatar] = useState(publication?.avatar || '');
  const [breadcrumbLogo, setBreadcrumbLogo] = useState('');
  const [avatarMimeType, setAvatarMimeType] = useState('');
  const [avatarSize, setAvatarSize] = useState(0);
  const [avatarBlob, setAvatarBlob] = useState(new Blob());

  const [primaryColor, setPrimaryColor] = useState('#02C4A1');
  const [titleFontType, setTitleFontType] = useState('Default');
  const [callToAction, setCallToAction] = useState(
    publication?.cta.ctaCopy ? publication.cta.ctaCopy : 'Want to write for us?'
  );
  const [buttonText, setButtonText] = useState(
    publication?.cta.buttonCopy ? publication.cta.buttonCopy : 'Apply here!'
  );
  const [buttonLink, setButtonLink] = useState(
    publication?.cta.link ? publication.cta.link : 'https://nuance.xyz'
  );
  const [callToActionIcon, setCallToActionIcon] = useState(
    publication?.cta.icon ? publication.cta.icon : 'faVolleyball'
  );

  //ensures button is clicked prior to warning (turns off all warnings until true)
  const [firstSave, setFirstSave] = useState(false);
  //warniing scenarios decide which fields get the warning box
  const [publicationWarning, setPublicationWarning] = useState(false);
  const [publicationSubtitleWarning, setPublicationSubtitleWarning] =
    useState(false);
  const [publicationDescriptionWarning, setPublicationDescriptionWarning] =
    useState(false);
  const [publicationBannerImageWarning, setPublicationBannerImageWarning] =
    useState(false);
  const [publicationCtaWebsiteWarning, setPublicationCtaWebsiteWarning] =
    useState(false);

  const [saveBtnIsDisabled, setSaveBtnIsDisabled] = useState(false);
  const editor = useRef(null);
  const [hideBreadcrumblogoEditor, setHideBreadcrumbLogoEditor] =
    useState(true);
  const [hideEditor, setHideEditor] = useState(true);
  const [canvasScaled, setCanvasScaled] = useState('');
  const [canvas, setCanvas] = useState('');

  //Used to manage all the dynamic input controls on the screen
  const [inputFields, setInputFields] = useState([
    { categories: '', editors: '', writers: '' },
  ]);

  const [categoriesFormValues, setCategoriesFormValues] = useState([
    { categories: '' },
  ]);

  const [editorsFormValues, setEditorsFormValues] = useState([{ editors: '' }]);

  const [writersFormValues, setWritersFormValues] = useState([{ writers: '' }]);

  const [publicationDoesNotExist, setPublicationDoesNotExist] = useState(false);
  const [userIsEditor, setUserIsEditor] = useState(false);
  const [allWriterHandlesExist, setAllWriterHandlesExist] = useState(true);
  const [allEditorHandlesExist, setAllEditorHandlesExist] = useState(true);
  const [writerExistsAsEditorError, setWriterExistsAsEditorError] =
    useState(false);
  const [editorExistsAsWriterError, setEditorExistsAsWriterError] =
    useState(false);
  const [isCtaActive, setIsCtaActive] = useState(true);

  const isCtaEmpty = (cta: PublicationCta | undefined) => {
    return (
      cta?.buttonCopy === '' ||
      cta?.ctaCopy === '' ||
      cta?.icon === '' ||
      cta?.link === ''
    );
  };

  const [subscriptionDetails, setSubscriptionDetails] =
    useState<SubscriptionDetailsState>({
      writerSubscriptions: [],
      weeklyFee: [],
      writerPrincipalId: '',
      paymentReceiverPrincipalId: '',
      lifeTimeFee: [],
      isSubscriptionActive: false,
      annuallyFee: [],
      monthlyFee: [],
      weeklyFeeEnabled: false,
      monthlyFeeEnabled: false,
      annuallyFeeEnabled: false,
      lifeTimeFeeEnabled: false,
    });

  interface SubscriptionDetailsState extends WriterSubscriptionDetails {
    weeklyFeeEnabled: boolean;
    monthlyFeeEnabled: boolean;
    annuallyFeeEnabled: boolean;
    lifeTimeFeeEnabled: boolean;
  }

  const handleUpdateSubscriptionDetails = async () => {

    // Convert fees to e8s
    const convertToE8s = (fee: string | undefined) =>
      fee ? Number(fee) * 1e8 : undefined;

    const weeklyFeeE8s = convertToE8s(subscriptionDetails.weeklyFee[0]);
    const monthlyFeeE8s = convertToE8s(subscriptionDetails.monthlyFee[0]);
    const annuallyFeeE8s = convertToE8s(subscriptionDetails.annuallyFee[0]);
    const lifeTimeFeeE8s = convertToE8s(subscriptionDetails.lifeTimeFee[0]);

    try {
      const publicationCanisterId = await getCanisterIdByHandle(
        publicationHandle
      );
      updateSubscriptionDetails(
        weeklyFeeE8s,
        monthlyFeeE8s,
        annuallyFeeE8s,
        lifeTimeFeeE8s,
        {
          paymentReceiverPrincipal: Principal.fromText(
            subscriptionDetails.paymentReceiverPrincipalId
          ),
          publicationCanisterId: publicationCanisterId || '',
        }
      );
    } catch (error) {
      console.error('Error fetching canister ID:', error);
      // Handle the error as needed
    }
  };

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (publication) {
        const publicationCanisterId = await getCanisterIdByHandle(
          publicationHandle
        );
        if (publicationCanisterId) {
          console.log(
            'Fetching subscription details for:',
            publicationCanisterId
          );
          const fetchedDetails =
            await getWriterSubscriptionDetailsByPrincipalId(
              publicationCanisterId
            );
          if (fetchedDetails) {
            setSubscriptionDetails({
              writerSubscriptions: fetchedDetails?.writerSubscriptions,
              weeklyFee: fetchedDetails.weeklyFee[0]
                ? [(Number(fetchedDetails.weeklyFee[0]) / 1e8).toString()]
                : [],
              writerPrincipalId: fetchedDetails.writerPrincipalId,
              paymentReceiverPrincipalId: fetchedDetails.paymentReceiverPrincipalId,
              lifeTimeFee: fetchedDetails.lifeTimeFee[0]
                ? [(Number(fetchedDetails.lifeTimeFee[0]) / 1e8).toString()]
                : [],
              isSubscriptionActive: fetchedDetails.isSubscriptionActive,
              annuallyFee: fetchedDetails.annuallyFee[0]
                ? [(Number(fetchedDetails.annuallyFee[0]) / 1e8).toString()]
                : [],
              monthlyFee: fetchedDetails.monthlyFee[0]
                ? [(Number(fetchedDetails.monthlyFee[0]) / 1e8).toString()]
                : [],
              weeklyFeeEnabled: fetchedDetails.weeklyFee.length != 0,
              monthlyFeeEnabled: fetchedDetails.monthlyFee.length != 0,
              annuallyFeeEnabled: fetchedDetails.annuallyFee.length != 0,
              lifeTimeFeeEnabled: fetchedDetails.lifeTimeFee.length != 0,
            });
          }
        }
      }
    };
    fetchSubscriptionDetails();
  }, [publication]);

  useEffect(() => {
    clearAll();
    getUser();

    return () => {
      clearAll();
    };
  }, []);

  useEffect(() => {
    setSocialLinks({
      website: publicationWebsite,
      socialChannels: publicationSocialChannelUrls,
    });
    setIsCtaActive(!isCtaEmpty(publication?.cta));
  }, [publicationWebsite, publicationSocialChannelUrls, publication]);

  useEffect(() => {
    setLoadingPublication(true);
    setPublicationDoesNotExist(false);
    getPublication(publicationHandle);
    fillFormValues();
    // So spinner doesn't get stuck if user does not have access to publication
    setTimeout(() => {
      setLoadingPublication(false);
    }, 5000);
  }, [window.location.pathname]);

  useEffect(() => {
    window.onresize = window.onload = () => {
      setScreenWidth(window.innerWidth);
    };
  }, [screenWidth]);

  useEffect(() => {
    if (isLoggedIn && !user) {
      navigate('/register', { replace: true });
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (publication && user) {
      let lowCasePublicationEditors = publication?.editors.map((e: string) => {
        return e.toLowerCase();
      });
      if (lowCasePublicationEditors?.includes(user?.handle.toLowerCase())) {
        setUserIsEditor(true);
      }
    }
  }, [publication]);

  useEffect(() => {
    if (userIsEditor && !publicationDoesNotExist) {
      setLoading(false);
    }
  }, [userIsEditor]);

  useEffect(() => {
    //Check if publication exists
    if (getPublicationError && !loadingPublication) {
      setPublicationDoesNotExist(false);
    }
  }, [getPublicationError]);


  const [validPrincipal, setValidPrincipal] = useState(true);
  useEffect(() => {
    if (subscriptionDetails.paymentReceiverPrincipalId) {
      validatePrincipal();
    }
  }, [subscriptionDetails.paymentReceiverPrincipalId]);

  const validatePrincipal = () => {
    try {
      let validation =
        subscriptionDetails.paymentReceiverPrincipalId === Principal.fromText(subscriptionDetails.paymentReceiverPrincipalId).toText();
      setValidPrincipal(validation);
      return validation;
    } catch (e) {
      setValidPrincipal(false);
      return false;
    }
  };

  useEffect(() => {
    fillFormValues();
    console.log("called fillFormValues, here's the pub", publication);
    if (publication) {
      setLoadingPublication(false);
    }
  }, [publication]);

  const handleScrolls = () => {
    if (publicationBannerImage === '') {
      let el = document.getElementById('banner-image');
      if (el) {
        console.log(0, el.offsetTop);
        window.scrollTo(0, el.offsetTop - 10);
      }
      return;
    }
    if (publicationTitle.trim() === '') {
      let el = document.getElementById('name-wrapper');
      if (el) {
        console.log(0, el.offsetTop);
        window.scrollTo(0, el.offsetTop - 10);
      }
      return;
    }
    if (publicationSubtitleWarning) {
      let el = document.getElementById('subtitle-wrapper');
      if (el) {
        console.log(0, el.offsetTop);
        window.scrollTo(0, el.offsetTop - 10);
      }
      return;
    }
    if (publicationDescription.trim() === '') {
      let el = document.getElementById('description');
      if (el) {
        console.log(0, el.offsetTop);
        window.scrollTo(0, el.offsetTop - 10);
      }
      return;
    }
    if (!validatePrincipal()) {
      let el = document.getElementById('principal');
      if (el) {
        console.log(0, el.offsetTop);
        window.scrollTo(0, el.offsetTop - 10);
      }
      return;
    }
    if (publicationCtaWebsiteWarning) {
      let el = document.getElementById('pub-banner');
      if (el) {
        console.log(0, el.offsetTop);
        window.scrollTo(0, el.offsetTop - 10);
      }
      return;

    }
    window.scrollTo(0, 0);


  };



  function validate() {
    const isValid =
      !loading &&
      publicationTitle.trim() !== '' &&
      publicationDescription.trim() !== '' &&
      !publicationWarning &&
      !publicationDescriptionWarning &&
      !publicationCtaWebsiteWarning &&
      publicationBannerImage !== '' &&
      validatePrincipal();

    return isValid;
  }

  const onIconChange = (icon: IconDefinition) => {
    setCallToActionIcon(icon.iconName);
  };

  //Used to Validate the URL's for all the social Links
  function validateUrl(url: string) {
    var validUrl = require('valid-url');
    const isValidUrl = false;
    if (url != '') {
      return validUrl.isWebUri(url);
    } else return true;
  }

  const isAddNewSocialLinkActive = () => {
    if (publicationSocialChannelUrls.length === 0) {
      return true;
    } else {
      return validateUrl(
        publicationSocialChannelUrls[publicationSocialChannelUrls.length - 1]
      );
    }
    return false;
  };

  const validateSocialLinks = () => {
    for (const socialChannelUrl of publicationSocialChannelUrls) {
      if (socialChannelUrl !== '' && !validateUrl(socialChannelUrl)) {
        return false;
      }
    }

    return true;
  };

  const validateWebsiteAndSocialLinks = () => {
    if (publicationWebsite === '') {
      return validateSocialLinks();
    } else {
      return validateUrl(publicationWebsite) && validateSocialLinks();
    }
  };

  useEffect(() => {
    setPublicationCtaWebsiteWarning(!validateUrl(buttonLink));
  }, [buttonLink, firstSave]);

  useEffect(() => {
    setPublicationWarning(firstSave && publicationTitle === '');
  }, [publicationTitle, firstSave]);

  useEffect(() => {
    setPublicationDescriptionWarning(
      firstSave && publicationDescription === ''
    );
  }, [publicationDescription, firstSave]);

  useEffect(() => {
    setPublicationBannerImageWarning(
      firstSave && publicationBannerImage === ''
    );
  }, [publicationBannerImage, firstSave]);

  const onPublicationTitleChange = (value: string) => {
    setPublicationTitle(value);
  };

  const onPublicationSubtitleChange = (value: string) => {
    setPublicationSubtitle(value);
  };

  const onPublicationDescriptionChange = (value: string) => {
    setPublicationDescription(value);
  };

  const onCallToActionChange = (value: string) => {
    if (value.length < 140) {
      setCallToAction(value);
    }
  };

  const onButtonTextChange = (value: string) => {
    setButtonText(value);
  };

  const onButtonLinkChange = (value: string) => {
    setButtonLink(value);
  };

  const onCallToActionIconChange = (value: string) => {
    setCallToActionIcon(value);
  };

  const fillFormValues = () => {
    if (publication?.headerImage) {
      setPublicationBannerImage(publication?.headerImage);
    }
    //publication title
    if (publication?.publicationTitle) {
      setPublicationTitle(publication?.publicationTitle);
    }
    //publication subtitle
    if (publication?.subtitle) {
      setPublicationSubtitle(publication?.subtitle);
    }
    //publication description
    if (publication?.description) {
      setPublicationDescription(publication?.description);
    }
    //publication website
    if (publication?.socialLinks.website) {
      setPublicationWebsite(publication?.socialLinks.website);
    }

    //Editors
    if (publication?.editors.length !== 0) {
      let editors = (publication?.editors || []).map((editor: string) => {
        return { editors: editor || '' };
      });
      console.log('setting editors: ', editors, '1');
      setEditorsFormValues(editors);
    }

    //Categories
    if (publication?.categories.length !== 0) {
      let categories = (publication?.categories || []).map(
        (category: string) => {
          return { categories: category || '' };
        }
      );
      setCategoriesFormValues(categories);
    }

    //Writers
    if (publication?.writers.length !== 0) {
      let writers = (publication?.writers || []).map((writer: string) => {
        return { writers: writer || '' };
      });
      setWritersFormValues(writers);
    }
    //avatar
    if (publication?.avatar) {
      setAvatar(publication?.avatar);
    }

    //breadcrumb logo
    if (publication) {
      setBreadcrumbLogo(publication?.styling.logo);
    }
    //font type
    if (publication?.styling.fontType.length) {
      setTitleFontType(publication.styling.fontType);
    }

    //primary color
    if (publication?.styling.primaryColor.length) {
      setPrimaryColor(publication.styling.primaryColor);
    }
  };

  const onPublicationBannerImageChange = (e: any) => {
    const reader = new FileReader();
    if (e.target.files[0]) {
      reader.readAsDataURL(e.target.files[0]);
    }
    reader.onload = async (event) => {
      const embeddedImage = event?.target?.result as string;
      const dataUrlCompressed = await downscaleImage(
        embeddedImage,
        1000, // max width
        1000, // max height
        'image/jpeg', // all images converted to jpeg
        [], // keepImageTypes
        [], // ignoreImageTypes
        0.9, // image quality
        console
      );
      setPublicationBannerImage(dataUrlCompressed);
    };
  };

  const handleCrop = (croppedImage: string) => {
    setBreadcrumbLogo(croppedImage);
  };

  const onAvatarChange = (
    imageUrl: string,
    value: Blob,
    mimeType: string,
    fileSize: number,
    e: any
  ) => {
    setAvatar(imageUrl);
    setAvatarMimeType(mimeType);
    setAvatarSize(fileSize);
    setHideEditor(false);

    const reader = new FileReader();
    if (e.target.files[0]) {
      reader.readAsDataURL(e.target.files[0]);
    }
    reader.onload = async (event) => {
      const embeddedImage = event?.target?.result as string;
      const dataUrlCompressed = await downscaleImage(
        embeddedImage,
        1000, // max width
        1000, // max height
        'image/jpeg', // all images converted to jpeg
        [], // keepImageTypes
        [], // ignoreImageTypes
        0.9, // image quality
        console
      );

      setAvatar(dataUrlCompressed);
    };
  };

  const convertImagesToUrls = async (
    content: string
  ): Promise<{ headerUrl: string; contentWithUrls: string } | null> => {
    let headerUrl = publicationBannerImage;
    // returns null if the header image is already a URL
    const headerImage = parseEmbeddedImage(publicationBannerImage);
    const images = getEmbeddedImages(content);

    // Validate that the blob size of every image is less than
    // the max allowed bytes for an IC ingress message (2 MB).
    // Subtract 1 KB for additional payload data.
    const maxMessageSize = 1024 * 1024 * 2 - 1024; //2096640 bytes
    let errorImageName = '';

    if ((headerImage?.blob.size || 0) > maxMessageSize) {
      errorImageName = 'Header image';
    } else {
      const imageIndex = images.findIndex(
        (image) => image.blob.size > maxMessageSize
      );

      if (imageIndex > -1) {
        errorImageName = `Content image # ${imageIndex + 1}`;
      }
    }

    if (errorImageName) {
      toast(
        `${errorImageName} exceeded the maximum image size of ` +
        `${(maxMessageSize / 1024 / 1024).toFixed(3)} MBs after compression.`,
        ToastType.Error
      );

      return null;
    }

    // TODO: Remove temporary hack when parallel uploads are working without this.
    // Each call to the canister is 2 seconds, so the header image + 2 content images
    // will take 6 seconds just to get content ids, before uploading begins.
    if (headerImage) {
      headerImage.contentId = await getNewContentId();
    }
    for (let image of images) {
      image.contentId = await getNewContentId();
    }

    const promises = images.map((image) =>
      uploadBlob(
        image.blob,
        image.blob.size,
        image.mimeType,
        image.index.toString(),
        image.contentId
      )
    );

    if (headerImage) {
      promises.push(
        uploadBlob(
          headerImage.blob,
          headerImage.blob.size,
          headerImage.mimeType,
          '-1', // indicates header
          headerImage.contentId
        )
      );
    }

    let storageInfo = await Promise.all(promises);

    if (headerImage) {
      let headerImageStorageInfo = storageInfo.find(
        (info) => info.mappingId === '-1'
      );
      if (headerImageStorageInfo?.dataUrl) {
        headerUrl = headerImageStorageInfo.dataUrl;
      }
      storageInfo = storageInfo.filter((info) => info.mappingId !== '-1');
    }

    storageInfo.sort((a, b) => Number(a.mappingId) - Number(b.mappingId));

    let offset = 0;
    let c = content;
    for (const info of storageInfo) {
      const image = images.find((x) => x.index === Number(info.mappingId));
      if (image) {
        const start = image.index + offset;
        const end = start + image.length;
        const replacement = `"${info.dataUrl}"`; // could add additional attributes

        // replace base64 with url
        c = c.substring(0, start) + replacement + c.substring(end);

        offset += replacement.length - image.length;
      }
    }

    return { headerUrl, contentWithUrls: c };
  };

  const convertAvatarImagesToUrls = async (
    content: string
  ): Promise<{ avatarUrl: string; contentWithUrls: string } | null> => {
    let avatarUrl = avatar;
    // returns null if the header image is already a URL
    const avatarImage = parseEmbeddedImage(avatar);
    const images = getEmbeddedImages(content);

    // Validate that the blob size of every image is less than
    // the max allowed bytes for an IC ingress message (2 MB).
    // Subtract 1 KB for additional payload data.
    const maxMessageSize = 1024 * 1024 * 2 - 1024; //2096640 bytes
    let errorImageName = '';

    if ((avatarImage?.blob.size || 0) > maxMessageSize) {
      errorImageName = 'Avatar image';
    } else {
      const imageIndex = images.findIndex(
        (image) => image.blob.size > maxMessageSize
      );

      if (imageIndex > -1) {
        errorImageName = `Content image # ${imageIndex + 1}`;
      }
    }

    if (errorImageName) {
      toast(
        `${errorImageName} exceeded the maximum image size of ` +
        `${(maxMessageSize / 1024 / 1024).toFixed(3)} MBs after compression.`,
        ToastType.Error
      );

      return null;
    }

    // TODO: Remove temporary hack when parallel uploads are working without this.
    // Each call to the canister is 2 seconds, so the header image + 2 content images
    // will take 6 seconds just to get content ids, before uploading begins.
    if (avatarImage) {
      avatarImage.contentId = await getNewContentId();
    }
    for (let image of images) {
      image.contentId = await getNewContentId();
    }

    const promises = images.map((image) =>
      uploadBlob(
        image.blob,
        image.blob.size,
        image.mimeType,
        image.index.toString(),
        image.contentId
      )
    );

    if (avatarImage) {
      promises.push(
        uploadBlob(
          avatarImage.blob,
          avatarImage.blob.size,
          avatarImage.mimeType,
          '-1', // indicates header
          avatarImage.contentId
        )
      );
    }

    let storageInfo = await Promise.all(promises);

    if (avatarImage) {
      let avatarImageStorageInfo = storageInfo.find(
        (info) => info.mappingId === '-1'
      );
      if (avatarImageStorageInfo?.dataUrl) {
        avatarUrl = avatarImageStorageInfo.dataUrl;
      }
      storageInfo = storageInfo.filter((info) => info.mappingId !== '-1');
    }

    storageInfo.sort((a, b) => Number(a.mappingId) - Number(b.mappingId));

    let offset = 0;
    let c = content;
    for (const info of storageInfo) {
      const image = images.find((x) => x.index === Number(info.mappingId));
      if (image) {
        const start = image.index + offset;
        const end = start + image.length;
        const replacement = `"${info.dataUrl}"`; // could add additional attributes

        // replace base64 with url
        c = c.substring(0, start) + replacement + c.substring(end);

        offset += replacement.length - image.length;
      }
    }

    return { avatarUrl, contentWithUrls: c };
  };
  //breadcrumb logo upload
  const convertBreadcrumbLogoToUrl = async (
    content: string
  ): Promise<{ logoUrl: string; contentWithUrls: string } | null> => {
    let logoUrl = breadcrumbLogo;
    // returns null if the header image is already a URL
    const breadcrumbImage = parseEmbeddedImage(breadcrumbLogo);
    const images = getEmbeddedImages(content);

    // Validate that the blob size of every image is less than
    // the max allowed bytes for an IC ingress message (2 MB).
    // Subtract 1 KB for additional payload data.
    const maxMessageSize = 1024 * 1024 * 2 - 1024; //2096640 bytes
    let errorImageName = '';

    if ((breadcrumbImage?.blob.size || 0) > maxMessageSize) {
      errorImageName = 'Avatar image';
    } else {
      const imageIndex = images.findIndex(
        (image) => image.blob.size > maxMessageSize
      );

      if (imageIndex > -1) {
        errorImageName = `Content image # ${imageIndex + 1}`;
      }
    }

    if (errorImageName) {
      toast(
        `${errorImageName} exceeded the maximum image size of ` +
        `${(maxMessageSize / 1024 / 1024).toFixed(3)} MBs after compression.`,
        ToastType.Error
      );

      return null;
    }

    // TODO: Remove temporary hack when parallel uploads are working without this.
    // Each call to the canister is 2 seconds, so the header image + 2 content images
    // will take 6 seconds just to get content ids, before uploading begins.
    if (breadcrumbImage) {
      breadcrumbImage.contentId = await getNewContentId();
    }
    for (let image of images) {
      image.contentId = await getNewContentId();
    }

    const promises = images.map((image) =>
      uploadBlob(
        image.blob,
        image.blob.size,
        image.mimeType,
        image.index.toString(),
        image.contentId
      )
    );

    if (breadcrumbImage) {
      promises.push(
        uploadBlob(
          breadcrumbImage.blob,
          breadcrumbImage.blob.size,
          breadcrumbImage.mimeType,
          '-1', // indicates header
          breadcrumbImage.contentId
        )
      );
    }

    let storageInfo = await Promise.all(promises);

    if (breadcrumbImage) {
      let avatarImageStorageInfo = storageInfo.find(
        (info) => info.mappingId === '-1'
      );
      if (avatarImageStorageInfo?.dataUrl) {
        logoUrl = avatarImageStorageInfo.dataUrl;
      }
      storageInfo = storageInfo.filter((info) => info.mappingId !== '-1');
    }

    storageInfo.sort((a, b) => Number(a.mappingId) - Number(b.mappingId));

    let offset = 0;
    let c = content;
    for (const info of storageInfo) {
      const image = images.find((x) => x.index === Number(info.mappingId));
      if (image) {
        const start = image.index + offset;
        const end = start + image.length;
        const replacement = `"${info.dataUrl}"`; // could add additional attributes

        // replace base64 with url
        c = c.substring(0, start) + replacement + c.substring(end);

        offset += replacement.length - image.length;
      }
    }

    return { logoUrl, contentWithUrls: c };
  };

  // On Change Events for the dynamic input fields
  let handleCategoriesChange = (index: any, event: any) => {
    let newFormCategoriesValues = [...categoriesFormValues];
    newFormCategoriesValues[index].categories = event.target.value;
    setCategoriesFormValues(newFormCategoriesValues);
  };

  let handleEditorsChange = (index: any, event: any) => {
    let newFormEditorsValues = [...editorsFormValues];
    newFormEditorsValues[index].editors = event.target.value;
    console.log('setting editors: ', newFormEditorsValues, '2');
    setEditorsFormValues(newFormEditorsValues);
    setAllEditorHandlesExist(true);
    setWriterExistsAsEditorError(false);
  };

  let handleWritersChange = (index: any, event: any) => {
    let newFormWritersValues = [...writersFormValues];
    newFormWritersValues[index].writers = event.target.value;
    setWritersFormValues(newFormWritersValues);
    setAllWriterHandlesExist(true);
    setEditorExistsAsWriterError(false);
  };

  //Code that gets triggered when the user tries to add a new category, author and editor from the UI
  let removeCategoriesFormFields = (i: any) => {
    let newFormValues = [...categoriesFormValues];
    newFormValues.splice(i, 1);
    setCategoriesFormValues(newFormValues);
  };

  let removeEditorsFormFields = (i: any) => {
    let newFormValues = [...editorsFormValues];
    newFormValues.splice(i, 1);
    //backend call to remove the editor from the publication
    removeEditor(editorsFormValues[i].editors as string, publicationHandle);
    console.log('setting editors: ', newFormValues, '3');
    setEditorsFormValues(newFormValues);
    setAllEditorHandlesExist(true);
    setAllWriterHandlesExist(true);
    //getPublication(location.pathname.split('/').pop() as string);
    setWriterExistsAsEditorError(false);
    setEditorExistsAsWriterError(false);
  };

  let removeWritersFormFields = (i: any) => {
    let newFormValues = [...writersFormValues];
    newFormValues.splice(i, 1);
    //backend call to remove the writer from the publication
    removeWriter(writersFormValues[i].writers as string, publicationHandle);
    setWritersFormValues(newFormValues);
    setAllWriterHandlesExist(true);
    setAllEditorHandlesExist(true);
    //getPublication(location.pathname.split('/').pop() as string);
    setEditorExistsAsWriterError(false);
    setWriterExistsAsEditorError(false);
  };

  //Code that gets triggered when the user tries to add a new category, author and editor from the UI
  let addCategoriesFormFields = () => {
    setCategoriesFormValues([...categoriesFormValues, { categories: '' }]);
  };

  let addEditorsFormFields = () => {
    console.log(
      'setting editors: ',
      [...editorsFormValues, { editors: '' }],
      '4'
    );
    setEditorsFormValues([...editorsFormValues, { editors: '' }]);
  };

  let addWritersFormFields = () => {
    setWritersFormValues([...writersFormValues, { writers: '' }]);
  };

  const validateHandles = async () => {
    let editorsAreValid = true;
    let writersAreValid = true;
    let isValid = true;
    // Check if entered editor handles exist
    let editors = editorsFormValues.map((editor) =>
      editor.editors.toLowerCase()
    );
    let writers = writersFormValues.map((writer) =>
      writer.writers.toLowerCase()
    );

    let lowCasePublicationEditors = publication?.editors.map((editor) => {
      return editor.toLowerCase();
    });
    let lowCasePublicationWriters = publication?.writers.map((writer) => {
      return writer.toLowerCase();
    });
    //Check Writers

    let validHandles = (await getUsersByHandles(writers))?.map((user) =>
      user.handle.toLowerCase()
    ) as string[];

    lowCasePublicationWriters?.forEach((existingWriter) => {
      writers = writers.filter((writer) => existingWriter !== writer);
    });
    if (
      lowCasePublicationWriters !== writers &&
      writers.length !== 0 &&
      lowCasePublicationWriters?.length !== 0
    ) {
      writers.forEach((writer) => {
        if (validHandles && validHandles.includes(writer) == false) {
          writersAreValid = false;
        }
        if (lowCasePublicationEditors?.includes(writer)) {
          writersAreValid = false;
          setWriterExistsAsEditorError(true);
        }
      });
    }

    writers.forEach((writer) => {
      if (lowCasePublicationEditors?.includes(writer)) {
        writersAreValid = false;
        setWriterExistsAsEditorError(true);
      }
    });

    //Check Editors

    lowCasePublicationEditors?.forEach((existingEditor) => {
      editors = editors.filter((editor) => existingEditor !== editor);
    });

    if (
      lowCasePublicationEditors !== editors &&
      editors.length !== 0 &&
      lowCasePublicationEditors?.length !== 0
    ) {
      validHandles = (await getUsersByHandles(editors as string[]))?.map(
        (user) => user.handle.toLowerCase()
      ) as string[];
      editors.forEach((editor) => {
        if (validHandles && validHandles.includes(editor as string) == false) {
          editorsAreValid = false;
        }
        if (lowCasePublicationWriters?.includes(editor as string)) {
          editorsAreValid = false;
          setEditorExistsAsWriterError(true);
        }
      });
    }

    editors.forEach((editor) => {
      if (lowCasePublicationWriters?.includes(editor as string)) {
        editorsAreValid = false;
        setEditorExistsAsWriterError(true);
      }
    });

    if (!editorsAreValid) {
      setAllEditorHandlesExist(false);
    }

    if (!writersAreValid) {
      setAllWriterHandlesExist(false);
    }

    isValid = editorsAreValid && writersAreValid;
    return isValid;
  };

  //Logic for Save Button Click
  const onSave = async () => {
    setFirstSave(true);
    setSaveBtnIsDisabled(true);
    let isValid = validate();
    let isValidHandle = await validateHandles();

    if (!isValid || !isValidHandle) {
      setSaveBtnIsDisabled(false);
      return;
    }

    setLoading(true);

    //ensure the spinner does not get stuck
    setTimeout(() => {
      setLoading(false);
    }, 20000);

    try {
      //Mapping Categories, Editors, Writers, filtering out null values and returning unique values if the user keys in dupes
      let categories = categoriesFormValues
        .map((category) => category.categories)
        .filter((element) => {
          return element != '';
        });

      let uniqueCategories = [...new Set(categories)];

      let writers = writersFormValues
        .map((writer) => writer.writers)
        .filter((element) => {
          return element != '';
        });

      let uniqueWriters = [...new Set(writers)];

      let editors = editorsFormValues
        .map((editor) => editor.editors)
        .filter((element) => {
          return element != '';
        });

      let uniqueEditors = [...new Set(editors)];

      const result = await convertImagesToUrls(postHtml);
      if (result) {
        setPublicationBannerImage(result.headerUrl);

        setTimeout(() => {
          setSaveBtnIsDisabled(false);
        }, 2000);
      }

      const avatarImageResult = await convertAvatarImagesToUrls(postHtml);
      if (avatarImageResult) {
        setAvatar(avatarImageResult.avatarUrl);

        setTimeout(() => {
          setSaveBtnIsDisabled(false);
        }, 2000);
      }

      const breadcrumbImageResult = await convertBreadcrumbLogoToUrl(postHtml);
      if (breadcrumbImageResult) {
        setBreadcrumbLogo(breadcrumbImageResult.logoUrl);
        setTimeout(() => {
          setSaveBtnIsDisabled(false);
        }, 2000);
      }

      await Promise.all([
        updatePublicationDetails(
          publicationHandle as string,
          publicationDescription as string,
          publicationTitle as string,
          result?.headerUrl as string,
          uniqueCategories as string[],
          uniqueWriters as string[],
          uniqueEditors as string[],
          avatarImageResult?.avatarUrl as string,
          publicationSubtitle as string,
          socialLinks as SocialLinksObject,
          new Date().getTime().toString() as string
        ),
        updatePublicationStyling(
          titleFontType,
          primaryColor,
          breadcrumbImageResult?.logoUrl as string,
          publicationHandle
        ),
        updatePublicationCta(
          {
            icon: isCtaActive ? callToActionIcon : '',
            link: isCtaActive ? buttonLink : '',
            ctaCopy: isCtaActive ? callToAction : '',
            buttonCopy: isCtaActive ? buttonText : '',
          },
          publication?.publicationHandle as string
        ),
        handleUpdateSubscriptionDetails(),
      ]);
      await getPublication(publicationHandle);
      setLoading(false);
    } catch (err) {
      setSaveBtnIsDisabled(false);
      toastError(err);
      setLoading(false);
    }
  };

  const clearAll = () => { };

  const KeyCodes = {
    comma: 188,
    enter: [10, 13],
  };

  const delimiters = [...KeyCodes.enter, KeyCodes.comma];

  if (
    publicationDoesNotExist ||
    featureIsLive === false ||
    userIsEditor == false ||
    publication == undefined ||
    loadingPublication
  ) {
    return (
      <Fragment>
        <Header
          loggedIn={isLoggedIn}
          isArticlePage={false}
          ScreenWidth={screenWidth}
          isPublicationPage={false}
          isUserAdminScreen={true}
        />
        {loadingPublication ? (
          <div
            className='publication-loader'
            style={{ background: darkOptionsAndColors.background }}
          >
            <Loader />
          </div>
        ) : (
          <div
            style={{
              display: 'block',
              margin: '0 auto',
              padding: '50px',
              height: '100vh',
              background: darkOptionsAndColors.background,
            }}
          >
            <h2
              style={{
                marginTop: '50px',
                color: colors.darkerBorderColor,
                textAlign: 'center',
                background: darkOptionsAndColors.background,
              }}
            >
              {publicationDoesNotExist
                ? 'This publication no longer exists or you have entered the wrong handle'
                : featureIsLive === false
                  ? 'This feature is not yet live! Stay tuned...'
                  : userIsEditor == false || publication == undefined
                    ? 'You are not authorized to edit this publication or this publication does not exist. Only an Editor may edit the publication.'
                    : 'You have reached a page that does not exist. Please use the header to navigate to a different page'}
            </h2>
          </div>
        )}
      </Fragment>
    );
  } else {
    return (
      <Fragment>
        <Header
          loggedIn={isLoggedIn}
          isArticlePage={false}
          ScreenWidth={screenWidth}
          isPublicationPage={false}
          isUserAdminScreen={true}
        />
        <div
          className='create-edit-publication-wrapper'
          style={{
            background: darkOptionsAndColors.background,
            color: darkOptionsAndColors.color,
          }}
        >
          <div className='left'>
            <div className='left-content'>
              <p className='date'>Publication</p>
              <div className='menus'></div>
              <div className='horizontal-divider'></div>

              <p className='left-text'>
                last modified: {formatDate(publication?.modified) || ' - '}
              </p>

              <div style={{ display: 'inline-block' }}>
                <Button
                  onClick={() => {
                    if (!validateWebsiteAndSocialLinks()) {
                      return;
                    }
                    handleScrolls();
                    setTimeout(onSave, 800);
                  }}
                  disabled={saveBtnIsDisabled || !validateWebsiteAndSocialLinks()}
                  type='button'
                  styleType={{dark: 'navy-dark', light: 'navy'}}
                  style={{ width: '96px' }}
                >
                  Save
                </Button>
              </div>
            </div>
            <div className='left-sidebar'></div>
          </div>

          <div className='vertical-divider'></div>
          <div className='right'>
            {loading && <Loader />}

            <div
              className='right-position'
              style={{ display: loading ? 'none' : 'inherit' }}
            >
              {screenWidth != 0 && screenWidth < 768 && (
                <p className='right-text'>
                  last modified: {formatDate(publication?.modified) || ' - '}
                </p>
              )}

              <input
                id='banner-image'
                type='file'
                style={{ display: 'none' }}
                required={true}
                onChange={onPublicationBannerImageChange}
              />
              {publicationBannerImage ? (
                <label htmlFor='banner-image' className='uploaded-pic'>
                  <img
                    className='uploaded-pic'
                    src={publicationBannerImage}
                    alt='background'
                    onChange={onPublicationBannerImageChange}
                  />
                </label>
              ) : (
                <label htmlFor='banner-image' className='upload-banner-picture'>
                  <img src={icons.UPLOAD_PICTURE} alt='background' />
                </label>
              )}
              {firstSave && publicationBannerImage === '' ? (
                <div
                  style={{ marginTop: '-40px', marginBottom: '25px' }}
                  className='required-fields-container'
                >
                  <div className='arrow-up'></div>
                  <div className='required-fields-warning'>
                    <span>Please review this</span>
                  </div>
                </div>
              ) : null}

              <div id='name-wrapper'>
                <InputField2
                  classname='input-attributes2'
                  width='100%'
                  height='53px'
                  defaultText='Publication title'
                  fontSize={window.innerWidth < 400 ? '41px' : '50px'}
                  fontWeight='100'
                  lineHeight='50px'
                  fontFamily='Roboto'
                  fontColor={colors.darkerBorderColor}
                  hasError={publicationWarning}
                  value={publicationTitle}
                  onChange={onPublicationTitleChange}
                  theme={darkTheme ? 'dark' : 'light'}
                ></InputField2>
              </div>
              <div style={{ position: 'relative', top: '-20px' }}>
                {<RequiredFieldMessage hasError={publicationWarning} />}
              </div>

              <div id='subtitle-wrapper'>
                <InputField2
                  classname='input-attributes2'
                  width='100%'
                  height='24px'
                  defaultText='Subtitle'
                  fontSize='14px'
                  fontWeight='400'
                  lineHeight='26px'
                  fontFamily='Roboto'
                  fontColor={colors.darkerBorderColor}
                  hasError={publicationSubtitleWarning}
                  value={
                    publicationSubtitle.length > 100
                      ? publicationSubtitle.substring(0, 100)
                      : publicationSubtitle
                  }
                  onChange={onPublicationSubtitleChange}
                  theme={darkTheme ? 'dark' : 'light'}
                ></InputField2>
              </div>
              <div style={{ position: 'relative', top: '-20px' }}>
                {<RequiredFieldMessage hasError={publicationSubtitleWarning} />}
              </div>

              <div style={{ marginTop: '70px' }}>
                <p
                  className={
                    context.width < 768 ? 'mainTitle mobile-title' : 'mainTitle'
                  }
                >
                  HANDLE OF YOUR PUBLICATION
                </p>
              </div>
              <InputField2
                classname='input-attributes2'
                width='100%'
                height='24px'
                defaultText=''
                fontSize={window.innerWidth < 400 ? '19px' : '22px'}
                fontFamily='Roboto'
                fontColor={colors.darkerBorderColor}
                hasError={false}
                value={publicationHandle}
                background='#EFEFEF4D'
                theme={darkTheme ? 'dark' : 'light'}
              ></InputField2>

              <div id='description' style={{ marginTop: '70px' }}>
                <p
                  className={
                    context.width < 768 ? 'mainTitle mobile-title' : 'mainTitle'
                  }
                >
                  SHORT DESCRIPTION OF YOUR PUBLICATION
                </p>
              </div>
              <InputField2
                classname='input-attributes2'
                width='100%'
                height='24px'
                defaultText=''
                fontSize={window.innerWidth < 400 ? '19px' : '22px'}
                fontFamily='Roboto'
                fontColor={colors.darkerBorderColor}
                hasError={publicationDescriptionWarning}
                value={
                  publicationDescription.length > 140
                    ? publicationDescription.substring(0, 140)
                    : publicationDescription
                }
                onChange={onPublicationDescriptionChange}
                theme={darkTheme ? 'dark' : 'light'}
              ></InputField2>
              <div style={{ position: 'relative', top: '-20px' }}>
                {
                  <RequiredFieldMessage
                    hasError={publicationDescriptionWarning}
                  />
                }
              </div>

              <div id='avatar' style={{ marginTop: '50px' }}>
                <p
                  className={
                    context.width < 768 ? 'mainTitle mobile-title' : 'mainTitle'
                  }
                >
                  AVATAR
                </p>
              </div>
              <ProfilePictureButton avatar={avatar} onChange={onAvatarChange} />
              <div>
                <AvatarEditor
                  ref={editor}
                  className={hideEditor ? 'hidden' : ''}
                  image={avatar}
                  borderRadius={100}
                  width={150}
                  height={150}
                  border={50}
                  scale={1.2}
                />
                {
                  <button
                    className={hideEditor ? 'hidden' : 'editor-button'}
                    onClick={() => {
                      if (editor) {
                        // This returns a HTMLCanvasElement, it can be made into a data URL or a blob,
                        // drawn on another canvas, or added to the DOM.
                        //@ts-ignore
                        setCanvas(editor.current.getImage().toDataURL());

                        // If you want the image resized to the canvas size (also a HTMLCanvasElement)
                        setCanvasScaled(
                          editor.current
                            //@ts-ignore
                            ?.getImageScaledToCanvas()
                            .toDataURL('image/jpeg', 1.0)
                        );
                        setAvatar(
                          editor.current
                            //@ts-ignore
                            ?.getImageScaledToCanvas()
                            .toDataURL('image/jpeg', 1.0)
                        );
                        setHideEditor(true);
                      }
                    }}
                  >
                    Crop
                  </button>
                }
              </div>

              <BreadCrumbCropper
                onCrop={handleCrop}
                currentImage={
                  breadcrumbLogo ? breadcrumbLogo : images.PHOTO_BACKGROUND
                }
                screenWidth={screenWidth}
              />

              <BlockPicker
                width='200px'
                colors={[
                  '#D9E3F0',
                  '#F47373',
                  '#697689',
                  '#02C4A1',
                  '#2CCCE4',
                  '#555555',
                  '#dce775',
                  '#ff8a65',
                  '#ba68c8',
                ]}
                className='color-picker'
                color={primaryColor}
                onChange={(color) => {
                  setPrimaryColor(color.hex);
                }}
              />

              <div style={{ marginTop: '50px' }}>
                <p
                  className={
                    context.width < 768 ? 'mainTitle mobile-title' : 'mainTitle'
                  }
                >
                  CHOOSE TITLE FONT TYPE
                </p>
              </div>
              <SelectFontType
                setFontType={setTitleFontType}
                darkMode={darkOptionsAndColors}
              />

              <div id='pub-banner' style={{ marginTop: '50px' }}>
                <div className='title-toggle-flex'>
                  <p
                    className={
                      context.width < 768
                        ? 'mainTitle mobile-title'
                        : 'mainTitle'
                    }
                  >
                    PUBLICATION BANNER
                  </p>
                  <Toggle
                    toggled={isCtaActive}
                    callBack={async () => {
                      setIsCtaActive(!isCtaActive);
                    }}
                  />
                </div>

                <div
                  style={
                    isCtaActive
                      ? {}
                      : { filter: 'grayscale(2)', cursor: 'not-allowed' }
                  }
                >
                  <InputField2
                    classname='input-attributes2'
                    style={
                      isCtaActive
                        ? {}
                        : { filter: 'grayscale(2)', cursor: 'not-allowed' }
                    }
                    width='100%'
                    height='24px'
                    defaultText='Call to action'
                    fontSize={window.innerWidth < 400 ? '19px' : '22px'}
                    fontFamily='Roboto'
                    fontColor={colors.darkerBorderColor}
                    hasError={false}
                    value={callToAction}
                    background='#EFEFEF4D'
                    theme={darkTheme ? 'dark' : 'light'}
                    onChange={(val) => {
                      if (isCtaActive) {
                        onCallToActionChange(val);
                      }
                    }}
                  ></InputField2>
                  <InputField2
                    classname='input-attributes2'
                    style={
                      isCtaActive
                        ? {}
                        : { filter: 'grayscale(2)', cursor: 'not-allowed' }
                    }
                    width='100%'
                    height='24px'
                    defaultText='Button text'
                    fontSize={window.innerWidth < 400 ? '19px' : '22px'}
                    fontFamily='Roboto'
                    fontColor={colors.darkerBorderColor}
                    hasError={false}
                    value={buttonText}
                    background='#EFEFEF4D'
                    theme={darkTheme ? 'dark' : 'light'}
                    onChange={(val) => {
                      if (isCtaActive) {
                        onButtonTextChange(val);
                      }
                    }}
                  ></InputField2>
                  <InputField2
                    classname='input-attributes2'
                    style={
                      isCtaActive
                        ? {}
                        : { filter: 'grayscale(2)', cursor: 'not-allowed' }
                    }
                    width='100%'
                    height='24px'
                    defaultText='https://www.example.com'
                    fontSize={window.innerWidth < 400 ? '19px' : '22px'}
                    fontFamily='Roboto'
                    fontColor={colors.darkerBorderColor}
                    hasError={publicationCtaWebsiteWarning}
                    value={buttonLink}
                    background='#EFEFEF4D'
                    theme={darkTheme ? 'dark' : 'light'}
                    noSpaces={true}
                    onChange={(val) => {
                      if (isCtaActive) {
                        onButtonLinkChange(val);
                      }
                    }}
                  ></InputField2>
                  <div style={{ position: 'relative', top: '-20px' }}>
                    {
                      <RequiredFieldMessage
                        hasError={publicationCtaWebsiteWarning}
                        errorMessage='Please use format https://www.example.com'
                      />
                    }
                  </div>
                  <p
                    className={
                      context.width < 768
                        ? 'mainTitle mobile-title'
                        : 'mainTitle'
                    }
                  >
                    CHOOSE ICON
                  </p>
                  <div style={{ marginTop: '25px' }}>
                    <PublicationIconSelector
                      style={
                        isCtaActive
                          ? {}
                          : { filter: 'grayscale(2)', cursor: 'not-allowed' }
                      }
                      isActive={isCtaActive}
                      darkMode={darkTheme}
                      publicationTagLine={callToAction}
                      publicationIcon={callToActionIcon}
                      publicationButtonText={buttonText}
                      backgroundColor={primaryColor}
                      onIconSelected={onIconChange}
                      mobile={window.innerWidth > 400}
                    />
                    <div style={{ marginTop: '50px' }}>
                      <PublicationCallToAction
                        style={
                          isCtaActive
                            ? {}
                            : { filter: 'grayscale(2)', cursor: 'not-allowed' }
                        }
                        publicationTagLine={callToAction}
                        publicationIcon={callToActionIcon}
                        publicationButtonText={buttonText}
                        publicationBackgroundColor={primaryColor}
                        onClick={() => console.log('CTA')}
                        mobile={window.innerWidth > 678}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '50px' }}>
                <p
                  className={
                    context.width < 768 ? 'mainTitle mobile-title' : 'mainTitle'
                  }
                >
                  CATEGORIES
                </p>
              </div>

              <div className='form-row'>
                {categoriesFormValues.map((element, index) => (
                  <div
                    className='input-attributes2'
                    key={index}
                    style={{ display: 'flex' }}
                  >
                    <span>/</span>
                    <input
                      type='text'
                      className='textarea'
                      role='input'
                      name='categories'
                      id='categories'
                      value={element.categories || ''}
                      onChange={(event) => handleCategoriesChange(index, event)}
                      style={{
                        background: darkOptionsAndColors.background,
                        color: darkOptionsAndColors.color,
                      }}
                    />

                    {index ? (
                      <FontAwesomeIcon
                        style={{ color: colors.accentColor }}
                        icon={faCircleXmark}
                        onClick={() => removeCategoriesFormFields(index)}
                      />
                    ) : null}
                  </div>
                ))}

                <div className='button-section'>
                  <button
                    className='btn add-more'
                    type='button'
                    onClick={() => addCategoriesFormFields()}
                    style={{
                      background: darkOptionsAndColors.background,
                      color: darkOptionsAndColors.color,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div id='editors' style={{ marginTop: '50px' }}>
                <p
                  className={
                    context.width < 768 ? 'mainTitle mobile-title' : 'mainTitle'
                  }
                  style={{}}
                >
                  EDITORS
                </p>
              </div>

              <div className='form-row'>
                {editorsFormValues.map((element, index) => {
                  if (element.editors == user?.handle) {
                    const fromIndex = editorsFormValues.indexOf(element);
                    const toIndex = 0;

                    const defaultEditor = editorsFormValues.splice(
                      fromIndex,
                      1
                    )[0];

                    editorsFormValues.splice(toIndex, 0, defaultEditor);
                  }
                  return (
                    <div
                      className='input-attributes2'
                      key={index}
                      style={{
                        display: 'flex',
                        background: darkOptionsAndColors.background,
                        color: darkOptionsAndColors.color,
                      }}
                    >
                      <span>@</span>
                      <input
                        type='text'
                        className='textarea'
                        role='input'
                        name='editors'
                        id='editors'
                        disabled={element.editors == user?.handle}
                        value={element.editors || ''}
                        onChange={(event) => handleEditorsChange(index, event)}
                        style={{
                          background: darkOptionsAndColors.background,
                          color: darkOptionsAndColors.color,
                        }}
                      />

                      {index ? (
                        <FontAwesomeIcon
                          style={{ color: colors.accentColor }}
                          icon={faCircleXmark}
                          onClick={() => removeEditorsFormFields(index)}
                        />
                      ) : null}
                    </div>
                  );
                })}

                {firstSave && allEditorHandlesExist == false ? (
                  <div className='required-fields-container'>
                    <div className='arrow-up'></div>
                    <div
                      style={{ height: '65px' }}
                      className='required-fields-warning'
                    >
                      {editorExistsAsWriterError ? (
                        <span>
                          One of the handles you have added already exists as a
                          writer. Remove it as a writer to add it as an editor.
                        </span>
                      ) : (
                        <span>
                          Please review. One or more handles you have entered do
                          not exist.
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className='button-section'>
                  <button
                    className='btn add-more'
                    type='button'
                    onClick={() => addEditorsFormFields()}
                    style={{
                      color: darkOptionsAndColors.color,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div id='writers' style={{ marginTop: '50px' }}>
                <p
                  className={
                    context.width < 768 ? 'mainTitle mobile-title' : 'mainTitle'
                  }
                >
                  WRITERS
                </p>
              </div>

              <div className='form-row'>
                {writersFormValues.map((element, index) => (
                  <div
                    className='input-attributes2'
                    key={index}
                    style={{ display: 'flex' }}
                  >
                    <span>@</span>
                    <input
                      type='text'
                      className='textarea'
                      role='input'
                      name='writers'
                      id='writers'
                      value={element.writers}
                      onChange={(event) => handleWritersChange(index, event)}
                      style={{
                        background: darkOptionsAndColors.background,
                        color: darkOptionsAndColors.color,
                      }}
                    />

                    {false ? null : (
                      <FontAwesomeIcon
                        style={{ color: colors.accentColor }}
                        icon={faCircleXmark}
                        onClick={() => removeWritersFormFields(index)}
                      />
                    )}
                  </div>
                ))}
                {firstSave && allWriterHandlesExist == false ? (
                  <div className='required-fields-container'>
                    <div className='arrow-up'></div>
                    <div
                      style={{ height: '65px' }}
                      className='required-fields-warning'
                    >
                      {writerExistsAsEditorError ? (
                        <span>
                          One of the handles you have added already exists as an
                          editor. Remove it as an editor to add it as a writer.
                        </span>
                      ) : (
                        <span>
                          Please review. One or more handles you have entered do
                          not exist.
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className='button-section'>
                  <button
                    className='btn add-more'
                    type='button'
                    onClick={() => addWritersFormFields()}
                    style={{
                      color: darkOptionsAndColors.color,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div id='links' style={{ marginTop: '50px' }}>
                <p
                  className={
                    context.width < 768 ? 'mainTitle mobile-title' : 'mainTitle'
                  }
                >
                  LINK TO WEBSITE
                </p>
              </div>
              <InputField2
                classname='input-attributes-3'
                defaultText='Enter your website...'
                width='100%'
                height='50px'
                fontSize={'14px'}
                fontFamily='Roboto'
                fontColor={colors.editProfileInputTextColor}
                hasError={
                  publicationWebsite !== '' && !validateUrl(publicationWebsite)
                }
                noSpaces={true}
                onChange={setPublicationWebsite}
                value={publicationWebsite}
                maxLength={161}
                theme={darkTheme ? 'dark' : 'light'}
                icon={darkTheme ? icons.WEBSITE_ICON_DARK : icons.WEBSITE_ICON}
                button={{
                  icon: icons.CLOSE_BUTTON,
                  onClick: () => {
                    setPublicationWebsite('');
                  },
                }}
              />
              {publicationSocialChannelUrls.map((socialChannelUrl, index) => {
                return (
                  <div className='edit-publication-input' key={index}>
                    <p
                      className={
                        context.width < 768
                          ? 'mainTitle mobile-title'
                          : 'mainTitle'
                      }
                      style={{ marginTop: '10px' }}
                    >
                      LINK TO SOCIAL CHANNEL
                    </p>
                    <InputField2
                      classname='input-attributes-3'
                      defaultText='Enter URL to social channel'
                      width='100%'
                      height='50px'
                      fontSize={'14px'}
                      fontFamily='Roboto'
                      fontColor={colors.editProfileInputTextColor}
                      hasError={
                        socialChannelUrl !== '' &&
                        !validateUrl(socialChannelUrl)
                      }
                      noSpaces={true}
                      onChange={(newVal) => {
                        let allUrls = publicationSocialChannelUrls;
                        allUrls = allUrls.map((val, i) => {
                          if (i === index) {
                            return newVal;
                          } else {
                            return val;
                          }
                        });
                        setPublicationSocialChannelUrls(allUrls);
                      }}
                      value={socialChannelUrl}
                      maxLength={161}
                      theme={darkTheme ? 'dark' : 'light'}
                      icon={getIconForSocialChannel(
                        socialChannelUrl,
                        darkTheme
                      )}
                      button={{
                        icon: icons.CLOSE_BUTTON,
                        onClick: () => {
                          let allUrls = publicationSocialChannelUrls;
                          allUrls = allUrls.filter((v, i) => i !== index);
                          setPublicationSocialChannelUrls(allUrls);
                        },
                      }}
                    />
                  </div>
                );
              })}
              <div
                style={
                  !isAddNewSocialLinkActive()
                    ? {
                      cursor: 'not-allowed',
                      opacity: '0.5',
                      marginTop: '20px',
                      marginBottom: '20px',
                    }
                    : {
                      marginTop: '20px',
                      marginBottom: '20px',
                    }
                }
                className='edit-publication-add-new-social-channel'
                onClick={() => {
                  if (isAddNewSocialLinkActive()) {
                    setPublicationSocialChannelUrls([
                      ...publicationSocialChannelUrls,
                      '',
                    ]);
                  }
                }}
              >
                <span>+</span>
                {'  Add new link to social channel'}
              </div>

              <div className='subscription-settings-wrapper'>
                <SubscriptionSettings
                  subscriptionDetails={subscriptionDetails}
                  updateSubscriptionDetails={handleUpdateSubscriptionDetails}
                  setSubscriptionDetails={setSubscriptionDetails}
                  isPublication={true}
                  error={!validPrincipal}
                />
              </div>

              <div style={{ display: 'inline-block' }}>
                <Button
                  style={{ width: '96px', margin: '0 16px 0 0' }}
                  type='button'
                  styleType={{dark: 'white', light: 'white'}}
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
              </div>
              <div style={{ display: 'inline-block' }}>
                <Button
                  onClick={() => {
                    if (!validateWebsiteAndSocialLinks()) {
                      return;
                    }
                    handleScrolls();
                    setTimeout(onSave, 800);
                  }}
                  disabled={saveBtnIsDisabled || !validateWebsiteAndSocialLinks()}
                  type='button'
                  styleType={{dark: 'navy-dark', light: 'navy'}}
                  style={{ width: '96px' }}
                >
                  Save
                </Button>
              </div>

              <Footer />
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
};

export default CreateEditPublication;
