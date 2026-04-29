import React from 'react';
import { Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Procedure } from '../types';
import { COLORS, RADIUS, FONTS, SHADOWS } from '../theme';

interface Props {
  procedure: Procedure;
  progress?: { done: number; total: number };
  onPress: () => void;
}

export function ProcedureCard({ procedure, progress, onPress }: Props) {
  const pct = progress && progress.total > 0 ? progress.done / progress.total : 0;
  const hasProgress = progress && progress.done > 0;

  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.96, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 300 }),
    );
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[styles.card, animStyle]}>
        <View style={styles.row}>
          <Text style={styles.emoji}>{procedure.emoji}</Text>
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={2}>{procedure.title}</Text>
            <Text style={styles.sub}>⏱ {procedure.duration}</Text>
            {procedure.cost && <Text style={styles.sub}>💶 {procedure.cost}</Text>}
          </View>
          {hasProgress && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{progress!.done}/{progress!.total}</Text>
            </View>
          )}
        </View>
        {hasProgress && (
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    ...SHADOWS.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  emoji: { fontSize: 24, marginRight: 12, marginTop: 2 },
  body: { flex: 1 },
  title: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    lineHeight: 20,
  },
  sub: {
    fontSize: 12,
    color: COLORS.textSub,
    marginTop: 2,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeText: { color: '#fff', fontSize: 11, fontFamily: FONTS.bold },
  barBg: {
    marginTop: 10,
    height: 4,
    backgroundColor: '#E8E4DC',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
});
