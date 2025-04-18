import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { modelConfig } from '../model_config';
import { getPhraseCompletion } from './phraseCompletion';

let engine: any = null;
let currentModelID: string | null = null;

async function ensureEngine(modelID: string) {
  if (!engine || currentModelID !== modelID) {
    engine = await CreateMLCEngine(modelID);
    currentModelID = modelID;
  }
}

addEventListener('message', async (e: MessageEvent<{ id: number; text: string; index: number; modelID: string }>) => {
  const { id, text, index, modelID } = e.data;
  await ensureEngine(modelID);
  const phrase = await getPhraseCompletion(engine, text);
  postMessage({ id, suggestion: phrase?.trim() ?? '', index });
});