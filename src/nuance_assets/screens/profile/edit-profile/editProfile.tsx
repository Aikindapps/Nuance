import React, { useState, useEffect, useRef } from 'react';
import Button from '../../../UI/Button/Button';
import { useNavigate } from 'react-router';
import InputField from '../../../UI/InputField2/InputField2';
import { useUserStore, useAuthStore } from '../../../store';
import {
  base64toBlob,
  formatDate,
  getEmbeddedImages,
  getIconForSocialChannel,
  parseEmbeddedImage,
} from '../../../shared/utils';
import { getNewContentId, uploadBlob } from '../../../services/storageService';
import AvatarEditor from 'react-avatar-editor';
import ProfilePictureButton from '../../../UI/profile-picture-button/profile-picture-button';
import { downscaleImage } from '../../../components/quill-text-editor/modules/quill-image-compress/downscaleImage';
import { toast, toastError, ToastType } from '../../../services/toastService';
import Loader from '../../../UI/loader/Loader';
import { useTheme } from '../../../contextes/ThemeContext';
import { colors, icons, images } from '../../../shared/constants';
import { UserType } from 'src/nuance_assets/types/types';
import SubscriptionSettings from '../../create-edit-publication/subscription-settings';
import { WriterSubscriptionDetails } from 'src/declarations/Subscription/Subscription.did';
import { useSubscriptionStore } from '../../../store/subscriptionStore';
import { SubscriptionStore } from '../../../store/subscriptionStore';
import { Principal } from '@dfinity/principal';
import './_edit-profile.scss';
import { useAgent, useIsInitializing } from '@nfid/identitykit/react';
var psl = require('psl');

const isLocal: boolean =
  window.location.origin.includes('localhost') ||
  window.location.origin.includes('127.0.0.1');

