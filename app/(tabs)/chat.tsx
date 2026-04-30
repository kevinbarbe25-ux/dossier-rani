import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AiToolCard } from '../../src/components/AiToolCard';
import { COLORS, FONTS, SHADOWS } from '../../src/theme';

const TOOLS = [
  {
    icon: 'chatbubble-ellipses-outline' as const,
    title: 'Chat Rani',
    subtitle: 'Pose n\'importe quelle question sur tes démarches',
    route: '/rani-chat',
    featured: true,
  },
  {
    icon: 'compass-outline' as const,
    title: 'Diagnostic',
    subtitle: 'Par où commencer ?',
    route: '/diagnostic',
  },
  {
    icon: 'mail-outline' as const,
    title: 'Courrier',
    subtitle: 'Rédige une lettre officielle',
    route: '/letter',
  },
  {
    icon: 'scan-outline' as const,
    title: 'Scanner',
    subtitle: 'Lis et analyse ton document',
    route: '/ocr',
  },
  {
    icon: 'calendar-outline' as const,
    title: 'Rendez-vous',
    subtitle: 'Planifie tes RDV administratifs',
    route: '/(tabs)/appointments',
  },
];

export default function RaniHubScreen() {
  const router = useRouter();

  const featured = TOOLS[0];
  const grid     = TOOLS.slice(1);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>Outils IA</Text>
            <Text style={styles.subheading}>Tous tes outils administratifs</Text>
          </View>
          <View style={styles.aiPill}>
            <Text style={styles.aiPillText}>Powered by Groq</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured card */}
        <View style={styles.section}>
          <AiToolCard
            icon={featured.icon}
            title={featured.title}
            subtitle={featured.subtitle}
            accentColor={COLORS.accent}
            onPress={() => router.push(featured.route as any)}
            featured
          />
        </View>

        {/* 2x2 grid */}
        <Text style={styles.sectionLabel}>Outils spécialisés</Text>
        <View style={styles.grid}>
          {grid.map(tool => (
            <AiToolCard
              key={tool.route}
              icon={tool.icon}
              title={tool.title}
              subtitle={tool.subtitle}
              onPress={() => router.push(tool.route as any)}
            />
          ))}
        </View>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoEmoji}>🔒</Text>
          <Text style={styles.infoText}>
            Tes questions ne sont pas stockées. Connexion Groq chiffrée.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  aiPill: {
    backgroundColor: 'rgba(212,160,23,0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.4)',
  },
  aiPillText: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    color: COLORS.accent,
  },

  scroll: { paddingBottom: 16 },

  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#F0F7F4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C8E6D8',
  },
  infoEmoji: { fontSize: 18 },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSub,
    lineHeight: 17,
  },
});
