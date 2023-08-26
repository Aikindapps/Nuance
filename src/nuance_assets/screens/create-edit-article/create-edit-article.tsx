import React, {
  useEffect,
  useState,
  useRef,
} from 'react';
import {
  useAuthStore,
  useUserStore,
  usePostStore,
  usePublisherStore,
} from '../../store';
import Button from '../../UI/Button/Button';
import Footer from '../../components/footer/footer';
import Header from '../../components/header/header';
import UnpublishArticle from '../../UI/unpublish article/unpublish-article';
import Loader from '../../UI/loader/Loader';
//import { PostSaveModel } from '../../services/actorService';
import {
  PostType,
  PremiumArticleOwners as PremiumArticleOwnersObject,
} from '../../types/types';
import { convertImagesToUrls, formatDate } from '../../shared/utils';

import { downscaleImage } from '../../components/quill-text-editor/modules/quill-image-compress/downscaleImage.js';
import { toast, toastError, ToastType } from '../../services/toastService';
import CopyArticle from '../../UI/copy-article/copy-article';
import { useParams, useNavigate } from 'react-router-dom';

import { colors, icons, images } from '../../shared/constants';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import './create-edit-article-screen.scss';
import PremiumArticleOwners from '../../components/premium-article-owners/premium-article-owners';
import { NftArticleView } from '../../components/nft-article-view/NftArticleView';
import { EditArticleInputFields } from '../../components/edit-article-input-fields/edit-article-input-fields';
import { EditArticlePremiumModal } from '../../components/edit-article-premium-modal/edit-article-premium-modal';
import { PublicationDropdownMenu } from '../../components/publication-dropdown-menu/publication-dropdown-menu';
import { ButtonsTextsMobile } from '../../components/buttons-texts-mobile/buttons-texts-mobile';

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

  //postStore
  const {
    getPost,
    getOwnersOfPremiumArticle,
    nftCanistersEntries,
    allTags,
    getAllTags,
    savePost,
    migratePostToPublication,
  } = usePostStore((state) => ({
    getPost: state.getSavedPostReturnOnly,
    getOwnersOfPremiumArticle: state.getOwnersOfPremiumArticleReturnOnly,
    nftCanistersEntries: state.nftCanistersEntries,
    allTags: state.allTags,
    getAllTags: state.getAllTags,
    savePost: state.savePost,
    migratePostToPublication: state.migratePostToPublication,
  }));

  //publisherStore
  const { savePublicationPost } = usePublisherStore((state) => ({
    savePublicationPost: state.savePublicationPost,
  }));

  //userStore
  const { getUser, user } = useUserStore((state) => ({
    getUser: state.getUser,
    user: state.user,
  }));

  //authStore
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  //returns the current status of the post
  const getPostCurrentStatus = () => {
    if (location.pathname === '/article/new') {
      return 'Draft';
    } else {
      if (lastSavedPost?.isDraft) {
        return 'Draft';
      } else {
        if (lastSavedPost?.isPremium) {
          return 'Published as premium';
        } else {
          ('Published');
        }
      }
    }
  };

  const isPublishButtonVisible = () => {
    if (lastSavedPost) {
      if (lastSavedPost.isPremium) {
        //post is premium -> not visible
        return false;
      } else {
        //post is not premium
        if(user?.handle === selectedHandle){
          //regular post -> display the button
          return true
        }
        else{
          //publication post -> display if the user is an editor
          return userPublicationsEditor.includes(selectedHandle)
        }
      }
    } else {
      //last saved post is undefined -> new article screen
      if(user?.handle === selectedHandle){
        //regular post -> display the button
        return true
      }
      else{
        //publication post -> diplay if the user is an editor
        return userPublicationsEditor.includes(selectedHandle)
      }
    }
  };

  const isPublishAsPremiumVisible = () => {
    if (lastSavedPost) {
      //the post has already been saved
      //if it's draft, check the userPublicationsWithNftCanister array, if it's not return false
      if (lastSavedPost.isDraft) {
        return (
          userPublicationsWithNftCanister.includes(selectedHandle) && !loading
        );
      } else {
        return false;
      }
    } else {
      //new article screen
      //just check the userPublicationsWithNftCanister array
      return (
        userPublicationsWithNftCanister.includes(selectedHandle) && !loading
      );
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
      bucketCanisterId: '',
      wordCount: '',
      isPublication: false,
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

  const fillUserRelatedFields = () => {
    if (user) {
      let allPublications: string[] = [];
      let writerPublications: string[] = [];
      let editorPublications: string[] = [];
      let publicationsWithNftCanister: string[] = [];
      let allPublicationsWithNftCanister = nftCanistersEntries.map((entry) => {
        return entry.handle;
      });
      user.publicationsArray.forEach((publicationObject) => {
        allPublications.push(publicationObject.publicationName);
        if (publicationObject.isEditor) {
          editorPublications.push(publicationObject.publicationName);
          if (
            allPublicationsWithNftCanister.includes(
              publicationObject.publicationName
            )
          ) {
            publicationsWithNftCanister.push(publicationObject.publicationName);
          }
        } else {
          writerPublications.push(publicationObject.publicationName);
        }
      });
      setUserAllPublications(allPublications);
      setUserPublicationsWriter(writerPublications);
      setUserPublicationsEditor(editorPublications);
      setUserPublicationsWithNftCanister(publicationsWithNftCanister);
      setSelectedHandle(user.handle);
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
        console.log('fetchPost-> ', post);
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
            }
          }
          //if it's not a premium post, simply put the post to local variable
          else {
            setSavingPost(post);
            setLastSavedPost(post);
            setPostHtml(post.content);
            if (post.isPublication) {
              setSelectedHandle(post.handle);
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
    setLoading(false);
  };

  //first load only
  useEffect(() => {
    console.log('first load useEffect');
    //fetch the post
    fetchPost();
    //refresh the user object
    getUser();
    //fill the user related fields by the user object
    fillUserRelatedFields();
    //get all the tags
    getAllTags();
  }, [location.pathname]);

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

  //premium modal
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

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
  const [userPublicationsWithNftCanister, setUserPublicationsWithNftCanister] =
    useState<string[]>([]);

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
    allTags?.forEach((tag) => {
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

  //save functions

  const toastErrors = () => {
    if (savingPost.title === '') {
      toastError('Title field can not be empty!');
      setTimeout(() => {
        window.scrollTo(0, titleRef.current.offsetTop);
      }, 200);

      return;
    }
    if (savingPost.subtitle === '') {
      toastError('Introduction field can not be empty!');
      setTimeout(() => {
        window.scrollTo(0, introRef.current.offsetTop);
      }, 200);
      return;
    }
    if (postHtml === '') {
      toastError('Body field can not be empty!');
      setTimeout(() => {
        window.scrollTo(0, bodyRef.current.offsetTop);
      }, 200);
      return;
    }
    if (savingPost.tags.length === 0) {
      toastError('Tags field can not be empty!');
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
  const onSave = async (isDraft: boolean, notNavigate?: boolean) => {
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
          let savePublicationResult = await savePublicationPost(
            {
              title: savingPost.title,
              creator: savingPost.creator || user?.handle || '',
              content: contentWithUrls || postHtml,
              isPremium: false,
              isDraft: isDraft,
              tagIds: savingPost.tags.map((tag) => {
                return tag.tagId;
              }),
              category: savingPost.category,
              headerImage: headerUrl || '',
              subtitle: savingPost.subtitle,
              isPublication: true,
              postId: savingPost.postId,
            },
            lastSavedPost.handle
          );
          if (savePublicationResult) {
            setSavingPost(savePublicationResult);
            setLastSavedPost(savePublicationResult);
            setPostHtml(savePublicationResult.content);
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

            //if the user is writer -> toast a success message and navigate to my-profile screen
            if(!notNavigate && userPublicationsWriter.includes(migratePostResult.handle)){
              toast(
                'The post has been submitted to the publication.',
                ToastType.Success
              );
              setTimeout(()=>{
                navigate('/my-profile')
              }, 500)
            }
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
            creator: savingPost.creator || '',
            content: contentWithUrls || postHtml,
            isPremium: false,
            isDraft: isDraft,
            tagIds: savingPost.tags.map((tag) => {
              return tag.tagId;
            }),
            category: savingPost.category,
            headerImage: headerUrl || '',
            subtitle: savingPost.subtitle,
            isPublication: false,
            postId: savingPost.postId,
          });
          if (saveResult) {
            setSavingPost(saveResult);
            setLastSavedPost(saveResult);
            setPostHtml(saveResult.content);
            return saveResult;
          }
        }
      }
    } else {
      //new article
      let isPublication = user?.handle !== selectedHandle;
      if (isPublication) {
        //create a publication post
        let savePublicationResult = await savePublicationPost(
          {
            title: savingPost.title,
            creator: user?.handle || '',
            content: contentWithUrls || postHtml,
            isPremium: false,
            isDraft: isDraft,
            tagIds: savingPost.tags.map((tag) => {
              return tag.tagId;
            }),
            category: savingPost.category,
            headerImage: headerUrl || '',
            subtitle: savingPost.subtitle,
            isPublication: true,
            postId: savingPost.postId,
          },
          selectedHandle
        );
        if (savePublicationResult) {
          setSavingPost(savePublicationResult);
          setLastSavedPost(savePublicationResult);
          setPostHtml(savePublicationResult.content);
          //if the user is writer -> toast a success message and navigate to my-profile screen
          //else if the user is editor -> navigate to edit-article screen
          if(!notNavigate && userPublicationsWriter.includes(savePublicationResult.handle)){
            toast(
              'The post has been submitted to the publication.',
              ToastType.Success
            );
            setTimeout(()=>{
              navigate('/my-profile')
            }, 500)
          }
          else if (!notNavigate) {
            navigate('/article/edit/' + savePublicationResult.postId, {
              replace: true,
            });
          }
          return savePublicationResult;
        }
      } else {
        //create a regular post
        //just a regular post edit -> call savePost
        let saveResult = await savePost({
          title: savingPost.title,
          creator: '',
          content: contentWithUrls || postHtml,
          isPremium: false,
          isDraft: isDraft,
          tagIds: savingPost.tags.map((tag) => {
            return tag.tagId;
          }),
          category: savingPost.category,
          headerImage: headerUrl || '',
          subtitle: savingPost.subtitle,
          isPublication: false,
          postId: savingPost.postId,
        });
        if (saveResult) {
          setSavingPost(saveResult);
          setLastSavedPost(saveResult);
          setPostHtml(saveResult.content);
          //navigate to the /article/edit/<post-id>
          if (!notNavigate) {
            navigate('/article/edit/' + saveResult.postId, { replace: true });
          }

          return saveResult;
        }
      }
    }
  };

  return (
    <div className='edit-article-wrapper' style={darkOptionsAndColors}>
      <Header
        loggedIn={isLoggedIn}
        isArticlePage={true}
        ScreenWidth={screenWidth}
        tokens={user?.nuaTokens}
        loading={false}
        isPublicationPage={false}
        isUserAdminScreen={true}
      />
      {premiumModalOpen && (
        <EditArticlePremiumModal
          refreshPost={async (post) => {
            console.log('refreshPost-> ', post);
            //set the post
            setSavingPost(post);
            setLastSavedPost(post);
            setPostHtml(post.content);
            if (post.isPublication) {
              setSelectedHandle(post.handle);
            }
            setTimeout(async () => {
              if (location.pathname.includes('new')) {
                navigate('/article/edit/' + post.postId, { replace: true });
              } else {
                fetchPost();
              }
            }, 6000);
          }}
          setLoading={setLoading}
          onSave={async (isDraft) => {
            return await onSave(isDraft, true);
          }}
          post={savingPost}
          setPremiumModalOpen={setPremiumModalOpen}
          publicationHandle={selectedHandle}
        />
      )}
      <div className='edit-article-content-wrapper'>
        <div className='edit-article-left'>
          <p className='edit-article-date'>
            {formatDate(
              lastSavedPost?.modified || new Date().getTime().toString()
            )}
          </p>
          <div className='edit-article-menus'>
            {lastSavedPost && (
              <CopyArticle
                url={lastSavedPost.url}
                shown={copyArticle}
                setShown={setCopyArticle}
                dark={darkTheme}
                postId={lastSavedPost.postId}
              />
            )}
            {lastSavedPost &&
              !lastSavedPost.isDraft &&
              !lastSavedPost.isPremium && (
                <UnpublishArticle
                  shown={shownMeatball}
                  setIsDraft={setIsDraft}
                  setShown={setShownMeatball}
                  savePost={async () => {
                    setLoading(true);
                    await onSave(true);
                    setLoading(false);
                  }}
                  dark={darkTheme}
                />
              )}
          </div>
          <div className='edit-article-horizontal-divider' />
          <p className='edit-article-left-text'>
            last modified: {formatDate(lastSavedPost?.modified) || ' - '}
          </p>
          {(location.pathname === '/article/new' || lastSavedPost?.isDraft) && (
            <Button
              disabled={loading}
              type='button'
              styleType='primary-1'
              style={{
                width: '96px',
                margin: '10px 0',
                border: darkTheme ? '1px solid #fff' : 'none',
              }}
              onClick={async () => {
                setLoading(true);
                await onSave(true);
                setLoading(false);
              }}
            >
              {userPublicationsWriter.includes(selectedHandle)
                ? 'Submit'
                : 'Save'}
            </Button>
          )}
          <div className='edit-article-horizontal-divider' />
          <p className='edit-article-left-text'>
            Current status: {getPostCurrentStatus()}
          </p>
          {!lastSavedPost?.isPremium && (
            <PublicationDropdownMenu
              user={user}
              lastSavedPost={lastSavedPost}
              userAllPublications={userAllPublications}
              loading={loading}
              selectedHandle={selectedHandle}
              setSelectedHandle={setSelectedHandle}
            />
          )}
          {isPublishButtonVisible() ? (
            <Button
              disabled={loading}
              type='button'
              styleType={darkTheme ? 'primary-1-dark' : 'primary-1'}
              style={{ width: '96px' }}
              onClick={async () => {
                setLoading(true);
                await onSave(false);
                setLoading(false);
              }}
              dark={darkTheme}
            >
              Publish
            </Button>
          ) : null}
          <div className='edit-article-horizontal-divider' />

          {/* display the owners of the post if it's a premium post */}
          {lastSavedPost?.isPremium ? (
            <PremiumArticleOwners
              owners={ownersOfPremiumArticle}
              dark={darkTheme}
            />
          ) : null}

          {/* Display the publish as premium button if the selected handle is a publication with an nft canister */}
          {isPublishAsPremiumVisible() ? (
            <div className='NFT-field-wrapper'>
              <div className='NFT-left-text-container'>
                <p className='NFT-left-text'>
                  Limit access to this article by selling exclusive NFT keys.
                </p>
                <p className='NFT-left-text'>
                  NOTE: after creating NFT keys you cannot edit the article
                  anymore.
                </p>
              </div>
              <Button
                disabled={false}
                type='button'
                styleType='secondary-NFT'
                style={{ width: '190px' }}
                onClick={() => {
                  setPremiumModalOpen(true);
                }}
              >
                <img src={icons.NFT_LOCK_ICON} className='NFT-icon'></img>
                Publish as premium
              </Button>
            </div>
          ) : null}
        </div>
        <div className='vertical-divider' />
        <div className='edit-article-right'>
          {loading ? (
            <Loader />
          ) : (
            <div className='edit-article-right-content'>
              {/* if the post is premium, act like the read-article screen. if not, simply show the input fields */}
              {lastSavedPost?.isPremium ? (
                <NftArticleView post={lastSavedPost} />
              ) : (
                <EditArticleInputFields
                  isMobile={isMobile()}
                  lastSavedPost={lastSavedPost}
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
              )}
              {/*Left sidebar is gone in mobile,  */}
              {isMobile() ? (
                <ButtonsTextsMobile
                  lastSavedPost={lastSavedPost}
                  user={user}
                  userAllPublications={userAllPublications}
                  userPublicationsWriter={userPublicationsWriter}
                  darkTheme={darkTheme}
                  loading={loading}
                  setLoading={setLoading}
                  selectedHandle={selectedHandle}
                  setSelectedHandle={setSelectedHandle}
                  ownersOfPremiumArticle={ownersOfPremiumArticle}
                  onSave={onSave}
                  getPostCurrentStatus={getPostCurrentStatus}
                  isPublishButtonVisible={isPublishButtonVisible}
                  isPublishAsPremiumVisible={isPublishAsPremiumVisible}
                  setPremiumModalOpen={setPremiumModalOpen}
                />
              ) : null}
              <div className='footer-wrapper'>
                <Footer />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEditArticle;
