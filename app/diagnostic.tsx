import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator, Keyboard,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getDiagnostic, DiagnosticResult } from '../src/services/ai';
import { PROCEDURES } from '../src/data/procedures';
import { COLORS, RADIUS } from '../src/theme';

const SUGGESTIONS = [
  "Je veux acheter une voiture d'occasion",
  "Bghit nkri dar f Casablanca",
  "Mon fils commence l'école en septembre",
  "Je veux voyager hors Maroc",
  "Je viens de trouver un emploi",
  "Je veux ouvrir un compte bancaire",
];

export default function DiagnosticScreen() {
  const router = useRouter();
  const [situation, setSituation] = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<DiagnosticResult | null>(null);
  const [error, setError]         = useState(false);

  const analyse = async (text?: string) => {
    const input = (text ?? situation).trim();
    if (!input || loading) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setResult(null);
    setError(false);
    try {
      const res = await getDiagnostic(input);
      setResult(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const useSuggestion = (s: string) => {
    setSituation(s);
    analyse(s);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Mon diagnostic' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Par où commencer ?</Text>
          <Text style={styles.pageSub}>
            Décris ta situation, je te compose le parcours dans l'ordre.
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            value={situation}
            onChangeText={setSituation}
            placeholder="Ex : je veux acheter une voiture d'occasion..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
            returnKeyType="done"
            onSubmitEditing={() => analyse()}
          />
          <TouchableOpacity
            style={[styles.analyseBtn, (!situation.trim() || loading) && styles.analyseBtnDisabled]}
            onPress={() => analyse()}
            disabled={!situation.trim() || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.analyseBtnText}>Analyser →</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Résultat */}
        {result && result.steps.length > 0 && (
          <View style={styles.resultSection}>
            {result.intro ? (
              <Text style={styles.resultIntro}>{result.intro}</Text>
            ) : null}

            {result.steps.map((step, i) => {
              const procedure = PROCEDURES.find(p => p.id === step.id);
              if (!procedure) return null;
              return (
                <TouchableOpacity
                  key={step.id}
                  style={styles.stepCard}
                  onPress={() => router.push(`/procedure/${step.id}`)}
                  activeOpacity={0.75}
                >
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={styles.stepEmoji}>{procedure.emoji}</Text>
                    <View style={styles.stepTexts}>
                      <Text style={styles.stepTitle}>{procedure.title}</Text>
                      {step.reason ? (
                        <Text style={styles.stepReason}>{step.reason}</Text>
                      ) : null}
                      <Text style={styles.stepMeta}>⏱ {procedure.duration}</Text>
                    </View>
                  </View>
                  <Text style={styles.stepArrow}>›</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.resetBtn} onPress={() => { setResult(null); setSituation(''); }}>
              <Text style={styles.resetBtnText}>Nouvelle situation</Text>
            </TouchableOpacity>
          </View>
        )}

        {result && result.steps.length === 0 && !loading && (
          <View style={styles.emptyResult}>
            <Text style={styles.emptyEmoji}>🤔</Text>
            <Text style={styles.emptyText}>
              Je n'ai pas trouvé de démarches correspondantes. Essaie une description plus précise.
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.emptyResult}>
            <Text style={styles.emptyEmoji}>📡</Text>
            <Text style={styles.emptyText}>Service IA indisponible. Vérifie ta connexion et réessaie.</Text>
          </View>
        )}

        {/* Suggestions */}
        {!result && !loading && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsLabel}>Situations fréquentes</Text>
            {SUGGESTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => useSuggestion(s)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{s}</Text>
                <Text style={styles.suggestionArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },

  pageHeader: { padding: 20, paddingTop: 8, backgroundColor: COLORS.background },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4 },
  pageSub: { fontSize: 14, color: COLORS.textSub, marginTop: 4, lineHeight: 20 },

  inputCard: {
    margin: 16,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  analyseBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  analyseBtnDisabled: { opacity: 0.4 },
  analyseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  resultSection: { paddingHorizontal: 16 },
  resultIntro: {
    fontSize: 14,
    color: COLORS.textSub,
    fontStyle: 'italic',
    marginBottom: 14,
    lineHeight: 20,
  },

  stepCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  stepNumText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stepBody: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepEmoji: { fontSize: 22, marginTop: 1 },
  stepTexts: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, lineHeight: 20 },
  stepReason: { fontSize: 12, color: COLORS.textSub, marginTop: 2, lineHeight: 16 },
  stepMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  stepArrow: { fontSize: 20, color: COLORS.textMuted, marginLeft: 8 },

  resetBtn: { alignItems: 'center', paddingVertical: 14 },
  resetBtnText: { fontSize: 14, color: COLORS.accent, fontWeight: '600' },

  emptyResult: { alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyText: { fontSize: 14, color: COLORS.textSub, textAlign: 'center', lineHeight: 20 },

  suggestionsSection: { paddingHorizontal: 16, marginTop: 8 },
  suggestionsLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
  },
  suggestionChip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionText: { fontSize: 14, color: COLORS.text, flex: 1 },
  suggestionArrow: { fontSize: 16, color: COLORS.accent, marginLeft: 8 },
});
