import React, { useMemo, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, FlatList, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CATEGORIES } from '../../src/data/categories';
import { PROCEDURES } from '../../src/data/procedures';
import { CategoryCard } from '../../src/components/CategoryCard';
import { ProcedureCard } from '../../src/components/ProcedureCard';
import { SearchBar } from '../../src/components/SearchBar';
import { useSearch } from '../../src/hooks/useSearch';
import { useRecentlyViewed } from '../../src/hooks/useRecentlyViewed';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, RADIUS, FONTS, SHADOWS } from '../../src/theme';
import { Category } from '../../src/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)  return 'Sbah lkhir';
  return 'Msa lkhir';
}

function CategoryChip({
  label, emoji, active, onPress,
}: { label: string; emoji: string; active: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.88, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 300 }),
    );
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[styles.chip, active && styles.chipActive, animStyle]}>
        <Text style={styles.chipEmoji}>{emoji}</Text>
        <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const FIRST_RUN_KEY = 'dossier_rani_first_run_done';

export default function HomeScreen() {
  const router   = useRouter();
  const { user, isGuest, loading } = useAuth();
  const { query, setQuery, results, aiLoading, isAiSearch } = useSearch();
  const { recent } = useRecentlyViewed();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // First-run: redirect to Diagnostic so new users describe their situation
  useEffect(() => {
    if (loading) return; // wait for auth to settle
    AsyncStorage.getItem(FIRST_RUN_KEY).then(done => {
      if (!done) {
        // Set flag BEFORE navigate to prevent re-trigger
        AsyncStorage.setItem(FIRST_RUN_KEY, 'true').then(() => {
          router.replace('/diagnostic' as any);
        });
      }
    });
  }, [loading]);

  const countByCategory = useMemo(() => {
    const map: Partial<Record<Category, number>> = {};
    PROCEDURES.forEach(p => { map[p.category] = (map[p.category] ?? 0) + 1; });
    return map;
  }, []);

  const isSearching = query.trim().length > 0;

  const filteredProcedures = useMemo(() => {
    if (!selectedCategory) return PROCEDURES;
    return PROCEDURES.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const recentProcedures = useMemo(
    () => recent.map(id => PROCEDURES.find(p => p.id === id)).filter(Boolean) as typeof PROCEDURES,
    [recent],
  );

  const greeting = getGreeting();
  const displayName = user?.email?.split('@')[0] ?? 'frère';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header vert */}
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.appName}>Dossier Rani</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profile' as any)}
            activeOpacity={0.8}
            accessibilityLabel="Mon profil"
            accessibilityRole="button"
          >
            <Text style={styles.avatarText}>
              {displayName.slice(0, 2).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Slogan */}
        <Text style={styles.slogan}>La première fois, c'est la bonne.</Text>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} loading={aiLoading} />
        </View>
      </SafeAreaView>

      {isSearching ? (
        /* Mode recherche */
        <View style={styles.flex}>
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
                {aiLoading ? 'Analyse en cours…' : `Aucune démarche pour « ${query} »`}
              </Text>
            }
            renderItem={({ item }) => (
              <ProcedureCard
                procedure={item}
                onPress={() => router.push(`/procedure/${item.id}`)}
              />
            )}
          />
        </View>
      ) : (
        /* Mode accueil */
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Catégories scrollables */}
          <Text style={styles.sectionTitle}>Catégories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <CategoryChip
              label="Tout"
              emoji="📋"
              active={selectedCategory === null}
              onPress={() => setSelectedCategory(null)}
            />
            {CATEGORIES.map(cat => (
              <CategoryChip
                key={cat.id}
                label={cat.label}
                emoji={cat.emoji}
                active={selectedCategory === cat.id}
                onPress={() => setSelectedCategory(
                  selectedCategory === cat.id ? null : cat.id as Category
                )}
              />
            ))}
          </ScrollView>

          {/* Récemment consultées */}
          {recentProcedures.length > 0 && !selectedCategory && (
            <>
              <Text style={styles.sectionTitle}>Récemment consultées</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentRow}
              >
                {recentProcedures.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.recentCard}
                    onPress={() => router.push(`/procedure/${p.id}`)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.recentEmoji}>{p.emoji}</Text>
                    <Text style={styles.recentTitle} numberOfLines={2}>{p.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Démarches */}
          <Text style={styles.sectionTitle}>
            {selectedCategory
              ? `${CATEGORIES.find(c => c.id === selectedCategory)?.label ?? 'Démarches'} — ${filteredProcedures.length} démarche${filteredProcedures.length > 1 ? 's' : ''}`
              : `Toutes les démarches — ${PROCEDURES.length}`
            }
          </Text>
          {filteredProcedures.map(p => (
            <ProcedureCard
              key={p.id}
              procedure={p}
              onPress={() => router.push(`/procedure/${p.id}`)}
            />
          ))}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  flex:   { flex: 1 },

  headerSafe: { backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  greeting: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.2,
  },
  appName: {
    fontSize: 22,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },

  slogan: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 20,
    paddingBottom: 12,
    fontStyle: 'italic',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  sectionTitle: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },

  chipsRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E8E4DC',
    ...SHADOWS.sm,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  chipLabelActive: { color: '#FFFFFF' },

  recentRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: 'center',
    width: 90,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    ...SHADOWS.sm,
  },
  recentEmoji: { fontSize: 24, marginBottom: 6 },
  recentTitle: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 14,
  },

  scroll: { paddingBottom: 32 },
  list:   { paddingBottom: 32 },

  searchMeta: {
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
  resultCount:  { fontSize: 12, color: COLORS.textMuted },
  empty: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 60,
    fontSize: 15,
    paddingHorizontal: 32,
  },
});
