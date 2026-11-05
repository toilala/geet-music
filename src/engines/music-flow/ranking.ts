import { trackKeyOf } from '@/core/types';
import { musicFlowArtistKey, type MusicFlowItem, type MusicFlowSource } from '@/engines/music-flow/models';

export type MusicFlowRankingConfig = {
  artistSpacing: number;
  likedArtistBoost: number;
  lessLikeThisPenalty: number;
  positionDecay: number;
  sourceWeights: Partial<Record<MusicFlowSource, number>>;
};

export const DEFAULT_MUSIC_FLOW_RANKING: MusicFlowRankingConfig = {
  artistSpacing: 2,
  likedArtistBoost: 1,
  lessLikeThisPenalty: 2.5,
  positionDecay: 0.02,
  sourceWeights: { history: 0.6, liked: 0.8, 'quick-picks': 0.5, catalog: 0.2, offline: 0.4 },
};

export type MusicFlowCandidateFilter = {
  seenSongIds?: Set<string>;
  seenTrackKeys?: Set<string>;
  excludedTrackKeys?: Set<string>;
  hiddenSongIds?: Set<string>;
  recentSongIds?: Set<string>;
};

export function musicFlowTrackKey(item: MusicFlowItem): string {
  return trackKeyOf(item.song.title, item.song.artist);
}

export function filterMusicFlowCandidates(candidates: MusicFlowItem[], filter: MusicFlowCandidateFilter): MusicFlowItem[] {
  const ids = new Set<string>();
  const keys = new Set<string>();
  const seenSongIds = filter.seenSongIds ?? new Set<string>();
  const seenTrackKeys = filter.seenTrackKeys ?? new Set<string>();
  const excluded = filter.excludedTrackKeys ?? new Set<string>();
  const hidden = filter.hiddenSongIds ?? new Set<string>();
  const recent = filter.recentSongIds ?? new Set<string>();
  return candidates.filter((item) => {
    const key = musicFlowTrackKey(item);
    const id = musicFlowArtistKey(item) ? item.song.id : item.song.videoId;
    if (!id || seenSongIds.has(id) || seenTrackKeys.has(key) || excluded.has(key) || hidden.has(id) || recent.has(id)) return false;
    if (ids.has(id) || keys.has(key)) return false;
    ids.add(id);
    keys.add(key);
    return true;
  });
}

export function rankMusicFlowCandidates(
  candidates: MusicFlowItem[],
  feedTailArtists: (string | null)[] = [],
  likedArtists: Set<string> = new Set(),
  lessLikeArtists: Set<string> = new Set(),
  config: MusicFlowRankingConfig = DEFAULT_MUSIC_FLOW_RANKING,
): MusicFlowItem[] {
  const scored = candidates.map((item, index) => {
    const artist = musicFlowArtistKey(item);
    let score = config.sourceWeights[item.source] ?? 0;
    score -= index * config.positionDecay;
    if (artist && likedArtists.has(artist)) score += config.likedArtistBoost;
    if (artist && lessLikeArtists.has(artist)) score -= config.lessLikeThisPenalty;
    return { item, score };
  }).sort((a, b) => b.score - a.score).map(({ item }) => item);

  const recent = feedTailArtists.slice(-config.artistSpacing);
  const result: MusicFlowItem[] = [];
  while (scored.length) {
    const index = scored.findIndex((item) => {
      const artist = musicFlowArtistKey(item);
      return !artist || !recent.includes(artist);
    });
    const picked = scored.splice(index >= 0 ? index : 0, 1)[0];
    result.push(picked);
    recent.push(musicFlowArtistKey(picked));
    while (recent.length > config.artistSpacing) recent.shift();
  }
  return result;
}
