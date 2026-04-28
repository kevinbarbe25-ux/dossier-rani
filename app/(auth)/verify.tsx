import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, RADIUS } from '../../src/theme';

const CODE_LENGTH = 6;
const RESEND_SEC  = 60;

export default function VerifyScreen() {
  const router   = useRouter();
  const { via, contact } = useLocalSearchParams<{ via: string; contact: string }>();
  const { migrateLocalDataToSupabase } = useAuth();

  const [digits,   setDigits]   = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading,  setLoading]  = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SEC);
  const inputs = useRef<(TextInput | null)[]>([]);
  const timer  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer
  useEffect(() => {
    timer.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer.current!); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  const handleInput = (text: string, index: number) => {
    const char = text.slice(-1);
    if (!/^\d$/.test(char) && char !== '') return;

    const next = [...digits];
    next[index] = char;
    setDigits(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (char && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
    // Auto-submit when all filled
    if (next.every(d => d !== '') && char) {
      verify(next.join(''));
    }
  };

  const handleBackspace = (index: number) => {
    if (digits[index] === '' && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputs.current[index - 1]?.focus();
    } else {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
    }
  };

  const verify = useCallback(async (code: string) => {
    setLoading(true);
    try {
      let result;
      if (via === 'phone') {
        result = await supabase.auth.verifyOtp({
          phone: contact,
          token: code,
          type: 'sms',
        });
      } else {
        result = await supabase.auth.verifyOtp({
          email: contact,
          token: code,
          type: 'email',
        });
      }

      if (result.error) throw result.error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Migration données locales → Supabase
      await migrateLocalDataToSupabase();

      // Vérifier si profil déjà rempli
      const { data: profile } = await supabase
        .from('profiles')
        .select('prenom')
        .eq('user_id', result.data.user?.id ?? '')
        .single();

      if (!profile?.prenom) {
        router.replace('/(auth)/profile-setup');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Code incorrect', 'Vérifie le code et réessaie.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [via, contact, migrateLocalDataToSupabase]);

  const resend = async () => {
    if (countdown > 0) return;
    try {
      if (via === 'phone') {
        await supabase.auth.signInWithOtp({ phone: contact });
      } else {
        await supabase.auth.signInWithOtp({ email: contact });
      }
      setCountdown(RESEND_SEC);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
      timer.current = setInterval(() => {
        setCountdown(c => { if (c <= 1) { clearInterval(timer.current!); return 0; } return c - 1; });
      }, 1000);
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    }
  };

  // Display contact masked
  const displayContact = via === 'phone'
    ? contact.replace(/(\+212)(\d{2})(\d{4})(\d{4})/, '$1 $2 $3 $4')
    : contact;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Entre le code</Text>
          <Text style={styles.subtitle}>
            {via === 'phone' ? `SMS envoyé au ${displayContact}` : `Email envoyé à ${displayContact}`}
          </Text>

          {/* Message en darija */}
          <Text style={styles.darijaHint}>
            🇲🇦 Dkhel le code lli wslek
          </Text>

          {/* 6 boxes OTP */}
          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={r => { inputs.current[i] = r; }}
                style={[styles.otpBox, d !== '' && styles.otpBoxFilled]}
                value={d}
                onChangeText={t => handleInput(t, i)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace') handleBackspace(i);
                }}
                keyboardType="number-pad"
                maxLength={1}
                autoFocus={i === 0}
                selectTextOnFocus
                caretHidden
              />
            ))}
          </View>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Vérification…</Text>
            </View>
          )}

          {/* Resend */}
          <TouchableOpacity
            onPress={resend}
            disabled={countdown > 0}
            style={styles.resendBtn}
          >
            <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
              {countdown > 0
                ? `Renvoyer le code dans ${countdown}s`
                : 'Renvoyer le code'}
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.background },
  kav:       { flex: 1 },
  container: { flex: 1, padding: 24, paddingTop: 16 },

  backBtn:  { marginBottom: 32 },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },

  title:      { fontSize: 30, fontWeight: '900', color: COLORS.text, marginBottom: 8, letterSpacing: -0.5 },
  subtitle:   { fontSize: 15, color: COLORS.textSub, marginBottom: 6 },
  darijaHint: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginBottom: 36 },

  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 32 },
  otpBox: {
    width: 48,
    height: 60,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },

  loadingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 20 },
  loadingText: { fontSize: 14, color: COLORS.textSub },

  resendBtn:     { alignItems: 'center', paddingVertical: 12 },
  resendText:    { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  resendDisabled:{ color: COLORS.textMuted },
});
