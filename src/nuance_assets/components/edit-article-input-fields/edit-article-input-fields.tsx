import React, { useEffect } from 'react';
import { formatDate } from '../../shared/utils';
import { PostType } from '../../types/types';
import InputField2 from '../../UI/InputField2/InputField2';
import { colors, icons } from '../../shared/constants';
import RequiredFieldMessage from '../required-field-message/required-field-message';
import QuillTextEditor from '../quill-text-editor/quill-text-editor';
import TagsAutocomplete from '../tags/tags-autocomplete';
import { ToastType, toast } from '../../services/toastService';
import { TagModel } from '../../../declarations/PostCore/PostCore.did';
import { useLocation } from 'react-router-dom';

export const EditArticleInputFields = (props: {
  isMobile: boolean;
  lastSavedPost: PostType | undefined;
  savingPost: PostType;
  postHtml: string;
  darkTheme: boolean;
  titleRef: React.MutableRefObject<any>;
  bodyRef: React.MutableRefObject<any>;
  introRef: React.MutableRefObject<any>;
  tagsRef: React.MutableRefObject<any>;
  titleWarning: boolean;
  introWarning: boolean;
  bodyWarning: boolean;
  tagsWarning: boolean;
  onPostTitleChange: (postTitle: string) => void;
  onPostTextChange: (html: string, text: string, isEmpty: boolean) => void;
  onPostSubTitleChange: (postTitle: string) => void;
  onPostImageChange: (e: any) => void;
  getTagNames: () => string[];
  onPostTagChange: (vals: string[]) => void;
  allTags: TagModel[] | undefined;
}) => {

  return (
    <div style={{ width: '100%' }}>
      {props.isMobile && (
        <p className='edit-article-right-text'>
          last modified: {formatDate(props.lastSavedPost?.modified) || ' - '}
        </p>
      )}

      <div className='input-wrapper' ref={props.titleRef}>
        <InputField2
          classname='input-attributes2'
          width='100%'
          height='53px'
          defaultText='Title...'
          fontSize='48px'
          fontFamily='Georgia'
          fontColor={colors.primaryTextColor}
          hasError={props.titleWarning}
          value={props.savingPost.title}
          onChange={props.onPostTitleChange}
          theme={props.darkTheme ? 'dark' : 'light'}
        ></InputField2>
      </div>
      <div style={{ position: 'relative', top: '-20px' }}>
        {<RequiredFieldMessage hasError={props.titleWarning} />}
      </div>

      <div className='input-wrapper' ref={props.introRef}>
        <InputField2
          classname='input-attributes2'
          width='100%'
          height='24px'
          defaultText='Intro...'
          fontSize='22px'
          fontFamily='Roboto'
          fontColor={colors.darkerBorderColor}
          hasError={props.introWarning}
          value={props.savingPost.subtitle}
          onChange={props.onPostSubTitleChange}
          theme={props.darkTheme ? 'dark' : 'light'}
        ></InputField2>
      </div>

      <div style={{ position: 'relative', top: '-20px' }}>
        {<RequiredFieldMessage hasError={props.introWarning} />}
      </div>
      <input
        id='file'
        type='file'
        style={{ display: 'none' }}
        required
        onChange={props.onPostImageChange}
      />
      {props.savingPost.headerImage.length !== 0 ? (
        <label htmlFor='file' className='edit-article-uploaded-pic-wrapper'>
          <img
            className='uploaded-pic'
            src={props.savingPost.headerImage}
            alt='background'
            onChange={props.onPostImageChange}
          />
        </label>
      ) : (
        <label htmlFor='file' className='edit-article-upload-picture-button'>
          <img
            className='button-icon'
            src={icons.UPLOAD_PICTURE}
            alt='background'
          />
        </label>
      )}
      <div className='input-wrapper quill' ref={props.bodyRef}>
        <QuillTextEditor
          onChange={props.onPostTextChange}
          value={props.postHtml}
          hasError={props.bodyWarning}
          dark={props.darkTheme}
        />
      </div>
      {<RequiredFieldMessage hasError={props.bodyWarning} />}
      <div className='input-wrapper'>
        <TagsAutocomplete
          placeholder='Tag ...'
          value={props.getTagNames()}
          options={(props.allTags || []).map((tag) => tag.value)}
          maxAllowedTags={3}
          onChange={props.onPostTagChange}
          onValidationError={(errorMessage: string) => {
            toast(errorMessage, ToastType.Plain);
          }}
          hasError={props.tagsWarning}
          dark={props.darkTheme}
        />
      </div>
      <div ref={props.tagsRef}>
        <RequiredFieldMessage hasError={props.tagsWarning} />
      </div>
    </div>
  );
};
