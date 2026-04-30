import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { COLORS } from '../src/theme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isGuest, loading } = useAuth();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    if (fontsLoaded && !loading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, loading]);

  useEffect(() => {
    if (loading || !fontsLoaded) return;

    const inAuth = segments[0] === '(auth)';

    if (!session && !isGuest) {
      if (!inAuth) router.replace('/(auth)/onboarding');
    } else {
      if (inAuth) router.replace('/(tabs)');
    }
  }, [session, isGuest, loading, fontsLoaded, segments]);

  return (
    <Stack
      screenOptions={{
        headerStyle:      { backgroundColor: COLORS.primary },
        headerTintColor:  '#FFFFFF',
        headerTitleStyle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: '#FFFFFF' },
        headerShadowVisible: false,
        headerBackTitle:  'Retour',
        contentStyle:     { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="(auth)"       options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)"       options={{ headerShown: false }} />
      <Stack.Screen name="rani-chat"     options={{ headerShown: false }} />
      <Stack.Screen name="diagnostic"   options={{ title: 'Mon diagnostic' }} />
      <Stack.Screen name="letter"       options={{ title: 'Rédiger un courrier' }} />
      <Stack.Screen name="ocr"          options={{ title: 'Scanner un document' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
