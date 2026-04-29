import React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ProcedureCard } from '../../src/components/ProcedureCard';
import { SearchBar } from '../../src/components/SearchBar';
import { useSearch } from '../../src/hooks/useSearch';
import { PROCEDURES } from '../../src/data/procedures';
import { COLORS, FONTS } from '../../src/theme';

export default function SearchScreen() {
  const router = useRouter();
  const { query, setQuery, results, aiLoading, isAiSearch } = useSearch();

  const isSearching = query.trim().length > 0;
  const data = isSearching ? results : PROCEDURES;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Rechercher</Text>
          <Text style={styles.subtitle}>{PROCEDURES.length} démarches disponibles</Text>
        </View>
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} loading={aiLoading} />
        </View>
      </SafeAreaView>

      {isSearching && (
        <View style={styles.meta}>
          {aiLoading ? (
            <View style={styles.aiBadge}>
              <ActivityIndicator size={10} color={COLORS.accent} />
              <Text style={styles.aiBadgeText}>Recherche IA…</Text>
            </View>
          ) : isAiSearch ? (
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>✦ Résultats IA</Text>
            </View>
          ) : null}
          <Text style={styles.count}>
            {results.length} résultat{results.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isSearching ? (
            <Text style={styles.empty}>
              {aiLoading ? 'Analyse en cours…' : `Aucune démarche pour « ${query} »`}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <ProcedureCard
            procedure={item}
            onPress={() => router.push(`/procedure/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: COLORS.background },
  headerSafe: { backgroundColor: COLORS.primary },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 16 },

  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF8EC',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#F0D98A',
  },
  aiBadgeText: { fontSize: 11, fontFamily: FONTS.bold, color: COLORS.accent },
  count:       { fontSize: 12, color: COLORS.textMuted },

  list:  { paddingBottom: 32 },
  empty: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 60,
    fontSize: 15,
    paddingHorizontal: 32,
  },
});
