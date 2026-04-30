import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Linking, StatusBar, ActivityIndicator,
  Modal, Pressable, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PROCEDURES } from '../../src/data/procedures';
import { DocumentItem } from '../../src/components/DocumentItem';
import { ConfettiOverlay } from '../../src/components/ConfettiOverlay';
import { useChecklist } from '../../src/hooks/useChecklist';
import { useRecentlyViewed } from '../../src/hooks/useRecentlyViewed';
import { useFavorites } from '../../src/hooks/useFavorites';
import { explainDocument, AiLang } from '../../src/services/ai';
import { ChecklistDocument } from '../../src/types';
import { COLORS, RADIUS, FONTS, SHADOWS } from '../../src/theme';

const WHATSAPP_BASE = 'https://wa.me/?text=';

function AnimatedProgressBar({ pct }: { pct: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(pct * 100, {
      duration: pct === 0 ? 400 : 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.barBg}>
      <Animated.View style={[styles.barFill, barStyle]} />
    </View>
  );
}

// ── Lang Toggle ────────────────────────────────────────────────────────────────
function LangToggle({ lang, onChange }: { lang: AiLang; onChange: (l: AiLang) => void }) {
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    indicatorX.value = withSpring(lang === 'fr' ? 0 : 1, { damping: 14, stiffness: 200 });
  }, [lang]);

  return (
    <View style={toggleStyles.container}>
      {(['fr', 'darija'] as AiLang[]).map((l, i) => {
        const active = lang === l;
        return (
          <TouchableOpacity
            key={l}
            onPress={() => onChange(l)}
            style={[toggleStyles.pill, active && toggleStyles.pillActive]}
            activeOpacity={0.8}
          >
            <Text style={[toggleStyles.pillText, active && toggleStyles.pillTextActive]}>
              {l === 'fr' ? '🇫🇷 Français' : '🇲🇦 Darija'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F0EDE6',
    borderRadius: RADIUS.full,
    padding: 3,
    marginBottom: 16,
    gap: 2,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    color: COLORS.textMuted,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});

// ── Bottom Sheet ───────────────────────────────────────────────────────────────
interface SheetState {
  visible: boolean;
  doc: ChecklistDocument | null;
  explanation: string | null;
  loading: boolean;
  error: boolean;
}

function AiBottomSheet({
  sheet,
  procedureTitle,
  onClose,
  onRefetch,
}: {
  sheet: SheetState;
  procedureTitle: string;
  onClose: () => void;
  onRefetch: (doc: ChecklistDocument, lang: AiLang) => void;
}) {
  const translateY = useSharedValue(400);
  const bgOpacity  = useSharedValue(0);
  const [lang, setLang] = useState<AiLang>('fr');

  useEffect(() => {
    if (sheet.visible) {
      setLang('fr');
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      bgOpacity.value  = withTiming(1, { duration: 250 });
    }
  }, [sheet.visible, sheet.doc?.id]);

  const handleLangChange = (newLang: AiLang) => {
    if (newLang === lang || !sheet.doc) return;
    setLang(newLang);
    onRefetch(sheet.doc, newLang);
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${bgOpacity.value * 0.5})`,
  }));

  const handleClose = () => {
    translateY.value = withSpring(400, { damping: 18, stiffness: 200 });
    bgOpacity.value  = withTiming(0, { duration: 200 });
    setTimeout(onClose, 280);
  };

  if (!sheet.visible && !sheet.doc) return null;

  return (
    <Modal transparent visible={sheet.visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[StyleSheet.absoluteFillObject, bgStyle]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetDocName}>{sheet.doc?.label}</Text>
        <Text style={styles.sheetProcedure}>{procedureTitle}</Text>

        <LangToggle lang={lang} onChange={handleLangChange} />

        <View style={styles.sheetContent}>
          {sheet.loading && (
            <View style={styles.sheetLoading}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.sheetLoadingText}>
                {lang === 'darija' ? 'Khdma…' : 'Rani explique…'}
              </Text>
            </View>
          )}
          {!sheet.loading && sheet.error && (
            <Text style={styles.sheetError}>Service IA indisponible. Vérifie ta connexion.</Text>
          )}
          {!sheet.loading && sheet.explanation && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetExplanation}>{sheet.explanation}</Text>
            </ScrollView>
          )}
        </View>

        <TouchableOpacity style={styles.sheetCloseBtn} onPress={handleClose}>
          <Text style={styles.sheetCloseBtnText}>Fermer</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function ProcedureScreen() {
  const { id }    = useLocalSearchParams<{ id: string }>();
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const procedure = PROCEDURES.find(p => p.id === id);

  const docIds = procedure?.documents.map(d => d.id) ?? [];
  const { checked, toggle, reset, done, total, loaded } = useChecklist(id ?? '', docIds);
  const { addRecent } = useRecentlyViewed();
  const { isFavorite, toggle: toggleFav } = useFavorites();

  const [confetti, setConfetti] = useState(false);
  const [sheet, setSheet] = useState<SheetState>({
    visible: false,
    doc: null,
    explanation: null,
    loading: false,
    error: false,
  });

  // Shake animation for progress card on reset
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  useEffect(() => {
    if (id) addRecent(id);
  }, [id]);

  const prevDone = React.useRef(done);
  useEffect(() => {
    if (done === total && total > 0 && prevDone.current < total) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2400);
    }
    prevDone.current = done;
  }, [done, total]);

  const handleExplain = useCallback(async (doc: ChecklistDocument, lang: AiLang = 'fr') => {
    setSheet(prev => ({ ...prev, visible: true, doc, explanation: null, loading: true, error: false }));
    try {
      const text = await explainDocument(doc.label, procedure?.title ?? '', lang);
      setSheet(prev => ({ ...prev, explanation: text, loading: false }));
    } catch {
      setSheet(prev => ({ ...prev, loading: false, error: true }));
    }
  }, [procedure?.title]);

  const handleCloseSheet = () => {
    setSheet(prev => ({ ...prev, visible: false }));
    setTimeout(() => setSheet({ visible: false, doc: null, explanation: null, loading: false, error: false }), 350);
  };

  const handleReset = () => {
    Alert.alert(
      'Remettre à zéro',
      'Effacer toute la progression de cette checklist ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Remettre à zéro',
          style: 'destructive',
          onPress: () => {
            reset();
            // Shake feedback
            shakeX.value = withSequence(
              withSpring(-10, { damping: 3, stiffness: 600 }),
              withSpring(10,  { damping: 3, stiffness: 600 }),
              withSpring(-6,  { damping: 4, stiffness: 400 }),
              withSpring(6,   { damping: 4, stiffness: 400 }),
              withSpring(0,   { damping: 8, stiffness: 300 }),
            );
          },
        },
      ],
    );
  };

  const handleWhatsApp = () => {
    if (!procedure) return;
    const msg = encodeURIComponent(
      `J'ai complété ${done}/${total} docs pour la démarche « ${procedure.title} » avec Dossier Rani 🗂️\nhttps://dossier-rani.pages.dev`
    );
    Linking.openURL(`whatsapp://send?text=${msg}`).catch(() =>
      Linking.openURL(`${WHATSAPP_BASE}${msg}`)
    );
  };

  if (!procedure) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.notFound}>Démarche introuvable</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const pct = total > 0 ? done / total : 0;
  const isComplete = done === total && total > 0;
  const fav = isFavorite(id ?? '');

  const sortedDocs = loaded
    ? [...procedure.documents].sort((a, b) => {
        const ac = checked[a.id] ? 1 : 0;
        const bc = checked[b.id] ? 1 : 0;
        return ac - bc;
      })
    : procedure.documents;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Text style={styles.backIconText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>{procedure.emoji}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{procedure.title}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleFav(id ?? '')} style={styles.favIcon}>
            <Text style={{ fontSize: 22 }}>{fav ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{procedure.category}</Text>
          </View>
          {procedure.cost && (
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>💶 {procedure.cost}</Text>
            </View>
          )}
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>⏱ {procedure.duration}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress card — animates on shake */}
        <Animated.View style={shakeStyle}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                Documents — <Text style={styles.progressCount}>{done}/{total}</Text>
              </Text>
              {done > 0 && (
                <TouchableOpacity onPress={handleReset}>
                  <Text style={styles.resetBtn}>Réinitialiser</Text>
                </TouchableOpacity>
              )}
            </View>
            <AnimatedProgressBar pct={pct} />
            {isComplete && (
              <Text style={styles.completeMsg}>
                ✅ Dossier complet — wla t-wla! Prêt à déposer.
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Checklist */}
        <Text style={styles.sectionTitle}>Checklist documents</Text>
        {sortedDocs.map(doc => (
          <DocumentItem
            key={doc.id}
            doc={doc}
            checked={!!checked[doc.id]}
            onToggle={() => toggle(doc.id)}
            onExplain={handleExplain}
          />
        ))}

        {procedure.notes && (
          <>
            <Text style={styles.sectionTitle}>À savoir</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{procedure.notes}</Text>
            </View>
          </>
        )}

        {procedure.tips && procedure.tips.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Conseils pratiques</Text>
            <View style={styles.infoCard}>
              {procedure.tips.map((tip, i) => (
                <Text key={i} style={styles.tipText}>• {tip}</Text>
              ))}
            </View>
          </>
        )}

        {procedure.administrations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Administrations</Text>
            <View style={styles.infoCard}>
              {procedure.administrations.map(a => (
                <Text key={a} style={styles.adminText}>🏛 {a}</Text>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Fixed WhatsApp button */}
      <View style={[styles.fixedBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp} activeOpacity={0.85}>
          <Text style={styles.whatsappText}>💬 Partager ma progression</Text>
        </TouchableOpacity>
      </View>

      <AiBottomSheet
        sheet={sheet}
        procedureTitle={procedure.title}
        onClose={handleCloseSheet}
        onRefetch={handleExplain}
      />

      <ConfettiOverlay visible={confetti} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: COLORS.background },
  flex:       { flex: 1 },
  headerSafe: { backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  backIcon:     { padding: 4 },
  backIconText: { fontSize: 22, color: '#FFFFFF', fontFamily: FONTS.bold },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerEmoji:  { fontSize: 20 },
  headerTitle:  { fontSize: 16, fontFamily: FONTS.bold, color: '#FFFFFF', flex: 1 },
  favIcon:      { padding: 4 },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryBadgeText: { fontSize: 11, fontFamily: FONTS.bold, color: '#FFFFFF', letterSpacing: 0.3 },
  metaBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaBadgeText: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },

  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    ...SHADOWS.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: { fontSize: 14, fontFamily: FONTS.semibold, color: COLORS.text },
  progressCount: { fontFamily: FONTS.bold, color: COLORS.primary },
  resetBtn:      { fontSize: 13, fontFamily: FONTS.semibold, color: COLORS.danger },
  barBg: { height: 8, backgroundColor: '#E8E4DC', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: COLORS.success, borderRadius: 4 },
  completeMsg: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.success,
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    ...SHADOWS.sm,
  },
  infoText:   { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textSub, lineHeight: 21 },
  tipText:    { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textSub, lineHeight: 22, marginBottom: 4 },
  adminText:  { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textSub, lineHeight: 22 },

  fixedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(250,250,248,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E8E4DC',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  whatsappText: { fontSize: 15, fontFamily: FONTS.bold, color: '#FFFFFF' },

  /* Sheet */
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '75%',
    ...SHADOWS.lg,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8E4DC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetDocName:  { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 4 },
  sheetProcedure:{ fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted, marginBottom: 12 },
  sheetContent:  { minHeight: 80, marginBottom: 16 },
  sheetLoading:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20 },
  sheetLoadingText: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textMuted },
  sheetError:    { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.danger, lineHeight: 20 },
  sheetExplanation: { fontSize: 15, fontFamily: FONTS.regular, color: COLORS.text, lineHeight: 24 },
  sheetCloseBtn: {
    backgroundColor: '#F0EDE6',
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  sheetCloseBtnText: { fontSize: 15, fontFamily: FONTS.semibold, color: COLORS.text },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  notFound:     { fontSize: 16, fontFamily: FONTS.semibold, color: COLORS.textMuted, marginBottom: 16 },
  backBtn:      { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: COLORS.primary, borderRadius: RADIUS.md },
  backBtnText:  { fontSize: 14, fontFamily: FONTS.bold, color: '#FFFFFF' },
});
