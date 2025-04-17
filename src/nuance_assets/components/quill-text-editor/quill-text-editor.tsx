import '../../shared/styles/customQuill.css';
import 'highlight.js/styles/github-dark-dimmed.css';
import React, { useEffect, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import ImageCompress from './modules/quill-image-compress/quill.imageCompressor.js';
import ImageResize from './modules/quill-image-resize/quill-image-resize.js';
import hljs from 'highlight.js';
import { createWebLLMAutocomplete } from './modules/quill-webllm-autocomplete';

// Register additional modules.
Quill.register('modules/imageCompress', ImageCompress);
Quill.register('modules/imageResize', ImageResize);
Quill.register('modules/webllm', createWebLLMAutocomplete);

hljs.configure({
  languages: ['javascript', 'ruby', 'python', 'rust'],
});

const modules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic'],
      [{ list: 'bullet' }, { list: 'ordered' }],
      ['link', 'image'],
      ['blockquote'],
      ['code-block'],
      ['autocompleteToggle'], // custom toggle button.
    ],
    handlers: {
      autocompleteToggle: () => { }, // Handler set below in useEffect.
    },
  },
  syntax: {
    highlight: (text: any) => hljs.highlightAuto(text).value,
  },
  clipboard: { matchVisual: false },
  imageResize: { modules: ['Resize', 'DisplaySize'] },
  imageCompress: {
    quality: 0.9,
    maxWidth: 1000,
    maxHeight: 1000,
    imageType: 'image/jpeg',
  },
  webllm: { autocomplete: true },
};

type TextEditorProps = {
  onChange?: (html: string, text: string, isEmpty: boolean) => void;
  value: string;
  hasError: boolean;
  dark?: boolean;
};

const QuillTextEditor: React.FC<TextEditorProps> = (props) => {
  const quillRef = useRef<ReactQuill>(null);

  const formats = [
    'header',
    'bold',
    'italic',
    'blockquote',
    'list',
    'bullet',
    'link',
    'image',
    'code-block',
    'width',
    'height',
    'style',
    'class',
    'alt',
  ];

  const onChangeHandler = (html: any, delta: any, source: any, editor: any) => {
    const text = editor.getText().trim();
    const isEmpty = text.length === 0;
    props.onChange && props.onChange(html, text, isEmpty);
  };

  const className = props.hasError
    ? props.dark
      ? 'has-error text-editor-dark'
      : 'has-error text-editor'
    : props.dark
      ? 'text-editor-dark'
      : 'text-editor';

  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const toolbar = editor.getModule('toolbar');
    toolbar.addHandler('autocompleteToggle', () => {
      const webllmModule = editor.getModule('webllm');
      if (webllmModule && typeof webllmModule.toggleAutocomplete === 'function') {
        webllmModule.toggleAutocomplete();
      }
    });
  }, []);

  return (
    <div className={className}>
      <ReactQuill
        ref={quillRef}
        modules={modules}
        formats={formats}
        placeholder="Body..."
        onChange={onChangeHandler}
        value={props.value}
      />
    </div>
  );
};

export default QuillTextEditor;
