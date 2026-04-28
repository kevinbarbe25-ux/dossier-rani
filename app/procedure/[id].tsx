import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { PROCEDURES } from '../../src/data/procedures';
import { DocumentItem } from '../../src/components/DocumentItem';
import { useChecklist } from '../../src/hooks/useChecklist';
import { COLORS, RADIUS } from '../../src/theme';

export default function ProcedureScreen() {
  const { id }    = useLocalSearchParams<{ id: string }>();
  const router    = useRouter();
  const procedure = PROCEDURES.find((p) => p.id === id);

  const docIds = procedure?.documents.map((d) => d.id) ?? [];
  const { checked, toggle, reset, done, total, loaded } = useChecklist(id ?? '', docIds);

  if (!procedure) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Démarche introuvable</Text>
      </View>
    );
  }

  const pct = total > 0 ? done / total : 0;

  const handleReset = () => {
    Alert.alert(
      'Remettre à zéro',
      'Effacer toute la progression de cette checklist ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Remettre à zéro', style: 'destructive', onPress: reset },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: procedure.title }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={styles.headerCard}>
          <Text style={styles.emoji}>{procedure.emoji}</Text>
          <Text style={styles.titleDarija}>{procedure.titleDarija}</Text>

          <View style={styles.metaRow}>
            {procedure.cost && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>💶 {procedure.cost}</Text>
              </View>
            )}
            <View style={styles.chip}>
              <Text style={styles.chipText}>⏱ {procedure.duration}</Text>
            </View>
          </View>

          <View style={styles.admins}>
            {procedure.administrations.map((a) => (
              <Text key={a} style={styles.admin}>🏛 {a}</Text>
            ))}
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionLabel}>Documents ({done}/{total})</Text>
            {done > 0 && (
              <TouchableOpacity onPress={handleReset}>
                <Text style={styles.resetBtn}>Remettre à zéro</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
          </View>
          {done === total && total > 0 && (
            <Text style={styles.complete}>✅ Dossier complet — prêt à déposer !</Text>
          )}
        </View>

        {/* Documents */}
        <Text style={styles.sectionTitle}>Checklist documents</Text>
        {loaded && procedure.documents.map((doc) => (
          <DocumentItem
            key={doc.id}
            doc={doc}
            procedureTitle={procedure.title}
            checked={!!checked[doc.id]}
            onToggle={() => toggle(doc.id)}
          />
        ))}

        {/* Notes */}
        {procedure.notes && (
          <>
            <Text style={styles.sectionTitle}>À savoir</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{procedure.notes}</Text>
            </View>
          </>
        )}

        {/* Tips */}
        {procedure.tips && procedure.tips.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Conseils pratiques</Text>
            <View style={styles.noteCard}>
              {procedure.tips.map((tip, i) => (
                <Text key={i} style={styles.tipText}>• {tip}</Text>
              ))}
            </View>
          </>
        )}

        {/* Planifier un RDV */}
        <TouchableOpacity
          style={styles.rdvBtn}
          onPress={() => router.push('/appointments')}
          activeOpacity={0.8}
        >
          <Text style={styles.rdvBtnText}>📅 Planifier un rendez-vous</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: COLORS.textMuted, fontSize: 16 },

  headerCard: {
    backgroundColor: COLORS.primary,
    padding: 24,
    alignItems: 'center',
  },
  emoji: { fontSize: 42, marginBottom: 6 },
  titleDarija: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipText: { color: '#FFF', fontSize: 13 },
  admins: { marginTop: 12, alignItems: 'center' },
  admin: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginVertical: 1 },

  progressCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: RADIUS.md,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  resetBtn: { fontSize: 13, color: COLORS.danger },
  barBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  complete: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 6,
  },

  noteCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: RADIUS.md,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  noteText: { fontSize: 14, color: COLORS.textSub, lineHeight: 20 },
  tipText: { fontSize: 14, color: COLORS.textSub, lineHeight: 22, marginBottom: 4 },
  rdvBtn: {
    marginHorizontal: 16, marginTop: 20, borderRadius: RADIUS.md,
    paddingVertical: 13, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.surface,
  },
  rdvBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
