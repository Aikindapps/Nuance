import React, { useState, useRef } from 'react';
import Button from '../../UI/Button/Button';
import { PostType, PublicationObject } from '../../types/types';
import CardHorizontal from '../card-horizontal/card-horizontal';
import CardLarge from '../card-large/card-large';
import CardVertical from '../card-vertical/card-vertical';
import { images } from '../../shared/constants';
import EmailOptIn from '../../components/email-opt-in/email-opt-in';
import PublicationCallToAction from '../publication-call-to-action/publication-call-to-action';
import { PublicationType, PublicationCta } from '../../types/types';
import Loader from '../../UI/loader/Loader';

type ArticleListProps = {
  displayingPosts: Array<PostType> | undefined;
  loadMoreHandler: Function;
  loadingMore: boolean;
  categoryName: string;
  totalPostCount: string | undefined;
  mobile?: boolean;
  screenwidth?: number;
  publicationName?: string;
  emailOptInRef?: any;
  publication?: PublicationType;
  loading: boolean;
};

const ArticleList: React.FC<ArticleListProps> = (props): JSX.Element => {
  if (
    props.mobile &&
    props.publicationName === 'FastBlocks' &&
    window.location.href.includes('subscription')
  ) {
    props.emailOptInRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const isCtaEmpty = () => {
    const cta = props.publication?.cta;
    return (
      cta?.buttonCopy === '' ||
      cta?.ctaCopy === '' ||
      cta?.icon === '' ||
      cta?.link === ''
    );
  };

  return (
    <div className='article-list'>
      <p className='mainTitle'>{props.categoryName.toUpperCase()}</p>
      {props.loading && (
        <div
          style={{ display: 'flex', width: '100%', justifyContent: 'center' }}
        >
          <Loader />
        </div>
      )}
      <div className='article-grid-large'>
        {props.displayingPosts?.slice(0, 2).map((post: PostType) => (
          <CardLarge post={post} key={post.postId} />
        ))}

        {!props.loading && props.publication?.cta && !isCtaEmpty() && (
          <div className={'publication-landing-cta'}>
            <PublicationCallToAction
              publicationTagLine={props.publication?.cta.ctaCopy}
              publicationIcon={props.publication?.cta.icon}
              publicationButtonText={props.publication?.cta.buttonCopy}
              publicationBackgroundColor={
                props.publication?.styling.primaryColor
              }
              onClick={() => {
                window.open(
                  props.publication?.cta.link
                    ? props.publication?.cta.link
                    : '/'
                );
              }}
              mobile={
                props.screenwidth && props.screenwidth > 768 ? true : false
              }
            ></PublicationCallToAction>
          </div>
        )}
      </div>

      <div className='article-grid'>
        {props.displayingPosts?.slice(2, 6).map((post: PostType) => (
          <CardVertical post={post} key={post.postId} />
        ))}
      </div>
      {props.mobile && props.publicationName === 'FastBlocks' ? (
        <div className='email-opt-in-mobile' ref={props.emailOptInRef}>
          <EmailOptIn mobile={props.mobile} />
        </div>
      ) : null}

      <div className='article-grid-horizontal'>
        {props.displayingPosts?.slice(6, 8).map((post: PostType) => (
          <CardHorizontal post={post} key={post.postId} />
        ))}
      </div>
      <div className='article-grid-horizontal'>
        {props.displayingPosts?.slice(8)?.map((post: PostType) => (
          <CardHorizontal post={post} key={post.postId} />
        ))}
      </div>
      {props.totalPostCount &&
      props.displayingPosts &&
      parseInt(props.totalPostCount) > props.displayingPosts?.length ? (
        <div className='load-more-container'>
          <Button
            styleType='secondary'
            style={{ width: '152px' }}
            onClick={() => props.loadMoreHandler()}
            icon={props.loadingMore ? images.loaders.BUTTON_SPINNER : ''}
          >
            <span>Load More</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default ArticleList;
