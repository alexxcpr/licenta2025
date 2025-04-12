import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Așteptăm până când Clerk este încărcat complet
  if (!isLoaded) {
    return null;
  }

  // Dacă utilizatorul este autentificat, redirecționăm către pagina principală
  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  // Dacă utilizatorul nu este autentificat, afișăm stack-ul de autentificare
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}