import YoutubePlayer, { PLAYER_STATES, type YoutubeIframeRef } from 'react-native-youtube-iframe';
import { useCallback, useEffect, useRef } from 'react';

import { usePlayer } from '@/context/player-context';

export function PlaybackEngine() {
  const playerRef = useRef<YoutubeIframeRef | null>(null);
  const recordedTrack = useRef<string | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    recordedTrack.current = null;
    retryCount.current = 0;
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [activeTrack.id, activeTrack.videoId]);

  useEffect(() => {
    registerController({
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      toggle: () => setPlaying((current) => !current),
      seekTo: (seconds) => {
        try {
          playerRef.current?.seekTo(seconds, true);
        } catch {}
      },
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
        })
        .catch(() => {});
    }, 500);
    return () => clearInterval(timer);
  }, [playing, setPlayback]);

  const handleStateChange = useCallback(
    (state: PLAYER_STATES) => {
      if (state === PLAYER_STATES.BUFFERING) setStatus('buffering');
      if (state === PLAYER_STATES.PLAYING) {
        setPlaying(true);
        setStatus('playing');
        if (recordedTrack.current !== activeTrack.id) {
          recordedTrack.current = activeTrack.id;
          recordTrackSignal('play');
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
    },
    [activeTrack.id, playNext, recordTrackSignal, setPlaying, setStatus]
  );

  return (
    <YoutubePlayer
      ref={playerRef}
      key={activeTrack.videoId}
      height={200}
      width={200}
      videoId={activeTrack.videoId}
      play={playing}
      forceAndroidAutoplay
      initialPlayerParams={{ controls: false, rel: false, preventFullScreen: true }}
      webViewProps={{
        allowsInlineMediaPlayback: true,
        mediaPlaybackRequiresUserAction: false,
        androidLayerType: 'hardware',
      }}
      onChangeState={handleStateChange}
      onError={(error: string) => {
        if (retryCount.current === 0) {
          retryCount.current = 1;
          setPlaying(false);
          retryTimer.current = setTimeout(() => {
            retryTimer.current = null;
            setPlaying(true);
          }, 500);
          return;
        }
        setPlaying(false);
        setStatus('error');
        console.warn('Playback error for track:', activeTrack.title, error);
      }}
      onReady={() => {
        setStatus('ready');
        void playerRef.current?.getDuration().then((duration) => {
          if (duration > 0) setPlayback(0, duration);
        });
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
    opacity: 0.001,
    left: -250,
    bottom: -250,
    pointerEvents: 'none' as const,
  },
  webView: { opacity: 0.001 },
};
