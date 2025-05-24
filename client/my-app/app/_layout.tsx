import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, Slot, Redirect, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator, Platform, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

//Clerk
import { ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Lista rutelor publice care nu necesită autentificare - definită în afara componentei pentru a evita recrearea la fiecare render
const PUBLIC_PATHS = ['/(auth)', 'sign-in', 'sign-up', 'not-found'];

// Componenta care verifică autentificarea și decide ce să afișeze
function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();
  
  // Folosim useMemo pentru a calcula dacă ruta este publică doar când pathname se schimbă
  const isPublicRoute = useMemo(() => {
    return PUBLIC_PATHS.some(route => pathname?.includes(route));
  }, [pathname]);
  
  // Dacă Clerk încă se încarcă, afișăm un indicator de încărcare simplu (fără text și logging)
  if (!isLoaded) {
    console.log('[AuthGuard] Clerk se încarcă...');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Se încarcă...</Text>
      </View>
    );
  }

  // Dacă suntem deja pe o rută de autentificare, nu mai redirecționăm
  if (pathname?.includes('/(auth)')) {
    return <Slot />;
  }
  
  // Redirecționăm doar dacă e necesar
  if (!isSignedIn && !isPublicRoute) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  
  // Afișăm conținutul normal
  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ClerkProvider 
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <AuthGuard />
            <StatusBar style="auto" />
          </View>
        </GestureHandlerRootView>
      </ThemeProvider>
    </ClerkProvider>
  );
}