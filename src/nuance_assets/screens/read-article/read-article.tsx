import React, { useEffect, useState, useContext, lazy, useRef } from 'react';
import { useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import parse from 'html-react-parser';
const Header = lazy(() => import('../../components/header/header'));
const Footer = lazy(() => import('../../components/footer/footer'));
const ReadArticleSidebar = lazy(() => import('../../UI/read-article-sidebar/read-article-sidebar'));
import CopyArticle from '../../UI/copy-article/copy-article';
import ReportArticle from '../../UI/report-article/report-article';
import {
  useAuthStore,
  usePostStore,
  usePublisherStore,
  useUserStore,
} from '../../store';
import Loader from '../../UI/loader/Loader';
import { formatDate, getIconForSocialChannel } from '../../shared/utils';
import {
  colors,
  images,
  premiumArticlePlaceHolder,
} from '../../shared/constants';
import 'react-quill/dist/quill.snow.css';
import FollowAuthor from '../../components/follow-author/follow-author';
import Button from '../../UI/Button/Button';
import { icons } from '../../shared/constants';
import ClapButton from '../../UI/clap-button/clap-button';
import LoggedOutSidebar from '../../components/logged-out-sidebar/logged-out-sidebar';
import Linkify from 'react-linkify';
import { Context } from '../../contextes/Context';
import {
  MoreFromThisAuthor,
  PostType,
  PublicationStylingObject,
} from '../../types/types';
import PostInformation from '../../components/post-information/post-information';
import EmailOptIn from '../../components/email-opt-in/email-opt-in';
import { useTheme } from '../../contextes/ThemeContext';

import { PremiumArticleInfo } from '../../components/premium-article-info/premium-article-info';
import Comments from '../../components/comments/comments';
import WriteComment from '../../components/comments/write-comments';
import { PostBucket } from 'src/declarations/PostBucket';
import { get } from 'lodash';
import { Tooltip } from 'react-tooltip';
import { Context as ModalContext } from '../../contextes/ModalContext';
import SubscriptionModal from '../../components/subscription-modal/subscription-modal';
import CancelSubscriptionModal from '../../components/cancel-subscription-modal/cancel-subscription-modal';
import CardPublishedArticles from '../../components/card-published-articles/card-published-articles';

const ReadArticle = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [copyArticle, setCopyArticle] = useState(false);
  const [meatBall, setMeatBall] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isToggled, setIsToggled] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [socialUrls, setSocialUrls] = useState<string[]>([]);
  const [modalType, setModalType] = useState('');

  const publicationFeatureIsLive = useContext(Context).publicationFeature;
  const [publicationHandle, setPublicationHandle] = useState('');
  const refEmailOptIn = useRef<HTMLDivElement>(null);

  const nftFeatureIsLive = useContext(Context).nftFeature;

  const navigate = useNavigate();
  const darkTheme = useTheme();
  const { handle, id } = useParams();

  const context = useContext(Context);
  const modalContext = useContext(ModalContext);

  const {
    getPost,
    clearPost,
    clapPost,
    post,
    author,
    loadingError,
    clearWordCount,
    getPostComments,
    comments,
    getMoreFromThisAuthor,
  } = usePostStore((state) => ({
    getPost: state.getPost,
    clearPost: state.clearPost,
    setSearchText: state.setSearchText,
    post: state.post,
    author: state.author,
    loadingError: state.getPostError,
    clapPost: state.clapPost,
    clearSearchBar: state.clearSearchBar,
    isTagScreen: state.isTagScreen,
    clearWordCount: state.clearWordCount,
    getPremiumPostError: state.getPremiumPostError,
    ownedPremiumPosts: state.ownedPremiumPosts,
    getOwnedNfts: state.getOwnedNfts,
    getPostComments: state.getPostComments,
    comments: state.comments,
    saveComment: state.saveComment,
    upVoteComment: state.upVoteComment,
    downVoteComment: state.downVoteComment,
    deleteComment: state.deleteComment,
    getMoreFromThisAuthor: state.getMoreFromThisAuthor,
  }));

  const { user, getUsersByHandlesReturnOnly } = useUserStore((state) => ({
    user: state.user,
    getUsersByHandlesReturnOnly: state.getUsersByHandlesReturnOnly,
    usersByHandles: state.usersByHandles,
  }));

  const { getPublication, publication, clearAll } = usePublisherStore(
    (state) => ({
      getPublication: state.getPublication,
      publication: state.publication,
      clearAll: state.clearAll,
    })
  );
  const { redirect, redirectScreen } = useAuthStore((state) => ({
    redirect: state.redirect,
    redirectScreen: state.redirectScreen,
  }));

  const PlaceholderImage = () => (
    <img
      src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAAAA="
      alt="Placeholder"
      style={{ width: "100%", height: "auto" }}
    />
  );


  const defaultPost: PostType = {
    postId: "loading-post-id",
    handle: "loading-handle",
    title: "...",
    url: "",
    subtitle: "...",
    headerImage: "",
    content: "<p>Loading content...</p>",
    isDraft: false,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    publishedDate: new Date().toISOString(),
    views: "0",
    tags: [],
    claps: "0",
    category: "",
    isPremium: false,
    isMembersOnly: false,
    bucketCanisterId: "default-bucket-canister-id",
    wordCount: "0",
    creatorHandle: "loading-creator-handle",
    creatorPrincipal: "loading-creator-principal",
  };


  const load = () => {
    if (handle && id) {
      if (publication?.publicationHandle !== handle) {
        clearAll();
      }
      setLoading(true);
      const { postId, bucketCanisterId } = separateIds(id);
      getPost(handle, postId, bucketCanisterId);
    }
  };

  const onSubsriptionComplete = () => {
    modalContext?.closeModal();
    load();
  };

  const openSubscriptionModal = async () => {
    setModalType('Subscription');
    modalContext?.openModal('Subscription');
  };

  const openCancelSubscriptionModal = async () => {
    setModalType('cancelSubscription');
    modalContext?.openModal('cancelSubscription');
  };

  const separateIds = (input: string) => {
    let parts = input.split('-');
    let postId = parts[0];
    let bucketCanisterId = parts.slice(1).join('-');
    return { postId, bucketCanisterId };
  };

  const postId = separateIds(id as string).postId;

  const getTitleFromUrl = (url: string) => {
    const segments = new URL(url).pathname.split('/');
    const title = segments.pop() || segments.pop() || '';
    return title;
  };

  const searchTag = (tag: string) => {
    navigate('/?tab=search&tag=' + encodeURIComponent(tag.toUpperCase()));
  };

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const commentId = queryParams.get('comment');

  useEffect(() => {
    const scrollToComment = () => {
      const commentElement = document.getElementById(`comment-${commentId}`);
      if (commentElement) {
        const commentPosition =
          commentElement.getBoundingClientRect().top + window.pageYOffset;

        const margin = 30;
        window.scrollTo({
          top: commentPosition - margin,
          behavior: 'smooth',
        });

        navigate(`${location.pathname}`, { replace: true });
      }
    };
    if (commentId) {
      if (comments && comments.length > 0) {
        scrollToComment();
      } else {
        const retryTimeout = setTimeout(scrollToComment, 500);
        return () => clearTimeout(retryTimeout);
      }
    }
  }, [commentId, comments, navigate, location.pathname]);

  useEffect(() => {
    clearPost();
    clearWordCount();
    window.scrollTo(0, 0);
    const publicationHandleName = publication?.publicationHandle;
    setPublicationHandle(publicationHandleName!);
    load();
    return () => {
      clearPost();
    };
  }, [location.pathname]);

  useEffect(() => {
    setPublicationHandle(publication?.publicationHandle!);
  }, [publication]);

  useEffect(() => {
    if ((post || loadingError) && !loading) {
      // redirect user if the post title does not match current title
      if (post) {
        if (
          getTitleFromUrl(window.location.origin + post.url) !==
          getTitleFromUrl(window.location.href)
        ) {
          window.location.href = post.url;
        }
      }

      setLoading(false);
    }
  }, [post, loadingError]);

  useEffect(() => {
    if (post && !loading) {
      redirect(post?.url);
    }
  }, [post]);

  useEffect(() => {
    if (post?.isMembersOnly && post?.content === '' && isLoggedIn) {
      openSubscriptionModal();
    } else if (post?.isMembersOnly && post?.content === '' && !isLoggedIn) {
      modalContext?.openModal('Login');
    }
  }, [post, user]);

  useEffect(() => {
    if (post) {
      getPostComments(postId, post?.bucketCanisterId);
      getMoreFromThisAuthorAndPublication(post);
    }
  }, [post?.postId]);

  useEffect(() => {
    if (post) {
      if (post.creatorHandle) {
        handleWriterFields(post.creatorHandle);
      }
      if (
        post.isPublication &&
        publication?.publicationHandle !== post.handle
      ) {
        getPublication(post.handle);
      }
      setLoading(false);
    }
  }, [post]);

  const handleWriterFields = async (handle: string) => {
    let response = await getUsersByHandlesReturnOnly([handle]);
    if (response) {
      let writer = response[0];
      setAvatar(writer.avatar);
      setBio(writer.bio);
      if (writer.website === '') {
        setSocialUrls(writer.socialChannelsUrls);
      } else {
        setSocialUrls([writer.website, ...writer.socialChannelsUrls]);
      }
    }
  };

  useEffect(
    (window.onresize = window.onload =
      () => {
        setScreenWidth(window.innerWidth);
      }),
    [context.width]
  );

  const isSidebarToggled = (data: any) => {
    setIsToggled(!isToggled);
  };

  const [postclaps, setPostclaps] = useState('0');
  const [tokenAnimate, setTokenAnimate] = useState(false);
  const [buttoncount, setButtonCount] = useState(0);
  const [mousedown, setMouseDown] = useState(false);
  const [clapDisabled, setClapDisabled] = useState(false);

  const [moreArticles, setMoreArticles] = useState<
    MoreFromThisAuthor | undefined
  >(undefined);

  const getMoreFromThisAuthorAndPublication = async (post: PostType) => {
    let moreArticles = await getMoreFromThisAuthor(post);
    setMoreArticles(moreArticles);
  };

  useEffect(() => {
    if (!user) {
      setClapDisabled(true);
    } else {
      setClapDisabled(
        user.handle == post?.handle || user?.nuaTokens - buttoncount <= 0
      );
    }
  }, [user, post]);

  useEffect(() => {
    if (user)
      setClapDisabled(
        user?.nuaTokens - buttoncount <= 0 || user.handle == post?.handle
      );
  }, [postclaps, user]);

  function nineClaps() {
    for (let i = 0; i < 9; i++) {
      clapPost(post?.postId || '');
    }
  }

  useEffect(() => {
    if (mousedown && user) {
      //single clap
      if (user?.nuaTokens - buttoncount >= 1) {
        setButtonCount((prevCounter) => prevCounter + 1);
        clapPost(post?.postId || '');
        //ovation effect, user must hold button for 2 seconds for 10 claps total
        if (context.width > 768 && user?.nuaTokens - buttoncount > 9) {
          const interval = setInterval(() => {
            nineClaps();
            setButtonCount((prevCounter) => prevCounter + 9);
            setMouseDown(false);
          }, 2000);
          return () => clearInterval(interval);
        }
      }
    }
  }, [mousedown]);

  useEffect(() => {
    setTokenAnimate(true);
    setTimeout(() => {
      setTokenAnimate(false);
    }, 1000);
  }, [buttoncount]);

  useEffect(() => {
    if (post) {
      setPostclaps(post?.claps);
    }
  });

  const getAvatar = () => {
    if (!post?.isPublication) {
      return author?.avatar;
    } else if (avatar !== '') {
      return avatar;
    }
  };

  const getBio = () => {
    if (!post?.isPublication) {
      return author?.bio;
    } else if (bio !== '') {
      return bio;
    }
  };

  const getSocialChannelUrls = () => {
    if (!post?.isPublication) {
      if (author) {
        if (author.website !== '') {
          return [author.website, ...author.socialChannels];
        } else {
          return author.socialChannels;
        }
      } else {
        return [];
      }
    } else {
      return socialUrls;
    }
  };

  const getReadTime = () => {
    if (post?.wordCount) {
      let time = Math.round(parseInt(post?.wordCount) / 250).toString();
      if (time === '0') {
        return '1';
      }
      return time;
    } else {
      return '1';
    }
  };

  //for customizing linkify npm package
  const componentDecorator = (href: any, text: any, key: any) => (
    <a href={href} key={key} target='_blank' rel='noopener noreferrer'>
      {text}
    </a>
  );

  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.primaryTextColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
    tags: darkTheme
      ? colors.darkModeSecondaryButtonColor
      : colors.tagTokenBackGround,
    tagText: darkTheme ? colors.primaryBackgroundColor : colors.tagTextColor,
    secondaryColor: darkTheme
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
  };

  let dashedTitle = post?.title.replace(/\s+/g, '-').toLowerCase();
  let url = `https://nuance.xyz${window.location.pathname}`;

  const postToRender = post || defaultPost;

  return (
    <div style={darkOptionsAndColors} className='read-article-wrapper'>
      <Helmet>
        <link rel='canonical' href={url} />

        {/* HTML Meta Tags */}
        <title>{postToRender.title}</title>
        <meta name='title' content={postToRender.title} />
        <meta name='description' content={postToRender.subtitle}></meta>
        <meta name='author' content={postToRender.handle}></meta>

        {/* Google / Search Engine Tags */}
        <meta itemProp='name' content={postToRender.title} />
        <meta itemProp='description' content={postToRender.subtitle} />
        <meta itemProp='image' content={postToRender.headerImage} />

        {/* Facebook Meta Tags */}
        <meta property='og:title' content={postToRender.title} />
        <meta property='og:description' content={postToRender.subtitle} />
        <meta property='og:url' content={url} />
        <meta property='og:type' content='article' />
        <meta
          property='og:image'
          content={postToRender.headerImage || images.NUANCE_LOGO}
        />

        {/* Twitter Meta Tags */}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={postToRender.title} />
        <meta name='twitter:description' content={postToRender.subtitle} />
        <meta name='twitter:image' content={postToRender.headerImage} />
        <meta name='twitter:creator' content='@nuancedapp' />

        <link
          rel='stylesheet'
          href='/assets/js/highlight/styles/github-dark-dimmed.min.css'
        ></link>
      </Helmet>

      <Header
        loggedIn={isLoggedIn}
        isArticlePage={false}
        isReadArticlePage={true}
        ScreenWidth={context.width}
        isPublicationPage={postToRender.isPublication}
        category={postToRender.category}
        publication={
          publication?.publicationHandle.toLowerCase() !== handle?.toLowerCase()
            ? undefined
            : publication
        }
        postTitle={postToRender.title}
      />

      <div className={`page`}>
        <div className={isToggled ? 'left left-toggled' : 'left'}>
          <p className='date'>
            {formatDate(postToRender.publishedDate) || formatDate(postToRender.created)}{' '}
          </p>
          <div className='left-content'>
            <div className='menus'>
              {postToRender.url && (
                <>
                  <CopyArticle
                    url={postToRender.url}
                    shown={copyArticle}
                    setShown={setCopyArticle}
                    dark={darkTheme}
                    postId={postToRender.postId}
                  />
                  {/* ReportArticle also takes in parameters for edit button since they share a drop down menu*/}
                  <ReportArticle
                    id={postId || ''}
                    handle={author?.handle || ''}
                    url={postToRender.url}
                    shown={meatBall}
                    setShown={setMeatBall}
                    isPremium={postToRender.isPremium}
                    dark={darkTheme}
                  />
                </>
              )}
            </div>
            <div className='horizontal-divider'></div>
            {postToRender && author && (
              <div className='author'>
                <img src={getAvatar() || images.DEFAULT_AVATAR} alt=''></img>
                <Link
                  to={`/user/${postToRender.isPublication ? postToRender.creatorHandle : author.handle
                    }`}
                  className='handle'
                  style={{ color: darkOptionsAndColors.color }}
                >
                  @{postToRender.isPublication ? postToRender.creatorHandle : author.handle}
                </Link>
              </div>
            )}
            <div className='horizontal-divider'></div>
          </div>

          <div className='left-menu'>
            <ReadArticleSidebar
              isSidebarToggle={isSidebarToggled}
              id={id}
              url={postToRender.url || ''}
              handle={postToRender.handle}
              avatar={getAvatar()}
              isPremium={postToRender.isPremium}
              dark={darkTheme}
            />
          </div>
          {
            <>
              <div className='side-bar-clap-button'>
                <div
                  className={
                    tokenAnimate && buttoncount !== 0
                      ? 'clap-count-container'
                      : 'hide'
                  }
                >
                  +{buttoncount}
                </div>
                <ClapButton
                  styleType={darkTheme ? 'clap-button-dark' : 'clap-button'}
                  disabled={loading}
                  dark={darkTheme}
                  type='button'
                  style={{ width: '96px' }}
                  onMouseDown={() => {
                    setMouseDown(true);
                  }}
                  onMouseUp={() => {
                    setMouseDown(false);
                  }}
                  applaudingPost={postToRender}
                />
              </div>
              <div className='publication-email-opt-in' ref={refEmailOptIn}>
                {context.width > 1089 && publicationHandle == 'FastBlocks' ? (
                  <EmailOptIn
                    mobile={context.width < 1089}
                    publictionHandle={publicationHandle}
                  />
                ) : null}
              </div>
            </>
          }
          {!user && context.width > 768 ? (
            <LoggedOutSidebar style={{ alignItems: 'end' }} />
          ) : (
            ''
          )}
        </div>

        <div className={darkTheme ? "right dark-mode" : "right"}>

          {postToRender && (
            <div className={`content ${postToRender === defaultPost ? 'blurred2' : ''}`}>
              <div className='title-post-info-wrapper'>
                {postToRender.isPremium ? (
                  <img
                    className='nft-lock-icon'
                    src={icons.NFT_LOCK_ICON}
                    style={{ filter: darkTheme ? 'contrast(0.5)' : '' }}
                  />
                ) : postToRender.isMembersOnly ? (
                  <div className='read-article-subscription'>
                    <img
                      className='read-article-subscription-icon'
                      src={icons.MEMBERS_ONLY}
                      style={{ filter: darkTheme ? 'contrast(0.5)' : '' }}
                    />
                    <p className='read-article-subscription-text'>
                      Members Only
                    </p>
                  </div>
                ) : null}

                <h1
                  style={
                    postToRender.isPublication
                      ? {
                        fontFamily: publication?.styling.fontType,
                        color: darkOptionsAndColors.color,
                      }
                      : { color: darkOptionsAndColors.color }
                  }
                  className='title'
                >
                  {postToRender.title}
                </h1>

                <PostInformation
                  post={postToRender}
                  readTime={getReadTime()}
                  publication={publication}
                  isMobile={context.width <= 768}
                  handle={handle}
                />
                <h2 className='subtitle'>{postToRender.subtitle}</h2>
              </div>

              <div
                className='header-content-wrapper'
                style={
                  postToRender.premiumArticleSaleInfo
                    ? { backgroundColor: 'rgba(67, 223, 186, 0.5)' }
                    : {}
                }
              >
                {postToRender.headerImage != defaultPost.headerImage ? (
                  <img
                    className="header-image"
                    src={postToRender.headerImage}
                    style={{
                      background: darkTheme ? darkOptionsAndColors.background : '',
                    }}
                  />
                ) : (
                  <PlaceholderImage />
                )}

                {postToRender.premiumArticleSaleInfo ? (
                  <PremiumArticleInfo
                    post={postToRender}
                    refreshPost={async () => {
                      load();
                    }}
                  />
                ) : postToRender.isMembersOnly && postToRender.content === '' && isLoggedIn ? (
                  <>
                    {modalType === 'Subscription' && modalContext?.isModalOpen && (
                      <SubscriptionModal
                        handle={author?.handle || ''}
                        authorPrincipalId={postToRender.principal || ''}
                        profileImage={author?.avatar || ''}
                        isPublication={postToRender.isPublication || false}
                        onSubscriptionComplete={() => {
                          onSubsriptionComplete();
                        }}
                      />
                    )}

                    {modalType === 'cancelSubscription' &&
                      modalContext?.isModalOpen && (
                        <CancelSubscriptionModal
                          handle={author?.handle || ''}
                          profileImage={author?.avatar || ''}
                          isPublication={postToRender.isPublication || false}
                          authorPrincipalId={postToRender.principal || ''}
                          onCancelComplete={() => { }}
                        />
                      )}
                  </>
                ) : null}

                {(postToRender.premiumArticleSaleInfo ||
                  (postToRender.isMembersOnly && postToRender.content === '')) ? (
                  <div className='text text-not-allowed'>
                    {parse(premiumArticlePlaceHolder)}
                  </div>
                ) : (
                  <div className={darkTheme ? 'dark-text' : 'text'}>
                    {parse(postToRender.content)}
                  </div>
                )}
              </div>

              <div className='profile-footer-wrapper'>
                <div className='tag-and-button'>
                  {
                    <div className='clap-footer'>
                      <div
                        className={
                          tokenAnimate && buttoncount !== 0
                            ? 'clap-count-container-footer'
                            : 'hide'
                        }
                      >
                        +{buttoncount}
                      </div>
                      <ClapButton
                        styleType={
                          darkTheme ? 'clap-button-dark' : 'clap-button'
                        }
                        type='button'
                        style={{ width: '96px' }}
                        dark={darkTheme}
                        disabled={loading}
                        onMouseDown={() => {
                          setMouseDown(true);
                        }}
                        onMouseUp={() => {
                          setMouseDown(false);
                        }}
                        applaudingPost={postToRender}
                      >
                        {parseInt(postclaps) + buttoncount}
                      </ClapButton>
                    </div>
                  }
                  <div className='tag-links'>
                    {postToRender.tags?.map((tag) => {
                      return (
                        <span
                          key={tag.tagId}
                          className='tag-link'
                          onClick={() => searchTag(tag.tagName)}
                        >
                          {tag.tagName}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className='author-content'>
                  <img
                    src={getAvatar() || images.DEFAULT_AVATAR}
                    alt='background'
                    className='profile-picture'
                  />
                  <Link
                    to={`/user/${postToRender.isPublication ? postToRender.creatorHandle : author?.handle
                      }`}
                    style={{ color: darkOptionsAndColors.color }}
                    className='username'
                  >
                    @{postToRender.isPublication ? postToRender.creatorHandle : author?.handle}
                  </Link>
                  <div className='social-channels'>
                    {getSocialChannelUrls().map((url, index) => {
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            let urlWithProtocol =
                              url.startsWith('https://') ||
                                url.startsWith('http://')
                                ? url
                                : 'https://' + url;
                            window.open(urlWithProtocol, '_blank');
                          }}
                        >
                          <Tooltip
                            clickable={true}
                            className='tooltip-wrapper'
                            anchorSelect={'#social-channel-' + index}
                            place='top'
                            noArrow={true}
                          >
                            {url}
                          </Tooltip>
                          <img
                            className='social-channel-icon'
                            src={getIconForSocialChannel(url, darkTheme)}
                            id={'social-channel-' + index}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p
                    className='description'
                    style={
                      darkTheme
                        ? {
                          color: darkOptionsAndColors.secondaryColor,
                        }
                        : {}
                    }
                  >
                    {getBio()}
                  </p>

                  <FollowAuthor
                    AuthorHandle={author?.handle || ''}
                    Followers={user?.followersArray || undefined}
                    user={user?.handle || ''}
                    isPublication={false}
                  />
                </div>

                <div className='publication-email-opt-in' ref={refEmailOptIn}>
                  {context.width < 1089 && publicationHandle == 'FastBlocks' ? (
                    <EmailOptIn
                      mobile={context.width < 1089}
                      publictionHandle={publicationHandle}
                    />
                  ) : null}
                </div>
                <div className='comment-section'>
                  <WriteComment
                    postId={postToRender.postId}
                    bucketCanisterId={postToRender.bucketCanisterId}
                    label='WRITE A COMMENT..'
                    handle={user?.handle || ''}
                    avatar={user?.avatar || ''}
                  />

                  {comments != undefined &&
                    comments.length > 0 &&
                    comments.map((comment) => (
                      <Comments
                        key={comment.commentId}
                        isReply={false}
                        comment={comment}
                        bucketCanisterId={postToRender.bucketCanisterId}
                        postId={postToRender.postId}
                        loggedInUser={user?.handle || ''}
                        avatar={user?.avatar || ''}
                      />
                    ))}
                </div>
                {moreArticles && moreArticles.authorArticles.length > 0 && (
                  <div className='more-articles'>
                    <p className='more-articles-title'>MORE FROM THIS AUTHOR</p>
                    <div className='article-list-items-wrapper'>
                      {moreArticles.authorArticles.map((post) => (
                        <CardPublishedArticles post={post} key={post.postId} />
                      ))}
                    </div>
                  </div>
                )}
                {moreArticles && moreArticles.publicationArticles.length > 0 && (
                  <div className='more-articles'>
                    <p className='more-articles-title'>
                      MORE FROM THIS PUBLICATION
                    </p>
                    <div className='article-list-items-wrapper'>
                      {moreArticles.publicationArticles.map((post) => (
                        <CardPublishedArticles post={post} key={post.postId} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && loadingError && (
            <div className='content'>
              <p className='not-found'>{loadingError}</p>
            </div>
          )}
          {!loading &&
            <Footer />
          }
        </div>
      </div>
    </div >
  );
};

export default ReadArticle;
