import { readJson, writeJson } from '@/core/storage';

const KEY = '@geet/echo-core/preferences-v1';

export type EchoCorePreferences = {
  musicFlowEnabled: boolean;
  musicFlowAutoplay: boolean;
  musicFlowAutoNext: boolean;
  musicFlowAnimatedBackground: boolean;
  musicFlowLyrics: boolean;
  musicFlowCellularPrefetch: boolean;
  musicFlowHideRecent: boolean;
  dataSaver: boolean;
  hideExplicit: boolean;
  hideVideoSongs: boolean;
  lastFmUsername: string;
  aiProvider: 'OpenRouter' | 'Puter';
  openRouterApiKey: string;
  openRouterBaseUrl: string;
  openRouterModel: string;
};

export const DEFAULT_ECHO_CORE_PREFERENCES: EchoCorePreferences = {
  musicFlowEnabled: true,
  musicFlowAutoplay: true,
  musicFlowAutoNext: true,
  musicFlowAnimatedBackground: false,
  musicFlowLyrics: true,
  musicFlowCellularPrefetch: true,
  musicFlowHideRecent: true,
  dataSaver: false,
  hideExplicit: false,
  hideVideoSongs: false,
  lastFmUsername: '',
  aiProvider: 'OpenRouter',
  openRouterApiKey: '',
  openRouterBaseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  openRouterModel: 'openrouter/free',
};

export async function readEchoCorePreferences(): Promise<EchoCorePreferences> {
  const stored = await readJson<Partial<EchoCorePreferences>>(KEY, {});
  return { ...DEFAULT_ECHO_CORE_PREFERENCES, ...stored };
}

export async function updateEchoCorePreferences(
  patch: Partial<EchoCorePreferences>,
): Promise<EchoCorePreferences> {
  const next = { ...(await readEchoCorePreferences()), ...patch };
  await writeJson(KEY, next);
  return next;
}

export type MusicFlowPreferences = Pick<
  EchoCorePreferences,
  | 'musicFlowEnabled'
  | 'musicFlowAutoplay'
  | 'musicFlowAutoNext'
  | 'musicFlowAnimatedBackground'
  | 'musicFlowLyrics'
  | 'musicFlowCellularPrefetch'
  | 'musicFlowHideRecent'
  | 'dataSaver'
>;

export async function readMusicFlowPreferences(): Promise<MusicFlowPreferences> {
  const preferences = await readEchoCorePreferences();
  return {
    musicFlowEnabled: preferences.musicFlowEnabled,
    musicFlowAutoplay: preferences.musicFlowAutoplay,
    musicFlowAutoNext: preferences.musicFlowAutoNext,
    musicFlowAnimatedBackground: preferences.musicFlowAnimatedBackground,
    musicFlowLyrics: preferences.musicFlowLyrics,
    musicFlowCellularPrefetch: preferences.musicFlowCellularPrefetch,
    musicFlowHideRecent: preferences.musicFlowHideRecent,
    dataSaver: preferences.dataSaver,
  };
}
