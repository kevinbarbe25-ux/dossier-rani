import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useExpirations, getStatus, ExpiryStatus } from '../../src/hooks/useExpirations';
import { ExpirationCard } from '../../src/components/ExpirationCard';
import { PROCEDURES } from '../../src/data/procedures';
import { COLORS, FONTS } from '../../src/theme';

const PRIORITY: Record<ExpiryStatus, number> = {
  expired:    0,
  warning:    1,
  valid:      2,
  'no-expiry': 3,
};

export default function MonDossierScreen() {
  const router = useRouter();
  const { store, loaded } = useExpirations();

  const entries = useMemo(() => {
    return Object.entries(store)
      .map(([procedureId, entry]) => {
        const procedure = PROCEDURES.find(p => p.id === procedureId);
        return { procedureId, entry, title: procedure?.title ?? procedureId };
      })
      .sort((a, b) => PRIORITY[getStatus(a.entry)] - PRIORITY[getStatus(b.entry)]);
  }, [store]);

  const urgent    = entries.filter(e => ['expired', 'warning'].includes(getStatus(e.entry)));
  const valides   = entries.filter(e => getStatus(e.entry) === 'valid');
  const historique = entries.filter(e => getStatus(e.entry) === 'no-expiry');
  const isEmpty   = loaded && entries.length === 0;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.heading}>Mon Dossier</Text>
          <Text style={styles.subheading}>
            {entries.length > 0
              ? `${entries.length} démarche${entries.length > 1 ? 's' : ''} suivie${entries.length > 1 ? 's' : ''}`
              : 'Tes documents administratifs'}
          </Text>
        </View>
      </SafeAreaView>

      {!loaded ? null : isEmpty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>Ton dossier est vide</Text>
          <Text style={styles.emptyText}>
            Complète une démarche pour voir tes documents ici et recevoir des rappels d'expiration.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {urgent.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>⚠️ À renouveler</Text>
              {urgent.map(({ procedureId, entry, title }) => (
                <ExpirationCard
                  key={procedureId}
                  procedureId={procedureId}
                  title={title}
                  entry={entry}
                  onPress={() => router.push(`/procedure/${procedureId}`)}
                />
              ))}
            </>
          )}

          {valides.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>✅ Valides</Text>
              {valides.map(({ procedureId, entry, title }) => (
                <ExpirationCard
                  key={procedureId}
                  procedureId={procedureId}
                  title={title}
                  entry={entry}
                  onPress={() => router.push(`/procedure/${procedureId}`)}
                />
              ))}
            </>
          )}

          {historique.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>📋 Historique</Text>
              {historique.map(({ procedureId, entry, title }) => (
                <ExpirationCard
                  key={procedureId}
                  procedureId={procedureId}
                  title={title}
                  entry={entry}
                  onPress={() => router.push(`/procedure/${procedureId}`)}
                />
              ))}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
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
  heading: {
    fontSize: 22,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },

  scroll: { paddingTop: 8, paddingBottom: 32 },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
