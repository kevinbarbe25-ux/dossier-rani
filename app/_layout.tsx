import { Stack } from 'expo-router';
import { COLORS } from '../src/theme';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: COLORS.text },
        headerShadowVisible: false,
        headerBackTitle: 'Retour',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      {/* Tab group — pas de header Stack, les tabs gèrent leur propre header */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Écrans IA au-dessus des tabs */}
      <Stack.Screen name="diagnostic"   options={{ title: 'Mon diagnostic'       }} />
      <Stack.Screen name="letter"       options={{ title: 'Rédiger un courrier'  }} />
      <Stack.Screen name="ocr"          options={{ title: 'Scanner un document'  }} />
    </Stack>
  );
}
