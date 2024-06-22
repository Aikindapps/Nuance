import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  useAuthStore,
  useUserStore,
  usePostStore,
  usePublisherStore,
} from '../../store';
import Button from '../../UI/Button/Button';
import { Context as ModalContext } from '../../contextes/ModalContext';
import Header from '../../components/header/header';
import Loader from '../../UI/loader/Loader';
//import { PostSaveModel } from '../../services/actorService';
import {
  CreatePremiumArticleData,
  PostType,
  PremiumArticleOwners as PremiumArticleOwnersObject,
  PublicationObject,
  PublicationType,
} from '../../types/types';
import {
  convertImagesToUrls,
  DateFormat,
  formatDate,
} from '../../shared/utils';

import { downscaleImage } from '../../components/quill-text-editor/modules/quill-image-compress/downscaleImage.js';
import { toast, toastError, ToastType } from '../../services/toastService';
import CopyArticle from '../../UI/copy-article/copy-article';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { colors, icons, images } from '../../shared/constants';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../contextes/ThemeContext';
import './create-edit-article-screen.scss';
import PremiumArticleOwners from '../../components/premium-article-owners/premium-article-owners';
import { StaticArticleView } from '../../components/static-article-view/StaticArticleView';
import { EditArticleInputFields } from '../../components/edit-article-input-fields/edit-article-input-fields';
import { EditArticlePremiumModal } from '../../components/edit-article-premium-modal/edit-article-premium-modal';
import { ButtonsTextsMobile } from '../../components/buttons-texts-mobile/buttons-texts-mobile';
import Badge from '../../UI/badge/badge';
import Dropdown from '../../UI/dropdown/dropdown';
import { RxAvatar } from 'react-icons/rx';
import RadioButtons from '../../UI/radio-buttons/radio-buttons';
import { PostStore } from '../../store/postStore';
import { PublisherStore } from '../../store/publisherStore';
import { UserStore } from '../../store/userStore';
import { AuthStore } from '../../store/authStore';
import { TagModel } from 'src/declarations/PostCore/PostCore.did';
import SchedulePublish from '../../components/schedule-publish/schedule-publish';
import { ReaderSubscriptionDetailsConverted, WriterSubscriptionDetailsConverted, useSubscriptionStore } from '../../store/subscriptionStore';

