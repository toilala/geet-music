export type LastFmArtist = { name: string };
export type LastFmTrack = { name: string; artist: string };
export type LastFmTag = { name: string };

type LastFmResponse = {
  error?: number;
  message?: string;
  artists?: { artist?: LastFmArtist[] };
  tracks?: { track?: LastFmTrack[] };
  tags?: { tag?: LastFmTag[] };
  similartracks?: { track?: { name?: string; artist?: { name?: string } }[] };
  similarartists?: { artist?: { name?: string }[] };
};

function getApiKey(): string | null {
  return process.env.EXPO_PUBLIC_LASTFM_API_KEY ?? null;
}

async function callLastFm(method: string, params: Record<string, string>): Promise<LastFmResponse | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const query = new URLSearchParams({
    method,
    api_key: apiKey,
    format: 'json',
    ...params,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(`https://ws.audioscrobbler.com/2.0/?${query.toString()}`, {
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as LastFmResponse;
    return data.error ? null : data;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getUserTopArtists(username: string, limit = 30): Promise<LastFmArtist[]> {
  const data = await callLastFm('user.gettopartists', { user: username, limit: String(limit), period: 'overall' });
  return data?.artists?.artist?.map((artist) => ({ name: artist.name.trim() })).filter((artist) => artist.name) ?? [];
}

export async function getUserTopTracks(username: string, limit = 50): Promise<LastFmTrack[]> {
  const data = await callLastFm('user.gettoptracks', { user: username, limit: String(limit), period: 'overall' });
  return data?.tracks?.track?.map((track) => ({ name: track.name.trim(), artist: track.artist.trim() })).filter((track) => track.name && track.artist) ?? [];
}

export async function getUserTopTags(username: string, limit = 15): Promise<LastFmTag[]> {
  const data = await callLastFm('user.gettoptags', { user: username, limit: String(limit) });
  return data?.tags?.tag?.map((tag) => ({ name: tag.name.trim() })).filter((tag) => tag.name) ?? [];
}

export async function getSimilarTracks(artist: string, track: string, limit = 10): Promise<LastFmTrack[]> {
  const data = await callLastFm('track.getsimilar', { artist, track, limit: String(limit) });
  return data?.similartracks?.track
    ?.map((item) => ({ name: item.name?.trim() ?? '', artist: item.artist?.name?.trim() ?? '' }))
    .filter((item) => item.name && item.artist) ?? [];
}

export async function getSimilarArtists(artist: string, limit = 10): Promise<LastFmArtist[]> {
  const data = await callLastFm('artist.getsimilar', { artist, limit: String(limit) });
  return data?.similarartists?.artist
    ?.map((item) => ({ name: item.name?.trim() ?? '' }))
    .filter((item) => item.name) ?? [];
}

export async function getTopTags(artist: string, limit = 15): Promise<LastFmTag[]> {
  const data = await callLastFm('artist.gettoptags', { artist, limit: String(limit) });
  return data?.tags?.tag?.map((tag) => ({ name: tag.name.trim() })).filter((tag) => tag.name) ?? [];
}
