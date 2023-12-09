import React, { useState } from 'react';
import Button from '../../UI/Button/Button';
import { PostType } from '../../types/types';
import CardHorizontal from '../card-horizontal/card-horizontal';
import CardLarge from '../card-large/card-large';
import CardVertical from '../card-vertical/card-vertical';
import { images } from '../../shared/constants';
import './_article-list-category-landing.scss';
import Loader from '../../UI/loader/Loader';
import { useNavigate } from 'react-router';


type ArticleListCategoryLandingProps = {
  posts: Array<PostType> | undefined;
  loadMoreHandler: Function;
  loadingMore: boolean;
  totalPostCount: string | undefined;
  categoryPostCount: Number;
  writersCount: number | undefined;
  categoryName: string;
  loading: boolean;
  validCategory: boolean | undefined;
  publicationHandle: string;
}

const ArticleListCategoryLanding: React.FC<ArticleListCategoryLandingProps> = (props): JSX.Element => {
  const navigate = useNavigate();
    if(!props.validCategory){
      //navigate(`/publication/${props.publicationHandle}`)
    }

    return (
        <div className='article-list'>
            <div className='category-info'>
              <p className='category-name'>{props.categoryName}</p>
              <div className='article-writer-flex'>
                <p className='articles-count'>{props.totalPostCount + ' articles'}</p>
                <p className='small-divider'></p>
                <p className='writers-count'>{props.writersCount + ' writers'}</p>
              </div>
            </div>
            <p style={{paddingTop:'20px'}} className='mainTitle'>{'LATEST'}</p>
            { props.loading?
              <div style={{
                height:'50%',
                display:'flex',
                justifyContent:'center',
                alignItems:'center'
                }}>
              <Loader/>
              </div>
              :
              <div>
            <div style={{marginTop: '25px'}} className='article-grid'>
              {props.posts?.slice(0,6).map((post: PostType) => (
                <CardVertical post={post} key={post.postId} />
              ))}
            </div>
            <div className='article-grid-horizontal'>
              {props.posts?.slice(6).map((post: PostType) => (
                <CardHorizontal post={post} key={post.postId} />
              ))}
            </div>
            {props.totalPostCount && props.posts && props.categoryPostCount.valueOf() > props.posts.length ?
            <div className='load-more-container'>
              <Button
                styleType='secondary'
                style={{ width: '152px' }}
                onClick={()=>props.loadMoreHandler()}
                icon={
                props.loadingMore ? images.loaders.BUTTON_SPINNER : ''
                }
              >
                <span>Load More</span>
              </Button>
            </div>
            :
            null}
            </div>}
        </div>  
    );
    
  };
  
  export default ArticleListCategoryLanding;