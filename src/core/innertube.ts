import type { Track } from '@/types/music';
import { isMusicLikeContent } from '@/core/content-filter';

export type InnerTubeClient = 'WEB' | 'ANDROID' | 'ANDROID_MUSIC';
export type InnerTubeEndpoint = { videoId?: string; playlistId?: string; browseId?: string; params?: string };
export type InnerTubePage<T> = { items: T[]; continuation?: string; endpoint?: InnerTubeEndpoint };

type Renderer = {
  videoId?: string;
  title?: { runs?: { text?: string }[]; simpleText?: string };
  ownerText?: { runs?: { text?: string }[] };
  longBylineText?: { runs?: { text?: string }[] };
  shortBylineText?: { runs?: { text?: string }[] };
  flexColumns?: Array<{
    musicResponsiveListItemFlexColumnRenderer?: {
      text?: { runs?: { text?: string }[] };
    };
  }>;
  thumbnail?: {
    thumbnails?: { url?: string }[];
    musicThumbnailRenderer?: { thumbnail?: { thumbnails?: { url?: string }[] } };
  };
  lengthText?: { simpleText?: string; runs?: { text?: string }[] };
  navigationEndpoint?: {
    watchEndpoint?: { videoId?: string };
  };
  playlistItemData?: {
    videoId?: string;
  };
};

const CLIENTS: Record<InnerTubeClient, { name: string; version: string; apiKey: string }> = {
  WEB: { name: 'WEB', version: '2.20260301.01.00', apiKey: 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8' },
  ANDROID: { name: 'ANDROID', version: '20.10.38', apiKey: 'AIzaSyAO_FJ2SlqUQ8j3y5b0jY7p2x0' },
  ANDROID_MUSIC: { name: 'ANDROID_MUSIC', version: '7.16.53', apiKey: 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8' },
};

export class InnerTubeClientApi {
  constructor(private readonly client: InnerTubeClient = 'WEB') {}

  async search(query: string, params?: string): Promise<InnerTubePage<Track>> {
    const data = await this.request('search', { query, params });
    return { items: collectRenderers(data).flatMap((renderer) => this.toTrack(renderer)) };
  }

  async next(endpoint: InnerTubeEndpoint, continuation?: string): Promise<InnerTubePage<Track>> {
    const data = await this.request('next', { ...endpoint, continuation });
    return {
      items: collectRenderers(data).flatMap((renderer) => this.toTrack(renderer)),
      continuation: findContinuation(data),
      endpoint,
    };
  }

  async browse(endpoint: InnerTubeEndpoint): Promise<InnerTubePage<Track>> {
    const data = await this.request('browse', endpoint);
    return { items: collectRenderers(data).flatMap((renderer) => this.toTrack(renderer)), continuation: findContinuation(data), endpoint };
  }

  async suggestions(query: string): Promise<string[]> {
    const response = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = (await response.json()) as unknown;
    return Array.isArray(data) && Array.isArray(data[1]) ? data[1].filter((item): item is string => typeof item === 'string').slice(0, 10) : [];
  }

  private async request(path: string, body: Record<string, unknown>): Promise<unknown> {
    const config = CLIENTS[this.client];
    const response = await fetch(`https://www.youtube.com/youtubei/v1/${path}?key=${config.apiKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        context: { client: { clientName: config.name, clientVersion: config.version, hl: 'en', gl: 'US' } },
        ...body,
      }),
    });
    if (!response.ok) throw new Error(`InnerTube ${path} failed with ${response.status}`);
    return response.json();
  }

  private toTrack(renderer: Renderer): Track[] {
    const videoId =
      renderer.videoId ||
      renderer.playlistItemData?.videoId ||
      renderer.navigationEndpoint?.watchEndpoint?.videoId;
    if (!videoId) return [];

    const title =
      renderer.title?.runs?.map((run) => run.text ?? '').join('') ||
      renderer.title?.simpleText ||
      renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map((r) => r.text ?? '').join('') ||
      'Untitled track';

    const artist =
      renderer.ownerText?.runs?.map((run) => run.text ?? '').join('').replace(' - Topic', '') ||
      renderer.longBylineText?.runs?.map((run) => run.text ?? '').join('').replace(' - Topic', '') ||
      renderer.shortBylineText?.runs?.map((run) => run.text ?? '').join('').replace(' - Topic', '') ||
      renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text?.replace(' - Topic', '') ||
      'Unknown artist';

    const duration =
      renderer.lengthText?.simpleText ||
      renderer.lengthText?.runs?.map((run) => run.text ?? '').join('') ||
      '0:00';

    const durationSeconds = duration.split(':').reduce((total, value) => total * 60 + Number(value), 0);
    if ((durationSeconds > 0 && durationSeconds < 45) || !isMusicLikeContent(title, artist)) return [];

    const artwork =
      renderer.thumbnail?.thumbnails?.at(-1)?.url ||
      renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.at(-1)?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return [{ id: videoId, videoId, title, artist, artwork, duration, durationSeconds }];
  }
}

export const innerTube = new InnerTubeClientApi();

function collectRenderers(value: unknown, result: Renderer[] = []): Renderer[] {
  if (!value || typeof value !== 'object') return result;
  if ('videoRenderer' in value && value.videoRenderer && typeof value.videoRenderer === 'object') {
    result.push(value.videoRenderer as Renderer);
  }
  if ('playlistPanelVideoRenderer' in value && value.playlistPanelVideoRenderer && typeof value.playlistPanelVideoRenderer === 'object') {
    result.push(value.playlistPanelVideoRenderer as Renderer);
  }
  if ('musicResponsiveListItemRenderer' in value && value.musicResponsiveListItemRenderer && typeof value.musicResponsiveListItemRenderer === 'object') {
    result.push(value.musicResponsiveListItemRenderer as Renderer);
  }
  if ('compactVideoRenderer' in value && value.compactVideoRenderer && typeof value.compactVideoRenderer === 'object') {
    result.push(value.compactVideoRenderer as Renderer);
  }
  Object.values(value).forEach((child) => collectRenderers(child, result));
  return result;
}

function findContinuation(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if ('continuationCommand' in value && value.continuationCommand && typeof value.continuationCommand === 'object' && 'token' in value.continuationCommand) {
    const token = value.continuationCommand.token;
    if (typeof token === 'string') return token;
  }
  for (const child of Object.values(value)) {
    const token = findContinuation(child);
    if (token) return token;
  }
  return undefined;
}
