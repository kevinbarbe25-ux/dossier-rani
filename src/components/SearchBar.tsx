import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  loading?: boolean;
}

export function SearchBar({ value, onChangeText, placeholder = 'Rechercher une démarche…', loading = false }: Props) {
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
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8}>
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
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  icon: { fontSize: 16, marginRight: 8 },
  iconWrap: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  clear: {
    fontSize: 14,
    color: COLORS.textMuted,
    paddingLeft: 8,
  },
});
