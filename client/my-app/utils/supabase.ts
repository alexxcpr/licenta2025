import 'react-native-url-polyfill/auto'
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js'

// Verificăm dacă suntem în browser sau în mediul server
const isBrowser = typeof window !== 'undefined'

// Importăm AsyncStorage doar în mediul browser
let AsyncStorage: any = null
if (isBrowser) {
  AsyncStorage = require('@react-native-async-storage/async-storage').default
}

// Cream un obiect de stocare care verifică mediul în care rulează
const supabaseStorage = {
  getItem: (key: string) => {
    if (!isBrowser) return Promise.resolve(null)
    return AsyncStorage.getItem(key)
  },
  setItem: (key: string, value: string) => {
    if (!isBrowser) return Promise.resolve()
    return AsyncStorage.setItem(key, value)
  },
  removeItem: (key: string) => {
    if (!isBrowser) return Promise.resolve()
    return AsyncStorage.removeItem(key)
  }
}

// Definim URL-ul și cheia Supabase
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Creăm configurația pentru Supabase
const supabaseConfig: SupabaseClientOptions<any> = {
  auth: {
    storage: supabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}

// Adăugăm configurații specifice pentru realtime doar în browser
if (isBrowser) {
  supabaseConfig.realtime = {
    params: {
      eventsPerSecond: 1
    },
  }
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  supabaseConfig
)

// Funcție pentru a obține URL-ul Supabase
export const getSupabaseUrl = () => {
  return SUPABASE_URL;
};

// Funcție pentru a obține cheia anonimă Supabase
export const getSupabaseAnonKey = () => {
  return SUPABASE_ANON_KEY;
};