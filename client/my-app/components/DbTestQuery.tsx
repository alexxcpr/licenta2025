import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { supabase } from '../utils/supabase';

// Definim interfața pentru datele din tabelul test
interface TestData {
  id: number;
  coloana1: string;
  numar: number;
  boolean: boolean;
}

interface Props {
  onRefreshTriggered?: () => void;
}

export default function DbTestQuery({ onRefreshTriggered }: Props) {
  const [data, setData] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Executăm interogarea către tabelul test
      const { data: testData, error } = await supabase
        .from('test')
        .select('*')
        .order('id', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Adăugăm informații de depanare
      setDebugInfo(JSON.stringify(testData, null, 2));
      
      // Verificăm dacă avem date
      if (testData && testData.length > 0) {
        console.log('Date primite:', testData);
        setData(testData as TestData[]);
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
        <Text style={styles.loadingText}>Se încarcă datele...</Text>
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

  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Postari acasa</Text> */}
      
      {data.length === 0 ? (
        <View>
          <Text style={styles.emptyText}>Nu există date în tabel</Text>
          <Text style={styles.debugText}>Informații de depanare: {debugInfo}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>ID: {item.id}</Text>
              <Text style={styles.itemText}>Coloana1: {item.coloana1}</Text>
              <Text style={styles.itemText}>Număr: {item.numar}</Text>
              <Text style={styles.itemText}>Boolean: {item.boolean ? 'Da' : 'Nu'}</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
              shadowColor: 'transparent',
              shadowOpacity: 0,
              shadowRadius: 0,
              shadowOffset: { height: 0, width: 0 },
              elevation: 0,
            }
          : {}),
  },
  itemText: {
    fontSize: 16,
    marginBottom: 4,
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
