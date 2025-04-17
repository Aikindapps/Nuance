import { COMMON_WORDS } from './commonWords';

export function getWordCompletion(token: string): string {
  if (!token) return '';
  const firstChar = token[0].toLowerCase();
  const candidates = COMMON_WORDS[firstChar];
  if (!candidates) return '';
  const match = candidates.find(word => word.startsWith(token) && word.length > token.length);
  return match ? match.slice(token.length) : '';
}
