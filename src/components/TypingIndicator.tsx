import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { COLORS } from '../theme';

function Dot({ delay }: { delay: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.4, { duration: 300 }),
          withTiming(1, { duration: 300 }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function TypingIndicator() {
  return (
    <View style={styles.container}>
      <Dot delay={0} />
      <Dot delay={180} />
      <Dot delay={360} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E8E4DC',
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
