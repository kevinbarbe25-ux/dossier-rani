import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Share, Keyboard, Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { generateLetter, LetterType, isTimeoutError } from '../src/services/ai';
import { COLORS, RADIUS, FONTS } from '../src/theme';

const LETTER_TYPES: { id: LetterType; label: string; emoji: string }[] = [
  { id: 'reclamation', label: 'Réclamation',      emoji: '⚠️' },
  { id: 'delai',       label: 'Demande de délai', emoji: '⏳' },
  { id: 'documents',   label: 'Demande docs',     emoji: '📄' },
  { id: 'explication', label: 'Informations',     emoji: '❓' },
  { id: 'aide',        label: 'Demande d\'aide',  emoji: '🤝' },
];

export default function LetterScreen() {
  const [situation, setSituation] = useState('');
  const [city, setCity]           = useState('Casablanca');
  const [letterType, setLetterType] = useState<LetterType>('reclamation');
  const [loading, setLoading]     = useState(false);
  const [letter, setLetter]       = useState('');
  const [subject, setSubject]     = useState('');
  const [error, setError]         = useState<'timeout' | 'generic' | null>(null);

  const generate = async () => {
    if (!situation.trim() || loading) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setLetter('');
    setError(null);
    try {
      const result = await generateLetter(situation.trim(), letterType, city.trim() || 'Casablanca');
      setLetter(result.letter);
      setSubject(result.subject);
    } catch (e) {
      setError(isTimeoutError(e) ? 'timeout' : 'generic');
    } finally {
      setLoading(false);
    }
  };

  const shareLetter = async () => {
    if (!letter) return;
    try {
      await Share.share({ message: letter, title: subject });
    } catch {
      // L'utilisateur a annulé le partage ou système indisponible
    }
  };

  const copyReset = () => {
    setLetter('');
    setSubject('');
    setSituation('');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Rédiger un courrier' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Courrier administratif</Text>
          <Text style={styles.pageSub}>
            Décris ta situation — je génère la lettre formelle prête à envoyer.
          </Text>
        </View>

        {!letter ? (
          <>
            {/* Type de courrier */}
            <Text style={styles.sectionLabel}>Type de courrier</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesScroll}>
              <View style={styles.typesRow}>
                {LETTER_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeChip, letterType === t.id && styles.typeChipActive]}
                    onPress={() => setLetterType(t.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.typeEmoji}>{t.emoji}</Text>
                    <Text style={[styles.typeLabel, letterType === t.id && styles.typeLabelActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Ville */}
            <Text style={styles.sectionLabel}>Ta ville</Text>
            <TextInput
              style={styles.cityInput}
              value={city}
              onChangeText={setCity}
              placeholder="Casablanca, Rabat, Marrakech..."
              placeholderTextColor={COLORS.textMuted}
            />

            {/* Situation */}
            <Text style={styles.sectionLabel}>Décris ta situation</Text>
            <View style={styles.situationCard}>
              <TextInput
                style={styles.situationInput}
                value={situation}
                onChangeText={setSituation}
                placeholder={
                  letterType === 'reclamation'
                    ? "Ex : Le commissariat refuse de renouveler ma CIN sans raison valable malgré mes documents complets..."
                    : letterType === 'delai'
                    ? "Ex : Je n'ai pas pu déposer ma déclaration IR dans les délais car j'étais hospitalisé..."
                    : "Décris ta situation en détail..."
                }
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.generateBtn, (!situation.trim() || loading) && styles.generateBtnDisabled]}
              onPress={generate}
              disabled={!situation.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.generateBtnText}>Rédaction en cours…</Text>
                </View>
              ) : (
                <Text style={styles.generateBtnText}>Générer le courrier →</Text>
              )}
            </TouchableOpacity>

            {error === 'timeout' && (
              <Text style={styles.errorText}>
                🐌 Connexion lente — 30s dépassées. Réessaie.
              </Text>
            )}
            {error === 'generic' && (
              <Text style={styles.errorText}>
                📡 Service indisponible. Vérifie ta connexion.
              </Text>
            )}
          </>
        ) : (
          <>
            {/* Courrier généré */}
            <View style={styles.subjectRow}>
              <Text style={styles.subjectLabel}>Objet :</Text>
              <Text style={styles.subjectText}>{subject}</Text>
            </View>

            <View style={styles.letterCard}>
              <Text style={styles.letterText} selectable>{letter}</Text>
            </View>

            {/* Actions */}
            <TouchableOpacity style={styles.shareBtn} onPress={shareLetter} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>Partager / Copier le courrier</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetBtn} onPress={copyReset}>
              <Text style={styles.resetBtnText}>Rédiger un autre courrier</Text>
            </TouchableOpacity>
          </>
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

  sectionLabel: {
    fontSize: 11, fontFamily: FONTS.bold, color: COLORS.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginHorizontal: 16, marginTop: 20, marginBottom: 10,
  },

  typesScroll: { paddingLeft: 16 },
  typesRow: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  typeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeEmoji: { fontSize: 14 },
  typeLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSub },
  typeLabelActive: { color: '#fff' },

  cityInput: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  situationCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 130,
  },
  situationInput: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    minHeight: 110,
    textAlignVertical: 'top',
  },

  generateBtn: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 15 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  errorText: {
    textAlign: 'center',
    color: COLORS.danger,
    fontSize: 13,
    marginTop: 12,
    marginHorizontal: 16,
  },

  subjectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    margin: 16,
    marginBottom: 10,
  },
  subjectLabel: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.textMuted },
  subjectText: { fontSize: 13, color: COLORS.text, flex: 1, lineHeight: 18 },

  letterCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  letterText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    fontFamily: 'monospace',
  },

  shareBtn: {
    backgroundColor: COLORS.accent,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareBtnText: { color: '#1A1200', fontFamily: FONTS.bold, fontSize: 15 },

  resetBtn: { alignItems: 'center', paddingVertical: 16 },
  resetBtnText: { fontSize: 14, color: COLORS.textSub },
});
