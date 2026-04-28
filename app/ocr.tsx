import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { analyzeDocument, OcrResult } from '../src/services/ai';
import { COLORS, RADIUS } from '../src/theme';

const DOC_LABELS: Record<string, string> = {
  CIN:           'Carte Nationale d\'Identité',
  Passeport:     'Passeport',
  PermisConduire:'Permis de conduire',
  CarteGrise:    'Carte grise',
  Autre:         'Document',
};

function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const exp = new Date(dateStr);
  if (isNaN(exp.getTime())) return null;
  const diff = exp.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function OcrScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<OcrResult | null>(null);
  const [error, setError]       = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Permission requise', fromCamera
        ? 'Active l\'accès à la caméra dans les paramètres.'
        : 'Active l\'accès à la galerie dans les paramètres.');
      return;
    }

    const picked = await (fromCamera
      ? ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          base64: true,
          allowsEditing: true,
        })
      : ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          base64: true,
          allowsEditing: true,
        }));

    if (picked.canceled || !picked.assets?.[0]) return;

    const asset = picked.assets[0];
    setImageUri(asset.uri);
    setResult(null);
    setError(false);

    if (!asset.base64) {
      Alert.alert('Erreur', 'Impossible de lire l\'image.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const extracted = await analyzeDocument(asset.base64);
      setResult(extracted);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImageUri(null);
    setResult(null);
    setError(false);
  };

  const days     = result ? daysUntilExpiry(result.dateExpiration) : null;
  const isExpired = days !== null && days <= 0;
  const isUrgent  = days !== null && days > 0 && days <= 60;

  return (
    <>
      <Stack.Screen options={{ title: 'Scanner un document' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Lecture de document</Text>
          <Text style={styles.pageSub}>
            Prends en photo ta CIN, passeport ou carte grise. L'IA extrait les infos et détecte les expirations proches.
          </Text>
        </View>

        {!imageUri ? (
          /* Boutons pick */
          <View style={styles.pickSection}>
            <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(true)} activeOpacity={0.8}>
              <Text style={styles.pickBtnIcon}>📷</Text>
              <Text style={styles.pickBtnText}>Prendre une photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickBtn, styles.pickBtnSecondary]} onPress={() => pickImage(false)} activeOpacity={0.8}>
              <Text style={styles.pickBtnIcon}>🖼️</Text>
              <Text style={[styles.pickBtnText, styles.pickBtnTextSecondary]}>Choisir depuis la galerie</Text>
            </TouchableOpacity>

            <View style={styles.privacyNote}>
              <Text style={styles.privacyText}>
                🔒 L'image est analysée par IA et n'est pas stockée. Elle transite uniquement vers le serveur d'analyse.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Aperçu image */}
            <View style={styles.imageWrap}>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
              {loading && (
                <View style={styles.imageOverlay}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                  <Text style={styles.analysisText}>Analyse en cours…</Text>
                </View>
              )}
            </View>

            {/* Résultats */}
            {result && !loading && (
              <View style={styles.resultsCard}>
                {/* Type de document */}
                <View style={styles.docTypeRow}>
                  <Text style={styles.docTypeLabel}>
                    {DOC_LABELS[result.documentType] ?? 'Document'}
                  </Text>
                  {result.numeroDocument && (
                    <Text style={styles.docNumber}>N° {result.numeroDocument}</Text>
                  )}
                </View>

                {/* Infos personnelles */}
                <View style={styles.infoGrid}>
                  <InfoRow label="Prénom" value={result.prenom} />
                  <InfoRow label="Nom" value={result.nom} />
                  <InfoRow label="Date de naissance" value={formatDate(result.dateNaissance)} />
                  <InfoRow label="Nationalité" value={result.nationalite} />
                </View>

                {/* Expiration */}
                {result.dateExpiration && (
                  <View style={[
                    styles.expiryBox,
                    isExpired ? styles.expiryExpired : isUrgent ? styles.expiryUrgent : styles.expiryOk,
                  ]}>
                    <Text style={styles.expiryTitle}>
                      {isExpired ? '❌ Document expiré' : isUrgent ? '⚠️ Expire bientôt' : '✅ Document valide'}
                    </Text>
                    <Text style={styles.expiryDate}>
                      Expiration : {formatDate(result.dateExpiration)}
                    </Text>
                    {days !== null && (
                      <Text style={styles.expiryDays}>
                        {isExpired
                          ? `Expiré depuis ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`
                          : `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`}
                      </Text>
                    )}
                    {isUrgent && !isExpired && (
                      <Text style={styles.expiryAdvice}>
                        Pense à le renouveler au commissariat avant qu'il expire.
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {error && !loading && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Analyse échouée</Text>
                <Text style={styles.errorText}>
                  Le document n'a pas pu être lu. Assure-toi que l'image est nette et bien cadrée.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <Text style={styles.resetBtnText}>Scanner un autre document</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },

  pageHeader: { padding: 20, paddingTop: 8, backgroundColor: COLORS.background },
  pageTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4 },
  pageSub: { fontSize: 14, color: COLORS.textSub, marginTop: 4, lineHeight: 20 },

  pickSection: { padding: 16, gap: 12 },
  pickBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pickBtnSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  pickBtnIcon: { fontSize: 28 },
  pickBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  pickBtnTextSecondary: { color: COLORS.text },

  privacyNote: {
    backgroundColor: '#FFF8EC',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0D98A',
    marginTop: 4,
  },
  privacyText: { fontSize: 12, color: '#8B7500', lineHeight: 18 },

  imageWrap: {
    margin: 16,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: 240 },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analysisText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  resultsCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },

  docTypeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docTypeLabel: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  docNumber: { fontSize: 12, color: COLORS.textMuted, fontFamily: 'monospace' },

  infoGrid: { gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: COLORS.textMuted, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 2, textAlign: 'right' },

  expiryBox: { borderRadius: RADIUS.md, padding: 14, gap: 4 },
  expiryOk:      { backgroundColor: '#EDFAF2', borderWidth: 1, borderColor: '#A8E6C0' },
  expiryUrgent:  { backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFD54F' },
  expiryExpired: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  expiryTitle:   { fontSize: 14, fontWeight: '700', color: COLORS.text },
  expiryDate:    { fontSize: 13, color: COLORS.textSub },
  expiryDays:    { fontSize: 13, fontWeight: '600', color: COLORS.text },
  expiryAdvice:  { fontSize: 12, color: COLORS.textSub, marginTop: 2, lineHeight: 17 },

  errorCard: {
    marginHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorTitle: { fontSize: 14, fontWeight: '700', color: COLORS.danger, marginBottom: 4 },
  errorText:  { fontSize: 13, color: COLORS.danger, lineHeight: 18 },

  resetBtn: { alignItems: 'center', paddingVertical: 20 },
  resetBtnText: { fontSize: 14, color: COLORS.textSub },
});
