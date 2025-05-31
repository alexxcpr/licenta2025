import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../../utils/supabase';
import ExploreNewConnection from './ExploreNewConnection';

// Interfețe pentru datele utilizatorului
interface UserData {
  id_user: string;
  username: string;
  profile_picture?: string;
  id_domeniu?: number;
  id_functie?: number;
  id_ocupatie?: number;
}

interface ExploreNewConnectionsRowProps {
  currentUserId: string;
}

export default function ExploreNewConnectionsRow({ currentUserId }: ExploreNewConnectionsRowProps) {
  const [recommendedUsers1, setRecommendedUsers1] = useState<UserData[]>([]);
  const [recommendedUsers2, setRecommendedUsers2] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  // Funcție pentru obținerea utilizatorilor recomandați
  const fetchRecommendedUsers = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      // Obținem ID-urile utilizatorilor cu care avem deja conexiuni
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connection')
        .select('id_user_1, id_user_2')
        .or(`id_user_1.eq.${currentUserId},id_user_2.eq.${currentUserId}`);

      if (connectionsError) {
        console.error('Eroare la obținerea conexiunilor:', connectionsError);
        return;
      }

      // Extragem ID-urile utilizatorilor conectați
      const connectedUserIds = new Set<string>();
      connectionsData?.forEach(connection => {
        if (connection.id_user_1 !== currentUserId) {
          connectedUserIds.add(connection.id_user_1);
        }
        if (connection.id_user_2 !== currentUserId) {
          connectedUserIds.add(connection.id_user_2);
        }
      });

      // Obținem utilizatori aleatorii care nu sunt conectați cu utilizatorul curent
      const { data: allUsers, error: usersError } = await supabase
        .from('user')
        .select('id_user, username, profile_picture, id_domeniu, id_functie, id_ocupatie')
        .neq('id_user', currentUserId)
        .limit(20);

      if (usersError) {
        console.error('Eroare la obținerea utilizatorilor:', usersError);
        return;
      }

      // Filtrăm utilizatorii cu care nu avem conexiuni
      const availableUsers = allUsers?.filter(user => 
        !connectedUserIds.has(user.id_user)
      ) || [];

      // Amestecăm utilizatorii disponibili
      const shuffledUsers = [...availableUsers].sort(() => Math.random() - 0.5);

      // Împărțim în două grupuri pentru cele două rânduri
      const mid = Math.ceil(shuffledUsers.length / 2);
      setRecommendedUsers1(shuffledUsers.slice(0, mid));
      setRecommendedUsers2(shuffledUsers.slice(mid));

    } catch (error) {
      console.error('Eroare la obținerea utilizatorilor recomandați:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchRecommendedUsers();
  }, [fetchRecommendedUsers]);

  // Callback pentru actualizarea listei când se creează o conexiune
  const handleConnectionChange = useCallback(() => {
    fetchRecommendedUsers();
  }, [fetchRecommendedUsers]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Se încarcă recomandările...</Text>
      </View>
    );
  }

  if (recommendedUsers1.length === 0 && recommendedUsers2.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nu există utilizatori noi de recomandat</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Persoane pe care le-ai putea cunoaște</Text>
      
      {/* Primul rând */}
      {recommendedUsers1.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
          contentContainerStyle={styles.scrollContent}
        >
          {recommendedUsers1.map((user) => (
            <ExploreNewConnection
              key={`row1-${user.id_user}`}
              user={user}
              currentUserId={currentUserId}
              onConnectionChange={handleConnectionChange}
            />
          ))}
        </ScrollView>
      )}

      {/* Al doilea rând */}
      {recommendedUsers2.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
          contentContainerStyle={styles.scrollContent}
        >
          {recommendedUsers2.map((user) => (
            <ExploreNewConnection
              key={`row2-${user.id_user}`}
              user={user}
              currentUserId={currentUserId}
              onConnectionChange={handleConnectionChange}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  horizontalScroll: {
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 