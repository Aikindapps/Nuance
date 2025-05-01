import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { modelConfig } from '../model_config';
import { COMMON_WORDS } from './commonWords';
import {toastError} from '../../../services/toastService';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { HiSparkles, HiOutlineSparkles } from 'react-icons/hi';

export interface QuillRange {
  index: number;
  length: number;
}

export interface Quill {
  focus(): unknown;
  container: HTMLElement;
  root: HTMLElement;
  on(event: string, callback: (...args: any[]) => void): void;
  getSelection(): QuillRange | null;
  getText(start?: number, end?: number): string;
  getBounds(index: number): { top: number; left: number; width: number; height: number };
  insertText(index: number, text: string, source: string): void;
  deleteText(index: number, length: number, source?: string): void;
  formatText(index: number, length: number, formats: { [key: string]: any }, source?: string): void;
  setSelection(index: number, length: number, source: string): void;
  keyboard: any;
  getLeaf(index: number): [any, number];
}

export interface WebLLMAutocompleteOptions {
  wordDebounceTime?: number;
  phraseDebounceTime?: number;
  usePhrasesEnabled?: boolean;
}

/* Helper: Synchronous word-level completion. */
function getWordCompletion(token: string): string {
  if (!token) return '';
  const firstChar = token[0].toLowerCase();
  const candidates = COMMON_WORDS[firstChar];
  if (!candidates) return '';
  const match = candidates.find(word => word.startsWith(token) && word.length > token.length);
  return match ? match.slice(token.length) : '';
}

// Add WebGPU check
function hasWebGPU(): boolean {
  return typeof (navigator as any).gpu !== 'undefined';
}

// Add VRAM threshold
const VRAM_REQUIREMENT_MB = 2951.51;
function hasSufficientVRAM(): boolean {
  const deviceMemory = (navigator as any).deviceMemory || 4; // in GB
  return deviceMemory * 1024 >= VRAM_REQUIREMENT_MB;
}

/* Helpers to decide model usage */
function canRunHeavyModels(): boolean {
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  return !isMobile
      && deviceMemory >= 4
      && cores >= 4
      && hasSufficientVRAM()
      && hasWebGPU();
}

function selectPhraseModel(): string {
  const matcher = (m: { model_id: string }) => m.model_id.includes('Llama-3.2-3B-Instruct-q4f32_1-MLC');
  if (canRunHeavyModels()) {
    const found = modelConfig.model_list.find(matcher);
    if (found) return found.model_id;
  }
  return "Llama-3.2-3B-Instruct-q4f32_1-MLC";
}

// spawn a worker for heavy phrase completions
const completionWorker = new Worker(
  new URL('./quill-webllm-autocomplete.worker.ts', import.meta.url)
);

