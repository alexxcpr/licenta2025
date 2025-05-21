import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Platform, Image, Dimensions } from 'react-native';
import { supabase } from '../utils/supabase';

// Definim interfața pentru datele din tabelul post conform structurii din Supabase
interface PostData {
  id_post: number;
  content: string;
  image_url: string;
  id_user: string;
  is_published: boolean;
  date_created: string;
  date_updated: string;
}

interface Props {
  onRefreshTriggered?: () => void;
}

export default function DbTestQuery({ onRefreshTriggered }: Props) {
  const [data, setData] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const screenWidth = Dimensions.get('window').width;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Executăm interogarea către tabelul post
      const { data: postData, error } = await supabase
        .from('post')
        .select('*')
        .order('date_created', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Adăugăm informații de depanare
      setDebugInfo(JSON.stringify(postData, null, 2));
      
      // Verificăm dacă avem date
      if (postData && postData.length > 0) {
        console.log('Date primite:', postData);
        setData(postData as PostData[]);
      } else {
        console.log('Nu s-au primit date');
        setData([]);
      }
    } catch (error: any) {
      setError(error.message || 'A apărut o eroare la încărcarea datelor');
      console.error('Eroare la încărcarea datelor:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Notificăm componenta părinte când datele sunt reîncărcate cu succes
  useEffect(() => {
    if (!loading && !error && onRefreshTriggered) {
      onRefreshTriggered();
    }
  }, [loading, error, onRefreshTriggered]);

  useEffect(() => {
    // Verificăm dacă suntem în mediul browser
    if (typeof window === 'undefined') {
      setError('Această componentă necesită acces la window (rulează doar în browser)');
      setLoading(false);
      return;
    }

    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Se încarcă postările...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Eroare: {error}</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      {data.length === 0 ? (
        <View>
          <Text style={styles.emptyText}>Nu există postări încă</Text>
          {__DEV__ && (
            <Text style={styles.debugText}>Informații de depanare: {debugInfo}</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id_post.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              {item.image_url && (
                <Image 
                  source={{ uri: item.image_url }} 
                  style={[styles.postImage, { width: screenWidth - 64 }]} 
                  resizeMode="cover"
                />
              )}
              <View style={styles.postContent}>
                <Text style={styles.contentText}>{item.content}</Text>
                <Text style={styles.dateText}>Publicat: {formatDate(item.date_created)}</Text>
                <Text style={styles.userText}>Utilizator ID: {item.id_user}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

// Exportăm și funcția fetchData pentru a putea fi apelată din exterior
export { DbTestQuery };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  item: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
        }
      : Platform.OS === 'android'
        ? {
            elevation: 2,
          }
        : Platform.OS === 'ios'
          ? {
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 4,
              shadowOffset: { height: 2, width: 0 },
            }
          : {}),
  },
  postImage: {
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postContent: {
    padding: 4,
  },
  contentText: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userText: {
    fontSize: 14,
    color: '#888',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 4,
  },
});