const EditProfile = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const navigate = useNavigate();
  const customHost = isLocal ? 'http://localhost:8080' : 'https://icp-api.io';
  const agentIk = useAgent({ host: customHost, retryTimes: 10 });
  const isInitializing = useIsInitializing();
  const { updateUserDetails, getUser, getPrincipalByHandle } = useUserStore(
    (state) => ({
      getUser: state.getUser,
      updateUserDetails: state.updateUserDetails,
      getPrincipalByHandle: state.getPrincipalByHandle,
    })
  );

  const {
    getWriterSubscriptionDetailsByPrincipalId,
    updateSubscriptionDetails,
  } = useSubscriptionStore((state: SubscriptionStore) => ({
    getWriterSubscriptionDetailsByPrincipalId:
      state.getWriterSubscriptionDetailsByPrincipalId,
    updateSubscriptionDetails: state.updateSubscriptionDetails,
  }));

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (isLoggedIn) {
      agentIk ? setLoading(false) : setLoading(true);
    }
  }, [agentIk, isLoggedIn]);

  const firstLoad = async () => {
    setIsLoading(true);
    let user = await getUser(agentIk);
    if (user) {
      setUser(user);
      setAvatar(user.avatar);
    } else {
      if (isLoggedIn) {
        navigate('/register', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    firstLoad();
  }, []);

  const [user, setUser] = useState<UserType | undefined>();

  const [avatar, setAvatar] = useState(user?.avatar || images.DEFAULT_AVATAR);
  const [avatarMimeType, setAvatarMimeType] = useState('');
  const [avatarSize, setAvatarSize] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [postHtml, setPostHtml] = useState('');
  const darkTheme = useTheme();

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
    const convertToE8s = (fee: string | undefined) =>
      fee ? Number(fee) * 1e8 : undefined;

    try {
      const userPrincipalId = await getPrincipalByHandle(user?.handle || '');
      await updateSubscriptionDetails(
        agentIk,
        convertToE8s(subscriptionDetails.weeklyFee[0]),
        convertToE8s(subscriptionDetails.monthlyFee[0]),
        convertToE8s(subscriptionDetails.annuallyFee[0]),
        convertToE8s(subscriptionDetails.lifeTimeFee[0]),
        {
          paymentReceiverPrincipal: Principal.fromText(
            subscriptionDetails.writerPrincipalId
          ),
          publicationCanisterId: userPrincipalId ?? '',
        }
      );
    } catch (error) {
      console.error('Error fetching canister ID:', error);
    }
  };

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      console.log('Fetching subscription details for:', user?.handle);
      if (user) {
        const userPrincipalId = await getPrincipalByHandle(user.handle);
        if (userPrincipalId) {
          const fetchedDetails =
            await getWriterSubscriptionDetailsByPrincipalId(userPrincipalId);
          if (fetchedDetails) {
            setSubscriptionDetails({
              writerSubscriptions: fetchedDetails?.writerSubscriptions,
              weeklyFee: fetchedDetails.weeklyFee[0]
                ? [(Number(fetchedDetails.weeklyFee[0]) / 1e8).toString()]
                : [],
              writerPrincipalId: fetchedDetails.writerPrincipalId,
              paymentReceiverPrincipalId:
                fetchedDetails.paymentReceiverPrincipalId,
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
            console.log(
              'Fetched subscription details:',
              fetchedDetails.annuallyFee[0]
                ? [(Number(fetchedDetails.annuallyFee[0]) / 1e8).toString()]
                : []
            );
            console.log(
              'Fetched subscription details:',
              fetchedDetails.annuallyFee[0]
                ? [fetchedDetails.annuallyFee[0]]
                : []
            );
          }
        }
      }
    };
    fetchSubscriptionDetails();
  }, [user]);

  const onDisplayNameChange = (value: string) => {
    if (user) {
      setUser({ ...user, displayName: value });
    }
  };

  const onBiographyChange = (value: string) => {
    if (user) {
      setUser({ ...user, bio: value });
    }
  };

  function validateURL(url: string) {
    var validUrl = require('valid-url');
    if (url != '') {
      return validUrl.isWebUri(url);
    } else return true;
  }

  const isAddNewSocialLinkActive = () => {
    if (user) {
      if (user.socialChannels.length === 0) {
        return true;
      } else {
        return validateURL(user.socialChannels[user.socialChannels.length - 1]);
      }
    }
    return false;
  };

  const validateSocialLinks = () => {
    if (user) {
      for (const socialChannelUrl of user.socialChannels) {
        if (socialChannelUrl !== '' && !validateURL(socialChannelUrl)) {
          return false;
        }
      }
    }
    return true;
  };

  const validate = () => {
    if (user) {
      if (user.website !== '') {
        return validateSocialLinks() && validateURL(user.website);
      } else {
        return validateSocialLinks();
      }
    }
    return false;
  };

  const onWebsiteChange = (value: string) => {
    if (user) {
      setUser({ ...user, website: value });
    }
  };

  const onSocialChannelUrlChange = (value: string, index: number) => {
    if (user) {
      let allUrls = user.socialChannels;
      allUrls = allUrls.map((val, i) => {
        if (i === index) {
          return value;
        } else {
          return val;
        }
      });
      setUser({ ...user, socialChannels: allUrls });
    }
  };

  const editor = useRef(null);
  const [hideEditor, setHideEditor] = useState(true);
  const [canvasScaled, setCanvasScaled] = useState('');
  const [canvas, setCanvas] = useState('');

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

  const onSave = async () => {
    setIsLoading(true);
    if (user) {
      let avatarChanged = avatar !== user?.avatar;
      if (avatarChanged) {
        const avatarImageResult = await convertAvatarImagesToUrls(postHtml);
        let response = await updateUserDetails(
          user.bio,
          avatarImageResult?.avatarUrl || user.avatar,
          user.displayName,
          user.website,
          user.socialChannels.filter((v) => v !== '') //remove the empty elements
        );
        if (response) {
          setUser(response);
          setAvatar(response.avatar);
        }
      } else {
        let response = await updateUserDetails(
          user.bio,
          user.avatar,
          user.displayName,
          user.website,
          user.socialChannels.filter((v) => v !== '') //remove the empty elements
        );
        if (response) {
          setUser(response);
          setAvatar(response.avatar);
        }
      }

      await updateSubscriptionDetails(
        agentIk,
        subscriptionDetails.weeklyFee[0]
          ? Number(subscriptionDetails.weeklyFee[0]) * 1e8
          : undefined,
        subscriptionDetails.monthlyFee[0]
          ? Number(subscriptionDetails.monthlyFee[0]) * 1e8
          : undefined,
        subscriptionDetails.annuallyFee[0]
          ? Number(subscriptionDetails.annuallyFee[0]) * 1e8
          : undefined,
        subscriptionDetails.lifeTimeFee[0]
          ? Number(subscriptionDetails.lifeTimeFee[0]) * 1e8
          : undefined
      );
    }

    setIsLoading(false);
    navigate('/my-profile');
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

  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
    secondaryColor: darkTheme
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
  };

  if (loading || isInitializing || isLoading) {
    return (
      <div className='edit-profile-wrapper'>
        <div style={{ width: '150px' }}>
          <Loader />
        </div>
      </div>
    );
  }
  return (
    <div className='edit-profile-wrapper'>
      <p className='edit-profile-title'>MY PROFILE / EDIT PROFILE</p>

      <div className='image'>
        <ProfilePictureButton avatar={avatar} onChange={onAvatarChange} />
      </div>
      <div style={{ display: 'flex' }}>
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

      <div className='edit-profile-static-info-wrapper'>
        <div className='edit-profile-static-info'>
          <div className='edit-profile-title'>ACCOUNT CREATED</div>
          <div
            className='edit-profile-static-info-value'
            style={{ color: darkOptionsAndColors.color }}
          >
            {formatDate(user?.accountCreated)}
          </div>
        </div>
        <div className='edit-profile-static-info'>
          <div className='edit-profile-title'>@HANDLE</div>
          <div
            className='edit-profile-static-info-value'
            style={{ color: darkOptionsAndColors.color }}
          >
            @{user?.handle}
          </div>
        </div>
      </div>

      <div className='edit-profile-input-wrapper'>
        <div className='edit-profile-input'>
          <p className='edit-profile-title' style={{ marginTop: '10px' }}>
            DISPLAY NAME
          </p>
          <InputField
            classname='input-attributes-3'
            style={{ width: '100%', marginBottom: '0' }}
            defaultText='Enter display name...'
            width='100%'
            height='50px'
            fontSize={'14px'}
            fontFamily='Roboto'
            fontColor={colors.editProfileInputTextColor}
            hasError={false}
            onChange={onDisplayNameChange}
            value={user?.displayName}
            theme={darkTheme ? 'dark' : 'light'}
          />
        </div>
        <div className='edit-profile-input'>
          <p className='edit-profile-title' style={{ marginTop: '10px' }}>
            BIOGRAPHY
          </p>
          <InputField
            classname='input-attributes-3'
            defaultText='Enter biography...'
            width='100%'
            height='50px'
            fontSize={'14px'}
            fontFamily='Roboto'
            fontColor={colors.editProfileInputTextColor}
            hasError={false}
            onChange={onBiographyChange}
            value={user?.bio}
            maxLength={161}
            theme={darkTheme ? 'dark' : 'light'}
          />
        </div>
        <p className='subtitle'>
          Your bio appears on your profile next to your stories. Max 160
          characters.
        </p>
        <div className='edit-profile-input'>
          <p className='edit-profile-title' style={{ marginTop: '10px' }}>
            LINK TO WEBSITE
          </p>
          <InputField
            classname='input-attributes-3'
            defaultText='Enter your website...'
            width='100%'
            height='50px'
            fontSize={'14px'}
            fontFamily='Roboto'
            fontColor={colors.editProfileInputTextColor}
            hasError={user?.website !== '' && !validateURL(user?.website || '')}
            noSpaces={true}
            onChange={onWebsiteChange}
            value={user?.website}
            maxLength={161}
            theme={darkTheme ? 'dark' : 'light'}
            icon={darkTheme ? icons.WEBSITE_ICON_DARK : icons.WEBSITE_ICON}
            button={{
              icon: icons.CLOSE_BUTTON,
              onClick: () => {
                onWebsiteChange('');
              },
            }}
          />
        </div>
        {user?.socialChannels.map((socialChannelUrl, index) => {
          return (
            <div className='edit-profile-input' key={index}>
              <p className='edit-profile-title' style={{ marginTop: '10px' }}>
                LINK TO SOCIAL CHANNEL
              </p>
              <InputField
                classname='input-attributes-3'
                defaultText='Enter URL to social channel'
                width='100%'
                height='50px'
                fontSize={'14px'}
                fontFamily='Roboto'
                fontColor={colors.editProfileInputTextColor}
                hasError={
                  socialChannelUrl !== '' && !validateURL(socialChannelUrl)
                }
                noSpaces={true}
                onChange={(newVal) => {
                  onSocialChannelUrlChange(newVal, index);
                }}
                value={socialChannelUrl}
                maxLength={161}
                theme={darkTheme ? 'dark' : 'light'}
                icon={getIconForSocialChannel(socialChannelUrl, darkTheme)}
                button={{
                  icon: icons.CLOSE_BUTTON,
                  onClick: () => {
                    if (user) {
                      let allUrls = user.socialChannels;
                      allUrls = allUrls.filter((v, i) => i !== index);
                      setUser({ ...user, socialChannels: allUrls });
                    }
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
                }
              : {}
          }
          className='edit-profile-add-new-social-channel'
          onClick={() => {
            if (user && isAddNewSocialLinkActive()) {
              setUser({
                ...user,
                socialChannels: [...user.socialChannels, ''],
              });
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
            isPublication={false}
          />
        </div>
        <div className='edit-profile-buttons-wrapper'>
          <Button
            style={{ width: '96px', margin: '0 0 0 0' }}
            type='button'
            styleType={{ dark: 'white', light: 'white' }}
            onClick={() => navigate('/my-profile')}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (validate()) {
                onSave();
              }
            }}
            type='button'
            styleType={{ dark: 'navy-dark', light: 'navy' }}
            disabled={!validate()}
            style={{ width: '120px' }}
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;