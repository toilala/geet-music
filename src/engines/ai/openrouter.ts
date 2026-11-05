import { readEchoCorePreferences } from '@/core/preferences';

export type AiSongRequest = { title: string; artist: string };

function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && (parsed.hostname === 'openrouter.ai' || parsed.hostname.endsWith('.openrouter.ai'));
  } catch {
    return false;
  }
}

export async function requestOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  const preferences = await readEchoCorePreferences();
  const apiKey = preferences.openRouterApiKey || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
  if (preferences.aiProvider === 'Puter') return '[]';
  if (!apiKey) throw new Error('OpenRouter API key is missing.');
  if (!isUrlSafe(preferences.openRouterBaseUrl)) throw new Error('Restricted or unsafe AI endpoint destination.');
  const response = await fetch(preferences.openRouterBaseUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: preferences.openRouterModel, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] }),
  });
  if (!response.ok) throw new Error(`AI request failed: ${response.status}`);
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

export function parseAiJson<T>(value: string, fallback: T): T {
  try {
    const clean = value.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(clean) as T;
  } catch {
    return fallback;
  }
}
