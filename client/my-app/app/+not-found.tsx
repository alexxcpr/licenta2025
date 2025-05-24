import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Platform } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function NotFoundScreen() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Stack.Screen options={{ title: 'Pagină inexistentă' }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="alert-circle-outline" size={80} color="#007AFF" />
          <Text style={styles.title}>Această pagină nu există</Text>
          <Text style={styles.subtitle}>Ne pare rău, dar pagina pe care încerci să o accesezi nu poate fi găsită.</Text>
          
          <TouchableOpacity 
            style={styles.returnButton}
            onPress={() => {}}
          >
            <Link href="/" style={styles.link}>
              <Text style={styles.returnText}>Înapoi la pagina principală</Text>
            </Link>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  returnButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  returnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    textDecorationLine: 'none',
  },
});
