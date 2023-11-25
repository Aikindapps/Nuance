import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import { colors, icons, images } from '../../shared/constants';
import { formatDate } from '../../shared/utils';
import { PostType, PublicationType } from '../../types/types';
import { Context } from '../../contextes/Context';




type PostInformationProps = {
  post: PostType,
  readTime: string,
  publication: PublicationType | undefined,
  isMobile: Boolean,
  handle: string | undefined
}

const PostInformation: React.FC<PostInformationProps> = (props): JSX.Element => {
    const publicationFeatureIsLive = useContext(Context).publicationFeature;
    if(props.isMobile){
        return (
            <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent:'space-between',
              flexDirection:'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection:'column'
              }}
            >
              <p 
                className='last-modified'
                style={{marginBottom:'4px'}}
              >
              last modified: {formatDate(props.post.modified) || ' -- '}
              </p>
              
            </div>
            {props.post.isPublication && publicationFeatureIsLive ? (
              <div style={{
                display:'flex',
                alignItems:'flex-start',
                flexDirection:'column'
                }}>
                
               <p 
                className='last-modified'
                style={{marginBottom:'4px'}}
              >
                {
                  <Link to={`/publication/${props.publication?.publicationHandle}`}>
                    {' '}
                    <span
                      style={{
                        textDecoration: 'underline',
                        color: colors.darkerBorderColor,
                      }}
                    >
                      In {props.publication?.publicationHandle}
                    </span>
                  </Link>
                }
              </p>
              </div>
                ) : null}
            <p 
                className='last-modified'
                style={{color:'#b5acac', marginBottom:'4px'}}
              >
              {props.readTime} min read
              </p>
          </div>
        );
    }
    else{
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <p className='last-modified'>
                last modified: {formatDate(props.post.modified) || ' -- '}
              </p>
              <p
                className='last-modified'
                style={{ marginLeft: '50px', color: '#b5acac' }}
              >
                {props.readTime} min read
              </p>
            </div>
            {props.post.isPublication && publicationFeatureIsLive ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div className='publication-avatar'>
                  <img
                    src={
                      props.publication?.publicationHandle.toLowerCase() ===
                      props.handle?.toLowerCase()
                        ? props.publication?.avatar
                        : images.DEFAULT_AVATAR
                    }
                    alt='background'
                    className='publication-logo'
                  />
                  <img
                    src={icons.PUBLICATION_ICON}
                    alt='publication-icon'
                    className='publication-icon'
                  />
                </div>
                <p className='last-modified'>
                  {
                    <Link
                      to={`/publication/${props.publication?.publicationHandle}`}
                    >
                      {' '}
                      <span
                        style={{
                          textDecoration: 'underline',
                          color: colors.darkerBorderColor,
                        }}
                      >
                        In {props.publication?.publicationHandle}
                      </span>
                    </Link>
                  }
                </p>
              </div>
            ) : null}
          </div>
        );
    }
    
  };
  
  export default PostInformation;













