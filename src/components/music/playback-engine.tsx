import YoutubePlayer, { PLAYER_STATES, type YoutubeIframeRef } from 'react-native-youtube-iframe';
import { useCallback, useEffect, useRef } from 'react';

import { usePlayer } from '@/context/player-context';

export function PlaybackEngine() {
  const playerRef = useRef<YoutubeIframeRef | null>(null);
  const selectedAt = useRef(0);
  const recordedTrack = useRef<string | null>(null);
  const {
    activeTrack,
    playing,
    setPlayback,
    setPlaying,
    setStatus,
    recordTrackSignal,
    registerController,
    playNext,
  } = usePlayer();

  useEffect(() => {
    selectedAt.current = Date.now();
    recordedTrack.current = null;
  }, [activeTrack.id]);

  useEffect(() => {
    registerController({
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      toggle: () => setPlaying((current) => !current),
      seekTo: (seconds) => playerRef.current?.seekTo(seconds, true),
    });
    return () => registerController(null);
  }, [registerController, setPlaying]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      void Promise.all([playerRef.current?.getCurrentTime(), playerRef.current?.getDuration()])
        .then(([currentTime, duration]) => {
          if (typeof currentTime === 'number' && typeof duration === 'number' && duration > 0) {
            setPlayback(currentTime, duration);
          }
        });
    }, 500);
    return () => clearInterval(timer);
  }, [playing, setPlayback]);

  const handleStateChange = useCallback((state: PLAYER_STATES) => {
    if (state === PLAYER_STATES.BUFFERING) setStatus('buffering');
    if (state === PLAYER_STATES.PLAYING) {
      setPlaying(true);
      setStatus('playing');
      if (recordedTrack.current !== activeTrack.id) {
        recordedTrack.current = activeTrack.id;
        recordTrackSignal('play');
      }
      if (selectedAt.current > 0) {
        console.info(`[Geet playback] first play for ${activeTrack.id} after ${Date.now() - selectedAt.current}ms`);
        selectedAt.current = 0;
      }
    }
    if (state === PLAYER_STATES.PAUSED) {
      setPlaying(false);
      setStatus('paused');
    }
    if (state === PLAYER_STATES.ENDED) {
      setPlaying(false);
      setStatus('ready');
      recordTrackSignal('complete');
      playNext();
    }
  }, [activeTrack.id, playNext, recordTrackSignal, setPlaying, setStatus]);

  return (
    <YoutubePlayer
      ref={playerRef}
      height={200}
      width={200}
      key={activeTrack.videoId}
      videoId={activeTrack.videoId}
      play={playing}
      forceAndroidAutoplay
      initialPlayerParams={{ controls: false, rel: false, preventFullScreen: true }}
      webViewProps={{ allowsInlineMediaPlayback: true, mediaPlaybackRequiresUserAction: false }}
      onChangeState={handleStateChange}
      onError={() => setStatus('error')}
      onReady={() => {
        setStatus('ready');
        void playerRef.current?.getDuration().then((duration) => {
          if (duration > 0) setPlayback(0, duration);
        });
        console.info(`[Geet playback] player ready for ${activeTrack.id} after ${Date.now() - selectedAt.current}ms`);
      }}
      viewContainerStyle={styles.engine}
      webViewStyle={styles.webView}
    />
  );
}

const styles = {
  engine: {
    position: 'absolute' as const,
    width: 200,
    height: 200,
    opacity: 0.01,
    left: -210,
    bottom: -210,
  },
  webView: { opacity: 0.01 },
};
