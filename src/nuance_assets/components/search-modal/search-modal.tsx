import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../store';
import { PostType } from '../../types/types';
import CardHorizontal from '../card-horizontal/card-horizontal';
import SearchBar from '../search-bar/search-bar';
import { icons, colors } from '../../shared/constants';
import { usePostStore } from '../../store';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../contextes/ThemeContext';

function SearchModal({ setOpenModal, screenWidth }: any) {
  const navigate = useNavigate();

  const [posts, setPosts] = useState<PostType[] | null | undefined>([]);
  const [filterData, setFilterData] = useState<string>('');

  useEffect(() => {
    let posts: PostType[] = []; //getLatestPosts();
    setPosts(posts);
  }, []);

  const filteredData = () => {
    return posts?.filter((post) => {
      return (
        post.handle.includes(filterData) ||
        post.title.includes(filterData) ||
        post.subtitle.includes(filterData) ||
        post.tags.some((tag) => tag.tagName.includes(filterData))
      );
    });
  };

  const onKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      navigate(
        `/?tab=search&phrase=${encodeURIComponent(e.target.value)}&page=0`
      );
    }
  };

  const darkTheme = useTheme();
  const darkOptionsAndColors = {
    background: darkTheme
      ? colors.primaryTextColor
      : colors.primaryBackgroundColor,
    color: darkTheme
      ? colors.darkModePrimaryTextColor
      : colors.primaryTextColor,
  };

  return (
    <div
      className='modal-wrapper'
      style={
        screenWidth < 768
          ? {
              top: '50px',
              background: darkOptionsAndColors.background,
              opacity: 0.95,
            }
          : {
              top: '64px',
              background: darkOptionsAndColors.background,
              opacity: 0.95,
            }
      }
    >
      <div className='content'>
        <div className='close-modal'>
          <img
            src={icons.CLOSE_SEARCH}
            style={{ filter: 'contrast(.5)' }}
            onClick={() => {
              setOpenModal(false);
            }}
          ></img>
        </div>

        <p>SEARCH</p>
        <SearchBar style={{ margin: 'auto' }} onKeyDown={onKeyDown}></SearchBar>

        <div className='posts'>
          {(() => {
            if (filteredData()?.length != 0 && filterData != '') {
              let number = filteredData()?.length;
              return (
                <div style={{ marginLeft: '60px' }}>
                  {(() => {
                    if (number == 1) {
                      return (
                        <div className='rowContainer'>
                          <h3 className='span2'>|</h3>
                          <h3 className='links'>
                            Found {number} article for{' '}
                            <span className='result'>'{filterData}'</span>
                          </h3>
                        </div>
                      );
                    } else {
                      return (
                        <div className='rowContainer'>
                          <h3 className='span2'>|</h3>
                          <h3 className='links'>
                            Found {number} articles for{' '}
                            <span
                              className='result'
                              style={{
                                color: darkTheme
                                  ? colors.primaryTextColor
                                  : colors.darkModePrimaryTextColor,
                              }}
                            >
                              '{filterData}'
                            </span>
                          </h3>
                        </div>
                      );
                    }
                  })()}
                  <div className='article-grid-horizontal'>
                    {filteredData()?.map((post: PostType) => (
                      <CardHorizontal post={post} key={post.postId} />
                    ))}
                  </div>
                </div>
              );
            } else {
              return <div className='latestArticles'></div>;
            }
          })()}
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
