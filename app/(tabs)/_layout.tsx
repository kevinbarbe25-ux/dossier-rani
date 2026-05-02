import { Tabs } from 'expo-router';
import { AnimatedTabBar } from '../../src/components/AnimatedTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Visible tabs — order must match AnimatedTabBar TABS array */}
      <Tabs.Screen name="index"       options={{ title: 'Accueil' }} />
      <Tabs.Screen name="chat"        options={{ title: 'Rani IA' }} />
      <Tabs.Screen name="mon-dossier" options={{ title: 'Mon Dossier' }} />

      {/* Hidden — navigable but not in tab bar */}
      <Tabs.Screen name="profile"      options={{ href: null }} />
      <Tabs.Screen name="search"       options={{ href: null }} />
      <Tabs.Screen name="favorites"    options={{ href: null }} />
      <Tabs.Screen name="appointments" options={{ href: null }} />
    </Tabs>
  );
}