export function createWebLLMAutocomplete(quill: Quill, options?: WebLLMAutocompleteOptions) {
  const opts: WebLLMAutocompleteOptions = {
    wordDebounceTime: 200,
    phraseDebounceTime: 600,
    usePhrasesEnabled: true,
    ...options,
  };

  // log for unsupported WebGPU, but don’t disable automatically
  if (!hasWebGPU()) {
    console.log('WebGPU not supported; AI completions will fall back or be disabled until toggled.');
  }

  let engine: any = null;
  const phraseModelID = selectPhraseModel();
  let suggestion = '';
  let autocompleteEnabled = canRunHeavyModels();
  let currentToken = '';
  let currentTokenStart: number | null = null;
  let completionType: 'word' | 'phrase' | null = null;
  let wordDebounceTimeout: number | null = null;
  let phraseDebounceTimeout: number | null = null;
  let ghostSpan: HTMLSpanElement;
  const spellingCache = new Map<string, string>();
  let requestCounter = 0;  // increment on each text change to track fresh requests

  // track the latest phrase‐request
  let workerRequestId = 0;
  completionWorker.onmessage = ({ data }) => {
    const { id, suggestion: workerSuggestion, index: workerIndex } = data;
    if (id !== workerRequestId) return;
    suggestion = workerSuggestion;
    showSuggestion({ index: workerIndex, length: 0 });
  };

  // toggle autocomplete icon: on/off
  const updateToolbarStatus = (enabled: boolean): void => {
    const parent = quill.container.parentNode;
    const toolbarButton = parent?.querySelector('.ql-toolbar .ql-autocompleteToggle') as HTMLElement | null;
    if (toolbarButton) {
      const IconComp = enabled ? HiSparkles : HiOutlineSparkles;
      const svg = ReactDOMServer.renderToStaticMarkup(
        React.createElement(IconComp, { size: 18, color: '#000' })
      );
      toolbarButton.innerHTML = svg;
    }
  };

  const initEngine = async (): Promise<void> => {
    try {
      engine = await CreateMLCEngine(phraseModelID);
      updateToolbarStatus(true);
    } catch {
      updateToolbarStatus(false);
    }
  };

  const clearSuggestion = (): void => {
    suggestion = '';
    completionType = null;
    if (ghostSpan) ghostSpan.style.display = 'none';
  };

  const injectGhostSpan = (): void => {
    ghostSpan = document.createElement('span');
    // inherit editor font metrics
    const computed = window.getComputedStyle(quill.root);
    Object.assign(ghostSpan.style, {
      position: 'absolute',
      opacity: '0.4',
      pointerEvents: 'none',
      color: '#999',
      whiteSpace: 'pre',
      display: 'none',
      zIndex: '1000',
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      lineHeight: computed.lineHeight,
    });
    // attach to editor container for overlay alignment
    quill.container.style.position = 'relative';
    quill.container.style.overflow = 'visible';
    quill.container.appendChild(ghostSpan);
  };

  const showSuggestion = (range: QuillRange): void => {
    if (!ghostSpan) injectGhostSpan();
    if (!suggestion) return clearSuggestion();
    // use Quill bounds for positioning
    const bounds = quill.getBounds(range.index);
    ghostSpan.textContent = suggestion;
    ghostSpan.style.top = `${bounds.top}px`;
    ghostSpan.style.left = `${bounds.left}px`;
    ghostSpan.style.display = 'block';
  };

  const acceptSuggestion = (range: QuillRange): void => {
    if (!suggestion) return;
    quill.focus();
    const insertText = suggestion.trim();
    clearSuggestion();
    quill.insertText(range.index, insertText, 'user');
    quill.setSelection(range.index + insertText.length, 0, 'user');
    currentToken = '';
    currentTokenStart = null;
    completionType = null;
  };

  const cancelPendingCompletions = (): void => {
    if (wordDebounceTimeout !== null) clearTimeout(wordDebounceTimeout);
    if (phraseDebounceTimeout !== null) clearTimeout(phraseDebounceTimeout);
  };

  const cancelOngoingRequests = (): void => {
    if (engine && typeof engine.cancel === 'function') {
      engine.cancel();
    }
  };

  const onTextChange = (): void => {
    if (!autocompleteEnabled) return;
    requestCounter++;
    clearSuggestion();  // drop any visible ghost immediately
    cancelPendingCompletions();
    cancelOngoingRequests();  // added to cancel requests immediately on text change

    const range = quill.getSelection();
    if (!range) return;
    const index = range.index;
    const text = quill.getText();
    const textBefore = text.slice(Math.max(0, index - 150), index);
    const textAfter = text.slice(index);

    // Word-level completion.
    const wordMatch = textBefore.match(/\b([a-zA-Z]+)$/);
    if (wordMatch) {
      currentToken = wordMatch[1];
      currentTokenStart = index - currentToken.length;
      if (currentToken.length >= 2) {
        completionType = 'word';
        const thisRequestId = requestCounter;
        const originalIndex = index;
        wordDebounceTimeout = window.setTimeout(() => {
          const cb = () => {
            if (thisRequestId !== requestCounter) return;
            const sel = quill.getSelection();
            if (!sel || sel.index !== originalIndex) return;
            const wordComp = getWordCompletion(currentToken);
            if (wordComp) {
              suggestion = wordComp;
              spellingCache.set(currentToken, currentToken + wordComp);
              showSuggestion(range);
            } else if (spellingCache.has(currentToken)) {
              const cached = spellingCache.get(currentToken)!;
              suggestion = cached.slice(currentToken.length);
              showSuggestion(range);
            } else {
              clearSuggestion();
            }
          };
          if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(cb);
          } else {
            cb();
          }
        }, opts.wordDebounceTime);
        return;
      }
    }

    // Phrase‐level completion: post to worker
    if (opts.usePhrasesEnabled &&
        (/\s$/.test(textBefore) || /[.?!]$/.test(textBefore))) {
      completionType = 'phrase';
      const originalIndex = range.index;
      phraseDebounceTimeout = window.setTimeout(() => {
        const id = ++workerRequestId;
        const txt = textBefore.trim();
        const mdl = phraseModelID;
        const post = () => completionWorker.postMessage({ id, text: txt, index: originalIndex, modelID: mdl });
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(post);
        } else {
          post();
        }
      }, opts.phraseDebounceTime);
    } else {
      clearSuggestion();
    }
  };

  const registerListeners = (): void => {
    quill.on('text-change', (_delta, _oldDelta, source) => {
      if (source === 'user') onTextChange();
    });

    // Remove direct DOM input listener to avoid interfering with debounce
    // quill.root.addEventListener('input', cancelOngoingRequests);

    // Remove Quill's default Tab handlers
    if (quill.keyboard.bindings[9]) {
      quill.keyboard.bindings[9].length = 0;
    }

    // Then add your custom Tab binding
    quill.keyboard.addBinding({ key: 9 }, (range: QuillRange) => {
      if (suggestion) {
        acceptSuggestion(range);
        return false; // prevents indentation
      }
      return true; // fallback if no suggestion
    });

    // Root-level Tab binding.
    quill.root.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        const range = quill.getSelection();
        if (range) acceptSuggestion(range);
      }
    });

  };

  // initialize ghost overlay and listeners
  injectGhostSpan();
  updateToolbarStatus(autocompleteEnabled);
  registerListeners();

  return {
    toggleAutocomplete: () => {
      // prevent enabling on low‑power devices
      if (!canRunHeavyModels()) {
        toastError('This device does not meet the minimum performance requirements for AI-powered completions.');
        return;
      }
      autocompleteEnabled = !autocompleteEnabled;
      updateToolbarStatus(autocompleteEnabled);
      if (!autocompleteEnabled) clearSuggestion();
    },
    setUsePhrasesEnabled: (enabled: boolean) => {
      opts.usePhrasesEnabled = enabled;
    }
  };
}
