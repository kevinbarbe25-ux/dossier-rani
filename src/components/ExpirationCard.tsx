import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ExpirationEntry, ExpiryStatus, getStatus } from '../hooks/useExpirations';
import { COLORS, RADIUS, FONTS, SHADOWS } from '../theme';

interface Props {
  procedureId:  string;
  title:        string;
  entry:        ExpirationEntry;
  onPress:      () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

const STATUS_CONFIG: Record<ExpiryStatus, {
  label: string; bg: string; border: string; text: string; emoji: string; cta?: string;
}> = {
  expired:    { label: 'Expiré',         bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', emoji: '❌', cta: 'Renouveler →' },
  warning:    { label: 'Expire bientôt', bg: '#FFFBEB', border: '#FCD34D', text: '#92400E', emoji: '⚠️', cta: 'Préparer →' },
  valid:      { label: 'Valide',         bg: '#F0FDF4', border: '#86EFAC', text: '#166534', emoji: '✅' },
  'no-expiry':{ label: 'Complété',       bg: '#F8FAFC', border: '#CBD5E1', text: '#475569', emoji: '📋' },
};

export function ExpirationCard({ procedureId, title, entry, onPress }: Props) {
  const status = getStatus(entry);
  const cfg    = STATUS_CONFIG[status];

  const scale    = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.96, { damping: 4, stiffness: 400 }),
      withSpring(1,    { damping: 8, stiffness: 300 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const days = entry.expiresAt ? daysUntil(entry.expiresAt) : null;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[
        styles.card,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
        animStyle,
      ]}>
        <View style={styles.row}>
          <Text style={styles.emoji}>{cfg.emoji}</Text>
          <View style={styles.body}>
            <Text style={styles.title}>{title}</Text>
            <Text style={[styles.status, { color: cfg.text }]}>{cfg.label}</Text>
            {entry.expiresAt && (
              <Text style={styles.date}>
                {status === 'expired'
                  ? `Expiré depuis ${Math.abs(days!)} jour${Math.abs(days!) > 1 ? 's' : ''}`
                  : status === 'warning'
                    ? `Expire dans ${days} jour${days! > 1 ? 's' : ''}`
                    : `Valide jusqu'au ${formatDate(entry.expiresAt)}`
                }
              </Text>
            )}
            {!entry.expiresAt && (
              <Text style={styles.date}>Complété le {formatDate(entry.completedAt)}</Text>
            )}
          </View>
          {cfg.cta && (
            <Text style={[styles.cta, { color: cfg.text }]}>{cfg.cta}</Text>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    ...SHADOWS.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emoji: { fontSize: 22, flexShrink: 0 },
  body:  { flex: 1 },
  title: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    lineHeight: 18,
  },
  status: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  cta: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    flexShrink: 0,
  },
});
