import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');
const TOTAL = 24;
const CONFETTI_COLORS = ['#D4A017', '#1B4332', '#E8C547', '#B5D9C8', '#F4A261', '#2D9C5A', '#FFD700'];

interface PieceConfig {
  angle: number;
  radius: number;
  size: number;
  color: string;
  isCircle: boolean;
  rotEnd: number;
  delayMs: number;
}

function ConfettiPiece({ cfg }: { cfg: PieceConfig }) {
  const centerX = SW / 2;
  const centerY = SH * 0.45;

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.2);

  useEffect(() => {
    const endX = Math.cos(cfg.angle) * cfg.radius;
    const endY = Math.sin(cfg.angle) * cfg.radius + 60;

    tx.value = withDelay(cfg.delayMs, withSpring(endX, { damping: 6, stiffness: 80 }));
    ty.value = withDelay(cfg.delayMs, withSpring(endY, { damping: 6, stiffness: 80 }));
    scale.value = withDelay(cfg.delayMs, withSpring(1, { damping: 5, stiffness: 120 }));
    rotate.value = withDelay(cfg.delayMs, withTiming(cfg.rotEnd, { duration: 900 }));
    opacity.value = withDelay(
      cfg.delayMs,
      withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(600, withTiming(0, { duration: 500 })),
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          left: centerX - cfg.size / 2,
          top: centerY - cfg.size / 2,
          width: cfg.size,
          height: cfg.size,
          borderRadius: cfg.isCircle ? cfg.size / 2 : 2,
          backgroundColor: cfg.color,
        },
      ]}
    />
  );
}

export function ConfettiOverlay({ visible }: { visible: boolean }) {
  const pieces = useMemo<PieceConfig[]>(() => {
    const seed = [0.12, 0.45, 0.78, 0.23, 0.67, 0.34, 0.89, 0.56, 0.11, 0.92,
                   0.38, 0.61, 0.84, 0.17, 0.73, 0.49, 0.06, 0.95, 0.28, 0.52,
                   0.81, 0.14, 0.66, 0.41];
    return Array.from({ length: TOTAL }).map((_, i) => ({
      angle: (i / TOTAL) * Math.PI * 2,
      radius: 80 + seed[i] * 140,
      size: 6 + (i % 4) * 3,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      isCircle: i % 2 === 0,
      rotEnd: seed[i] * 720 - 360,
      delayMs: i * 25,
    }));
  }, []);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {pieces.map((cfg, i) => (
        <ConfettiPiece key={i} cfg={cfg} />
      ))}
    </View>
  );
}
