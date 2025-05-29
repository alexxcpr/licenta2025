import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';

// Interfața pentru proprietățile componentei
interface ConnectionsListProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
  username?: string;
}

// Interfața extinsă pentru o conexiune
interface Connection {
  id: string;
  username: string;
  full_name?: string;
  profile_photo_url?: string;
  domeniu?: {
    id_domeniu: number;
    denumire: string;
  } | null;
  functie?: {
    id_functie: number;
    denumire: string;
  } | null;
  ocupatie?: {
    id_ocupatie: number;
    denumire: string;
  } | null;
}

// Interfață pentru datele returnate de Supabase pentru un utilizator dintr-un join
interface UserRecordFromSupabase {
  id_user: string;
  username: string;
  profile_picture?: string | null;
  id_domeniu?: number | null;
  id_functie?: number | null;
  id_ocupatie?: number | null;
}

// Interfața pentru datele returnate de Supabase pentru user_1
interface User1Data {
  id: string;
  user_1: {
    id: string;
    username: string;
    nume?: string;
    prenume?: string;
    profile_picture?: string;
  };
}

// Interfața pentru datele returnate de Supabase pentru user_2
interface User2Data {
  id: string;
  user_2: {
    id: string;
    username: string;
    nume?: string;
    prenume?: string;
    profile_picture?: string;
  };
}
// Interfața pentru secțiuni
interface ConnectionSection {
  title: string;
  data: Connection[];
  domeniu_id?: number;
}

