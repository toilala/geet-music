import { readJson, writeJson } from '@/core/storage';

export type AiLogEntry = { id: string; category: string; message: string; createdAt: number };
const KEY = '@geet/echo-ai/logs-v1';

export async function logAiEvent(category: string, message: string): Promise<void> {
  const entries = await readJson<AiLogEntry[]>(KEY, []);
  entries.unshift({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, category, message, createdAt: Date.now() });
  await writeJson(KEY, entries.slice(0, 100));
}

export async function readAiLogs(): Promise<AiLogEntry[]> { return readJson(KEY, []); }
