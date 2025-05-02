import { isChatModel } from './utils';

const LOADING_COLOR = "#FFA500"; // Changed to orange

export async function getPhraseCompletion(
  mlEngine: any,
  context: string
): Promise<string> {
  const messages = [
    {
      role: 'system',
      content: `You are an AI text completion assistant. Continue the user's text with a coherent phrase or sentence.
                Write a phrase that naturally follows from the given context.
                Do NOT return any special tokens, metadata or explanations - ONLY the completion text without quotes. Also do not include elipses e.g. "..."`
    },
    { role: 'user', content: `Complete this text: "${context}"` }
  ];

  const options = {
    max_tokens: 25,
    temperature: 0.7,
    stop: []
  };

  let raw = '';

  // Add a method to cancel ongoing requests
  const cancelOngoingRequests = (): void => {
    if (mlEngine && typeof mlEngine.cancel === 'function') {
      mlEngine.cancel();
    }
  };

  if (isChatModel(mlEngine)) {
    cancelOngoingRequests();
    const resp = await mlEngine.chat.completions.create({ messages, ...options });
    if (
      resp &&
      Array.isArray(resp.choices) &&
      resp.choices[0] != null &&
      typeof resp.choices[0].message?.content === 'string'
    ) {
      raw = resp.choices[0].message.content;
    } else {
      raw = '';
    }
  } else {
    cancelOngoingRequests();
    const prompt = context;
    const resp = await mlEngine.text.completions.create({ prompt, ...options });
    if (
      resp &&
      Array.isArray(resp.choices) &&
      resp.choices[0] != null &&
      typeof resp.choices[0].text === 'string'
    ) {
      raw = resp.choices[0].text;
    } else {
      raw = '';
    }
  }

  let cleaned = raw.trim();
  const prefixesToRemove = [
    "Here's a completion:",
    "Completion:",
    "Here is a continuation:",
    "I'll continue this:"
  ];

  for (const prefix of prefixesToRemove) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.substring(prefix.length).trim();
    }
  }

  // Strip leading/trailing straight or smart quotes
  cleaned = cleaned.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();

  return cleaned;
}
