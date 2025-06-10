import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../utils/supabase';
import ConnectionButton from '../../ui/conexiuni/ConnectionButton';

//utils
import navigateToProfile from '@/app/utils/Navigation';

// Interfețe pentru datele utilizatorului și informații suplimentare
interface UserData {
  id_user: string;
  username: string;
  profile_picture?: string;
  id_domeniu?: number;
  id_functie?: number;
  id_ocupatie?: number;
}

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

interface EnrichedUserData extends UserData {
  domeniu?: Domeniu;
  functie?: Functie;
  ocupatie?: Ocupatie;
}

interface ExploreNewConnectionProps {
  user: UserData;
  currentUserId: string;
  onConnectionChange?: () => void;
}

export default function ExploreNewConnection({
  user,
  currentUserId,
  onConnectionChange,
}: ExploreNewConnectionProps) {
  const [enrichedUser, setEnrichedUser] = useState<EnrichedUserData>(user);
  const [loading, setLoading] = useState(true);

  // Funcție pentru îmbogățirea datelor utilizatorului cu informații profesionale
  const enrichUserData = async () => {
    setLoading(true);
    try {
      const enrichedData: EnrichedUserData = { ...user };

      // Obținem informațiile despre domeniu
      if (user.id_domeniu) {
        const { data: domeniuData } = await supabase
          .from('domenii')
          .select('id_domeniu, denumire')
          .eq('id_domeniu', user.id_domeniu)
          .single();
        
        if (domeniuData) {
          enrichedData.domeniu = domeniuData;
        }
      }

      // Obținem informațiile despre funcție
      if (user.id_functie) {
        const { data: functieData } = await supabase
          .from('functii')
          .select('id_functie, denumire')
          .eq('id_functie', user.id_functie)
          .single();
        
        if (functieData) {
          enrichedData.functie = functieData;
        }
      }

      // Obținem informațiile despre ocupație
      if (user.id_ocupatie) {
        const { data: ocupatieData } = await supabase
          .from('ocupatii')
          .select('id_ocupatie, denumire')
          .eq('id_ocupatie', user.id_ocupatie)
          .single();
        
        if (ocupatieData) {
          enrichedData.ocupatie = ocupatieData;
        }
      }

      setEnrichedUser(enrichedData);
    } catch (error) {
      console.error('Eroare la îmbogățirea datelor utilizatorului:', error);
      setEnrichedUser(user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    enrichUserData();
  }, [user]);

  const profileImageUrl = enrichedUser.profile_picture || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.userCard} onPress={() => navigateToProfile(user.id_user)}>
        {/* Poza de profil */}
        <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
        
        {/* Username */}
        <Text style={styles.username} numberOfLines={1}>
          {enrichedUser.username}
        </Text>
        
        {/* Informații profesionale */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        ) : (
          <View style={styles.professionalInfo}>
            {enrichedUser.domeniu && (
              <View style={styles.infoItem}>
                <Ionicons name="briefcase-outline" size={12} color="#3366CC" />
                <Text style={styles.domeniuText} numberOfLines={1}>
                  {enrichedUser.domeniu.denumire}
                </Text>
              </View>
            )}
            
            {enrichedUser.functie && (
              <View style={styles.infoItem}>
                <Ionicons name="laptop-outline" size={12} color="#6633CC" />
                <Text style={styles.functieText} numberOfLines={1}>
                  {enrichedUser.functie.denumire}
                </Text>
              </View>
            )}
            
            {enrichedUser.ocupatie && (
              <View style={styles.infoItem}>
                <Ionicons name="school-outline" size={12} color="#CC3366" />
                <Text style={styles.ocupatieText} numberOfLines={1}>
                  {enrichedUser.ocupatie.denumire}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Buton de conexiune */}
      <View style={styles.connectionButtonContainer}>
        <ConnectionButton
          profileUserId={user.id_user}
          onConnectionChange={onConnectionChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 12,
  },
  userCard: {
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  professionalInfo: {
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    maxWidth: 140,
  },
  domeniuText: {
    fontSize: 11,
    color: '#3366CC',
    marginLeft: 4,
    fontWeight: '500',
    flex: 1,
  },
  functieText: {
    fontSize: 11,
    color: '#6633CC',
    marginLeft: 4,
    fontWeight: '500',
    flex: 1,
  },
  ocupatieText: {
    fontSize: 11,
    color: '#CC3366',
    marginLeft: 4,
    fontWeight: '500',
    flex: 1,
  },
  connectionButtonContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
}); 