import { readMusicFlowPreferences, updateEchoCorePreferences, type MusicFlowPreferences } from '@/core/preferences';

export type { MusicFlowPreferences };

export async function getMusicFlowPreferences(): Promise<MusicFlowPreferences> {
  return readMusicFlowPreferences();
}

export async function setMusicFlowPreferences(patch: Partial<MusicFlowPreferences>): Promise<MusicFlowPreferences> {
  await updateEchoCorePreferences(patch);
  return readMusicFlowPreferences();
}
