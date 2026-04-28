import React from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { PROCEDURES } from '../../src/data/procedures';
import { CATEGORIES } from '../../src/data/categories';
import { ProcedureCard } from '../../src/components/ProcedureCard';
import { COLORS } from '../../src/theme';
import { Category } from '../../src/types';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const category = id ? decodeURIComponent(id) as Category : null;
  const catDef = CATEGORIES.find((c) => c.id === category);
  const procedures = PROCEDURES.filter((p) => p.category === category);

  return (
    <>
      <Stack.Screen
        options={{ title: catDef ? `${catDef.emoji} ${catDef.label}` : 'Catégorie' }}
      />
      <View style={styles.container}>
        <FlatList
          data={procedures}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🗂️</Text>
              <Text style={styles.empty}>Aucune démarche dans cette catégorie</Text>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Text style={styles.backBtnText}>Retour à l'accueil</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <ProcedureCard
              procedure={item}
              onPress={() => router.push(`/procedure/${item.id}`)}
            />
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingTop: 8, paddingBottom: 32 },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  empty: { textAlign: 'center', color: COLORS.textMuted, fontSize: 15, marginBottom: 20 },
  backBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
});