const CreateEditArticle = () => {
  const navigate = useNavigate();
  const location = useLocation();

  //dark theme
  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.darkModePrimaryBackgroundColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };
  const modalContext = useContext(ModalContext);

  //postStore
  const {
    getPost,
    getOwnersOfPremiumArticle,
    nftCanistersEntries,
    allTags,
    getAllTags,
    savePost,
    migratePostToPublication,
  } = usePostStore((state: PostStore) => ({
    getPost: state.getSavedPostReturnOnly,
    getOwnersOfPremiumArticle: state.getOwnersOfPremiumArticleReturnOnly,
    nftCanistersEntries: state.nftCanistersEntries,
    allTags: state.allTags,
    getAllTags: state.getAllTags,
    savePost: state.savePost,
    migratePostToPublication: state.migratePostToPublication,
  }));

  //publisherStore
  const { savePublicationPost, getPublication } = usePublisherStore(
    (state: PublisherStore) => ({
      savePublicationPost: state.savePublicationPost,
      getPublication: state.getPublication,
    })
  );

  const { getMySubscriptionHistoryAsReader, getWriterSubscriptionDetailsByPrincipalId } = useSubscriptionStore((state) => ({
    getMySubscriptionHistoryAsReader: state.getMySubscriptionHistoryAsReader,
    getWriterSubscriptionDetailsByPrincipalId: state.getWriterSubscriptionDetailsByPrincipalId,
  }));


  //userStore
  const { getUser, user, getPrincipalByHandle } = useUserStore((state: UserStore) => ({
    getPrincipalByHandle: state.getPrincipalByHandle,
    getUser: state.getUser,
    user: state.user,
  }));

  //authStore
  const isLoggedIn = useAuthStore((state: AuthStore) => state.isLoggedIn);
  const [currentStatus, setCurrentStatus] = useState('');



  //returns the current status of the post
  const getCurrentStatus = () => {
    const currentDate = new Date();

    if (location.pathname === '/article/new') {
      return 'Not saved';
    }

    if (lastSavedPost?.isDraft) {
      if (userPublicationsWriter.includes(lastSavedPost.handle)) {
        return 'Submitted for review';
      } else {
        return 'Draft';
      }
    }
    if (lastSavedPost?.isPremium) {
      if (lastSavedPost?.publishedDate) {
        const plannedDate = new Date(Number(lastSavedPost?.publishedDate));
        if (plannedDate > currentDate) {
          return "Planned + Mint";
        }
      }
      return "Minted";
    }

    if (lastSavedPost?.publishedDate) {
      // Assuming lastSavedPost.publishedDate is in milliseconds
      const scheduledDate = new Date(Number(lastSavedPost.publishedDate));


      if (scheduledDate > currentDate) {
        return 'Planned';
      } else {
        return 'Published';
      }
    }
    return 'Published';
  };


  const isPublishButtonVisible = () => {
    if (lastSavedPost) {
      if (lastSavedPost.isPremium) {
        //post is premium -> not visible
        return false;
      } else {
        //post is not premium
        if (user?.handle === selectedHandle) {
          //regular post -> display the button
          return true;
        } else {
          //publication post -> display if the user is an editor
          return userPublicationsEditor.includes(selectedHandle);
        }
      }
    } else {
      //last saved post is undefined -> new article screen
      if (user?.handle === selectedHandle) {
        //regular post -> display the button
        return true;
      } else {
        //publication post -> diplay if the user is an editor
        return userPublicationsEditor.includes(selectedHandle);
      }
    }
  };

  const isPublishAsPremiumVisible = () => {
    if (lastSavedPost) {
      //the post has already been saved
      //if it's draft, check the userPublicationsEditor array, if it's not there, return false
      if (lastSavedPost.isDraft) {
        return userPublicationsEditor.includes(selectedHandle) && !loading;
      } else {
        return false;
      }
    } else {
      //new article screen
      //just check the userPublicationsEditor array
      return userPublicationsEditor.includes(selectedHandle) && !loading;
    }
  };

  const getTagNames = () => {
    return savingPost.tags.map((tag) => {
      return tag.tagName;
    });
  };

  const buildEmptyPost = () => {
    let post: PostType = {
      postId: '',
      handle: '',
      title: '',
      url: '',
      subtitle: '',
      headerImage: '',
      content: '',
      isDraft: true,
      created: '',
      modified: '',
      publishedDate: '',
      views: '',
      tags: [],
      claps: '',
      category: '',
      isPremium: false,
      isMembersOnly: false,
      bucketCanisterId: '',
      wordCount: '',
      isPublication: false,
      creatorHandle: '',
      creatorPrincipal: '',
    };
    return post;
  };

  const buildEmptyPremiumArticleOwners = () => {
    let owners: PremiumArticleOwnersObject = {
      postId: '',
      totalSupply: '',
      available: '',
      ownersList: [],
    };
    return owners;
  };

  const fillUserRelatedFields = async () => {
    if (user) {
      let allPublications: string[] = [];
      let writerPublications: string[] = [];
      let editorPublications: string[] = [];
      user.publicationsArray.forEach((publicationObject: PublicationObject) => {
        allPublications.push(publicationObject.publicationName);
        if (publicationObject.isEditor) {
          editorPublications.push(publicationObject.publicationName);
        } else {
          writerPublications.push(publicationObject.publicationName);
        }
      });
      setUserAllPublications(allPublications);
      setUserPublicationsWriter(writerPublications);
      setUserPublicationsEditor(editorPublications);
      setSelectedHandle(user.handle);

      //fetch the publications that user is editor in parallel
      const userEditorPublicationsDetailsArray = await Promise.all(
        editorPublications.map((publicationHandle) => {
          return getPublication(publicationHandle);
        })
      );
      let userEditorPublicationsDetailsMap: Map<string, PublicationType> =
        new Map();
      for (const publicationDetail of userEditorPublicationsDetailsArray) {
        if (publicationDetail) {
          userEditorPublicationsDetailsMap.set(
            publicationDetail.publicationHandle,
            publicationDetail
          );
        }
      }
      setUserEditorPublicationsDetails(userEditorPublicationsDetailsMap);
    }
  };

  //fetch the post to load the page -> navigates to new article screen if the caller is not authorized
  const fetchPost = async () => {
    let pathname = window.location.pathname;
    if (!pathname.includes('new')) {
      //edit article
      //fetch the post first
      let postId = window.location.pathname.split('/').pop();
      if (postId) {
        let post = await getPost(postId);
        if (post) {
          //fetch the other info if the post is premium
          if (post.isPremium) {
            let premiumArticleOwners = await getOwnersOfPremiumArticle(postId);
            if (premiumArticleOwners) {
              setOwnersOfPremiumArticle(premiumArticleOwners);
            }
            //set the post
            setSavingPost(post);
            setLastSavedPost(post);
            setPostHtml(post.content);
            if (post.isPublication) {
              setSelectedHandle(post.handle);
              setSelectedCategory(post.category);
            }
          }
          //if it's not a premium post, simply put the post to local variable
          else {
            setSavingPost(post);
            setLastSavedPost(post);
            setPostHtml(post.content);
            if (post.isPublication) {
              setSelectedHandle(post.handle);
              setSelectedCategory(post.category);
            }
          }
        } else {
          navigate('/article/new', { replace: true });
        }
      } else {
        navigate('/article/new', { replace: true });
      }
    } else {
      setLastSavedPost(undefined);
      setSavingPost(buildEmptyPost());
      setPostHtml('');
      if (user) {
        setSelectedHandle(user.handle);
      }
    }
  };

  //first load only
  useEffect(() => {
    firstLoad();
  }, [location.pathname]);

  const firstLoad = async () => {
    setLoading(true);
    await Promise.all([
      fetchPost(),
      getUser(),
      fillUserRelatedFields(),
      getAllTags(),
    ]);
    setLoading(false);
  };



  //refresh the user related fields if the user object changes
  useEffect(() => {
    fillUserRelatedFields();
  }, [user]);

  //check screen width
  useEffect(() => {
    const handleScreenWidth = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleScreenWidth);
  }, []);

  //saving post and last saved post
  const [savingPost, setSavingPost] = useState(buildEmptyPost());
  const [lastSavedPost, setLastSavedPost] = useState<PostType | undefined>();
  const [postHtml, setPostHtml] = useState('');

  //user related fields
  const [ownersOfPremiumArticle, setOwnersOfPremiumArticle] = useState(
    buildEmptyPremiumArticleOwners()
  );
  const [userAllPublications, setUserAllPublications] = useState<string[]>([]);
  const [userPublicationsEditor, setUserPublicationsEditor] = useState<
    string[]
  >([]);
  const [userPublicationsWriter, setUserPublicationsWriter] = useState<
    string[]
  >([]);
  const [userEditorPublicationsDetails, setUserEditorPublicationsDetails] =
    useState<Map<string, PublicationType>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState('');

  //loading
  const [loading, setLoading] = useState(true);
  //mobile management
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const isMobile = () => {
    return screenWidth < 950;
  };

  //menu vars
  const [copyArticle, setCopyArticle] = useState(false);
  const [shownMeatball, setShownMeatball] = useState(false);

  //schedule publish
  const [date, setDate] = useState<Date | null>(new Date());
  const [time, setTime] = useState({ hours: new Date().getHours().toString().padStart(2, '0'), minutes: new Date().getMinutes().toString().padStart(2, '0') });
  const [access, setAccess] = useState<{ value: string, label: string }>({ value: 'public', label: 'Public' });

  const handleDateChange = (newDate: Date | null) => {
    setDate(newDate);
  };

  const handleTimeChange = (newTime: { hours: string, minutes: string }) => {
    setTime(newTime);
  };

  const handleAccessChange = (newAccess: { value: string, label: string }) => {
    setAccess(newAccess);
  };

  const handleScheduledPublishDate = (): [] | [bigint] => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(parseInt(time.hours, 10));
      newDate.setMinutes(parseInt(time.minutes, 10));

      const currentDate = new Date();
      if (newDate <= currentDate) {
        return [];
      }

      const milliseconds = BigInt(newDate.getTime());
      return [milliseconds];
    }
    return [];
  };

  useEffect(() => {
    if (lastSavedPost) {
      setAccess({ value: lastSavedPost.isMembersOnly ? 'members-only' : 'public', label: lastSavedPost.isMembersOnly ? 'Members Only' : 'Public' });
      handleAccessChange({ value: lastSavedPost.isMembersOnly ? 'members-only' : 'public', label: lastSavedPost.isMembersOnly ? 'Members Only' : 'Public' });
    }
  }, [lastSavedPost]);


  //set post fields
  const setIsDraft = (isDraft: boolean) => {
    setSavingPost({ ...savingPost, isDraft: isDraft });
  };

  const onPostTitleChange = (value: string) => {
    setTitleWarning(false);
    setSavingPost({ ...savingPost, title: value });
  };

  const onPostSubTitleChange = (value: string) => {
    setIntroWarning(false);
    setSavingPost({ ...savingPost, subtitle: value });
  };

  const onPostTextChange = (html: string, text: string, isEmpty: boolean) => {
    setBodyWarning(false);
    setPostHtml(isEmpty ? '' : html);
  };
  const onPostTagChange = (value: string[]) => {
    let usingTags: { tagId: string; tagName: string }[] = [];
    allTags?.forEach((tag: TagModel) => {
      value.forEach((tagName) => {
        if (tag.value === tagName) {
          usingTags.push({ tagId: tag.id, tagName });
        }
      });
    });
    if (value.length !== 0) {
      setTagsWarning(false);
    }
    setSavingPost({ ...savingPost, tags: usingTags });
  };
  //handle selection menu
  const [selectedHandle, setSelectedHandle] = useState('');

  //refs for each input field
  const tagsRef = useRef<any>(null);
  const titleRef = useRef<any>(null);
  const introRef = useRef<any>(null);
  const bodyRef = useRef<any>(null);

  //warning variables for each input field
  const [titleWarning, setTitleWarning] = useState(false);
  const [introWarning, setIntroWarning] = useState(false);
  const [bodyWarning, setBodyWarning] = useState(false);
  const [tagsWarning, setTagsWarning] = useState(false);

  //uploading header image

  const onPostImageChange = (e: any) => {
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
      setSavingPost({ ...savingPost, headerImage: dataUrlCompressed });
    };
  };

  useEffect(() => {
    setCurrentStatus(getCurrentStatus());
    console.log('Current status:', getCurrentStatus());
  }, [lastSavedPost]);

  //save functions

  const toastErrors = () => {
    if (savingPost.title === '') {
      toastError('Title field cannot be empty!');
      setTimeout(() => {
        window.scrollTo(0, titleRef.current.offsetTop);
      }, 200);

      return;
    }
    if (savingPost.subtitle === '') {
      toastError('Introduction field cannot be empty!');
      setTimeout(() => {
        window.scrollTo(0, introRef.current.offsetTop);
      }, 200);
      return;
    }
    if (postHtml === '') {
      toastError('Body field cannot be empty!');
      setTimeout(() => {
        window.scrollTo(0, bodyRef.current.offsetTop);
      }, 200);
      return;
    }
    if (savingPost.tags.length === 0) {
      toastError('Tags field cannot be empty!');
      setTimeout(() => {
        window.scrollTo(0, tagsRef.current.offsetTop);
      }, 200);
      return;
    }
  };

  const validate = () => {
    toastErrors();
    if (savingPost.title === '') {
      setTitleWarning(true);
    }
    if (savingPost.subtitle === '') {
      setIntroWarning(true);
    }
    if (postHtml === '') {
      setBodyWarning(true);
    }
    if (savingPost.tags.length === 0) {
      setTagsWarning(true);
    }

    return (
      savingPost.title !== '' &&
      savingPost.subtitle !== '' &&
      postHtml !== '' &&
      savingPost.tags.length !== 0
    );
  };

  //will be used for regular posts and publication posts
  const onSave = async (
    isDraft: boolean,
    notNavigate?: boolean,
    premium?: CreatePremiumArticleData
  ) => {
    if (!validate()) {
      return;
    }
    //firstly conver the images to urls
    const result = await convertImagesToUrls(postHtml, savingPost.headerImage);
    const contentWithUrls = result?.contentWithUrls;
    const headerUrl = result?.headerUrl;

    if (lastSavedPost) {
      //edit article
      let isPublication = user?.handle !== selectedHandle;
      let wasPublication = user?.handle !== lastSavedPost.handle;
      if (isPublication) {
        if (wasPublication) {
          //the post was a publication post and it's still a publication post -> just call savePublicationPost

          let savePublicationResult = await savePublicationPost({
            title: savingPost.title,
            creatorHandle: savingPost.creatorHandle || user?.handle || '',
            content: contentWithUrls || postHtml,
            premium: premium ? [premium] : [],
            isDraft: isDraft,
            tagIds: savingPost.tags.map((tag) => {
              return tag.tagId;
            }),
            category: selectedCategory,
            headerImage: headerUrl || '',
            subtitle: savingPost.subtitle,
            isPublication: true,
            postId: savingPost.postId,
            handle: lastSavedPost.handle,
            isMembersOnly: access.value === 'members-only',
            scheduledPublishedDate: handleScheduledPublishDate() || []
          });
          if (savePublicationResult) {
            setSavingPost(savePublicationResult);
            setLastSavedPost(savePublicationResult);
            setPostHtml(savePublicationResult.content);
            setRadioButtonIndex(savePublicationResult.isDraft ? 0 : 1);
            return savePublicationResult;
          }
        } else {
          //the post was a regular post. now it needs to be migrated to a publication
          let migratePostResult = await migratePostToPublication(
            lastSavedPost.postId,
            selectedHandle,
            isDraft
          );
          if (migratePostResult) {
            setSavingPost(migratePostResult);
            setLastSavedPost(migratePostResult);
            setPostHtml(migratePostResult.content);
            setRadioButtonIndex(migratePostResult.isDraft ? 0 : 1);
            navigate('/article/edit/' + migratePostResult.postId, {
              replace: true,
            });
            return migratePostResult;
          }
        }
      } else {
        if (wasPublication) {
          //not possible to reach here
        } else {
          //just a regular post edit -> call savePost
          let saveResult = await savePost({
            title: savingPost.title,
            creatorHandle: savingPost.creatorHandle || '',
            content: contentWithUrls || postHtml,
            premium: premium ? [premium] : [],
            isDraft: isDraft,
            tagIds: savingPost.tags.map((tag) => {
              return tag.tagId;
            }),
            category: selectedCategory,
            headerImage: headerUrl || '',
            subtitle: savingPost.subtitle,
            isPublication: false,
            postId: savingPost.postId,
            handle: lastSavedPost.handle,
            isMembersOnly: access.value === 'members-only',
            scheduledPublishedDate: handleScheduledPublishDate() || []
          });
          if (saveResult) {
            setSavingPost(saveResult);
            setLastSavedPost(saveResult);
            setPostHtml(saveResult.content);
            setRadioButtonIndex(saveResult.isDraft ? 0 : 1);
            return saveResult;
          }
        }
      }
    } else {
      //new article
      let isPublication = user?.handle !== selectedHandle;
      if (isPublication) {

        //create a publication post
        let savePublicationResult = await savePublicationPost({
          title: savingPost.title,
          creatorHandle: user?.handle || '',
          content: contentWithUrls || postHtml,
          premium: premium ? [premium] : [],
          isDraft: isDraft,
          tagIds: savingPost.tags.map((tag) => {
            return tag.tagId;
          }),
          category: selectedCategory,
          headerImage: headerUrl || '',
          subtitle: savingPost.subtitle,
          isPublication: true,
          postId: savingPost.postId,
          handle: selectedHandle,
          isMembersOnly: access.value === 'members-only',
          scheduledPublishedDate: handleScheduledPublishDate() || []
        });
        if (savePublicationResult) {
          setSavingPost(savePublicationResult);
          setLastSavedPost(savePublicationResult);
          setPostHtml(savePublicationResult.content);
          setRadioButtonIndex(savePublicationResult.isDraft ? 0 : 1);
          navigate('/article/edit/' + savePublicationResult.postId, {
            replace: true,
          });
          return savePublicationResult;
        }
      } else {
        //create a regular post
        //just a regular post edit -> call savePost
        let saveResult = await savePost({
          title: savingPost.title,
          creatorHandle: '',
          content: contentWithUrls || postHtml,
          premium: premium ? [premium] : [],
          isDraft: isDraft,
          tagIds: savingPost.tags.map((tag) => {
            return tag.tagId;
          }),
          category: selectedCategory,
          headerImage: headerUrl || '',
          subtitle: savingPost.subtitle,
          isPublication: false,
          postId: savingPost.postId,
          handle: selectedHandle,
          isMembersOnly: access.value === 'members-only',
          scheduledPublishedDate: handleScheduledPublishDate() || []
        });
        if (saveResult) {
          setSavingPost(saveResult);
          setLastSavedPost(saveResult);
          setPostHtml(saveResult.content);
          setRadioButtonIndex(saveResult.isDraft ? 0 : 1);
          //navigate to the /article/edit/<post-id>
          if (!notNavigate) {
            navigate('/article/edit/' + saveResult.postId, { replace: true });
          }

          return saveResult;
        }
      }
    }
  };

  const [hasValidSubscriptionOptions, setHasValidSubscriptionOptions] = useState<boolean>(false);
  //get subscription details
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (user) {
        try {
          let handle = user.handle === selectedHandle ? user.handle : selectedHandle;
          let principal = await getPrincipalByHandle(handle);
          let subscriptionDetails = await getWriterSubscriptionDetailsByPrincipalId(principal || '');
          console.log("debugging " + selectedHandle + " principal " + principal);

          if (subscriptionDetails && (
            subscriptionDetails.weeklyFee.length > 0 ||
            subscriptionDetails.monthlyFee.length > 0 ||
            subscriptionDetails.annuallyFee.length > 0 ||
            subscriptionDetails.lifeTimeFee.length > 0
          )) {
            setHasValidSubscriptionOptions(true);
            console.log('Valid subscription options', subscriptionDetails);
          } else {
            setHasValidSubscriptionOptions(false);
            console.log('No valid subscription options', subscriptionDetails);
          }
        } catch (error) {
          console.log('Error fetching subscription details', error);
        }
      }
    };

    fetchSubscriptionDetails();
  }, [user, selectedHandle]);


  const [radioButtonIndex, setRadioButtonIndex] = useState(
    lastSavedPost ? (lastSavedPost.isDraft ? 0 : 1) : 0
  );

  const getRadioButtonItems = (): JSX.Element[] => {
    if (isPublishAsPremiumVisible()) {
      if (isPublishButtonVisible()) {
        return [
          <div
            className={
              darkTheme ? 'radio-button-text-dark-mode' : 'radio-button-text'
            }
          >
            Save as draft under{' '}
            <span className={darkTheme ? 'lighter' : 'darker'}>
              @{selectedHandle}
            </span>
          </div>,
          <div
            className={
              darkTheme ? 'radio-button-text-dark-mode' : 'radio-button-text'
            }
          >
            Publish this article under{' '}
            <span className={darkTheme ? 'lighter' : 'darker'}>
              @{selectedHandle}
            </span>
          </div>,

          <div
            className={
              darkTheme ? 'radio-button-text-dark-mode' : 'radio-button-text'
            }
          >
            Publish and mint as an NFT gated limited edition article.
            <br /> <br /> You can then no longer edit this article or un-publish
            it....ever.
          </div>,
        ];
      } else {
        //not possible
        return [];
      }
    } else {
      if (isPublishButtonVisible()) {
        return [
          <div
            className={
              darkTheme ? 'radio-button-text-dark-mode' : 'radio-button-text'
            }
          >
            Save as draft under{' '}
            <span className={darkTheme ? 'lighter' : 'darker'}>
              @{selectedHandle}
            </span>
          </div>,
          <div
            className={
              darkTheme ? 'radio-button-text-dark-mode' : 'radio-button-text'
            }
          >
            Publish this article under{' '}
            <span className={darkTheme ? 'lighter' : 'darker'}>
              @{selectedHandle}
            </span>
          </div>,
        ];
      } else {
        //Only for writers in publications
        //nothing here
        return [];
      }
    }
  };
  const getManageItems = () => {
    if (lastSavedPost) {
      if (lastSavedPost.isDraft) {
        if (lastSavedPost.isPublication) {
          //saved post -> draft publication post
          //two possibilities to be here
          if (userPublicationsWriter.includes(lastSavedPost.handle)) {
            //user(writer) submitted the post for review
            //no action here. Just display that this post is submitted
            return (
              <div className='edit-article-left-manage-content-wrapper'>
                <div className={darkTheme ? 'text-dark-mode' : 'text'}>
                  This article is submitted to a publication:{' '}
                  <span className={darkTheme ? 'text-lighter' : 'text-darker'}>
                    @{lastSavedPost.handle}
                  </span>
                </div>
                <div className='horizontal-divider' />
                <div className='text'>
                  An editor manages the article there. You cannot edit this
                  article anymore.
                </div>
              </div>
            );
          } else if (userPublicationsEditor.includes(lastSavedPost.handle)) {
            //user is an editor
            //radio buttons are rendered. Just display the button according to the radioButtonIndex var
            switch (radioButtonIndex) {
              case 0:
                return (
                  <Button
                    type='button'
                    styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={async () => {
                      setLoading(true);
                      await onSave(true);
                      setLoading(false);
                    }}
                    dark={darkTheme}
                  >
                    Save as Draft
                  </Button>
                );
              case 1:
                return (
                  <Button
                    type='button'
                    styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={async () => {
                      setLoading(true);
                      await onSave(false);
                      setLoading(false);
                    }}
                    dark={darkTheme}
                  >
                    Publish
                  </Button>
                );
              case 2:
                return (
                  <Button
                    type='button'
                    styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={() => {
                      let validationResult = validate();
                      if (!validationResult || savingPost.headerImage === '') {
                        if (validationResult) {
                          toastError(
                            'You need to add an header image to mint an article.'
                          );
                        }
                        return;
                      }
                      modalContext?.openModal('Premium article', {
                        premiumPostNumberOfEditors:
                          userEditorPublicationsDetails.get(selectedHandle)
                            ?.editors.length || 1,
                        premiumPostData: savingPost,
                        premiumPostOnSave: async (
                          maxSupply: bigint,
                          icpPrice: bigint,
                          thumbnail: string
                        ) => {
                          await onSave(false, true, {
                            thumbnail,
                            icpPrice,
                            maxSupply,
                          });
                        },
                        premiumPostRefreshPost: firstLoad,
                      });
                    }}
                  >
                    <img src={icons.NFT_LOCK_ICON} className='NFT-icon'></img>
                    Publish as premium
                  </Button>
                );
            }
          }
        } else {
          //saved post -> regular user post (draft)

          if (selectedHandle === user?.handle) {
            //dropdown uses the regular handle

            switch (radioButtonIndex) {
              case 0:
                return (
                  <Button
                    type='button'
                    styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={async () => {
                      setLoading(true);
                      await onSave(true);
                      setLoading(false);
                    }}
                    dark={darkTheme}
                  >
                    Save as Draft
                  </Button>
                );
              case 1:
                return (
                  <Button
                    type='button'
                    styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={async () => {
                      setLoading(true);
                      await onSave(false);
                      setLoading(false);
                    }}
                    dark={darkTheme}
                  >
                    Publish
                  </Button>
                );
                break;
            }
          } else if (userPublicationsWriter.includes(selectedHandle)) {
            //post is saved as draft under the writer
            //writer can only submit this post to the publication
            return (
              <div className='edit-article-left-manage-content-wrapper'>
                <div className='text'>
                  Submit this article for review in a publication. An editor
                  will manage the article there.
                </div>
                <Button
                  type='button'
                  styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                  style={{ width: '100%', marginTop: '20px' }}
                  onClick={async () => {
                    setLoading(true);
                    let response = await onSave(true);
                    setLoading(false);
                    if (
                      response &&
                      userPublicationsWriter.includes(response.handle)
                    ) {
                      toast(
                        `Your article is submitted for review in @${response.handle}!`,
                        ToastType.Plain
                      );
                    }
                  }}
                  dark={darkTheme}
                >
                  Submit to publication
                </Button>
              </div>
            );
          } else if (userPublicationsEditor.includes(selectedHandle)) {
            //user is an editor
            //radio buttons are rendered. Just display the button according to the radioButtonIndex var
            switch (radioButtonIndex) {
              case 0:
                return (
                  <Button
                    type='button'
                    styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={async () => {
                      setLoading(true);
                      await onSave(true);
                      setLoading(false);
                    }}
                    dark={darkTheme}
                  >
                    Save as Draft
                  </Button>
                );
              case 1:
                return (
                  <Button
                    type='button'
                    styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={async () => {
                      setLoading(true);
                      await onSave(false);
                      setLoading(false);
                    }}
                    dark={darkTheme}
                  >
                    Publish
                  </Button>
                );
              case 2:
                return (
                  <Button
                    type='button'
                    styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={() => {
                      let validationResult = validate();
                      if (!validationResult || savingPost.headerImage === '') {
                        if (validationResult) {
                          toastError(
                            'You need to add an header image to mint an article.'
                          );
                        }
                        return;
                      }
                      modalContext?.openModal('Premium article', {
                        premiumPostNumberOfEditors:
                          userEditorPublicationsDetails.get(selectedHandle)
                            ?.editors.length || 1,
                        premiumPostData: savingPost,
                        premiumPostOnSave: async (
                          maxSupply: bigint,
                          icpPrice: bigint,
                          thumbnail: string
                        ) => {
                          await onSave(false, true, {
                            thumbnail,
                            icpPrice,
                            maxSupply,
                          });
                        },
                        premiumPostRefreshPost: firstLoad,
                      });
                    }}
                  >
                    <img src={icons.NFT_LOCK_ICON} className='NFT-icon'></img>
                    Publish as premium
                  </Button>
                );
            }
          }
        }
      } else {
        //there is a published post
        if (lastSavedPost.isPublication) {
          //published publication post
          if (lastSavedPost.isPremium) {
            //post is premium
            //it doesn't matter if the user is editor or writer
            //display the generic info
            return (
              <div className='edit-article-left-manage-content-wrapper'>
                <div className={darkTheme ? 'text-dark-mode' : 'text'}>
                  This article is minted and published to the publication:{' '}
                  <br />
                  <span className={darkTheme ? 'text-lighter' : 'text-darker'}>
                    @{lastSavedPost.handle}
                  </span>
                </div>
                <div className={darkTheme ? 'text-dark-mode' : 'text'}>
                  You can not edit this article anymore.
                </div>
                <div className='horizontal-divider' />
                <PremiumArticleOwners
                  owners={ownersOfPremiumArticle}
                  dark={darkTheme}
                />
                <div className={darkTheme ? 'text-dark-mode' : 'text'}>
                  NFT keys are created that people need to buy to access this
                  article.
                </div>

                <div
                  onClick={() => {
                    window.open(
                      'https://wiki.nuance.xyz/nuance/how-do-premium-articles-work',
                      '_blank'
                    );
                  }}
                  className={
                    darkTheme
                      ? 'external-url-text-dark-mode'
                      : 'external-url-text'
                  }
                >
                  More on NFT keys
                </div>
              </div>
            );
          } else {
            //published publication post
            if (userPublicationsWriter.includes(lastSavedPost.handle)) {
              //user is a writer
              //no action permission, just display the info
              return (
                <div className='edit-article-left-manage-content-wrapper'>
                  <div className={darkTheme ? 'text-dark-mode' : 'text'}>
                    This article is submitted to a publication:{' '}
                    <span
                      className={darkTheme ? 'text-lighter' : 'text-darker'}
                    >
                      @{lastSavedPost.handle}
                    </span>
                  </div>
                  <div className='horizontal-divider' />
                  <div className='text'>
                    An editor manages the article there. You cannot edit this
                    article anymore.
                  </div>
                </div>
              );
            } else if (userPublicationsEditor.includes(lastSavedPost.handle)) {
              //user is an editor
              return (
                <div className='edit-article-left-manage-content-wrapper'>
                  <div className={darkTheme ? 'text-dark-mode' : 'text'}>
                    Unpublish from{' '}
                    <span
                      className={darkTheme ? 'text-lighter' : 'text-darker'}
                    >
                      @{lastSavedPost.handle}
                    </span>
                  </div>
                  <Button
                    type='button'
                    styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={async () => {
                      setLoading(true);
                      await onSave(true);
                      setLoading(false);
                    }}
                    dark={darkTheme}
                  >
                    Unpublish
                  </Button>
                </div>
              );
            }
          }
        } else {
          //published, regular post
          //user is the owner, just display the unpublish button and text

          return (
            <div className='edit-article-left-manage-content-wrapper'>
              <div className={darkTheme ? 'text-dark-mode' : 'text'}>
                Unpublish from{' '}
                <span className={darkTheme ? 'text-lighter' : 'text-darker'}>
                  @{lastSavedPost.handle}
                </span>
              </div>
              <Button
                type='button'
                styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                style={{ width: '100%', marginTop: '20px' }}
                onClick={async () => {
                  setLoading(true);
                  await onSave(true);
                  setLoading(false);
                }}
                dark={darkTheme}
              >
                Unpublish
              </Button>
            </div>
          );
        }
      }
    } else {
      if (userPublicationsWriter.includes(selectedHandle)) {
        //there is no saved post
        //user wants to submit it to a publication (user is a writer in the selected publication)
        return (
          <div className='edit-article-left-manage-content-wrapper'>
            <div className='text'>
              Submit this article for review in a publication. An editor will
              manage the article there.
            </div>
            <Button
              type='button'
              styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
              style={{ width: '100%', marginTop: '20px' }}
              onClick={async () => {
                setLoading(true);
                let response = await onSave(true);
                setLoading(false);
                if (
                  response &&
                  userPublicationsWriter.includes(response.handle)
                ) {
                  toast(
                    `Your article is submitted for review in @${response.handle}!`,
                    ToastType.Plain
                  );
                }
              }}
              dark={darkTheme}
            >
              Submit to publication
            </Button>
          </div>
        );
      } else if (userPublicationsEditor.includes(selectedHandle)) {
        //there is no saved post
        //user is an editor in the selected publication
        switch (radioButtonIndex) {
          case 0:
            return (
              <Button
                type='button'
                styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                style={{ width: '100%', marginTop: '20px' }}
                onClick={async () => {
                  setLoading(true);
                  await onSave(true);
                  setLoading(false);
                }}
                dark={darkTheme}
              >
                Save as Draft
              </Button>
            );
          case 1:
            return (
              <Button
                type='button'
                styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                style={{ width: '100%', marginTop: '20px' }}
                onClick={async () => {
                  setLoading(true);
                  await onSave(false);
                  setLoading(false);
                }}
                dark={darkTheme}
              >
                Publish
              </Button>
            );
          case 2:
            return (
              <Button
                type='button'
                styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                style={{ width: '100%', marginTop: '20px' }}
                onClick={() => {
                  let validationResult = validate();
                  if (!validationResult || savingPost.headerImage === '') {
                    if (validationResult) {
                      toastError(
                        'You need to add an header image to mint an article.'
                      );
                    }
                    return;
                  }
                  modalContext?.openModal('Premium article', {
                    premiumPostNumberOfEditors:
                      userEditorPublicationsDetails.get(selectedHandle)?.editors
                        .length || 1,
                    premiumPostData: savingPost,
                    premiumPostOnSave: async (
                      maxSupply: bigint,
                      icpPrice: bigint,
                      thumbnail: string
                    ) => {
                      await onSave(false, true, {
                        thumbnail,
                        icpPrice,
                        maxSupply,
                      });
                    },
                    premiumPostRefreshPost: firstLoad,
                  });
                }}
              >
                <img src={icons.NFT_LOCK_ICON} className='NFT-icon'></img>
                Publish as premium
              </Button>
            );
        }
      } else {
        //there is no saved post
        //user selected his/her own handle
        switch (radioButtonIndex) {
          case 0:
            return (
              <Button
                type='button'
                styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                style={{ width: '100%', marginTop: '20px' }}
                onClick={async () => {
                  setLoading(true);
                  await onSave(true);
                  setLoading(false);
                }}
                dark={darkTheme}
              >
                Save as Draft
              </Button>
            );
          case 1:
            return (
              <Button
                type='button'
                styleType={darkTheme ? 'edit-article-dark' : 'edit-article'}
                style={{ width: '100%', marginTop: '20px' }}
                onClick={async () => {
                  setLoading(true);
                  await onSave(false);
                  setLoading(false);
                }}
                dark={darkTheme}
              >
                Publish
              </Button>
            );
        }
      }
    }
  };

  const getDropdownItems = () => {
    if (lastSavedPost) {
      if (lastSavedPost.isDraft) {
        if (lastSavedPost.isPublication) {
          return ['@' + lastSavedPost.handle];
        } else {
          return [
            '@' + user?.handle,
            ...userAllPublications.map((v) => '@' + v),
          ];
        }
      } else {
        return ['@' + lastSavedPost.handle];
      }
    } else {
      return ['@' + user?.handle, ...userAllPublications.map((v) => '@' + v)];
    }
  };

  const getDropdownIcons = () => {
    if (lastSavedPost) {
      if (lastSavedPost.isDraft) {
        if (lastSavedPost.isPublication) {
          return [icons.PUBLICATION_ICON];
        } else {
          return [
            darkTheme ? icons.PROFILE_ICON_DARK : icons.PROFILE_ICON,
            ...userAllPublications.map((v) => icons.PUBLICATION_ICON),
          ];
        }
      } else {
        return [
          lastSavedPost.isPublication
            ? icons.PUBLICATION_ICON
            : darkTheme
              ? icons.PROFILE_ICON_DARK
              : icons.PROFILE_ICON,
        ];
      }
    } else {
      return [
        darkTheme ? icons.PROFILE_ICON_DARK : icons.PROFILE_ICON,
        ...userAllPublications.map((v) => icons.PUBLICATION_ICON),
      ];
    }
  };

  const isEditAllowed = () => {
    if (lastSavedPost) {
      if (lastSavedPost.isDraft) {
        //post is draft
        if (lastSavedPost.isPublication) {
          //draft and publication post
          if (userPublicationsEditor.includes(lastSavedPost.handle)) {
            //draft publication post but user is an editor
            //allowed
            return true;
          }
          //user is not the editor
          return false;
        } else {
          //regular draft post
          //user is allowed to edit
          return true;
        }
      } else {
        //post is published
        //edit is not allowed before unpublishing it
        return false;
      }
    } else {
      //there is no existing post
      //edit is allowed
      return true;
    }
  };

  const getCategoriesIfExists = () => {
    let publicationDetails = userEditorPublicationsDetails.get(selectedHandle);
    if (publicationDetails) {
      return [
        '/',
        ...publicationDetails.categories.map((category) => '/' + category),
      ];
    }
  };

  return (
    <div className='edit-article-wrapper' style={darkOptionsAndColors}>
      <Header
        loggedIn={isLoggedIn}
        isArticlePage={true}
        ScreenWidth={screenWidth}
        isPublicationPage={false}
        isUserAdminScreen={true}
      />
      <div className='edit-article-content-wrapper'>
        <div className='edit-article-left'>
          <p className='edit-article-left-date'>
            {formatDate(
              lastSavedPost?.modified || new Date().getTime().toString(),
              DateFormat.NoYear
            )}
          </p>
          {!loading && (
            <div className='edit-article-left-manage-wrapper'>
              <div className='edit-article-horizontal-divider' />
              <div className='edit-article-left-info-list-wrapper'>
                <div className='edit-article-left-info-list-item'>
                  <div>Current status</div>
                  <Badge status={getCurrentStatus()} dark={darkTheme} />
                </div>
                <div className='edit-article-left-info-list-item'>
                  <div>Last modified</div>
                  {formatDate(
                    lastSavedPost?.modified || new Date().getTime().toString(),
                    DateFormat.WithYear
                  )}
                </div>
                {lastSavedPost && (
                  <div className='edit-article-left-info-list-item'>
                    <div>Location</div>
                    {'@' + lastSavedPost.handle}
                  </div>
                )}
                {lastSavedPost?.isPublication && (
                  <div className='edit-article-left-info-list-item'>
                    <div>Category</div>
                    {'/' + lastSavedPost.category}
                  </div>
                )}
              </div>
              <div
                className='edit-article-left-manage-location-wrapper'
                style={
                  darkTheme
                    ? {
                      background: colors.darkModePrimaryBackgroundColor,
                      border: '1px solid rgb(153, 153, 153)',
                    }
                    : {}
                }
              >
                {(lastSavedPost?.isDraft || !lastSavedPost) && (
                  <div className='edit-article-left-location-wrapper'>
                    <div className='edit-article-left-location-title'>
                      LOCATION
                    </div>
                    <Dropdown
                      uniqueId={'edit-article-location-dropdown-menu'}
                      style={{ height: '30px' }}
                      selectedTextStyle={{
                        fontWeight: '400',
                        fontSize: '14px',
                      }}
                      icons={getDropdownIcons()}
                      drodownItemsWrapperStyle={{ top: '32px' }}
                      items={getDropdownItems()}
                      arrowWidth={12}
                      imageStyle={{ width: '20px', height: '20px' }}
                      dropdownMenuItemStyle={{ fontSize: '12px' }}
                      onSelect={(item) => {
                        setSelectedHandle(item.slice(1));
                        if (lastSavedPost?.category) {
                          setSelectedCategory(lastSavedPost.category);
                        } else {
                          setSelectedCategory('');
                        }
                        setRadioButtonIndex(
                          lastSavedPost
                            ? lastSavedPost.isDraft ||
                              lastSavedPost.handle !== item.slice(1)
                              ? 0
                              : 1
                            : 0
                        );
                      }}
                      notActiveIfOnlyOneItem={true}
                    />
                  </div>
                )}
                {getCategoriesIfExists() &&
                  (lastSavedPost?.isDraft || !lastSavedPost) && (
                    <div className='edit-article-left-location-wrapper'>
                      <div className='edit-article-left-location-title'>
                        CATEGORY
                      </div>
                      <Dropdown
                        uniqueId={'edit-article-category-dropdown-menu'}
                        selected={'/' + selectedCategory}
                        style={{ height: '30px' }}
                        selectedTextStyle={{
                          fontWeight: '400',
                          fontSize: '14px',
                        }}
                        drodownItemsWrapperStyle={{ top: '32px' }}
                        items={getCategoriesIfExists() as string[]}
                        arrowWidth={12}
                        dropdownMenuItemStyle={{
                          fontSize: '12px',
                          height: '20px',
                        }}
                        onSelect={(item) => {
                          setSelectedCategory(item.slice(1));
                        }}
                        notActiveIfOnlyOneItem={false}
                      />
                    </div>
                  )}
                <div className='edit-article-left-manage-wrapper'>
                  <div className='edit-article-left-manage-title'>MANAGE</div>
                  {(getCurrentStatus() === 'Draft' ||
                    getCurrentStatus() === 'Not saved') && (
                      <RadioButtons
                        items={getRadioButtonItems()}
                        onSelect={(index) => {
                          setRadioButtonIndex(index);
                        }}
                        selectedIndex={radioButtonIndex}
                      />
                    )}
                  {(currentStatus === 'Draft' || currentStatus === 'Not saved') && (
                    <div className='schedule-publish-container'>
                      <SchedulePublish
                        onDateChange={handleDateChange}
                        onTimeChange={handleTimeChange}
                        onAccessChange={handleAccessChange}
                        initialAccess={access}
                        isPremium={radioButtonIndex === 2 || lastSavedPost?.isPremium}
                        validSubscriptionOptions={hasValidSubscriptionOptions}
                      />
                    </div>
                  )
                  }
                  {getManageItems()}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className='vertical-divider' />
        <div className='edit-article-right'>
          {loading ? (
            <Loader />
          ) : (
            <div className='edit-article-right-content'>
              {/* if the post is premium, act like the read-article screen. if not, simply show the input fields */}
              {isEditAllowed() ? (

                <EditArticleInputFields
                  isMobile={isMobile()}
                  lastSavedPost={lastSavedPost}
                  membersOnly={access.value === 'members-only' && radioButtonIndex != 2}
                  savingPost={savingPost}
                  postHtml={postHtml}
                  darkTheme={darkTheme}
                  titleRef={titleRef}
                  bodyRef={bodyRef}
                  introRef={introRef}
                  tagsRef={tagsRef}
                  titleWarning={titleWarning}
                  introWarning={introWarning}
                  bodyWarning={bodyWarning}
                  tagsWarning={tagsWarning}
                  onPostTitleChange={onPostTitleChange}
                  onPostTextChange={onPostTextChange}
                  onPostSubTitleChange={onPostSubTitleChange}
                  onPostImageChange={onPostImageChange}
                  getTagNames={getTagNames}
                  onPostTagChange={onPostTagChange}
                  allTags={allTags}
                />
              ) : lastSavedPost ? (
                <StaticArticleView post={lastSavedPost} />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEditArticle;
