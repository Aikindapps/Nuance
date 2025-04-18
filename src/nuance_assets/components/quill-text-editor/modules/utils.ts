// utils.ts
export function isChatModel(engine: any): boolean {
    return engine && engine.chat && typeof engine.chat.completions?.create === 'function';
  }
  