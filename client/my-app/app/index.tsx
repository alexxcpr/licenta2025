import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  // Indicator de încărcare simplu
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Redirecționare directă
  return isSignedIn 
    ? <Redirect href="/(home)" /> 
    : <Redirect href="/(auth)/sign-in" />;
} 