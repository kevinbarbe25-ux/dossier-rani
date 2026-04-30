import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, RADIUS, FONTS, SHADOWS } from '../../src/theme';

interface Stats {
  completed: number;
  docsAvoided: number;
}

async function loadStats(): Promise<Stats> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const checklistKeys = keys.filter(k => k.startsWith('checklist_'));
    let completed = 0;
    let docsAvoided = 0;
    for (const key of checklistKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;
      const obj: Record<string, boolean> = JSON.parse(raw);
      const checked = Object.values(obj).filter(Boolean).length;
      if (checked > 0) {
        completed++;
        docsAvoided += checked;
      }
    }
    return { completed, docsAvoided };
  } catch {
    return { completed: 0, docsAvoided: 0 };
  }
}

export default function ProfileScreen() {
  const { user, isGuest, signOut } = useAuth();
  const [stats, setStats] = useState<Stats>({ completed: 0, docsAvoided: 0 });

  useEffect(() => {
    loadStats().then(setStats);
  }, []);

  const displayName = user?.email?.split('@')[0] ?? 'Invité';
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = user?.email ?? 'Mode invité';

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Tu vas être déconnecté de ton compte.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: signOut },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon profil</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          {isGuest && (
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeText}>Mode invité</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <Text style={styles.sectionLabel}>Mes stats</Text>
        {stats.completed === 0 && stats.docsAvoided === 0 && (
          <View style={styles.statsHint}>
            <Text style={styles.statsHintEmoji}>🌱</Text>
            <Text style={styles.statsHintText}>
              Complète ta première démarche pour voir tes stats.
            </Text>
          </View>
        )}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Démarches{'\n'}complétées</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{stats.docsAvoided}</Text>
            <Text style={styles.statLabel}>Documents{'\n'}vérifiés</Text>
          </View>
        </View>

        {/* App info */}
        <Text style={styles.sectionLabel}>À propos</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🗂️</Text>
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>Dossier Rani</Text>
              <Text style={styles.infoSub}>Toutes tes démarches marocaines, step by step.</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📱</Text>
            <View style={styles.infoBody}>
              <Text style={styles.infoTitle}>Version 1.0.0</Text>
              <Text style={styles.infoSub}>Checklist offline + IA intégrée</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  headerTitle: {
    fontSize: 22,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  scroll: { paddingBottom: 40 },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E4DC',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  displayName: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  guestBadge: {
    marginTop: 8,
    backgroundColor: '#FFF3CD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  guestBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    color: '#856404',
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },

  statsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#F0F7F4',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C8E6D8',
  },
  statsHintEmoji: { fontSize: 20 },
  statsHintText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSub,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E8E4DC',
    marginVertical: 16,
  },
  statNum: {
    fontSize: 32,
    fontFamily: FONTS.extrabold,
    color: COLORS.primary,
    lineHeight: 36,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 16,
  },

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  infoIcon: { fontSize: 22 },
  infoBody: { flex: 1 },
  infoTitle: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  infoSub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8E4DC',
    marginHorizontal: 16,
  },

  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.danger,
  },
});
