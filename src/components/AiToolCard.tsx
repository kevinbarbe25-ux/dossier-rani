import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IaBadge } from './IaBadge';
import { COLORS, RADIUS, FONTS, SHADOWS } from '../theme';

interface Props {
  icon: string;
  title: string;
  subtitle: string;
  accentColor?: string;
  onPress: () => void;
  featured?: boolean;
}

export function AiToolCard({
  icon, title, subtitle, accentColor = COLORS.primary, onPress, featured = false,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.93, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 300 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={featured ? styles.wrapFeatured : styles.wrap}>
      <Animated.View style={[styles.card, featured && styles.cardFeatured, animStyle]}>
        <View style={styles.top}>
          <Text style={[styles.icon, featured && styles.iconFeatured]}>{icon}</Text>
          <IaBadge />
        </View>
        <Text style={[styles.title, featured && styles.titleFeatured]}>{title}</Text>
        <Text style={[styles.subtitle, featured && styles.subtitleFeatured]} numberOfLines={2}>
          {subtitle}
        </Text>
        {featured && (
          <View style={[styles.featuredArrow, { backgroundColor: accentColor }]}>
            <Text style={styles.featuredArrowText}>Démarrer →</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap:         { flex: 1 },
  wrapFeatured: { width: '100%' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    gap: 6,
    ...SHADOWS.md,
  },
  cardFeatured: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderWidth: 0,
  },

  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  icon:         { fontSize: 28 },
  iconFeatured: { fontSize: 36 },

  title: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    lineHeight: 18,
  },
  titleFeatured: {
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  subtitleFeatured: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
  },

  featuredArrow: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  featuredArrowText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#1A1200',
  },
});
