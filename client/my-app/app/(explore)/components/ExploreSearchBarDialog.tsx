import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../../utils/supabase';

//utils
import { navigateToProfile } from '@/app/utils/Navigation';

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

interface ExploreSearchBarDialogProps {
  visible: boolean;
  results: UserData[];
  loading: boolean;
  onClose: () => void;
  onSelectUser: (user: UserData) => void;
}

export default function ExploreSearchBarDialog({
  visible,
  results,
  loading,
  onClose,
  onSelectUser,
}: ExploreSearchBarDialogProps) {
  const [enrichedResults, setEnrichedResults] = useState<EnrichedUserData[]>([]);
  const [loadingEnrich, setLoadingEnrich] = useState(false);

  // Funcție pentru îmbogățirea datelor utilizatorilor cu informații profesionale
  const enrichUserData = async (users: UserData[]) => {
    setLoadingEnrich(true);
    try {
      const enrichedUsers: EnrichedUserData[] = [];

      for (const user of users) {
        const enrichedUser: EnrichedUserData = { ...user };

        // Obținem informațiile despre domeniu
        if (user.id_domeniu) {
          const { data: domeniuData } = await supabase
            .from('domenii')
            .select('id_domeniu, denumire')
            .eq('id_domeniu', user.id_domeniu)
            .single();
          
          if (domeniuData) {
            enrichedUser.domeniu = domeniuData;
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
            enrichedUser.functie = functieData;
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
            enrichedUser.ocupatie = ocupatieData;
          }
        }

        enrichedUsers.push(enrichedUser);
      }

      setEnrichedResults(enrichedUsers);
    } catch (error) {
      console.error('Eroare la îmbogățirea datelor utilizatorilor:', error);
      setEnrichedResults(results);
    } finally {
      setLoadingEnrich(false);
    }
  };

  // Îmbogățim datele când se schimbă rezultatele
  useEffect(() => {
    if (results.length > 0) {
      enrichUserData(results);
    } else {
      setEnrichedResults([]);
    }
  }, [results]);

  const renderUserItem = ({ item }: { item: EnrichedUserData }) => {
    const profileImageUrl = item.profile_picture || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png';

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => navigateToProfile(item.id_user)}
      >
        <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          
          {/* Informații profesionale */}
          <View style={styles.professionalInfo}>
            {item.domeniu && (
              <View style={styles.infoItem}>
                <Ionicons name="briefcase-outline" size={12} color="#3366CC" />
                <Text style={styles.domeniuText}>{item.domeniu.denumire}</Text>
              </View>
            )}
            
            {item.functie && (
              <View style={styles.infoItem}>
                <Ionicons name="laptop-outline" size={12} color="#6633CC" />
                <Text style={styles.functieText}>{item.functie.denumire}</Text>
              </View>
            )}
            
            {item.ocupatie && (
              <View style={styles.infoItem}>
                <Ionicons name="school-outline" size={12} color="#CC3366" />
                <Text style={styles.ocupatieText}>{item.ocupatie.denumire}</Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
        <View style={styles.dialogContainer}>
          <View style={styles.dialogContent}>
            {loading || loadingEnrich ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Se caută...</Text>
              </View>
            ) : (
              <FlatList
                data={enrichedResults}
                keyExtractor={(item) => item.id_user}
                renderItem={renderUserItem}
                style={styles.resultsList}
                showsVerticalScrollIndicator={false}
                maxToRenderPerBatch={5}
                windowSize={10}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dialogContainer: {
    position: 'absolute',
    top: 120, // Poziționat sub search bar
    left: 16,
    right: 16,
    maxHeight: 300,
  },
  dialogContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  resultsList: {
    maxHeight: 280,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  professionalInfo: {
    flexDirection: 'column',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  domeniuText: {
    fontSize: 12,
    color: '#3366CC',
    marginLeft: 4,
    fontWeight: '500',
  },
  functieText: {
    fontSize: 12,
    color: '#6633CC',
    marginLeft: 4,
    fontWeight: '500',
  },
  ocupatieText: {
    fontSize: 12,
    color: '#CC3366',
    marginLeft: 4,
    fontWeight: '500',
  },
}); 