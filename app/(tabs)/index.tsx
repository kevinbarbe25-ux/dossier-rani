import React, { useMemo } from 'react';
import {
  View, Text, FlatList, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { CATEGORIES } from '../../src/data/categories';
import { PROCEDURES } from '../../src/data/procedures';
import { CategoryCard } from '../../src/components/CategoryCard';
import { ProcedureCard } from '../../src/components/ProcedureCard';
import { SearchBar } from '../../src/components/SearchBar';
import { useSearch } from '../../src/hooks/useSearch';
import { COLORS, RADIUS, FONTS } from '../../src/theme';
import { Category } from '../../src/types';

const AI_TOOLS = [
  { emoji: '🧭', label: 'Diagnostic',  route: '/diagnostic'   },
  { emoji: '💬', label: 'Rani',         route: '/chat'         },
  { emoji: '✉️', label: 'Courrier',    route: '/letter'       },
  { emoji: '📷', label: 'Scanner',     route: '/ocr'          },
  { emoji: '📅', label: 'Rendez-vous', route: '/appointments' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { query, setQuery, results, aiLoading, isAiSearch } = useSearch();

  const countByCategory = useMemo(() => {
    const map: Partial<Record<Category, number>> = {};
    PROCEDURES.forEach(p => { map[p.category] = (map[p.category] ?? 0) + 1; });
    return map;
  }, []);

  const isSearching = query.trim().length > 0;

  return (
    <>
      <Stack.Screen options={{ title: '', headerShown: false }} />
      <View style={styles.container}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoRow}>
            <View style={styles.logoDot} />
            <Text style={styles.logoName}>Dossier Rani</Text>
          </View>
          <Text style={styles.heroHeading}>
            {'Tes démarches\n'}
            <Text style={styles.heroAccent}>marocaines.</Text>
          </Text>
        </View>

        {/* Search */}
        <SearchBar value={query} onChangeText={setQuery} loading={aiLoading} />

        {isSearching ? (
          /* ── Mode recherche ── */
          <>
            <View style={styles.searchMeta}>
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
              <Text style={styles.resultCount}>
                {results.length} résultat{results.length > 1 ? 's' : ''}
              </Text>
            </View>

            <FlatList
              data={results}
              keyExtractor={p => p.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  {aiLoading
                    ? 'Analyse en cours…'
                    : `Aucune démarche trouvée pour « ${query} »`}
                </Text>
              }
              renderItem={({ item }) => (
                <ProcedureCard
                  procedure={item}
                  onPress={() => router.push(`/procedure/${item.id}`)}
                />
              )}
            />
          </>
        ) : (
          /* ── Mode accueil ── */
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* 1. Catégories — contenu principal */}
            <Text style={styles.sectionTitle}>Catégories</Text>
            <View style={styles.grid}>
              {CATEGORIES.map(cat => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  count={countByCategory[cat.id] ?? 0}
                  onPress={() => router.push(`/category/${encodeURIComponent(cat.id)}`)}
                />
              ))}
            </View>

            {/* 2. Outils IA — section secondaire en scroll horizontal */}
            <Text style={styles.sectionTitle}>Outils IA</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.aiToolsRow}
            >
              {AI_TOOLS.map(tool => (
                <TouchableOpacity
                  key={tool.route}
                  style={styles.aiChip}
                  onPress={() => router.push(tool.route as any)}
                  activeOpacity={0.75}
                  accessibilityLabel={tool.label}
                  accessibilityRole="button"
                >
                  <Text style={styles.aiChipEmoji}>{tool.emoji}</Text>
                  <Text style={styles.aiChipLabel}>{tool.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  hero: {
    backgroundColor: COLORS.background,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  logoDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.accent },
  logoName: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text, letterSpacing: 0.2 },
  heroHeading: { fontSize: 32, fontFamily: FONTS.extrabold, color: '#0D0D0D', lineHeight: 36, letterSpacing: -0.8 },
  heroAccent: { color: COLORS.accent, fontFamily: FONTS.extrabold },

  scroll: { paddingBottom: 32 },
  list:   { paddingBottom: 32 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.9, textTransform: 'uppercase',
    marginHorizontal: 16, marginTop: 20, marginBottom: 10,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },

  /* Outils IA — scroll horizontal compact */
  aiToolsRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  aiChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minWidth: 80,
  },
  aiChipEmoji: { fontSize: 22 },
  aiChipLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text },

  /* Recherche */
  searchMeta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4,
  },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFF8EC', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: '#F0D98A',
  },
  aiBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
  resultCount: { fontSize: 12, color: COLORS.textMuted },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 15, paddingHorizontal: 32 },
});
