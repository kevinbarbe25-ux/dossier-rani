import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, RADIUS, FONTS } from '../../src/theme';

const WHATSAPP_MSG = encodeURIComponent(
  "Découvre Dossier Rani 🗂️ — l'app pour tes démarches administratives marocaines, checklist offline + assistant IA. https://dossier-rani.pages.dev"
);

export default function OnboardingScreen() {
  const router              = useRouter();
  const { continueAsGuest } = useAuth();

  // Logo
  const logoScale   = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);

  // Slogan
  const sloganY       = useSharedValue(24);
  const sloganOpacity = useSharedValue(0);

  // Buttons
  const btnY       = useSharedValue(40);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo spring
    logoScale.value   = withSpring(1, { damping: 8, stiffness: 100 });
    logoOpacity.value = withTiming(1, { duration: 500 });

    // Slogan after 400ms
    sloganOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    sloganY.value       = withDelay(400, withSpring(0, { damping: 12, stiffness: 100 }));

    // Buttons after 800ms
    btnOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    btnY.value       = withDelay(800, withSpring(0, { damping: 12, stiffness: 120 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const sloganStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sloganY.value }],
    opacity: sloganOpacity.value,
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: btnY.value }],
    opacity: btnOpacity.value,
  }));

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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>

        {/* Hero */}
        <View style={styles.hero}>
          <Animated.View style={[styles.logoWrap, logoStyle]}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🗂️</Text>
            </View>
            <Text style={styles.logoName}>Dossier Rani</Text>
          </Animated.View>

          <Animated.View style={[styles.sloganWrap, sloganStyle]}>
            <Text style={styles.slogan}>La première fois,</Text>
            <Text style={styles.sloganAccent}>c'est la bonne.</Text>
            <Text style={styles.subtitle}>
              Toutes tes démarches marocaines,{'\n'}step by step — checklist offline + IA.
            </Text>
          </Animated.View>
        </View>

        {/* Actions */}
        <Animated.View style={[styles.actions, btnStyle]}>
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
            activeOpacity={0.75}
          >
            <Text style={styles.btnSecondaryText}>J'ai déjà un compte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGuest}
            onPress={handleGuest}
            activeOpacity={0.7}
          >
            <Text style={styles.btnGuestText}>Continuer sans compte →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={handleWhatsApp}
            activeOpacity={0.8}
          >
            <Text style={styles.whatsappText}>💬 Partager à un ami</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.primary },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },

  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },

  logoWrap:   { alignItems: 'center', gap: 14 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoEmoji: { fontSize: 48 },
  logoName: {
    fontSize: 26,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  sloganWrap: { alignItems: 'center', gap: 4 },
  slogan: {
    fontSize: 34,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  sloganAccent: {
    fontSize: 34,
    fontFamily: FONTS.extrabold,
    color: COLORS.accent,
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
  },

  actions: { gap: 10, maxWidth: 440, width: '100%', alignSelf: 'center' },

  btnPrimary: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 16,
    fontFamily: FONTS.extrabold,
    color: '#1A1200',
    letterSpacing: 0.2,
  },

  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: '#FFFFFF',
  },

  btnGuest:     { paddingVertical: 10, alignItems: 'center' },
  btnGuestText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: 'rgba(255,255,255,0.5)',
  },

  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  whatsappText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
});
