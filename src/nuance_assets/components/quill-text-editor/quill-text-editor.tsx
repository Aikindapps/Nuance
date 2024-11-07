import '../../shared/styles/customQuill.css';
import 'highlight.js/styles/github-dark-dimmed.css';
import React from 'react';
import ReactQuill, { Quill } from 'react-quill';
import ImageCompress from './modules/quill-image-compress/quill.imageCompressor.js';
import ImageResize from './modules/quill-image-resize/quill-image-resize.js';
import hljs from 'highlight.js';

//Includes ImageDrop module
Quill.register('modules/imageCompress', ImageCompress);
Quill.register('modules/imageResize', ImageResize);

type TextEditorProps = {
  onChange?: (html: string, text: string, isEmpty: boolean) => void;
  value: string;
  hasError: boolean;
  dark?: boolean;
};


hljs.configure({
  languages: ['javascript', 'ruby', 'python', 'rust'],
});

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic'],
    [{ list: 'bullet' }, { list: 'ordered' }],
    ['link', 'image'],
    ['blockquote'],
    ['code-block'],
  ],

  syntax: {
    highlight: (text: string) => hljs.highlightAuto(text).value,
  },
  clipboard: {
    matchVisual: false,
  },

  imageResize: {
    modules: ['Resize', 'DisplaySize'],
  },

  imageCompress: {
    quality: 0.9,
    maxWidth: 1000, // default
    maxHeight: 1000, // default
    imageType: 'image/jpeg', // default
    debug: true, // default
    suppressErrorLogging: false, // default
  },
};

const QuillTextEditor: React.FC<TextEditorProps> = (props) => {
  const formats = [
    'code-block',
    'header',
    'bold',
    'italic',
    'blockquote',
    'list',
    'bullet',
    'link',
    'image',
    'width',
    'height',
    'style',
    'class',
    'alt',
  ];

  const onChangeHandler = (html: any, delta: any, source: any, editor: any) => {
    const text = editor.getText(html).trim();
    const isEmpty = text.length === 0;
    props.onChange && props.onChange(html, text, isEmpty);
  };

  const className = props.hasError
    ? props.dark
      ? 'has-error text-editor-dark'
      : 'has-editor'
    : props.dark
      ? 'text-editor-dark'
      : 'text-editor';

  return (
    <div className={className}>
      <ReactQuill
        modules={modules}
        formats={formats}
        placeholder='Body...'
        onChange={onChangeHandler}
        value={props.value}
      ></ReactQuill>
    </div>
  );
};

export default QuillTextEditor;
