import YoutubePlayer, { PLAYER_STATES, type YoutubeIframeRef } from 'react-native-youtube-iframe';
import { useCallback, useEffect, useRef, useState } from 'react';

import { usePlayer } from '@/context/player-context';
import { searchYouTube } from '@/services/youtube';

export function PlaybackEngine() {
  const playerRef = useRef<YoutubeIframeRef | null>(null);
  const recordedTrack = useRef<string | null>(null);
  const retryCount = useRef(0);
  const sourceRecoveryAttempted = useRef<string | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvedCatalogTrack = useRef<string | null>(null);
  const [resolvingCatalogTrack, setResolvingCatalogTrack] = useState(false);
  const [readyVideoId, setReadyVideoId] = useState<string | null>(null);
  const playIntent = useRef(false);
  const {
    activeTrack,
    playing,
    volume,
    setPlayback,
    setPlaying,
    setStatus,
    recordTrackSignal,
    registerController,
    playNext,
    selectTrack,
    queue,
  } = usePlayer();

  useEffect(() => {
    playIntent.current = playing;
  }, [playing]);

  useEffect(() => {
    if (activeTrack.id === activeTrack.videoId || resolvedCatalogTrack.current === activeTrack.id) return;
    let mounted = true;
    resolvedCatalogTrack.current = activeTrack.id;
    setResolvingCatalogTrack(true);
    setStatus('loading');
    void searchYouTube(`"${activeTrack.title}" ${activeTrack.artist} official audio song`)
      .then((results) => {
        if (!mounted) return;
        const replacement = results[0];
        if (replacement && replacement.videoId !== activeTrack.videoId) {
          selectTrack(replacement, [replacement, ...queue.filter((item) => item.id !== activeTrack.id && item.id !== replacement.id)]);
        } else if (!replacement) {
          setPlaying(false);
          setStatus('error');
        }
      })
      .catch((error) => {
        if (mounted) {
          setPlaying(false);
          setStatus('error');
        }
        console.warn('Unable to resolve catalog track:', error);
      })
      .finally(() => {
        if (mounted) setResolvingCatalogTrack(false);
      });
    return () => {
      mounted = false;
    };
  }, [activeTrack.artist, activeTrack.id, activeTrack.title, activeTrack.videoId, queue, selectTrack, setPlaying, setStatus]);

  useEffect(() => {
    recordedTrack.current = null;
    retryCount.current = 0;
    sourceRecoveryAttempted.current = null;
    if (retryTimer.current) clearTimeout(retryTimer.current);
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
          playerRef.current?.seekTo(Math.max(0, seconds), true);
        } catch (error) {
          console.warn('Unable to seek playback:', error);
        }
      },
      setVolume: () => undefined,
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
        .catch((error) => console.warn('Unable to read playback position:', error));
    }, 500);
    return () => clearInterval(timer);
  }, [playing, setPlayback]);

  const handleStateChange = useCallback(
    (state: PLAYER_STATES) => {
      if (state === PLAYER_STATES.BUFFERING) setStatus('buffering');
      if (state === PLAYER_STATES.UNSTARTED || state === PLAYER_STATES.VIDEO_CUED) {
        setStatus('ready');
      }
      if (state === PLAYER_STATES.PLAYING) {
        setPlaying(true);
        setStatus('playing');
        if (recordedTrack.current !== activeTrack.id) {
          recordedTrack.current = activeTrack.id;
          recordTrackSignal('play');
        }
      }
      if (state === PLAYER_STATES.PAUSED) {
        if (readyVideoId !== activeTrack.videoId) return;
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
    [activeTrack.id, activeTrack.videoId, playNext, readyVideoId, recordTrackSignal, setPlaying, setStatus]
  );

  const recoverSource = useCallback(() => {
    if (sourceRecoveryAttempted.current === activeTrack.id) return;
    sourceRecoveryAttempted.current = activeTrack.id;
    void searchYouTube(`"${activeTrack.title}" ${activeTrack.artist} official audio song`)
      .then((results) => {
        const replacement = results.find((candidate) => candidate.videoId !== activeTrack.videoId);
        if (replacement) {
          selectTrack(replacement, [replacement, ...queue.filter((item) => item.id !== replacement.id)]);
          return;
        }
        setPlaying(false);
        setStatus('error');
      })
      .catch((error) => {
        setPlaying(false);
        setStatus('error');
        console.warn('Playback source recovery failed:', error);
      });
  }, [activeTrack.artist, activeTrack.id, activeTrack.title, activeTrack.videoId, queue, selectTrack, setPlaying, setStatus]);

  if (resolvingCatalogTrack) return null;

  return (
    <YoutubePlayer
      ref={playerRef}
      key={activeTrack.videoId}
      height={200}
      width={200}
      videoId={activeTrack.videoId}
      play={playing}
      volume={volume}
      mute={volume === 0}
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
          }, 700);
          return;
        }
        console.warn('Playback source failed:', activeTrack.title, error);
        recoverSource();
      }}
      onReady={() => {
        setReadyVideoId(activeTrack.videoId);
        setStatus('ready');
        if (playIntent.current || playing) {
          try {
            playerRef.current?.seekTo(0, true);
          } catch {}
          setPlaying(true);
        }
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
    opacity: 0.01,
    left: 0,
    top: 0,
    pointerEvents: 'none' as const,
  },
  webView: { opacity: 0.01 },
};
