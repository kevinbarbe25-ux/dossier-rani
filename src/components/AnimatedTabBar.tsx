import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../theme';

const TABS = [
  { name: 'index',     label: 'Accueil',   icon: '🏠' },
  { name: 'search',    label: 'Recherche', icon: '🔍' },
  { name: 'favorites', label: 'Favoris',   icon: '⭐' },
  { name: 'chat',      label: 'Rani IA',   icon: '💬' },
];

function TabButton({
  icon, label, focused, onPress,
}: { icon: string; label: string; focused: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.78, { damping: 3, stiffness: 500 }),
      withSpring(1, { damping: 8, stiffness: 300 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.tabBtn}
      onPress={handlePress}
      activeOpacity={1}
    >
      <Animated.View style={[styles.tabContent, animStyle]}>
        <Text style={styles.tabIcon}>{icon}</Text>
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function AnimatedTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(Dimensions.get('window').width);
  const tabWidth = barWidth / TABS.length;
  const indicatorX = useSharedValue(state.index * tabWidth + tabWidth / 2 - 18);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth + tabWidth / 2 - 18, {
      damping: 14,
      stiffness: 180,
    });
  }, [state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + 4 }]}
      onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.indicator, indicatorStyle]} />

      {TABS.map((tab, i) => {
        const route = state.routes[i];
        if (!route) return null;
        return (
          <TabButton
            key={tab.name}
            icon={tab.icon}
            label={tab.label}
            focused={state.index === i}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E4DC',
    paddingTop: 8,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
      },
      android: { elevation: 8 },
    }),
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#9A9A9A',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
});
