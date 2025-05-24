import { Stack } from 'expo-router';

export default function HomeLayout() {
  // Afișăm layout-ul normal al secțiunii home
  // Verificarea autentificării este gestionată la nivel global
  return (
    <Stack screenOptions={{
      headerShown: false,
    }} />
  );
} 