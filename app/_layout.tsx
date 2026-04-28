import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '../src/theme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function RootNavigator() {
  const { session, isGuest, loading } = useAuth();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const segments  = useSegments();
  const router    = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (!session && !isGuest) {
      // Pas connecté et pas en mode invité → onboarding
      if (!inAuth) router.replace('/(auth)/onboarding');
    } else {
      // Connecté ou invité → app principale
      if (inAuth) router.replace('/(tabs)');
    }
  }, [session, isGuest, loading, segments]);

  return (
    <Stack
      screenOptions={{
        headerStyle:      { backgroundColor: COLORS.surface },
        headerTintColor:  COLORS.primary,
        headerTitleStyle: { fontWeight: '700', fontSize: 17, color: COLORS.text },
        headerShadowVisible: false,
        headerBackTitle:  'Retour',
        contentStyle:     { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="(auth)"   options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)"   options={{ headerShown: false }} />
      <Stack.Screen name="diagnostic"   options={{ title: 'Mon diagnostic' }} />
      <Stack.Screen name="letter"       options={{ title: 'Rédiger un courrier' }} />
      <Stack.Screen name="ocr"          options={{ title: 'Scanner un document' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
