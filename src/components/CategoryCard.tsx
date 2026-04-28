import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { CategoryDef } from '../types';
import { COLORS, RADIUS } from '../theme';

interface Props {
  category: CategoryDef;
  count: number;
  onPress: () => void;
}

export function CategoryCard({ category, count, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.emoji}>{category.emoji}</Text>
      <Text style={styles.label} numberOfLines={2}>{category.label}</Text>
      <Text style={styles.count}>{count} démarche{count > 1 ? 's' : ''}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    // flexBasis 46% + margin 2% = ~50% par carte = grille 2 colonnes
    // Remplace flex:1 qui ne wrap pas correctement sur web
    flexBasis: '46%',
    flexGrow: 0,
    flexShrink: 0,
    margin: '2%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(210,195,175,0.45)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minHeight: 110,
    justifyContent: 'center',
  },
  emoji: { fontSize: 28, marginBottom: 6 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  count: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