const ConnectionsList: React.FC<ConnectionsListProps> = ({
  visible,
  userId,
  onClose,
  username = 'Utilizator',
}) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [sectionedConnections, setSectionedConnections] = useState<ConnectionSection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Funcție pentru a prelua conexiunile din baza de date cu informații complete
  const fetchConnections = async () => {
    if (!userId || !visible) return;

    try {
      setLoading(true);

      // Obținem conexiunile în care utilizatorul este id_user_1
      const { data: connections1, error: error1 } = await supabase
        .from('connection')
        .select(`
          id_connection,
          user_2:user!connection_id_user_2_fkey (
            id_user,
            username,
            profile_picture,
            id_domeniu,
            id_functie,
            id_ocupatie
          )
        `)
        .eq('id_user_1', userId)

      // Obținem conexiunile în care utilizatorul este id_user_2
      const { data: connections2, error: error2 } = await supabase
        .from('connection')
        .select(`
          id_connection,
          user_1:user!connection_id_user_1_fkey (
            id_user,
            username,
            profile_picture,
            id_domeniu,
            id_functie,
            id_ocupatie
          )
        `)
        .eq('id_user_2', userId)

      if (error1 || error2) {
        console.error('Eroare la obținerea conexiunilor:', error1 || error2);
        return;
      }

      // Combinăm rezultatele
      const formattedConnections: Connection[] = [];

      // Adăugăm conexiunile unde utilizatorul este id_user_1
      if (connections1) {
        for (const conn of connections1) {
          let userDetail: UserRecordFromSupabase | null = null;

          if (conn.user_2) {
            if (Array.isArray(conn.user_2)) {
              // Dacă Supabase returnează un tablou (cum sugera linter-ul)
              if (conn.user_2.length > 0) {
                userDetail = conn.user_2[0] as UserRecordFromSupabase;
              }
            } else {
              // Dacă Supabase returnează un singur obiect (comportament mai probabil pentru join-uri to-one)
              userDetail = conn.user_2 as unknown as UserRecordFromSupabase;
            }
          }

          if (userDetail) {
            const connection: Connection = {
              id: userDetail.id_user,
              username: userDetail.username,
              profile_photo_url: userDetail.profile_picture || undefined,
            };
            
            // Adăugăm informații despre domeniu, funcție și ocupație
            if (userDetail.id_domeniu) {
              await fetchDomeniu(connection, userDetail.id_domeniu);
            }
            
            if (userDetail.id_functie) {
              await fetchFunctie(connection, userDetail.id_functie);
            }
            
            if (userDetail.id_ocupatie) {
              await fetchOcupatie(connection, userDetail.id_ocupatie);
            }
            
            formattedConnections.push(connection);
          }
        }
      }

      // Adăugăm conexiunile unde utilizatorul este id_user_2
      if (connections2) {
        for (const conn of connections2) {
          let userDetail: UserRecordFromSupabase | null = null;

          if (conn.user_1) {
            if (Array.isArray(conn.user_1)) {
              if (conn.user_1.length > 0) {
                userDetail = conn.user_1[0] as UserRecordFromSupabase;
              }
            } else {
              userDetail = conn.user_1 as unknown as UserRecordFromSupabase;
            }
          }

          if (userDetail) {
            const connection: Connection = {
              id: userDetail.id_user,
              username: userDetail.username,
              profile_photo_url: userDetail.profile_picture || undefined,
            };
            
            // Adăugăm informații despre domeniu, funcție și ocupație
            if (userDetail.id_domeniu) {
              await fetchDomeniu(connection, userDetail.id_domeniu);
            }
            
            if (userDetail.id_functie) {
              await fetchFunctie(connection, userDetail.id_functie);
            }
            
            if (userDetail.id_ocupatie) {
              await fetchOcupatie(connection, userDetail.id_ocupatie);
            }
            
            formattedConnections.push(connection);
          }
        }
      }

      setConnections(formattedConnections);
      groupConnectionsByDomain(formattedConnections);
    } catch (error) {
      console.error('Eroare la obținerea conexiunilor:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru a obține informații despre domeniu
  const fetchDomeniu = async (connection: Connection, idDomeniu: number) => {
    try {
      const { data, error } = await supabase
        .from('domenii')
        .select('id_domeniu, denumire')
        .eq('id_domeniu', idDomeniu)
        .single();
      
      if (!error && data) {
        connection.domeniu = data;
      }
    } catch (error) {
      console.error('Eroare la obținerea informațiilor despre domeniu:', error);
    }
  };

  // Funcție pentru a obține informații despre funcție
  const fetchFunctie = async (connection: Connection, idFunctie: number) => {
    try {
      const { data, error } = await supabase
        .from('functii')
        .select('id_functie, denumire')
        .eq('id_functie', idFunctie)
        .single();
      
      if (!error && data) {
        connection.functie = data;
      }
    } catch (error) {
      console.error('Eroare la obținerea informațiilor despre funcție:', error);
    }
  };

  // Funcție pentru a obține informații despre ocupație
  const fetchOcupatie = async (connection: Connection, idOcupatie: number) => {
    try {
      const { data, error } = await supabase
        .from('ocupatii')
        .select('id_ocupatie, denumire')
        .eq('id_ocupatie', idOcupatie)
        .single();
      
      if (!error && data) {
        connection.ocupatie = data;
      }
    } catch (error) {
      console.error('Eroare la obținerea informațiilor despre ocupație:', error);
    }
  };

  // Funcție pentru a grupa conexiunile după domeniu
  const groupConnectionsByDomain = (connections: Connection[]) => {
    // Creăm un obiect pentru a grupa conexiunile după domeniu
    const domainGroups: { [key: string]: Connection[] } = {};
    const withoutDomain: Connection[] = [];
    
    // Grupăm conexiunile după domeniu
    connections.forEach(connection => {
      if (connection.domeniu) {
        const domainName = connection.domeniu.denumire;
        if (!domainGroups[domainName]) {
          domainGroups[domainName] = [];
        }
        domainGroups[domainName].push(connection);
      } else {
        withoutDomain.push(connection);
      }
    });
    
    // Convertim grupurile în secțiuni pentru SectionList
    const sections: ConnectionSection[] = Object.keys(domainGroups).map(domainName => ({
      title: domainName,
      data: domainGroups[domainName],
      domeniu_id: domainGroups[domainName][0].domeniu?.id_domeniu
    }));
    
    // Adăugăm secțiunea pentru conexiunile fără domeniu
    if (withoutDomain.length > 0) {
      sections.push({
        title: 'Fără domeniu specificat',
        data: withoutDomain
      });
    }
    
    // Sortăm secțiunile alfabetic după titlu
    sections.sort((a, b) => {
      if (a.title === 'Fără domeniu specificat') return 1;
      if (b.title === 'Fără domeniu specificat') return -1;
      return a.title.localeCompare(b.title);
    });
    
    setSectionedConnections(sections);
  };

  // Încărcăm conexiunile când se deschide modalul
  useEffect(() => {
    if (visible) {
      fetchConnections();
    }
  }, [visible, userId]);

  // Navighează către profilul utilizatorului
  const navigateToProfile = (profileUserId: string) => {
    onClose();
    // Corectăm ruta pentru a ne asigura că este validă
    router.push({
      pathname: '/(profile)/[id]',
      params: { id: profileUserId }
    });
  };

  // Rendăm un element din lista de conexiuni
  const renderConnectionItem = ({ item }: { item: Connection }) => (
    <TouchableOpacity
      style={styles.connectionItem}
      onPress={() => navigateToProfile(item.id)}
    >
      <Image
        source={{
          uri: item.profile_photo_url || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png',
        }}
        style={styles.avatar}
      />
      <View style={styles.connectionInfo}>
        <Text style={styles.connectionName} numberOfLines={1} ellipsizeMode="tail">
          {item.full_name || item.username}
        </Text>
        <Text style={styles.connectionUsername} numberOfLines={1} ellipsizeMode="tail">
          @{item.username}
        </Text>
        
        {/* Afișăm funcția și ocupația utilizatorului */}
        <View style={styles.professionalInfoContainer}>
          {item.functie && (
            <View style={styles.infoItem}>
              <Ionicons name="laptop-outline" size={14} color="#555" />
              <Text style={styles.functieText}>{item.functie.denumire}</Text>
            </View>
          )}
          
          {item.ocupatie && (
            <View style={styles.infoItem}>
              <Ionicons name="school-outline" size={14} color="#555" />
              <Text style={styles.ocupatieText}>{item.ocupatie.denumire}</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  // Rendăm header-ul pentru o secțiune
  const renderSectionHeader = ({ section }: { section: ConnectionSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>
            Conexiunile lui {username}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : sectionedConnections.length > 0 ? (
          <SectionList
            sections={sectionedConnections}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderConnectionItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.connectionsList}
            stickySectionHeadersEnabled={true}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={50} color="#ccc" />
            <Text style={styles.emptyText}>
              {username === 'Utilizator' ? 'Acest utilizator' : username} nu are conexiuni încă.
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionsList: {
    paddingBottom: 20,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  connectionUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
  },
  sectionHeader: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // Stiluri pentru informațiile profesionale
  professionalInfoContainer: {
    marginTop: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  functieText: {
    fontSize: 13,
    color: '#6633CC',
    marginLeft: 6,
    fontWeight: '500',
  },
  ocupatieText: {
    fontSize: 13,
    color: '#CC3366',
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default ConnectionsList; 