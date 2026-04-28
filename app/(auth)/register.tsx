import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
  ActivityIndicator, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { COLORS, RADIUS } from '../../src/theme';

// Normalise un numéro marocain → +212XXXXXXXXX
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('212')) return `+${digits}`;
  if (digits.startsWith('0'))  return `+212${digits.slice(1)}`;
  return `+212${digits}`;
}

export default function RegisterScreen() {
  const router      = useRouter();
  const [useEmail, setUseEmail] = useState(false);
  const [phone,    setPhone]    = useState('');
  const [email,    setEmail]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const inputRef   = useRef<TextInput>(null);

  const handleSend = async () => {
    setLoading(true);
    try {
      if (useEmail) {
        const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
        if (error) throw error;
        router.push({ pathname: '/(auth)/verify', params: { via: 'email', contact: email.trim() } });
      } else {
        const normalized = normalizePhone(phone);
        if (normalized.length < 12) {
          Alert.alert('Numéro invalide', 'Entre un numéro marocain valide (ex: 06 12 34 56 78)');
          return;
        }
        const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
        if (error) throw error;
        router.push({ pathname: '/(auth)/verify', params: { via: 'phone', contact: normalized } });
      }
    } catch (err: any) {
      Alert.alert('Erreur', err.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const canSend = useEmail
    ? email.includes('@') && email.includes('.')
    : phone.replace(/\D/g, '').length >= 9;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backText}>← Retour</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Ton numéro</Text>
            <Text style={styles.subtitle}>
              {useEmail
                ? 'On t\'envoie un lien de connexion par email.'
                : 'On t\'envoie un code SMS pour te connecter.\nAucun mot de passe à retenir.'}
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputSection}>
            {!useEmail ? (
              <View style={styles.phoneRow}>
                <View style={styles.flagChip}>
                  <Text style={styles.flag}>🇲🇦</Text>
                  <Text style={styles.prefix}>+212</Text>
                </View>
                <TextInput
                  ref={inputRef}
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="06 12 34 56 78"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  autoFocus
                  maxLength={12}
                />
              </View>
            ) : (
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={setEmail}
                placeholder="ton@email.com"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            )}

            {/* Toggle email */}
            <View style={styles.toggleRow}>
              <Switch
                value={useEmail}
                onValueChange={setUseEmail}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={useEmail ? COLORS.accent : '#FFF'}
              />
              <Text style={styles.toggleLabel}>
                {useEmail ? 'Utiliser un numéro' : 'Utiliser un email'}
              </Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canSend || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.sendBtnText}>
                  {useEmail ? 'Recevoir le lien ✉️' : 'Recevoir mon code 📲'}
                </Text>
            }
          </TouchableOpacity>

          <Text style={styles.legalNote}>
            En continuant, tu acceptes que tes données soient stockées de façon sécurisée.
            Aucun spam, aucune publicité.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.background },
  kav:    { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'space-between', minHeight: 500 },

  header:   { marginBottom: 40 },
  backBtn:  { marginBottom: 24 },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  title:    { fontSize: 30, fontWeight: '900', color: COLORS.text, marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textSub, lineHeight: 22 },

  inputSection: { gap: 16, marginBottom: 32 },

  phoneRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  flagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: `${COLORS.primary}15`,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  flag:   { fontSize: 22 },
  prefix: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  phoneInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 16,
    letterSpacing: 1,
  },

  emailInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
  },

  toggleRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleLabel:{ fontSize: 14, color: COLORS.textSub },

  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText:     { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  legalNote: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
});
