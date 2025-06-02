import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ChatRedirect() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      // Redirecționează către ruta corectă de conversație
      router.replace(`/(chats)/conversation/${id}` as any);
    } else {
      // Dacă nu avem ID, mergem înapoi la lista de conversații
      router.replace('/(chats)' as any);
    }
  }, [id, router]);

  return null; // Nu renderăm nimic, doar redirecționăm
} 