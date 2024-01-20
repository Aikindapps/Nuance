import React, { useEffect, useState } from 'react';
import { usePostStore, useUserStore, useAuthStore } from '../../../store';
import CardDraftArticles from '../../../components/card-draft-articles/card-draft-articles';
import { PostType } from '../../../types/types';
import { useNavigate } from 'react-router-dom';
import Loader from '../../../UI/loader/Loader';
import { useTheme } from '../../../contextes/ThemeContext';
import { colors, images } from '../../../shared/constants';
import Button from '../../../UI/Button/Button';
import './_personal-articles.scss';

const PersonalArticles = () => {
  const { user, getUser, getCounts, counts } = useUserStore((state) => ({
    user: state.user,
    getUser: state.getUser,
    getCounts: state.getUserPostCounts,
    counts: state.userPostCounts,
  }));
  const darkTheme = useTheme();

  const {
    getMyDraftPosts,
    getMyPublishedPosts,
    getMyAllPosts,
    getMySubmittedForReviewPosts,
  } = usePostStore((state) => ({
    getMyDraftPosts: state.getMyDraftPosts,
    getMyPublishedPosts: state.getMyPublishedPosts,
    getMyAllPosts: state.getMyAllPosts,
    getMySubmittedForReviewPosts: state.getMySubmittedForReviewPosts,
  }));

  const getInitialPage = () => {
    if(window.location.href.includes('?page=all')){
      return 'All'
    }
    else if(window.location.href.includes('?page=draft')){
      return 'Drafts'
    }
    else if(window.location.href.includes('?page=submitted')){
      return 'Submitted to review'
    }
    else if(window.location.href.includes('?page=published')) {
      return 'Published'
    }
    return 'All'
  }

  type Page = 'All' | 'Drafts' | 'Published' | 'Submitted to review';
  const pages : Page [] = ['All', 'Drafts', 'Submitted to review', 'Published']

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreCounterAll, setLoadMoreCounterAll] = useState(1);
  const [loadMoreCounterDraft, setLoadMoreCounterDraft] = useState(1);
  const [loadMoreCounterSubmittedToReview, setLoadMoreCounterSubmittedToReview] = useState(1);
  const [loadMoreCounterPublished, setLoadMoreCounterPublished] = useState(1);
  const [allPosts, setAllPosts] = useState<PostType[]>([]);
  const [draftPosts, setDraftPosts] = useState<PostType[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<PostType[]>([]);
  const [submittedToReviewPosts, setSubmittedToReviewPosts] = useState<
    PostType[]
  >([]);
  const [page, setPage] = useState<Page>(getInitialPage());

  const navigate = useNavigate();

  useEffect(() => {
    getUser();
    loadInitial();
  }, []);

  useEffect(() => {
    if (user) {
      getCounts(user.handle);
    }
  }, [user]);

  useEffect(() => {
    if (isLoggedIn && !user) {
      navigate('/register', { replace: true });
    }
  }, [isLoggedIn, user]);

  const loadMoreHandler = async () => {
    setLoadingMore(true);
    switch (page) {
      case 'All':
        let postsAll = await getMyAllPosts(
          (loadMoreCounterAll - 1) * 20 + 20,
          19 + loadMoreCounterAll * 20
        );
        if (postsAll) {
          setAllPosts([...allPosts, ...postsAll]);
        }
        setLoadMoreCounterAll(loadMoreCounterAll + 1);
        break;
      case 'Published':
        let postsPublished = await getMyPublishedPosts(
          (loadMoreCounterPublished - 1) * 20 + 20,
          19 + loadMoreCounterPublished * 20
        );
        if (postsPublished) {
          setPublishedPosts([...publishedPosts, ...postsPublished]);
        }
        setLoadMoreCounterPublished(loadMoreCounterPublished + 1);
        break;
      case 'Drafts':
        let postsDraft = await getMyDraftPosts(
          (loadMoreCounterDraft - 1) * 20 + 20,
          19 + loadMoreCounterDraft * 20
        );
        if (postsDraft) {
          setDraftPosts([...draftPosts, ...postsDraft]);
        }
        setLoadMoreCounterDraft(loadMoreCounterDraft + 1);
        break;
      case 'Submitted to review':
        let postsSubmittedToReview = await getMyAllPosts(
          (loadMoreCounterSubmittedToReview - 1) * 20 + 20,
          19 + loadMoreCounterSubmittedToReview * 20
        );
        if (postsSubmittedToReview) {
          setSubmittedToReviewPosts([...submittedToReviewPosts, ...postsSubmittedToReview]);
        }
        setLoadMoreCounterSubmittedToReview(loadMoreCounterSubmittedToReview + 1);
        break;
    }
    
    setLoadingMore(false);
  };

  const loadInitial = async () => {
    setLoading(true);
    const [allPosts, draftPosts, submittedToReviewPosts, publishedPosts] =
      await Promise.all([
        getMyAllPosts(0, 19),
        getMyDraftPosts(0, 19),
        getMySubmittedForReviewPosts(0, 19),
        getMyPublishedPosts(0, 19),
      ]);
    if (allPosts) {
      setAllPosts(allPosts);
    }
    if (draftPosts) {
      setDraftPosts(draftPosts);
    }
    if (submittedToReviewPosts) {
      setSubmittedToReviewPosts(submittedToReviewPosts);
    }
    if (publishedPosts) {
      setPublishedPosts(publishedPosts);
    }
    setLoading(false);
  };

  const getDisplayingPosts = () => {
    switch (page) {
      case 'All':
        return allPosts
      case 'Drafts':
        return draftPosts
      case 'Published':
        return publishedPosts
      case 'Submitted to review':
        return submittedToReviewPosts;
    }
  }
  //console.log(counts)
  //console.log(allPosts)
  const displayLoadMore = () => {
    if(counts && !loading){
      switch (page) {
        case 'All':
          return parseInt(counts.totalPostCount) > allPosts.length
        case 'Drafts':
          return parseInt(counts.draftCount) > draftPosts.length
        case 'Published':
          return parseInt(counts.publishedCount) > publishedPosts.length
        case 'Submitted to review':
          return parseInt(counts.submittedToReviewCount) > submittedToReviewPosts.length
      }
    }
    return false;
  }

  return (
    <div className='personal-articles-wrapper'>
      <div
        style={
          darkTheme
            ? {
                background: colors.darkModePrimaryBackgroundColor,
              }
            : {}
        }
        className='personal-articles-title-navigation-wrapper'
      >
        <p className='personal-articles-title'>
          PERSONAL ARTICLES ({counts?.totalPostCount || 0})
        </p>
        <div className='personal-articles-navigation-items-wrapper'>
          {pages.map((pageName)=>{
            return (
              <div
                className={
                  page === pageName
                    ? 'personal-articles-navigation-item selected'
                    : 'personal-articles-navigation-item'
                }
                style={
                  page === pageName && darkTheme
                    ? {
                        color: colors.darkModePrimaryTextColor,
                        borderColor: colors.darkModePrimaryTextColor,
                      }
                    : {}
                }
                onClick={() => {
                  setPage(pageName);
                  navigate(
                    `/my-profile/articles?page=${
                      pageName === 'All'
                        ? 'all'
                        : pageName === 'Drafts'
                        ? 'draft'
                        : pageName === 'Published'
                        ? 'published'
                        : pageName === 'Submitted to review'
                        ? 'submitted'
                        : ''
                    }`
                  );
                }}
              >{`${pageName} (${
                pageName === 'All'
                  ? counts?.totalPostCount || 0
                  : pageName === 'Drafts'
                  ? counts?.draftCount || 0
                  : pageName === 'Published'
                  ? counts?.publishedCount || 0
                  : pageName === 'Submitted to review'
                  ? counts?.submittedToReviewCount || 0
                  : null
              })`}</div>
            );
          })}
        </div>
      </div>

      <div className='article-list-items-wrapper'>
        {loading ? (
          <div
            className='article-list-items-loader'
            style={{
              height: '50%',
              width: '64vw',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '50px',
            }}
          >
            <Loader />
          </div>
        ) : (
          getDisplayingPosts().map((post, index) => {
            return <CardDraftArticles post={post} key={index} />;
          })
        )}
        {displayLoadMore() && (
          <div className='personal-articles-load-more-container'>
            <Button
              styleType='secondary'
              style={{ width: '152px' }}
              onClick={() => loadMoreHandler()}
              icon={loadingMore ? images.loaders.BUTTON_SPINNER : ''}
            >
              <span>Load More</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalArticles;
