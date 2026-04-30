import { Tabs } from 'expo-router';
import { AnimatedTabBar } from '../../src/components/AnimatedTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Accueil' }} />
      <Tabs.Screen name="search"    options={{ title: 'Recherche' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favoris' }} />
      <Tabs.Screen name="chat"      options={{ title: 'Rani IA' }} />
      <Tabs.Screen name="profile"      options={{ href: null }} />
      <Tabs.Screen name="appointments" options={{ title: 'Rendez-vous' }} />
    </Tabs>
  );
}
