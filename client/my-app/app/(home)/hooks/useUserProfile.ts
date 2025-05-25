import { useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useReverification } from '@clerk/clerk-react';
import { Alert, Linking } from 'react-native';
import { supabase } from '../../../utils/supabase';
import { UserProfile, Post } from '../../../utils/types';
// Nu importăm useRouter aici decât dacă o funcție mutată îl necesită direct și nu poate fi pasat

export default function useUserProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk(); // Deși nu e folosit direct în funcțiile mutate, îl păstrăm momentan

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);

  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const updateUserWithReverification = useReverification((params: { username: string }) => {
    if (!user) throw new Error("Utilizatorul nu este disponibil");
    return user.update(params);
  });

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      console.log('(Hook) Încărcare date profil pentru utilizatorul:', user.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('user')
        .select('*')
        .eq('id_user', user.id)
        .single();

      if (profileError) {
        console.error('(Hook) Eroare la încărcarea profilului:', profileError);
        setProfile(null); // Sau gestionează eroarea altfel
      } else {
        console.log('(Hook) Date profil încărcate:', profileData);
        setProfile(profileData);
      }

      const { data: postsData, error: postsError } = await supabase
        .from('post')
        .select('*')
        .eq('id_user', user.id)
        .eq('is_published', true)
        .order('date_created', { ascending: false });

      if (postsError) {
        console.error('(Hook) Eroare la încărcarea postărilor:', postsError);
        setPosts([]);
      } else {
        setPosts(postsData || []);
        setPostCount(postsData?.length || 0);
      }

      const { count: memberCount, error: memberError } = await supabase
        .from('group_member')
        .select('*', { count: 'exact' })
        .eq('id_user', user.id);

      if (memberError) {
        console.error('(Hook) Eroare la încărcarea conexiunilor:', memberError);
        setConnectionCount(0);
      } else {
        setConnectionCount(memberCount || 0);
      }
      
    } catch (error) {
      console.error('(Hook) Eroare generală:', error);
      // Setează stări de eroare dacă este necesar
    } finally {
      setLoading(false);
      setRefreshing(false); // Asigură-te că refreshing e resetat după loadProfile
    }
  }, [user]); // Adăugăm user ca dependență pentru useCallback

  useEffect(() => {
    if (isSignedIn && user) {
      loadProfile();
    }
  }, [isSignedIn, user, loadProfile]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile(); 
    // setLoading(false) și setRefreshing(false) sunt deja în finally al loadProfile
  }, [loadProfile]);

  const openVerificationLink = useCallback((url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('(Hook) Eroare la deschiderea link-ului de verificare:', err);
      Alert.alert('Eroare', 'Nu s-a putut deschide link-ul de verificare. Verificați email-ul manual.');
    });
  }, []);

  const requestUsernameChangeVerification = useCallback(async (newUsername: string) => {
    if (!user) {
      console.error('(Hook) User este null, nu putem actualiza username-ul');
      Alert.alert('Eroare', 'Utilizatorul nu este autentificat.');
      return false;
    }

    try {
      console.log('(Hook) Încercare de actualizare a username-ului în Clerk:', newUsername);
      const response = await updateUserWithReverification({ username: newUsername });
      console.log('(Hook) Răspuns de la Clerk:', JSON.stringify(response, null, 2));

      if (user.username === newUsername || (response && response.username === newUsername)) {
        console.log('(Hook) Numele de utilizator a fost actualizat.');
        Alert.alert('Succes', 'Numele de utilizator a fost actualizat cu succes!');
        await loadProfile(); 
        return true;
      }
      
      const verifications = (response as any)?.verifications;
      if (verifications && verifications.emailAddress) {
        setVerificationPending(true);
        const verificationUrl = verifications.emailAddress.verificationURL;
        if (verificationUrl) {
          Alert.alert(
            'Verificare necesară',
            'Pentru a finaliza schimbarea numelui, trebuie să verificați email-ul. Doriți să deschideți link-ul?',
            [
              { text: 'Deschide link', onPress: () => openVerificationLink(verificationUrl) },
              { text: 'Mai târziu', style: 'cancel' },
            ]
          );
        } else {
           Alert.alert('Verificare necesară', 'Un email de verificare a fost trimis. Verificați email-ul.');
        }
        return true; 
      }
      
      console.warn('(Hook) Actualizarea username-ului procesată, stare finală neclară:', response);
      Alert.alert('Info', 'Solicitarea de actualizare a numelui de utilizator a fost procesată.');
      return false; 

    } catch (error: any) {
      if (error.clerkError && error.code === 'reverification_cancelled') { 
        console.log('(Hook) Utilizatorul a anulat reverificarea.');
        Alert.alert('Anulat', 'Procesul de reverificare a fost anulat.');
      } else {
        console.error('(Hook) Eroare detaliată la actualizare username:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        let errorMessage = 'Nu s-a putut actualiza numele de utilizator.';
        if (error.clerkError && Array.isArray(error.errors) && error.errors.length > 0) {
          errorMessage = error.errors.map((e: any) => e.longMessage || e.message).join('\n');
        } else if (error.message) {
          errorMessage = error.message;
        }
        Alert.alert('Eroare la actualizare', errorMessage);
      }
      return false;
    }
  }, [user, updateUserWithReverification, loadProfile, openVerificationLink]);

  return {
    user, // Returnăm și user pentru a fi disponibil în componentă dacă e nevoie
    isLoaded, // Starea de încărcare a user-ului de la Clerk
    isSignedIn,
    profile,
    posts,
    refreshing,
    loading, // Starea de loading generală a datelor profilului
    postCount,
    connectionCount,
    verificationPending,
    verificationMessage, // Deși nu e setat explicit, e bine să-l returnăm dacă va fi
    loadProfile, // Expunem loadProfile pentru a putea fi apelat din EditProfileModal
    handleRefresh,
    openVerificationLink, // Expunem pentru a fi folosit în afara hook-ului dacă e nevoie
    requestUsernameChangeVerification, // Expunem pentru EditProfileModal
  };
} 