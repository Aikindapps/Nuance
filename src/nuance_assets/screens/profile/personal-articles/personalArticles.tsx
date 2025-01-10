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
import { get } from 'lodash';

const PersonalArticles = () => {
  const { agent: agentToBeUsed } = useAuthStore((state) => ({ agent: state.agent }));

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
    getMyPlannedPosts,
  } = usePostStore((state) => ({
    getMyDraftPosts: state.getMyDraftPosts,
    getMyPublishedPosts: state.getMyPublishedPosts,
    getMyAllPosts: state.getMyAllPosts,
    getMySubmittedForReviewPosts: state.getMySubmittedForReviewPosts,
    getMyPlannedPosts: state.getMyPlannedPosts,
  }));

  const getInitialPage = () => {
    if (window.location.href.includes('?page=all')) {
      return 'All';
    } else if (window.location.href.includes('?page=draft')) {
      return 'Drafts';
    } else if (window.location.href.includes('?page=submitted')) {
      return 'Submitted for review';
    } else if (window.location.href.includes('?page=published')) {
      return 'Published';
    } else if (window.location.href.includes('?page=planned')) {
      return 'Planned';
    }

    return 'All';
  };

  type Page = 'All' | 'Drafts' | 'Published' | 'Submitted for review' | 'Planned';
  const pages: Page[] = ['All', 'Drafts', 'Submitted for review', 'Published', 'Planned'];

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreCounterAll, setLoadMoreCounterAll] = useState(1);
  const [loadMoreCounterDraft, setLoadMoreCounterDraft] = useState(1);
  const [
    loadMoreCounterSubmittedToReview,
    setLoadMoreCounterSubmittedToReview,
  ] = useState(1);
  const [loadMoreCounterPublished, setLoadMoreCounterPublished] = useState(1);
  const [allPosts, setAllPosts] = useState<PostType[]>([]);
  const [draftPosts, setDraftPosts] = useState<PostType[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<PostType[]>([]);
  const [submittedToReviewPosts, setSubmittedToReviewPosts] = useState<
    PostType[]
  >([]);
  const [plannedPosts, setPlannedPosts] = useState<PostType[]>([]);
  const [page, setPage] = useState<Page>(getInitialPage());

  const navigate = useNavigate();

  useEffect(() => {
    getUser(agentToBeUsed);
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
          20 + loadMoreCounterAll * 20
        );
        if (postsAll) {
          setAllPosts([...allPosts, ...postsAll]);
        }
        setLoadMoreCounterAll(loadMoreCounterAll + 1);
        break;
      case 'Published':
        let postsPublished = await getMyPublishedPosts(
          (loadMoreCounterPublished - 1) * 20 + 20,
          20 + loadMoreCounterPublished * 20
        );
        if (postsPublished) {
          setPublishedPosts([...publishedPosts, ...postsPublished]);
        }
        setLoadMoreCounterPublished(loadMoreCounterPublished + 1);
        break;
      case 'Drafts':
        let postsDraft = await getMyDraftPosts(
          (loadMoreCounterDraft - 1) * 20 + 20,
          20 + loadMoreCounterDraft * 20
        );
        if (postsDraft) {
          setDraftPosts([...draftPosts, ...postsDraft]);
        }
        setLoadMoreCounterDraft(loadMoreCounterDraft + 1);
        break;
      case 'Submitted for review':
        let postsSubmittedToReview = await getMySubmittedForReviewPosts(
          (loadMoreCounterSubmittedToReview - 1) * 20 + 20,
          20 + loadMoreCounterSubmittedToReview * 20
        );
        if (postsSubmittedToReview) {
          setSubmittedToReviewPosts([
            ...submittedToReviewPosts,
            ...postsSubmittedToReview,
          ]);
        }
        setLoadMoreCounterSubmittedToReview(
          loadMoreCounterSubmittedToReview + 1
        );
        break;
      case 'Planned':
        let postsPlanned = await getMyPlannedPosts(
          (loadMoreCounterAll - 1) * 20 + 20,
          20 + loadMoreCounterAll * 20
        );
        if (postsPlanned) {
          setAllPosts([...allPosts, ...postsPlanned]);
        }
        setLoadMoreCounterAll(loadMoreCounterAll + 1);
        break;
    }

    setLoadingMore(false);
  };

  const loadInitial = async () => {
    setLoading(true);
    const [allPosts, draftPosts, submittedToReviewPosts, plannedPosts, publishedPosts] =
      await Promise.all([
        getMyAllPosts(0, 20),
        getMyDraftPosts(0, 20),
        getMySubmittedForReviewPosts(0, 20),
        getMyPlannedPosts(0, 20),
        getMyPublishedPosts(0, 20),
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
    if (plannedPosts) {
      setPlannedPosts(plannedPosts);
    }
    setLoading(false);
  };

  const getDisplayingPosts = () => {
    switch (page) {
      case 'All':
        return allPosts;
      case 'Drafts':
        return draftPosts;
      case 'Published':
        return publishedPosts;
      case 'Submitted for review':
        return submittedToReviewPosts;
      case 'Planned':
        return plannedPosts;
    }
  };

  const displayLoadMore = () => {
    if (counts && !loading) {
      switch (page) {
        case 'All':
          return parseInt(counts.totalPostCount) > allPosts.length;
        case 'Drafts':
          return parseInt(counts.draftCount) > draftPosts.length;
        case 'Published':
          return parseInt(counts.publishedCount) > publishedPosts.length;
        case 'Submitted for review':
          return (
            parseInt(counts.submittedToReviewCount) >
            submittedToReviewPosts.length
          );
        case 'Planned':
          return parseInt(counts.plannedCount) > plannedPosts.length;
      }
    }
    return false;
  };

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
          MY ARTICLES ({counts?.totalPostCount || 0})
        </p>
        <div className='personal-articles-navigation-items-wrapper'>
          {pages.map((pageName, index) => {
            return (
              <div
                key={index}
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
                    `/my-profile/articles?page=${pageName === 'All'
                      ? 'all'
                      : pageName === 'Drafts'
                        ? 'draft'
                        : pageName === 'Published'
                          ? 'published'
                          : pageName === 'Submitted for review'
                            ? 'submitted'
                            : pageName === 'Planned'
                              ? 'planned'
                              : ''
                    }`
                  );
                }}
              >{`${pageName} (${pageName === 'All'
                ? counts?.totalPostCount || 0
                : pageName === 'Drafts'
                  ? counts?.draftCount || 0
                  : pageName === 'Published'
                    ? counts?.publishedCount || 0
                    : pageName === 'Submitted for review'
                      ? counts?.submittedToReviewCount || 0
                      : pageName === 'Planned'
                        ? counts?.plannedCount || 0
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
            return <CardDraftArticles post={post} key={post.postId} />;
          })
        )}
        {displayLoadMore() && (
          <div className='personal-articles-load-more-container'>
            <Button
              styleType={{dark: 'white', light: 'white'}}
              style={{ width: '152px' }}
              onClick={() => loadMoreHandler()}
              loading={loadingMore}
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
