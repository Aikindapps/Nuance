import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import parse from 'html-react-parser';
import Header from '../../components/header/header';
import Footer from '../../components/footer/footer';
import ReadArticleSidebar from '../../UI/read-article-sidebar/read-article-sidebar';
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
import { PublicationStylingObject } from '../../types/types';
import PostInformation from '../../components/post-information/post-information';
import EmailOptIn from '../../components/email-opt-in/email-opt-in';
import { useTheme } from '../../contextes/ThemeContext';

import { PremiumArticleInfo } from '../../components/premium-article-info/premium-article-info';
import Comments from '../../components/comments/comments';
import WriteComment from '../../components/comments/write-comments';
import { PostBucket } from 'src/declarations/PostBucket';
import { get } from 'lodash';
import { Tooltip } from 'react-tooltip';

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

  // Publication Feature Context
  const publicationFeatureIsLive = useContext(Context).publicationFeature;
  const [publicationHandle, setPublicationHandle] = useState('');
  const refEmailOptIn = useRef<HTMLDivElement>(null);

  //NFT feature toggle
  const nftFeatureIsLive = useContext(Context).nftFeature;

  const navigate = useNavigate();
  const darkTheme = useTheme();
  const { handle, id } = useParams();

  const context = useContext(Context);

  const {
    getPost,
    clearPost,
    setSearchText,
    clapPost,
    clearSearchBar,
    isTagScreen,
    post,
    author,
    loadingError,
    clearWordCount,
    getOwnedNfts,
    getPremiumPostError,
    ownedPremiumPosts,
    getPostComments,
    saveComment,
    upVoteComment,
    downVoteComment,
    deleteComment,
    comments,
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
  }));

  const { user, getUsersByHandlesReturnOnly } = useUserStore((state) => ({
    user: state.user,
    getUsersByHandlesReturnOnly: state.getUsersByHandlesReturnOnly,
    usersByHandles: state.usersByHandles,
  }));

  const { getUser } = useUserStore((state) => ({ getUser: state.getUser }));
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

  const separateIds = (input: string) => {
    // Split the input string by the '-' character
    let parts = input.split('-');

    // The first part is the post ID
    let postId = parts[0];

    // The rest of the parts make up the canister ID
    let bucketCanisterId = parts.slice(1).join('-');
    // Return the IDs in an object
    return { postId, bucketCanisterId };
  };
  const getLeftStyle = () => {
    if (context.width <= 768) {
      if (isToggled) {
        return { width: 'max-content', minWidth: 'unset' };
      } else {
        return {
          width: '30px',
          paddingRight: '25px',
          maxWidth: '30px',
          minWidth: 'unset',
        };
      }
    } else {
      return {
        width: '30px',
        paddingRight: '25px',
        maxWidth: '30px',
      };
    }
  };

  const postId = separateIds(id as string).postId;

  const getTitleFromUrl = (url: string) => {
    const segments = new URL(url).pathname.split('/');
    const title = segments.pop() || segments.pop() || '';
    return title;
  };

  const searchTag = (tag: string) => {
    //setSearchText('#' + tag);
    //clearSearchBar(false);
    navigate(
      '/?tab=search&search=' + encodeURIComponent('#' + tag.toUpperCase()),
      { replace: true }
    );
  };

  //comment scrolling
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
  }, []);

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
    if (post) {
      getPostComments(postId, post?.bucketCanisterId);
    }
  }, [post?.postId]);

  useEffect(() => {
    if (post) {
      setLoading(false);
      if (post.creator) {
        handleWriterFields(post.creator);
      }
      if (
        post.isPublication &&
        publication?.publicationHandle !== post.handle
      ) {
        getPublication(post.handle);
      }
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

  //disabled for null user and on authored posts
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
  return (
    <div style={darkOptionsAndColors} className='read-article-wrapper'>
      <Helmet>
        <link rel='canonical' href={url} />

        {/* HTML Meta Tags */}
        <title>{post?.title}</title>
        <meta name='title' content={post?.title} />
        <meta name='description' content={post?.subtitle}></meta>
        <meta name='author' content={post?.handle}></meta>

        {/* Google / Search Engine Tags */}
        <meta itemProp='name' content={post?.title} />
        <meta itemProp='description' content={post?.subtitle} />
        <meta itemProp='image' content={post?.headerImage} />

        {/* Facebook Meta Tags */}
        <meta property='og:title' content={post?.title} />
        <meta property='og:description' content={post?.subtitle} />
        <meta property='og:url' content={url} />
        <meta property='og:type' content='article' />
        <meta
          property='og:image'
          content={post?.headerImage || images.NUANCE_LOGO}
        />

        {/* Twitter Meta Tags */}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={post?.title} />
        <meta name='twitter:description' content={post?.subtitle} />
        <meta name='twitter:image' content={post?.headerImage} />
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
        isPublicationPage={post?.isPublication}
        category={post?.category}
        publication={
          publication?.publicationHandle.toLowerCase() !== handle?.toLowerCase()
            ? undefined
            : publication
        }
        postTitle={post?.title}
      />

      <div className='page'>
        <div className='left' style={getLeftStyle()}>
          <p className='date'>
            {formatDate(post?.publishedDate) || formatDate(post?.created)}{' '}
          </p>
          <div className='left-content'>
            <div className='menus'>
              {post?.url && (
                <>
                  <CopyArticle
                    url={post.url}
                    shown={copyArticle}
                    setShown={setCopyArticle}
                    dark={darkTheme}
                    postId={post?.postId}
                  />
                  {/* ReportArticle also takes in parameters for edit button since they share a drop down menu*/}
                  <ReportArticle
                    id={postId || ''}
                    handle={author?.handle || ''}
                    url={post?.url}
                    shown={meatBall}
                    setShown={setMeatBall}
                    isPremium={post.isPremium}
                    dark={darkTheme}
                  />
                </>
              )}
            </div>
            <div className='horizontal-divider'></div>
            {post && author && (
              <div className='author'>
                <img src={getAvatar() || images.DEFAULT_AVATAR} alt=''></img>
                <Link
                  to={`/user/${
                    post.isPublication ? post.creator : author.handle
                  }`}
                  className='handle'
                  style={{ color: darkOptionsAndColors.color }}
                >
                  @{post.isPublication ? post.creator : author.handle}
                </Link>
              </div>
            )}
            <div className='horizontal-divider'></div>
          </div>

          <div className='left-menu'>
            <ReadArticleSidebar
              isSidebarToggle={isSidebarToggled}
              id={id}
              url={post?.url || ''}
              handle={post?.handle}
              avatar={getAvatar()}
              isPremium={post?.isPremium}
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
                  applaudingPost={post}
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

        <div className='right'>
          {loading && (
            <div style={{ marginTop: '-50px' }}>
              <Loader />
            </div>
          )}

          {!loading && post && author && (
            <div className='content'>
              <div className='title-post-info-wrapper'>
                {post.isPremium ? (
                  <img
                    className='nft-lock-icon'
                    src={icons.NFT_LOCK_ICON}
                    style={{ filter: darkTheme ? 'contrast(0.5)' : '' }}
                  />
                ) : null}
                <h1
                  style={
                    post.isPublication
                      ? {
                          fontFamily: publication?.styling.fontType,
                          color: darkOptionsAndColors.color,
                        }
                      : { color: darkOptionsAndColors.color }
                  }
                  className='title'
                >
                  {post.title}
                </h1>
                <PostInformation
                  post={post}
                  readTime={getReadTime()}
                  publication={publication}
                  isMobile={context.width <= 768}
                  handle={handle}
                />
                <h2 className='subtitle'>{post.subtitle}</h2>
              </div>

              <div
                className='header-content-wrapper'
                style={
                  post.premiumArticleSaleInfo
                    ? { backgroundColor: 'rgba(67, 223, 186, 0.5)' }
                    : {}
                }
              >
                <img
                  className='header-image'
                  src={post.headerImage || images.NUANCE_LOGO}
                  style={{
                    background: darkTheme
                      ? darkOptionsAndColors.background
                      : '',
                  }}
                />
                {post.premiumArticleSaleInfo ? (
                  <PremiumArticleInfo
                    post={post}
                    refreshPost={async () => {
                      load();
                    }}
                  />
                ) : null}

                {post.premiumArticleSaleInfo ? (
                  <div className='text text-not-allowed'>
                    {parse(premiumArticlePlaceHolder)}
                  </div>
                ) : (
                  <div className={darkTheme ? 'dark-text' : 'text'}>
                    {parse(post.content)}
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
                        applaudingPost={post}
                      >
                        {parseInt(postclaps) + buttoncount}
                      </ClapButton>
                    </div>
                  }
                  <div className='tag-links'>
                    {post.tags?.map((tag) => {
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
                    to={`/user/${
                      post.isPublication ? post.creator : author.handle
                    }`}
                    style={{ color: darkOptionsAndColors.color }}
                    className='username'
                  >
                    @{post.isPublication ? post.creator : author.handle}
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
                    postId={post.postId}
                    bucketCanisterId={post.bucketCanisterId}
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
                        bucketCanisterId={post.bucketCanisterId}
                        postId={post.postId}
                        loggedInUser={user?.handle || ''}
                        avatar={user?.avatar || ''}
                      />
                    ))}
                </div>
              </div>
            </div>
          )}

          {!loading && loadingError && (
            <div className='content'>
              <p className='not-found'>{loadingError}</p>
            </div>
          )}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ReadArticle;
