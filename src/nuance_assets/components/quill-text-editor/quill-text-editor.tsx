import 'highlight.js/styles/github-dark-dimmed.css';
import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import hljs from 'highlight.js';
import { CreateMLCEngine } from '@mlc-ai/web-llm';
import 'react-quill/dist/quill.snow.css';
import { modelConfig } from './model_config';

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
  clipboard: { matchVisual: false },
};

const formats = [
  'code-block', 'header', 'bold', 'italic', 'blockquote', 'list', 'bullet',
  'link', 'image', 'width', 'height', 'style', 'class', 'alt',
];

type Mode = 'autocomplete' | 'tone' | 'grammar' | 'quality';

const defaultPrompts = {
  autocomplete: 'You are a helpful blogging assistant. Suggest the next sentence for a blog. Only respond suggesting the next word or few words.',
  quality: 'Provide a quality assessment of this blog content and suggest improvements.',
  tone: 'Analyze the tone of this blog and suggest adjustments to match a professional style.',
  grammar: 'Check the grammar of this blog content and suggest corrections.',
};

interface QuillTextEditorProps {
  onChange: (html: string, text: string, isEmpty: boolean) => void;
  value: string;
  hasError: boolean;
  dark: boolean;
}

const QuillTextEditor: React.FC<QuillTextEditorProps> = ({ onChange, value, hasError, dark }) => {
  const [mode, setMode] = useState<Mode>('autocomplete');
  const [engine, setEngine] = useState<any>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(defaultPrompts[mode]);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(10);
  const [processing, setProcessing] = useState<boolean>(false);
  const [modelName, setModelName] = useState<string>(modelConfig.model_list[0]?.model_id || '');
  const quillRef = useRef<ReactQuill | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeModel();
  }, [modelName]);

  useEffect(() => {
    setPrompt(defaultPrompts[mode]);
    setOutput(null);
  }, [mode]);

  const initializeModel = async () => {
    setModelLoaded(false);
    setLoadingProgress(0);
    setLoadingError(null);
    try {
      const progressCallback = (progress: { progress: number }) => {
        setLoadingProgress(Math.round(progress.progress * 100));
      };
      const engineInstance = await CreateMLCEngine(modelName, { initProgressCallback: progressCallback });
      setEngine(engineInstance);
      setModelLoaded(true);
    } catch (error) {
      console.error('Error loading model:', error);
      setLoadingError('Failed to load model. Please try again or check your configuration.');
    }
  };

  const handleTextChange = (html: string, _delta: any, source: string, editor: any) => {
    const text = editor.getText().trim();
    const isEmpty = text.length === 0;
    onChange(html, text, isEmpty);

    if (!text || !modelLoaded) {
      setOutput(null);
      return;
    }

    if (mode === 'autocomplete') {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => processInput(text), 300); // Debounced input processing for autocomplete
    } else if (isSentenceComplete(text)) {
      processInput(text); // Process input only if the sentence is complete for other modes
    }
  };

  const isSentenceComplete = (text: string): boolean => {
    return /[.!?]$/.test(text); // Detect if the text ends with a sentence-ending punctuation
  };

  const processInput = async (text: string) => {
    if (!engine) return;

    setProcessing(true); // Show processing indicator
    try {
      const messages = [
        { role: 'system', content: prompt },
        { role: 'user', content: text },
      ];

      const result = await engine.chat.completions.create({
        messages,
        max_tokens: mode === 'autocomplete' ? 10 : 100,
        temperature,
      });

      setOutput(result.choices?.[0]?.message?.content?.trim() || null);
    } catch (error) {
      console.error(`Error in ${mode} mode:`, error);
    } finally {
      setProcessing(false); // Hide processing indicator
    }
  };

  return (
    <div className={dark ? 'editor-dark' : 'editor-light'}>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        {(['autocomplete', 'tone', 'grammar', 'quality'] as Mode[]).map((currentMode) => (
          <button
            key={currentMode}
            onClick={() => setMode(currentMode)}
            style={{
              padding: '5px 10px',
              border: mode === currentMode ? '2px solid #007BFF' : '1px solid #ddd',
              background: mode === currentMode ? '#E7F3FF' : '#fff',
              cursor: 'pointer',
            }}
          >
            {currentMode.toUpperCase()}
          </button>
        ))}
        <label style={{ marginLeft: 'auto' }}>Model:</label>
        <select
          style={{ marginLeft: '5px' }}
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
        >
          {modelConfig.model_list.map((model) => (
            <option key={model.model_id} value={model.model_id}>
              {model.model_id}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginTop: '10px' }}>
        <label>Prompt:</label>
        <input
          type="text"
          style={{ width: '100%', marginTop: '5px' }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      <ReactQuill
        ref={quillRef}
        modules={modules}
        formats={formats}
        value={value}
        placeholder="Start writing your blog content..."
        onChange={(html, delta, source, editor) => handleTextChange(html, delta, source, editor)}
      />
      <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd' }}>
        {processing && (
          <div
            style={{
              display: 'inline-block',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, #cafff2, #b2e8e0, #cafff2)',
              boxShadow: '0 0 10px #cafff2, 0 0 20px #b2e8e0',
              animation: 'spin 1s linear infinite, glow 1.5s ease-in-out infinite',
              verticalAlign: 'middle',
              marginLeft: '8px',
            }}
          />
        )}

        <style>
          {`
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 10px #cafff2, 0 0 20px #b2e8e0;
  }
  50% {
    box-shadow: 0 0 20px #eafffa, 0 0 30px #d8fff7;
  }
}
`}
        </style>


        {output && (
          <>
            <strong>{mode.toUpperCase()} Output:</strong>
            <p>{output}</p>
          </>
        )}
      </div>
      {!modelLoaded && (
        <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd' }}>
          {loadingError ? (
            <span style={{ color: 'red' }}>{loadingError}</span>
          ) : (
            <span>Loading model... {loadingProgress}%</span>
          )}
        </div>
      )}
      {hasError && <div className="error-message">Error: Please check the content!</div>}
    </div>
  );
};

export default QuillTextEditor;
