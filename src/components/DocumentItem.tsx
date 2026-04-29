import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChecklistDocument } from '../types';
import { COLORS, RADIUS, FONTS } from '../theme';

interface Props {
  doc: ChecklistDocument;
  checked: boolean;
  onToggle: () => void;
  onExplain: (doc: ChecklistDocument) => void;
}

export function DocumentItem({ doc, checked, onToggle, onExplain }: Props) {
  const checkScale = useSharedValue(1);
  const checkBg = useSharedValue(0);
  const rowOpacity = useSharedValue(1);

  useEffect(() => {
    checkBg.value = withTiming(checked ? 1 : 0, { duration: 220 });
    rowOpacity.value = withTiming(checked ? 0.55 : 1, { duration: 300 });
    if (checked) {
      checkScale.value = withSpring(1.3, { damping: 3, stiffness: 400 }, () => {
        checkScale.value = withSpring(1, { damping: 6, stiffness: 300 });
      });
    }
  }, [checked]);

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    backgroundColor: interpolateColor(checkBg.value, [0, 1], ['transparent', COLORS.success]),
    borderColor: interpolateColor(checkBg.value, [0, 1], [COLORS.border, COLORS.success]),
  }));

  const rowStyle = useAnimatedStyle(() => ({
    opacity: rowOpacity.value,
  }));

  return (
    <Animated.View style={[styles.wrapper, rowStyle]}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        activeOpacity={0.8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <Animated.View style={[styles.checkbox, checkboxStyle]}>
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </Animated.View>

        <View style={styles.body}>
          <Text style={[styles.label, checked && styles.labelDone]} numberOfLines={2}>
            {doc.label}
          </Text>
          {doc.labelDarija && (
            <Text style={styles.darija}>{doc.labelDarija}</Text>
          )}
          {doc.note && <Text style={styles.note}>{doc.note}</Text>}
        </View>

        <View style={styles.right}>
          <TouchableOpacity
            onPress={() => onExplain(doc)}
            style={styles.explainBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.explainBtnText}>?</Text>
          </TouchableOpacity>
          {doc.required ? (
            <View style={styles.pillRequired}>
              <Text style={styles.pillRequiredText}>Requis</Text>
            </View>
          ) : (
            <View style={styles.pillOptional}>
              <Text style={styles.pillOptionalText}>Option</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    marginHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E8E4DC',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#E8E4DC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: { color: '#fff', fontSize: 13, fontFamily: FONTS.bold },
  body: { flex: 1 },
  label: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    lineHeight: 20,
  },
  labelDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
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
  right: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  explainBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0EDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  explainBtnText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  pillRequired: {
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillRequiredText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.danger,
  },
  pillOptional: {
    backgroundColor: '#E0F2FE',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillOptionalText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#0369A1',
  },
});
