YoutubeMusic client with clean interface and no ads. It is a free and open-source project that allows you to listen to music from YouTube without any distractions. The client provides a simple and intuitive interface for searching, playing, and managing your favorite music tracks.
built with react native and expo

## Attribution

Echo Find's Android fingerprint generator is ported from
[Echo Music](https://github.com/EchoMusicApp/Echo-Music), which is licensed
under GPL-3.0. Keep the required GPL-3.0 notice and source-availability
requirements when distributing builds containing this port.

The portable TypeScript engine layer also adapts Echo Music's GPL-3.0
recommendation and taste engines (`generate`), AI playlist/weather helpers,
Music Flow session/ranking/coordinator, playback queue/crossfade/sleep-timer
algorithms, InnerTube client models, and core persistence/domain contracts.
Android-only Room, Media3, WorkManager, and Hilt implementations are replaced
with Expo-compatible AsyncStorage, fetch, and player-adapter equivalents.
