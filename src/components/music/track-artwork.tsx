import { Image, type ImageProps } from 'expo-image';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Track } from '@/types/music';

type Props = Omit<ImageProps, 'source'> & {
  track: Pick<Track, 'artwork' | 'videoId'>;
};

function youtubeArtwork(videoId: string): string | null {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
}

function generatedArtwork(videoId: string): string {
  return `https://picsum.photos/seed/geet-${videoId || 'music'}/800/800`;
}

export function TrackArtwork({ track, style, ...props }: Props) {
  const fallback = useMemo(() => youtubeArtwork(track.videoId), [track.videoId]);
  const generated = useMemo(() => generatedArtwork(track.videoId), [track.videoId]);
  const signature = `${track.videoId}:${track.artwork}`;
  const [failure, setFailure] = useState<{ signature: string; stage: number } | null>(null);
  const sources = [fallback, track.artwork, generated].filter(Boolean) as string[];
  const stage = failure?.signature === signature ? failure.stage : 0;
  const source = sources[Math.min(stage, sources.length - 1)];

  if (!source) {
    return <View style={[styles.placeholder, style]} />;
  }

  return (
    <Image
      {...props}
      source={source}
      style={style}
      cachePolicy="memory-disk"
      recyclingKey={signature}
      onError={() => {
        setFailure((current) => ({
          signature,
          stage: current?.signature === signature ? current.stage + 1 : 1,
        }));
      }}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#2F2625',
  },
});
