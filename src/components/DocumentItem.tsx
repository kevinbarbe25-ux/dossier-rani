import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChecklistDocument } from '../types';
import { COLORS, RADIUS } from '../theme';
import { explainDocument, AiLang } from '../services/ai';

interface Props {
  doc: ChecklistDocument;
  procedureTitle: string;
  checked: boolean;
  onToggle: () => void;
}

export function DocumentItem({ doc, procedureTitle, checked, onToggle }: Props) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<AiLang>('fr');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  const handleExplain = async (targetLang: AiLang) => {
    const alreadyOpen = open && explanation && lang === targetLang;
    if (alreadyOpen) {
      setOpen(false);
      return;
    }
    setLang(targetLang);
    setOpen(true);
    if (explanation && lang === targetLang) return;
    setError(false);
    setLoading(true);
    try {
      const text = await explainDocument(doc.label, procedureTitle, targetLang);
      setExplanation(text);
    } catch {
      setError(true);
      setExplanation(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={`${doc.label}${doc.required ? ', obligatoire' : ', optionnel'}`}
      >
        <View style={[styles.checkbox, checked && styles.checkboxDone]}>
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.body}>
          <Text style={[styles.label, checked && styles.labelDone]}>{doc.label}</Text>
          {doc.labelDarija && (
            <Text style={styles.darija}>{doc.labelDarija}</Text>
          )}
          {doc.note && <Text style={styles.note}>{doc.note}</Text>}

          {/* Boutons explain */}
          <View style={styles.explainRow}>
            <TouchableOpacity
              onPress={() => handleExplain('fr')}
              hitSlop={8}
              style={styles.explainBtn}
            >
              <Text style={styles.explainBtnText}>
                {open && lang === 'fr' && !loading ? 'Masquer' : "Qu'est-ce que c'est ?"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.explainSep}>·</Text>
            <TouchableOpacity
              onPress={() => handleExplain('darija')}
              hitSlop={8}
              style={styles.explainBtn}
            >
              <Text style={styles.explainBtnText}>
                {open && lang === 'darija' && !loading ? 'Khbbi' : 'Shrah b darija'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.pillCol}>
          {doc.required ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>Requis</Text>
            </View>
          ) : (
            <View style={[styles.pill, styles.pillOptional]}>
              <Text style={[styles.pillText, styles.pillTextOptional]}>Optionnel</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Zone explication */}
      {open && (
        <View style={styles.explainBox}>
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.loadingText}>
                {lang === 'darija' ? 'Khdma...' : 'Chargement...'}
              </Text>
            </View>
          )}
          {!loading && error && (
            <Text style={styles.errorText}>
              Service IA indisponible. Vérifie ta connexion.
            </Text>
          )}
          {!loading && explanation && (
            <Text style={styles.explanationText}>{explanation}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  body: { flex: 1 },
  label: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  labelDone: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  darija: {
    fontSize: 12,
    color: COLORS.textSub,
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  explainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  explainBtn: { paddingVertical: 2 },
  explainBtnText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
  explainSep: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  pillCol: { alignSelf: 'flex-start', marginLeft: 8 },
  pill: {
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.danger,
  },
  pillOptional: { backgroundColor: '#E0F2FE' },
  pillTextOptional: { color: '#0369A1' },

  /* Explain box */
  explainBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: '#FFFDF8',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.danger,
  },
  explanationText: {
    fontSize: 13,
    color: COLORS.textSub,
    lineHeight: 20,
  },
});
