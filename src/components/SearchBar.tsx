import React from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity, Text, ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  loading?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Rechercher une démarche…',
  loading = false,
}: Props) {
  return (
    <View style={styles.wrapper}>
      {loading
        ? <ActivityIndicator size={15} color={COLORS.accent} style={styles.iconWrap} />
        : <Text style={styles.icon}>🔍</Text>
      }
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.clear}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  icon:    { fontSize: 16, marginRight: 8 },
  iconWrap:{ marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  clear: {
    fontSize: 14,
    color: COLORS.textMuted,
    paddingLeft: 8,
  },
});
