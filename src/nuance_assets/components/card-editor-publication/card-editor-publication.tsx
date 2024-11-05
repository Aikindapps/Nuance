import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DateFormat, formatDate } from '../../shared/utils';
import { images, icons, colors } from '../../shared/constants';
import { CardEditorPublicationProps } from './types';
import { Toggle } from '../../UI/toggle/toggle';
import { PostType } from '../../../nuance_assets/types/types';
import {
  usePostStore,
  usePublisherStore,
  useUserStore,
} from '../../../nuance_assets/store';
import { toast, toastError, ToastType } from '../../services/toastService';
import { useTheme } from '../../contextes/ThemeContext';
import './_card-editor-publication.scss';
import Dropdown from '../../UI/dropdown/dropdown';
import { Tooltip } from 'react-tooltip';
import { MeatBallMenuGeneral } from '../../UI/meatball-menu-general/meatball-menu-general';
import PremiumArticleSoldBar from '../../UI/premium-article-sold-bar/premium-article-sold-bar';
import { Context as ModalContext } from '../../contextes/ModalContext';
import { is } from 'immutable';

const CardEditorPublication: React.FC<CardEditorPublicationProps> = ({
  post,
  toggleHandler,
  categories,
  categoryChangeHandler,
  publication,
  refreshPosts,
}) => {
  const [isToggled, setIsToggled] = useState(!post.isDraft);
  const [isLoading, setIsLoading] = useState(false);
  const [handleSelection, setHandleSelection] = useState(post.category);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isKebabMenuOpen, setIsKebabMenuOpen] = useState(false);
  const navigate = useNavigate();
  const darkTheme = useTheme();
  const modalContext = useContext(ModalContext);

  const isScheduled = (post: PostType) => {
    const postDate = new Date(Number(post.publishedDate));
    const currentDate = new Date();
    return postDate > currentDate;
  };

  const handleCategoryChange = async (post: PostType, e: string) => {
    setIsLoading(true);
    setHandleSelection(e);
    await categoryChangeHandler(post, e);
    await refreshPosts(post.postId);
    setIsLoading(false);
  };
  const getCategoriesWithNoCategory = () => {
    if (post.category === '') {
      return ['', ...categories];
    } else {
      var categoriesWithoutSelected: any[] = [];
      categories.map((category: string) => {
        if (category !== post.category) {
          categoriesWithoutSelected = [...categoriesWithoutSelected, category];
        }
      });
      return [post.category, ...categoriesWithoutSelected, ''];
    }
  };

  const darkOptionsAndColors = {
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
    secondaryColor: darkTheme
      ? colors.darkSecondaryTextColor
      : colors.primaryTextColor,
    filter: darkTheme ? 'contrast(.5)' : 'none',
  };

  const { getApplaudedHandles, savePost } = usePostStore((state) => ({
    getApplaudedHandles: state.getApplaudedHandles,
    savePost: state.savePost,
  }));

  const { getPrincipalByHandle } = useUserStore((state) => ({
    getPrincipalByHandle: state.getPrincipalByHandle,
  }));

  const [applaudedHandles, setApplaudedHandles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchApplaudedHandles = async () => {
    setLoading(true);
    let handles = await getApplaudedHandles(post.postId, post.bucketCanisterId);
    setApplaudedHandles(handles);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplaudedHandles();
  }, []);

  const toastMessage = (isDraft: boolean) => {
    if (isDraft) {
      toast(`This article “${post.title}” is unpublished!`, ToastType.Success);
    } else {
      toast(
        `This article “${post.title}” is now published!`,
        ToastType.Success
      );
    }
  };

  return (
    <div
      className='card-editor-publication-wrapper'
      style={
        isToggled
          ? isLoading
            ? { filter: 'blur(3px)' }
            : {}
          : isLoading
          ? {
              filter: 'blur(3px)',
              zIndex: isDropdownOpen || isKebabMenuOpen ? '3' : 'unset',
            }
          : {
              zIndex: isDropdownOpen || isKebabMenuOpen ? '3' : 'unset',
            }
      }
    >
      <div className='field-published field-general'>
        {post.isPremium ? (
          <img className='nft-icon' src={icons.NFT_ICON} />
        ) : (
          <Toggle
            scheduled={isScheduled(post)}
            toggled={isToggled}
            callBack={async () => {
              if (!isLoading) {
                if (post.isPremium) {
                  toastError('Premium article can not be unpublished');
                } else {
                  setIsToggled(!isToggled);
                  setIsLoading(true);
                  await toggleHandler(post.postId, isToggled);
                  await refreshPosts(post.postId);
                  toastMessage(isToggled);
                  setIsLoading(false);
                }
              }
            }}
          />
        )}
      </div>
      <Link className='field-article field-general' to={post.url}>
        <img
          className='article-image'
          src={post.headerImage || (darkTheme ? images.NUANCE_LOGO : images.NUANCE_LOGO_BLACK)}
          style={
            !isToggled
              ? {
                  filter: 'grayscale(1)',
                }
              : {}
          }
        />
        <p style={darkOptionsAndColors} className='article-title'>
          {post.title}
        </p>
      </Link>
      <Link
        to={'/user/' + post.creatorHandle || post.handle}
        className='field-writer field-general'
        style={darkOptionsAndColors}
      >
        @{post.creatorHandle || post.handle}
      </Link>
      <div className='field-category field-general'>
        <Dropdown
          selectedTextStyle={{ fontSize: '14px', fontWeight: '400' }}
          drodownItemsWrapperStyle={{
            overflowY: 'scroll',
            top: '29px',
            rowGap: '0',
          }}
          style={{ height: '24px' }}
          items={getCategoriesWithNoCategory().map((val) => '/' + val)}
          nonActive={isLoading}
          onSelect={(item) => {
            if (!isLoading) {
              handleCategoryChange(post, item.slice(1));
            }
          }}
          onIsOpenChanged={setIsDropdownOpen}
          uniqueId={'publication-post-dropdown-menu-' + post.postId}
        />
      </div>

      <div
        className='field-applause field-general'
        id={'card-editor-article-tooltip-' + post.postId}
      >
        <img
          className='clap-icon-card-editor'
          src={darkTheme ? icons.CLAP_WHITE_2 : icons.CLAP_BLACK}
        />
        <p style={darkOptionsAndColors} className='clap-count'>
          {post.claps}
        </p>
      </div>
      <div
        style={
          isScheduled(post)
            ? { color: '#FF8126' }
            : darkTheme
            ? { color: darkOptionsAndColors.secondaryColor }
            : {}
        }
        className='field-published-date field-general'
      >
        {formatDate(post.publishedDate, DateFormat.WithYear) ||
          formatDate(post.created, DateFormat.WithYear)}
      </div>
      <div
        style={
          darkTheme
            ? {
                color: darkOptionsAndColors.secondaryColor,
              }
            : {}
        }
        className='field-modified field-general'
      >
        {formatDate(post.modified, DateFormat.WithYear) ||
          formatDate(post.created, DateFormat.WithYear)}
      </div>
      <div className='field-keys-sold field-general'>
        {post.premiumArticleSaleInfo && (
          <PremiumArticleSoldBar
            availableSupply={
              post.premiumArticleSaleInfo.totalSupply -
              post.premiumArticleSaleInfo.currentSupply
            }
            totalSupply={post.premiumArticleSaleInfo.totalSupply}
            dark={darkTheme}
          />
        )}
        <MeatBallMenuGeneral
          items={
            !isToggled
              ? post.isMembersOnly
                ? [
                    {
                      onClick: async () => {
                        navigate('/article/edit/' + post.postId);
                      },
                      text: 'Edit',
                      useDividerOnTop: false,
                    },
                    {
                      onClick: async () => {
                        setIsToggled(!isToggled);
                        setIsLoading(true);
                        await toggleHandler(post.postId, isToggled);
                        await refreshPosts(post.postId);
                        toastMessage(isToggled);
                        setIsLoading(false);
                      },
                      text: 'Publish in publication',
                      useDividerOnTop: false,
                    },
                  ]
                : [
                    {
                      onClick: async () => {
                        navigate('/article/edit/' + post.postId);
                      },
                      text: 'Edit',
                      useDividerOnTop: false,
                    },
                    {
                      onClick: async () => {
                        setIsToggled(!isToggled);
                        setIsLoading(true);
                        await toggleHandler(post.postId, isToggled);
                        await refreshPosts(post.postId);
                        toastMessage(isToggled);
                        setIsLoading(false);
                      },
                      text: 'Publish in publication',
                      useDividerOnTop: false,
                    },
                    {
                      onClick: async () => {
                        if (post.headerImage === '') {
                          toastError(
                            'You need to add an header image before minting an NFT for an article.'
                          );
                          return;
                        }
                        modalContext?.openModal('Premium article', {
                          premiumPostNumberOfEditors:
                            publication?.editors.length,
                          premiumPostData: post,
                          premiumPostOnSave: async (
                            maxSupply: bigint,
                            icpPrice: bigint,
                            thumbnail: string
                          ) => {
                            await savePost({
                              ...post,
                              premium: [
                                {
                                  thumbnail: thumbnail,
                                  icpPrice: icpPrice,
                                  maxSupply: maxSupply,
                                },
                              ],
                              tagIds: post.tags.map((val) => val.tagId),
                              creatorHandle: post.creatorHandle,
                              isPublication: true,
                              isDraft: false,
                              isMembersOnly: false,
                              scheduledPublishedDate: [],
                            });
                          },
                          premiumPostRefreshPost: async () => {
                            await refreshPosts(post.postId);
                          },
                        });
                      },
                      text: 'Mint article',
                      useDividerOnTop: true,
                      icon: icons.NFT_ICON,
                    },
                  ]
              : post.isPremium
              ? [
                  {
                    onClick: async () => {
                      navigate('/article/edit/' + post.postId);
                    },
                    text: 'See details',
                    useDividerOnTop: false,
                  },
                ]
              : [
                  {
                    onClick: async () => {
                      navigate('/article/edit/' + post.postId);
                    },
                    text: 'Edit',
                    useDividerOnTop: false,
                  },
                  {
                    onClick: async () => {
                      setIsToggled(!isToggled);
                      setIsLoading(true);
                      await toggleHandler(post.postId, isToggled);
                      await refreshPosts(post.postId);
                      toastMessage(isToggled);
                      setIsLoading(false);
                    },
                    text: 'Unpublish from publication',
                    useDividerOnTop: false,
                  },
                ]
          }
          uniqueId={post.postId + '-kebab-menu'}
          isMenuOpen={isKebabMenuOpen}
          setIsMenuOpen={(input: boolean) => {
            setIsKebabMenuOpen(input);
          }}
          inActive={isLoading}
        />
      </div>

      <Tooltip
        clickable={true}
        className='tooltip-wrapper'
        anchorSelect={'#card-editor-article-tooltip-' + post.postId}
        place='top'
        noArrow={true}
      >
        {loading ? (
          <p className='tooltip-inside-text'>Loading...</p>
        ) : applaudedHandles.length > 0 ? (
          applaudedHandles.map((handle, index) => {
            if (index === applaudedHandles.length - 1 && index < 10) {
              //last element
              return (
                <Link to={'/user/' + handle}>
                  <p key={handle} className='tooltip-inside-handle'>
                    {'@' + handle + ' applauded this article.'}
                  </p>
                </Link>
              );
            } else if (index === 10) {
              //there are more than 10, this is last
              return (
                <Link to={'/user/' + handle}>
                  <p key={handle} className='tooltip-inside-handle'>
                    {'@' +
                      handle +
                      ' +' +
                      (applaudedHandles.length - index - 1) +
                      ' applauded this article.'}
                  </p>
                </Link>
              );
            } else if (index < 10) {
              return (
                <Link to={'/user/' + handle}>
                  <p key={handle} className='tooltip-inside-handle'>
                    {'@' + handle + ', '}
                  </p>
                </Link>
              );
            }
          })
        ) : (
          <p className='tooltip-inside-text'>No applause yet.</p>
        )}
      </Tooltip>
    </div>
  );
};

export default CardEditorPublication;
