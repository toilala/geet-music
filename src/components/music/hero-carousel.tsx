import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Track } from '@/data/music';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_HEIGHT = 300;

type Props = {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
};

export function HeroCarousel({ tracks, onPlayTrack }: Props) {
  const featuredTracks = tracks.slice(0, 6);

  return (
    <ScrollView
      horizontal
      pagingEnabled={false}
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + 14}
      decelerationRate="fast"
      contentContainerStyle={styles.container}>
      {/* Featured Artwork Cards with bottom gradient matching Echo Music Screenshots */}
      {featuredTracks.map((item, index) => (
        <Pressable
          key={`hero-${item.id}-${index}`}
          onPress={() => onPlayTrack(item)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <Image
            source={item.artwork}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={['transparent', 'rgba(10, 14, 13, 0.3)', 'rgba(10, 14, 13, 0.95)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.cardFooter}>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {item.title}
            </Text>
            <Text numberOfLines={1} style={styles.cardSubtitle}>
              {item.artist}
            </Text>
          </View>
        </Pressable>
      ))}

      {/* Synchronized Lyric Highlight Card */}
      <Pressable
        onPress={() => onPlayTrack(featuredTracks[0] ?? tracks[0])}
        style={({ pressed }) => [styles.card, styles.lyricCard, pressed && styles.pressed]}>
        <View style={styles.lyricContent}>
          <Text style={styles.lyricLine}>सानेको रिसाउने बानी भो</Text>
          <Text style={styles.lyricLine}>कहिल्यै नहाँस्ने, कहिल्यै नबोल्ने</Text>
          <Text style={styles.lyricLine}>के तिम्रो अनौठो चाला यो?</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            Saani Ko · 1974AD
          </Text>
          <Text style={styles.cardSubtitle}>Lyrics from YouLyPlus</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 14,
    paddingVertical: 10,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#161B19',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  lyricCard: {
    backgroundColor: '#121614',
    padding: 22,
    justifyContent: 'space-between',
  },
  lyricContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  lyricLine: {
    color: '#E8F0EC',
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  cardFooter: {
    padding: 18,
    gap: 3,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    color: '#99A8A4',
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
