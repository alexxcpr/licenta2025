import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../utils/supabase';

// Definim interfața pentru datele din tabelul test
interface TestData {
  id: number;
  coloana1: string;
  numar: number;
  boolean: boolean;
}

export default function DbTestQuery() {
  const [data, setData] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Executăm interogarea către tabelul test
        const { data: testData, error } = await supabase
          .from('test')
          .select('*');
        
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
    }

    fetchData();
  }, []);

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
      <Text style={styles.title}>Date din tabelul test</Text>
      
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
