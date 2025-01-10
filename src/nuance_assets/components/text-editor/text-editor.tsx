import React, { useState, Component, useEffect } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import PropTypes from 'prop-types';
import { icons } from '../../shared/constants';

type TextEditorProps = {
  onChange?: (value: string) => void;
};

class BreakOption extends Component<any, any> {
  static propTypes = {
    onChange: PropTypes.func,
    editorState: PropTypes.object,
  };

  AddBreak: Function = (): any => {
    return console.log('add break');
  };

  render() {
    return (
      <div
        onClick={() => this.AddBreak}
        style={{
          display: 'flex',
          alignItems: 'center',
          marginRight: '20px',
          marginLeft: '10px',
        }}
      >
        <img src={icons.editor.BREAK} />
      </div>
    );
  }
}

class QuoteOption extends Component<any, any> {
  static propTypes = {
    onChange: PropTypes.func,
    editorState: PropTypes.object,
  };

  toggleQuotes: Function = (): any => {
    return console.log('quote text');
  };

  render() {
    return (
      <div
        onClick={() => this.toggleQuotes}
        style={{ display: 'flex', alignItems: 'center', marginRight: '40px' }}
      >
        <img src={icons.editor.QUOTES} />
      </div>
    );
  }
}

const TextEditor: React.FC<TextEditorProps> = (props) => {
  //   const [editorState, setEditorState] = useState<EditorState>(
  //     EditorState.createEmpty()
  //   );
  // const [saving, setSaving] = useState<boolean>(false);
  // const [loading, setLoading] = useState<boolean>(true);

  const [postPictures, setPostPictures] = useState('');
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  const onEditorStateChange = (editorState: any) => {
    setEditorState(editorState);

    props.onChange &&
      props.onChange(
        draftToHtml(convertToRaw(editorState?.getCurrentContent()))
      );
  };

  // const onPostTextChange = (value: any) => {
  //   props.onChange && props.onChange(value.blocks[0].text);
  // };

  const UploadPicture = (e: any) => {
    console.log('e: ', e.target.files);
    const reader = new FileReader();
    if (e.target.files[0]) {
      reader.readAsDataURL(e.target.files[0]);
    }
    reader.onload = (event) => {
      setPostPictures(event?.target?.result as string);
    };
  };

  useEffect(() => {
    const testdiv = document.getElementById('test');
    if (testdiv) {
      testdiv.innerHTML = draftToHtml(
        convertToRaw(editorState?.getCurrentContent())
      );
    }
  }, [editorState]);

  console.log(
    'editor state: ' +
      draftToHtml(convertToRaw(editorState?.getCurrentContent()))
  );
  return (
    <div className='text-editor'>
      <Editor
        editorState={editorState}
        wrapperClassName='demo-wrapper'
        editorClassName='demo-editor'
        onEditorStateChange={onEditorStateChange}
        toolbarClassName='toolbarClassName'
        placeholder='Body...'
        toolbarCustomButtons={[<BreakOption />, <QuoteOption />]}
        toolbar={{
          options: ['blockType', 'inline', 'list', 'link', 'image'],
          inline: {
            inDropdown: false,
            className: undefined,
            component: undefined,
            dropdownClassName: undefined,
            options: ['bold', 'italic'],
            bold: { className: undefined, icon: icons.editor.BOLD },
            italic: { className: undefined, icon: icons.editor.ITALIC },
            underline: { className: undefined },
            strikethrough: { className: undefined },
            monospace: { className: undefined },
            superscript: { className: undefined },
            subscript: { className: undefined },
          },
          blockType: {
            inDropdown: true,
            options: [
              'Normal',
              'H1',
              'H2',
              'H3',
              'H4',
              'H5',
              'H6',
              'Blockquote',
              'Code',
            ],
            className: undefined,
            icon: icons.editor.SIZE,
            component: undefined,
            dropdownClassName: undefined,
          },

          list: {
            inDropdown: false,
            className: undefined,
            component: undefined,
            dropdownClassName: undefined,
            options: ['unordered', 'ordered'],
            unordered: { className: undefined, icon: icons.editor.LIST },
            ordered: { className: undefined, icon: icons.editor.LIST_NUMBERS },
          },

          link: {
            inDropdown: false,
            className: undefined,
            icon: icons.editor.LINK,
            component: undefined,
            popupClassName: undefined,
            dropdownClassName: undefined,
            showOpenOptionOnHover: true,
            defaultTargetOption: '_self',
            options: ['link', 'unlink'],
            link: { className: undefined },
            unlink: { className: undefined },
            linkCallback: undefined,
          },

          image: {
            className: undefined,
            component: undefined,
            popupClassName: undefined,
            urlEnabled: true,
            uploadEnabled: true,
            alignmentEnabled: true,
            previewImage: false,
            icon: icons.editor.PHOTO,
            inputAccept: 'image/gif,image/jpeg,image/jpg,image/png,image/svg',
            alt: { present: false, mandatory: false },
            defaultSize: {
              height: 'auto',
              width: 'auto',
            },
          },
        }}
      ></Editor>
      <textarea
        disabled
        value={draftToHtml(convertToRaw(editorState?.getCurrentContent()))}
      />
      {/* <div id='test'></div> */}
    </div>
  );
};

export default TextEditor;
