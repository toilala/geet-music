import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

export type RecognitionStatus =
  | { state: 'ready' }
  | { state: 'listening' }
  | { state: 'processing' }
  | { state: 'success'; title: string; artist: string; artwork?: string; videoId?: string }
  | { state: 'no-match'; message: string }
  | { state: 'error'; message: string };

type EchoFindNative = {
  captureSignature: () => Promise<{ signature: string; sampleDurationMs: number }>;
};

const nativeModule = NativeModules.EchoFind as EchoFindNative | undefined;

export async function requestRecognitionPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function recognizeNearbySong(): Promise<RecognitionStatus> {
  if (Platform.OS !== 'android') {
    return { state: 'error', message: 'Echo Find is currently available on Android only.' };
  }
  if (!nativeModule?.captureSignature) {
    return { state: 'error', message: 'Echo Find native module is not installed in this development build.' };
  }
  if (!(await requestRecognitionPermission())) {
    return { state: 'error', message: 'Microphone permission is required to identify music.' };
  }

  try {
    const capture = await nativeModule.captureSignature();
    const response = await recognizeSignature(capture.signature, capture.sampleDurationMs);
    return response;
  } catch (error) {
    return { state: 'error', message: error instanceof Error ? error.message : 'Recognition failed.' };
  }
}

type ShazamResponse = {
  track?: {
    key?: string;
    title?: string;
    subtitle?: string;
    images?: { coverart?: string; coverarthq?: string };
    hub?: {
      options?: { type?: string; actions?: { uri?: string }[] }[];
    };
  };
};

const requestCache = new Map<string, { expiresAt: number; result: RecognitionStatus }>();
let lastRequestAt = 0;

async function recognizeSignature(signature: string, sampleDurationMs: number): Promise<RecognitionStatus> {
  const cached = requestCache.get(signature);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const wait = Math.max(0, 1000 - (Date.now() - lastRequestAt));
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();

  let response: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(
      `https://amp.shazam.com/discovery/v5/en/US/android/-/tag/${createUuid()}/${createUuid()}` +
        '?sync=true&webv3=true&sampling=true&connected=&shazamapiversion=v3&sharehub=true&video=v3',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Language': 'en_US' },
        body: JSON.stringify({
          geolocation: { altitude: 100, latitude: 0, longitude: 0 },
          signature: { samplems: sampleDurationMs, timestamp: Math.floor(Date.now() / 1000), uri: signature },
          timestamp: Math.floor(Date.now() / 1000),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        }),
      },
    );
    if (response.status !== 429 || attempt === 2) break;
    await new Promise((resolve) => setTimeout(resolve, 2000 * 2 ** attempt));
  }

  function createUuid(): string {
    const random = Math.random().toString(16).slice(2);
    return `${Date.now().toString(16)}-${random}-${Math.random().toString(16).slice(2)}`;
  }

  if (!response || response.status === 404) {
    return { state: 'no-match', message: 'No match found. Try again with clearer audio.' };
  }
  if (!response.ok) {
    return { state: 'error', message: `Recognition failed (error ${response.status}).` };
  }

  const data = (await response.json()) as ShazamResponse;
  const track = data.track;
  if (!track?.title || !track.subtitle) {
    return { state: 'no-match', message: 'No match found. Try again with clearer audio.' };
  }
  const youtubeUri = track.hub?.options?.find((option) => option.type?.toLowerCase().includes('video'))?.actions?.[0]?.uri;
  const result: RecognitionStatus = {
    state: 'success',
    title: track.title,
    artist: track.subtitle,
    artwork: track.images?.coverarthq ?? track.images?.coverart,
    videoId: youtubeUri?.match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1],
  };
  requestCache.set(signature, { expiresAt: Date.now() + 300_000, result });
  return result;
}
