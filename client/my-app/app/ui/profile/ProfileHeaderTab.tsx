import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeaderTabProps {
  username: string;
  onGoBack: () => void;
  onSettingsPress: () => void;
}

const ProfileHeaderTab: React.FC<ProfileHeaderTabProps> = ({
  username,
  onGoBack,
  onSettingsPress
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={onGoBack}
        accessibilityLabel="Înapoi"
        accessibilityHint="Navigare înapoi la pagina anterioară"
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
        {username}
      </Text>
      
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={onSettingsPress}
        accessibilityLabel="Setări"
        accessibilityHint="Deschide meniul de setări"
      >
        <Ionicons name="settings-outline" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  settingsButton: {
    padding: 8,
  },
});

export default ProfileHeaderTab; 