import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '@/utils/supabase';
import ConnectionRequestRow from './ConnectionRequestRow';

interface ConnectionRequestListProps {
  onClose: () => void;
}

const ConnectionRequestList: React.FC<ConnectionRequestListProps> = ({ onClose }) => {
  const { user } = useUser();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Funcție pentru încărcarea cererilor de conexiune
  const loadConnectionRequests = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Obține cererile de conexiune pentru utilizatorul curent
      const { data, error } = await supabase
        .from('connection_request')
        .select(`
          *,
          user:id_user_sender (
            username,
            profile_picture
          )
        `)
        .eq('id_user_receiver', user.id)
        .order('date_created', { ascending: false });
      
      if (error) {
        console.error('Eroare la încărcarea cererilor:', error);
        return;
      }
      
      setRequests(data || []);
    } catch (error) {
      console.error('Eroare la încărcarea cererilor:', error);
    } finally {
      setLoading(false);
    }
  };

  // Încarcă cererile la montarea componentei
  useEffect(() => {
    loadConnectionRequests();
  }, [user]);

  // Actualizează lista după ce o cerere a fost procesată
  const handleRequestProcessed = () => {
    loadConnectionRequests();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cereri de conexiune</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : requests.length === 0 ? (
        <Text style={styles.emptyText}>Nu ai cereri de conexiune</Text>
      ) : (
        <ScrollView style={styles.requestsList}>
          {requests.map((request) => (
            <ConnectionRequestRow 
              key={request.id_connection_request} 
              request={request} 
              onRequestProcessed={handleRequestProcessed}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  loader: {
    marginTop: 40,
  },
  requestsList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default ConnectionRequestList; 