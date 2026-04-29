import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { CategoryDef } from '../types';
import { COLORS, RADIUS, FONTS, SHADOWS } from '../theme';

interface Props {
  category: CategoryDef;
  count: number;
  onPress: () => void;
}

export function CategoryCard({ category, count, onPress }: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 300 }),
    );
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.wrapper}>
      <Animated.View style={[styles.card, animStyle]}>
        <Text style={styles.emoji}>{category.emoji}</Text>
        <Text style={styles.label} numberOfLines={2}>{category.label}</Text>
        <Text style={styles.count}>{count} démarche{count > 1 ? 's' : ''}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexBasis: '46%',
    flexGrow: 0,
    flexShrink: 0,
    margin: '2%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E4DC',
    minHeight: 110,
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  emoji: { fontSize: 28, marginBottom: 6 },
  label: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  count: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.accent,
  },
});
