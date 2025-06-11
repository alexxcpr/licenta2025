import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '@/utils/types';
import { UserResource } from '@clerk/types';
import ConnectionButton from '../conexiuni/ConnectionButton';
import { supabase } from '@/utils/supabase';
import ConnectionsList from '../conexiuni/ConnectionsList';
import { useUser } from '@clerk/clerk-expo';

interface ProfileUserInfoProps {
  user: UserResource | null | undefined;
  profile: UserProfile | null;
  postCount: number;
  connectionCount: number; // Păstrăm prop-ul pentru compatibilitate, dar îl ignorăm
  onEditPress: () => void;
  isOwnProfile?: boolean;
  profileUserId?: string;
  isCurrentUserProfile: boolean;
}

// Noi interfețe pentru datele suplimentare
interface Domeniu {
  id_domeniu: number;
  denumire: string;
}

interface Functie {
  id_functie: number;
  denumire: string;
}

interface Ocupatie {
  id_ocupatie: number;
  denumire: string;
}

const ProfileUserInfo: React.FC<ProfileUserInfoProps> = ({
  user,
  profile,
  postCount,
  connectionCount: initialConnectionCount, // Ignorăm această valoare
  onEditPress,
  isOwnProfile = false,
  profileUserId,
  isCurrentUserProfile,
}) => {
  const { user: clerkUser } = useUser();
  const [connectionCount, setConnectionCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionModalVisible, setConnectionsModalVisible] = useState<boolean>(false);
  
  // State-uri noi pentru informațiile profesionale
  const [domeniu, setDomeniu] = useState<Domeniu | null>(null);
  const [functie, setFunctie] = useState<Functie | null>(null);
  const [ocupatie, setOcupatie] = useState<Ocupatie | null>(null);
  const [loadingProfInfo, setLoadingProfInfo] = useState<boolean>(false);

  // Adăugăm state pentru a controla înălțimea expandată
  const [expanded, setExpanded] = useState<boolean>(false);

  // Funcție pentru actualizarea numărului de conexiuni
  const fetchConnectionCount = useCallback(async () => {
    if (!profileUserId) return;

    try {
      setLoading(true);
      
      // Calculăm numărul de conexiuni pentru profilul vizitat folosind COUNT
      const { count, error } = await supabase
        .from('connection')
        .select('*', { count: 'exact', head: true })
        .or(`id_user_1.eq.${profileUserId},id_user_2.eq.${profileUserId}`);

      if (error) {
        console.error('Eroare la obținerea numărului de conexiuni:', error);
        setConnectionCount(0);
      } else {
        setConnectionCount(count || 0);
      }
    } catch (error) {
      console.error('Eroare la actualizarea numărului de conexiuni:', error);
      setConnectionCount(0);
    } finally {
      setLoading(false);
    }
  }, [profileUserId]);

  // Funcție nouă pentru obținerea informațiilor profesionale
  const fetchProfessionalInfo = useCallback(async () => {
    if (!profileUserId) return;

    try {
      setLoadingProfInfo(true);
      
      // Obținem informațiile despre utilizator, inclusiv id-urile pentru domeniu, funcție și ocupație
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('id_domeniu, id_functie, id_ocupatie')
        .eq('id_user', profileUserId)
        .single();

      if (userError) {
        console.error('Eroare la obținerea informațiilor despre utilizator:', userError);
        return;
      }

      // Obținem informațiile despre domeniu dacă există
      if (userData.id_domeniu) {
        const { data: domeniuData, error: domeniuError } = await supabase
          .from('domenii')
          .select('id_domeniu, denumire')
          .eq('id_domeniu', userData.id_domeniu)
          .single();

        if (!domeniuError && domeniuData) {
          setDomeniu(domeniuData);
        }
      }

      // Obținem informațiile despre funcție dacă există
      if (userData.id_functie) {
        const { data: functieData, error: functieError } = await supabase
          .from('functii')
          .select('id_functie, denumire')
          .eq('id_functie', userData.id_functie)
          .single();

        if (!functieError && functieData) {
          setFunctie(functieData);
        }
      }

      // Obținem informațiile despre ocupație dacă există
      if (userData.id_ocupatie) {
        const { data: ocupatieData, error: ocupatieError } = await supabase
          .from('ocupatii')
          .select('id_ocupatie, denumire')
          .eq('id_ocupatie', userData.id_ocupatie)
          .single();

        if (!ocupatieError && ocupatieData) {
          setOcupatie(ocupatieData);
        }
      }
    } catch (error) {
      console.error('Eroare la obținerea informațiilor profesionale:', error);
    } finally {
      setLoadingProfInfo(false);
    }
  }, [profileUserId]);

  // Actualizăm numărul de conexiuni la fiecare randare a componentei
  useEffect(() => {
    fetchConnectionCount();
    fetchProfessionalInfo(); // Apelăm și funcția pentru obținerea informațiilor profesionale
  }, [fetchConnectionCount, fetchProfessionalInfo, profileUserId]);

  // Afișează data de înregistrare formatată
  const formatJoinDate = () => {
    const dateValue = profile?.date_created || user?.createdAt;
    if (dateValue) {
      return `Membru din ${new Date(dateValue).toLocaleDateString('ro-RO')}`;
    }
    return 'Dată înregistrare indisponibilă';
  };

  // Afișează modalul cu conexiuni
  const showConnectionsModal = () => {
    setConnectionsModalVisible(true);
  };

  // Închide modalul cu conexiuni
  const closeConnectionsModal = () => {
    setConnectionsModalVisible(false);
    // Opțional: reîncarcă numărul de conexiuni după închiderea modalului
    fetchConnectionCount();
  };
  
  // Comută starea expandată
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Construim numele complet pentru afișare
  const displayName = profile?.username
    ? profile.username
    : profile?.email || 'Utilizator';

  // URL-ul imaginii de profil sau placeholder
  const profileImageUrl = profile?.profile_picture || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png';

  // Fix: Determinăm corect dacă suntem pe profilul propriu
  const isCurrentUser = isCurrentUserProfile || (clerkUser?.id === profileUserId);

  // Verifică dacă există informații profesionale de afișat
  const hasProfessionalInfo = domeniu || functie || ocupatie;

  // Randarea profilului
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : (
            <Image 
              source={{ uri: profileImageUrl }} 
              style={styles.profileImage}
            />
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.statsContainer}>
            <View style={styles.statItemWrapper}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{postCount}</Text>
                <Text style={styles.statLabel}>Postări</Text>
              </View>
            </View>
            
            <View style={styles.statItemWrapper}>
              <TouchableOpacity 
                style={styles.statItem} 
                onPress={showConnectionsModal}
                accessibilityLabel="Vezi conexiunile"
                accessibilityHint="Deschide lista cu toate conexiunile utilizatorului"
                disabled={connectionCount === 0}
              >
                <Text style={styles.statNumber}>{connectionCount}</Text>
                <Text style={styles.statLabel}>Conexiuni</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isCurrentUser ? (
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={onEditPress}
              accessibilityLabel="Editează profilul"
              accessibilityHint="Deschide formularul de editare a profilului"
            >
              <Text style={styles.editButtonText}>Editează profilul</Text>
            </TouchableOpacity>
          ) : (
            <ConnectionButton
              profileUserId={profileUserId || ''}
              onConnectionChange={fetchConnectionCount}
            />
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.bioSection}>
          <View style={styles.usernameContainer}>
            <Text style={styles.username}>{displayName}</Text>
          </View>
          
          <Text style={styles.joinDate}>{formatJoinDate()}</Text>
        
            {/* Container nou pentru informațiile profesionale */}
            {hasProfessionalInfo && (
              <View style={styles.professionalInfoContainer}>
                {loadingProfInfo ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <>
                    {domeniu && (
                      <View style={styles.infoItem}>
                        <Ionicons name="briefcase-outline" size={16} color="#555" />
                        <Text style={styles.domeniuText}>Domeniu: {domeniu.denumire}</Text>
                      </View>
                    )}
                    
                    {functie && (
                      <View style={styles.infoItem}>
                        <Ionicons name="laptop-outline" size={16} color="#555" />
                        <Text style={styles.functieText}>Funcție: {functie.denumire}</Text>
                      </View>
                    )}
                    
                    {ocupatie && (
                      <View style={styles.infoItem}>
                        <Ionicons name="school-outline" size={16} color="#555" />
                        <Text style={styles.ocupatieText}>Ocupație: {ocupatie.denumire}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
            
            {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>
      </View>

      {/* Modal pentru afișarea listei de conexiuni */}
      <ConnectionsList
        visible={connectionModalVisible}
        userId={profileUserId || ''}
        onClose={closeConnectionsModal}
        username={profile?.username || clerkUser?.username || 'Utilizator'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    padding: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  loadingContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-around',
    width: '100%',
  },
  statItemWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    padding: 15,
    paddingTop: 0,
  },
  bioSection: {
    marginBottom: 10,
  },
  usernameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  joinDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  editProfileButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  // Stiluri noi pentru informațiile profesionale
  professionalInfoContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  domeniuText: {
    fontSize: 14,
    color: '#3366CC',
    marginLeft: 6,
    fontWeight: '500',
  },
  functieText: {
    fontSize: 14,
    color: '#6633CC',
    marginLeft: 6,
    fontWeight: '500',
  },
  ocupatieText: {
    fontSize: 14,
    color: '#CC3366',
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default ProfileUserInfo; 