import 'highlight.js/styles/github-dark-dimmed.css';
import React, { useState, useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import hljs from 'highlight.js';
import { pipeline } from '@xenova/transformers';
import 'react-quill/dist/quill.snow.css';

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
    highlight: (text: any) => hljs.highlightAuto(text).value,
  },
  clipboard: { matchVisual: false },
};

const formats = [
  'code-block', 'header', 'bold', 'italic', 'blockquote', 'list', 'bullet',
  'link', 'image', 'width', 'height', 'style', 'class', 'alt'
];

type Mode = 'autocomplete' | 'tone' | 'grammar';

type TextEditorProps = {
  onChange?: (html: string, text: string, isEmpty: boolean) => void;
  value: string;
  hasError: boolean;
  dark?: boolean;
};

const QuillTextEditor: React.FC<TextEditorProps> = ({ onChange, value, hasError, dark }) => {
  const [mode, setMode] = useState<Mode>('autocomplete');
  const [modelLoaded, setModelLoaded] = useState(false);

  const [generator, setGenerator] = useState<null | ((text: string, options?: any) => Promise<any>)>(null);
  const [classifier, setClassifier] = useState<null | ((text: string, options?: any) => Promise<any>)>(null);
  const [grammarChecker, setGrammarChecker] = useState<null | ((text: string, options?: any) => Promise<any>)>(null);

  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [tone, setTone] = useState<string | null>(null);
  const [grammarMessage, setGrammarMessage] = useState<string | null>(null);

  const [prompt, setPrompt] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(3);
  const [modelName, setModelName] = useState<string>('Xenova/gpt2');

  const quillRef = useRef<ReactQuill | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadAutocompleteModel(modelName);
    preloadSentimentModel();
    preloadGrammarModel();
  }, [modelName]);

  const loadAutocompleteModel = async (model: string) => {
    setModelLoaded(false);
    setGenerator(null);
    try {
      const pipe = await pipeline('text-generation', model, {
        revision: 'main',
        quantized: true,
      });
      if (typeof pipe === 'function') {
        setGenerator(() => pipe);
        setModelLoaded(true);
      } else {
        console.error('Pipeline did not return a function.');
      }
    } catch (err) {
      console.error('Error loading pipeline:', err);
    }
  };

  const preloadSentimentModel = async () => {
    if (classifier) return;
    try {
      const sentimentPipe = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );
      if (typeof sentimentPipe === 'function') {
        setClassifier(() => sentimentPipe);
      } else {
        console.error('Sentiment pipeline did not return a function.');
      }
    } catch (err) {
      console.error('Error loading sentiment pipeline:', err);
    }
  };

  const preloadGrammarModel = async () => {
    if (grammarChecker) return;
    try {
      // Grammar correction model
      const grammarPipe = await pipeline(
        'text2text-generation',
        'prithivida/grammar_error_correcter_v1'
      );
      if (typeof grammarPipe === 'function') {
        setGrammarChecker(() => grammarPipe);
      } else {
        console.error('Grammar pipeline did not return a function.');
      }
    } catch (err) {
      console.error('Error loading grammar pipeline:', err);
    }
  };

  const generateSuggestion = async (text: string) => {
    if (!modelLoaded || typeof generator !== 'function') return;
    try {
      const formattedPrompt = prompt.trim().length > 0
        ? `You are a helpful writing assistant. Here is some user text:\n\n${text}\n\nGiven this, continue and suggest the next few words:\n`
        : text;

      const output = await generator(formattedPrompt, { max_new_tokens: maxTokens, temperature });
      if (Array.isArray(output) && output.length > 0 && output[0].generated_text) {
        const fullText = output[0].generated_text;
        const completion = fullText.slice(formattedPrompt.length).trim();
        setSuggestion(completion || null);
      } else {
        console.log('Unexpected output format:', output);
      }
    } catch (e) {
      console.error('Error generating suggestion:', e);
    }
  };

  const analyzeTone = async (fullText: string) => {
    if (!classifier) await preloadSentimentModel();
    if (!classifier) return;
    try {
      const output = await classifier!(fullText);
      if (Array.isArray(output) && output.length > 0 && output[0].label) {
        setTone(output[0].label);
      } else {
        console.log('Unexpected sentiment output:', output);
      }
    } catch (e) {
      console.error('Error analyzing tone:', e);
    }
  };

  const analyzeGrammar = async (fullText: string) => {
    if (!grammarChecker) await preloadGrammarModel();
    if (!grammarChecker) return;

    try {
      const output = await grammarChecker!(fullText);
      // The grammar model returns corrected text as `output[0].generated_text`
      if (Array.isArray(output) && output.length > 0 && output[0].generated_text) {
        const corrected = output[0].generated_text.trim();
        // Compare corrected text to original
        if (corrected.toLowerCase() !== fullText.trim().toLowerCase()) {
          setGrammarMessage("Grammar issues detected (corrections suggested).");
        } else {
          setGrammarMessage("No grammar issues detected.");
        }
      } else {
        console.log('Unexpected grammar output:', output);
      }
    } catch (e) {
      console.error('Error analyzing grammar:', e);
    }
  };

  const handleTextChange = (html: string, delta: any, source: any, editor: any) => {
    const text = editor.getText().trim();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(async () => {
      if (text.length > 0 && modelLoaded) {
        if (mode === 'autocomplete') {
          setTone(null);
          setGrammarMessage(null);
          await generateSuggestion(text);
        } else if (mode === 'tone') {
          setSuggestion(null);
          setGrammarMessage(null);
          await analyzeTone(text);
        } else if (mode === 'grammar') {
          setSuggestion(null);
          setTone(null);
          await analyzeGrammar(text);
        }
      } else {
        setSuggestion(null);
        setTone(null);
        setGrammarMessage(null);
      }
    }, 500);

    onChange && onChange(html, text, text.length === 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode === 'autocomplete' && e.key === 'Tab' && suggestion && quillRef.current) {
      e.preventDefault();
      const editor = quillRef.current.getEditor();
      editor.insertText(editor.getLength() - 1, ' ' + suggestion + ' ');
      setSuggestion(null);
    }
  };

  const toggleMode = () => {
    let newMode: Mode;
    if (mode === 'autocomplete') newMode = 'tone';
    else if (mode === 'tone') newMode = 'grammar';
    else newMode = 'autocomplete';

    setMode(newMode);
    setSuggestion(null);
    setTone(null);
    setGrammarMessage(null);
  };

  const className = hasError
    ? (dark ? 'has-error text-editor-dark' : 'has-editor')
    : (dark ? 'text-editor-dark' : 'text-editor');

  return (
    <div className={className} onKeyDown={handleKeyDown}>
      <div style={{ marginBottom: '10px' }}>
        <label>Prompt (optional): </label>
        <input
          type="text"
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: '5px' }}
          placeholder="Enter a guiding prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <label>Temperature: </label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="1.5"
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: '5px' }}
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
        />
        <label>Max New Tokens: </label>
        <input
          type="number"
          min="1"
          max="10"
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: '5px' }}
          value={maxTokens}
          onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
        />
        <label>Model: </label>
        <select
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: '5px' }}
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
        >
          <option value="Xenova/gpt2">GPT-2</option>
          <option value="Xenova/distilgpt2">DistilGPT-2</option>
        </select>
        <button onClick={toggleMode}>
          {mode === 'autocomplete' ? 'Switch to Tone Analysis' :
            mode === 'tone' ? 'Switch to Grammar Check' : 'Switch to Autocomplete'}
        </button>
      </div>
      <ReactQuill
        ref={quillRef}
        modules={modules}
        formats={formats}
        placeholder="Start writing..."
        onChange={handleTextChange}
        value={value}
      />
      {mode === 'autocomplete' && suggestion && (
        <div className="autocomplete-suggestion">
          <span>{suggestion}</span>
        </div>
      )}
      {mode === 'tone' && tone && (
        <div className="tone-indicator">
          <strong>Tone: {tone}</strong>
        </div>
      )}
      {mode === 'grammar' && grammarMessage && (
        <div className="grammar-indicator">
          <strong>{grammarMessage}</strong>
        </div>
      )}
      {!modelLoaded && <div>Loading autocomplete model, please wait...</div>}
    </div>
  );
};

export default QuillTextEditor;
