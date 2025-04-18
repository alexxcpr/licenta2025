import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

// Folosim o implementare simplă de stocare pentru sesiunea de inițializare
const simpleStorage = {
  getItem: (key: string) => {
    return null // La inițializare, nu avem date de sesiune
  },
  setItem: (key: string, value: string) => {},
  removeItem: (key: string) => {}
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: {
      storage: simpleStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })