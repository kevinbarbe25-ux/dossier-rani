import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Linking, SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, RADIUS } from '../../src/theme';

const WHATSAPP_MSG = encodeURIComponent(
  'Découvre Dossier Rani 🗂️ — l\'app pour tes démarches administratives marocaines, avec checklist offline et assistant IA. https://github.com/kevinbarbe25-ux/dossier-rani'
);

export default function OnboardingScreen() {
  const router              = useRouter();
  const { continueAsGuest } = useAuth();

  const logoScale   = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
      Animated.timing(btnOpacity,  { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleGuest = () => {
    continueAsGuest();
    router.replace('/(tabs)');
  };

  const handleWhatsApp = () => {
    Linking.openURL(`whatsapp://send?text=${WHATSAPP_MSG}`).catch(() =>
      Linking.openURL(`https://wa.me/?text=${WHATSAPP_MSG}`)
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>

        {/* Logo animé */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
            <Text style={styles.logoEmoji}>🗂️</Text>
            <Text style={styles.logoName}>Dossier Rani</Text>
          </Animated.View>

          <Animated.View style={{ opacity: textOpacity }}>
            <Text style={styles.slogan}>La première fois,</Text>
            <Text style={styles.sloganAccent}>c'est la bonne.</Text>
            <Text style={styles.subtitle}>
              Toutes tes démarches marocaines,{'\n'}step by step — checklist offline + IA.
            </Text>
          </Animated.View>
        </View>

        {/* Boutons */}
        <Animated.View style={[styles.actions, { opacity: btnOpacity }]}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Créer mon compte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.7}
          >
            <Text style={styles.btnSecondaryText}>J'ai déjà un compte</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
            <Text style={styles.whatsappText}>💬 Partager l'app à un ami</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestBtn} onPress={handleGuest} activeOpacity={0.6}>
            <Text style={styles.guestText}>Continuer sans compte →</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.primary },
  container:  { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between', paddingBottom: 32 },

  heroSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },

  logoWrap:  { alignItems: 'center', gap: 10 },
  logoEmoji: { fontSize: 72 },
  logoName:  { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },

  slogan:      { fontSize: 34, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', lineHeight: 40, letterSpacing: -0.8 },
  sloganAccent:{ fontSize: 34, fontWeight: '900', color: COLORS.accent, textAlign: 'center', lineHeight: 40, letterSpacing: -0.8 },
  subtitle:    { marginTop: 14, fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22 },

  actions: { gap: 12, maxWidth: 440, width: '100%', alignSelf: 'center' },

  btnPrimary: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#1A1200' },

  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  whatsappText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  guestBtn:  { paddingVertical: 10, alignItems: 'center' },
  guestText: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
});
