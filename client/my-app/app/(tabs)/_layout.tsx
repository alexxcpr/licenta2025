import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isSignedIn, isLoaded } = useAuth();

  // Așteptăm până când Clerk este încărcat complet
  if (!isLoaded) {
    return null;
  }

  // Dacă utilizatorul nu este autentificat, redirecționăm către pagina de autentificare
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Redirecționăm către pagina principală
  return <Redirect href="/(home)" />;
}