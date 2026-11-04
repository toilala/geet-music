import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 500;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      opacity: 1,
    },
    80: {
      opacity: 0,
    },
    100: {
      opacity: 0,
      easing: Easing.out(Easing.ease),
    },
  });

  const branding = (
    <View style={styles.brandingBox}>
      <Text style={styles.brandPrimary}>Geet</Text>
      <Text style={styles.brandSecondary}>Music</Text>
      <View style={styles.dot} />
    </View>
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {branding}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {branding}
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D1110',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  brandingBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  brandPrimary: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandSecondary: {
    color: '#7CD5C6',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7CD5C6',
    marginLeft: 2,
    marginBottom: 6,
  },
});
