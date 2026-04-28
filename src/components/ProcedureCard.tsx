import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Procedure } from '../types';
import { COLORS, RADIUS } from '../theme';

interface Props {
  procedure: Procedure;
  progress?: { done: number; total: number };
  onPress: () => void;
}

export function ProcedureCard({ procedure, progress, onPress }: Props) {
  const pct = progress && progress.total > 0 ? progress.done / progress.total : 0;
  const hasProgress = progress && progress.done > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{procedure.emoji}</Text>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>{procedure.title}</Text>
          <Text style={styles.sub}>⏱ {procedure.duration}</Text>
          {procedure.cost && (
            <Text style={styles.sub}>💶 {procedure.cost}</Text>
          )}
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emoji: { fontSize: 24, marginRight: 12, marginTop: 2 },
  body: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '600',
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
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  barBg: {
    marginTop: 10,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    backgroundColor: COLORS.success,
    borderRadius: 2,
  },
});
