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

// Interfața pentru o conexiune
interface Connection {
  id: string;
  username: string;
  full_name?: string;
  profile_photo_url?: string;
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

const ConnectionsList: React.FC<ConnectionsListProps> = ({
  visible,
  userId,
  onClose,
  username = 'Utilizator',
}) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Funcție pentru a prelua conexiunile din baza de date
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
            profile_picture
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
            profile_picture
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
        connections1.forEach((conn: any) => {
          if (conn.user_2) {
            formattedConnections.push({
              id: conn.user_2.id,
              username: conn.user_2.username,
              profile_photo_url: conn.user_2.profile_picture,
            });
          }
        });
      }

      // Adăugăm conexiunile unde utilizatorul este id_user_2
      if (connections2) {
        connections2.forEach((conn: any) => {
          if (conn.user_1) {
            formattedConnections.push({
              id: conn.user_1.id,
              username: conn.user_1.username,
              profile_photo_url: conn.user_1.profile_picture,
            });
          }
        });
      }

      setConnections(formattedConnections);
    } catch (error) {
      console.error('Eroare la obținerea conexiunilor:', error);
    } finally {
      setLoading(false);
    }
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
    router.push(`/profile/${profileUserId}`);
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
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
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
        ) : connections.length > 0 ? (
          <FlatList
            data={connections}
            keyExtractor={(item) => item.id}
            renderItem={renderConnectionItem}
            contentContainerStyle={styles.connectionsList}
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
    padding: 15,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
});

export default ConnectionsList; 