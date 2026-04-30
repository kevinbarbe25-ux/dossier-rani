import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, FONTS, SHADOWS } from '../theme';

type DocType = 'CIN' | 'Passeport' | 'PermisConduire' | 'CarteGrise' | 'Autre';

const OCR_TO_PROCEDURE: Record<DocType, string | null> = {
  CIN:            '/procedure/cin',
  Passeport:      '/procedure/passeport-ma',
  PermisConduire: '/procedure/permis-conduire-ma',
  CarteGrise:     '/procedure/carte-grise-ma',
  Autre:          null,
};

const DOC_LABELS: Record<DocType, string> = {
  CIN:            'Carte Nationale d\'Identité',
  Passeport:      'Passeport',
  PermisConduire: 'Permis de conduire',
  CarteGrise:     'Carte grise',
  Autre:          'Document',
};

interface Props {
  documentType: DocType;
  onReset: () => void;
}

export function OcrResultActions({ documentType, onReset }: Props) {
  const router       = useRouter();
  const route        = OCR_TO_PROCEDURE[documentType];
  const docLabel     = DOC_LABELS[documentType];

  const primaryScale = useSharedValue(1);
  const primaryAnim  = useAnimatedStyle(() => ({ transform: [{ scale: primaryScale.value }] }));

  const handleChecklist = () => {
    if (!route) return;
    primaryScale.value = withSequence(
      withSpring(0.94, { damping: 4, stiffness: 400 }),
      withSpring(1,    { damping: 8, stiffness: 300 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      {route ? (
        <TouchableOpacity onPress={handleChecklist} activeOpacity={1}>
          <Animated.View style={[styles.primaryBtn, primaryAnim]}>
            <Text style={styles.primaryIcon}>📋</Text>
            <View style={styles.primaryBody}>
              <Text style={styles.primaryLabel}>Voir la checklist</Text>
              <Text style={styles.primarySub}>{docLabel} → documents requis</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <View style={styles.noChecklist}>
          <Text style={styles.noChecklistText}>
            Aucune checklist disponible pour ce type de document.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.resetBtn}
        onPress={onReset}
        activeOpacity={0.7}
      >
        <Text style={styles.resetBtnText}>Scanner un autre document</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, marginHorizontal: 16, marginTop: 16 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: 16,
    ...SHADOWS.md,
  },
  primaryIcon:  { fontSize: 24 },
  primaryBody:  { flex: 1 },
  primaryLabel: { fontSize: 15, fontFamily: FONTS.bold, color: '#FFFFFF' },
  primarySub:   { fontSize: 12, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  arrow:        { fontSize: 20, color: COLORS.accent, fontFamily: FONTS.bold },

  noChecklist: {
    backgroundColor: '#F0EDE6',
    borderRadius: RADIUS.md,
    padding: 14,
    alignItems: 'center',
  },
  noChecklistText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  resetBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E4DC',
  },
  resetBtnText: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.textSub,
  },
});
