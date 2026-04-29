import React from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ProcedureCard } from '../../src/components/ProcedureCard';
import { useFavorites } from '../../src/hooks/useFavorites';
import { PROCEDURES } from '../../src/data/procedures';
import { COLORS, FONTS } from '../../src/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const saved = PROCEDURES.filter(p => favorites.includes(p.id));

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Favoris</Text>
          <Text style={styles.subtitle}>
            {saved.length} démarche{saved.length > 1 ? 's' : ''} sauvegardée{saved.length > 1 ? 's' : ''}
          </Text>
        </View>
      </SafeAreaView>

      <FlatList
        data={saved}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>⭐</Text>
            <Text style={styles.emptyTitle}>Aucun favori pour l'instant</Text>
            <Text style={styles.emptyText}>
              Ouvre une démarche et appuie sur ⭐ pour la sauvegarder ici.
            </Text>
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
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: COLORS.background },
  headerSafe: { backgroundColor: COLORS.primary },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
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
    marginTop: 2,
  },

  list: { paddingTop: 12, paddingBottom: 32 },

  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
