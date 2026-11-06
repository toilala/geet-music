/** Music-only content policy shared by search, radio, Music Flow, and AI resolution. */
const NON_MUSIC_PATTERN = /\b(?:podcasts?|podcast(?:ing)?|episode|interviews?|q\s*(?:&|and)\s*a|talk\s*shows?|conversation|discussion|current\s+affairs|news(?:cast)?|commentary|reaction|reacts?|review|recap|documentar(?:y|ies)|vlogs?|gameplay|trailer|behind\s+the\s+scenes|tutorial|lesson|livestream|live\s+stream|full\s+show|morning\s+show|season\s+\d+|chapter\s+\d+)\b/i;
const SHORT_FORM_PATTERN = /(?:^|\s)#?shorts?\b|(?:^|\s)short\s*video\b/i;
const MUSIC_SIGNAL_PATTERN = /\b(?:official\s+(?:audio|music\s+video)|music\s+video|lyrics?|visualizer|audio\s+only|full\s+(?:album|song)|soundtrack|ost|song|music|cover|acoustic|remix|karaoke|instrumental)\b/i;

export function isNonMusicContent(title: string, artist = ''): boolean {
  return NON_MUSIC_PATTERN.test(`${title} ${artist}`) || SHORT_FORM_PATTERN.test(title);
}

export function isMusicLikeContent(title: string, artist = ''): boolean {
  return !isNonMusicContent(title, artist);
}

export function hasMusicSignal(title: string, artist = ''): boolean {
  return MUSIC_SIGNAL_PATTERN.test(`${title} ${artist}`);
}

export function filterMusicSuggestion(value: string): boolean {
  return Boolean(value.trim()) && !isNonMusicContent(value);
}
