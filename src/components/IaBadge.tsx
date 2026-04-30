import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FONTS } from '../theme';

interface Props {
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export function IaBadge({ style, size = 'sm' }: Props) {
  return (
    <View style={[styles.badge, size === 'md' && styles.badgeMd, style]}>
      <Text style={[styles.text, size === 'md' && styles.textMd]}>IA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#D4A017',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  text: {
    fontSize: 9,
    fontFamily: FONTS.extrabold,
    color: '#1A1200',
    letterSpacing: 0.5,
  },
  textMd: {
    fontSize: 11,
  },
});
