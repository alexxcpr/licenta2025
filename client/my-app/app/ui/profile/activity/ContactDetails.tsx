import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ContactDetailsProps {
  username?: string;
  domeniu?: string;
  functie?: string;
  ocupatie?: string;
  email?: string;
}

const ContactDetails: React.FC<ContactDetailsProps> = ({
  username,
  domeniu,
  functie,
  ocupatie,
  email
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Informații de contact</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>Nume utilizator:</Text>
        <Text style={styles.value}>{username || 'Nespecificat'}</Text>
      </View>
      
      {domeniu && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Domeniu:</Text>
          <Text style={styles.value}>{domeniu}</Text>
        </View>
      )}
      
      {functie && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Funcție:</Text>
          <Text style={styles.value}>{functie}</Text>
        </View>
      )}
      
      {ocupatie && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Ocupație:</Text>
          <Text style={styles.value}>{ocupatie}</Text>
        </View>
      )}
      
      {email && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{email}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
});

export default ContactDetails; 