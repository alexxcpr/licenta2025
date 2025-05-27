import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ViewMode } from './FullProfilePage';

interface ProfileActionButtonsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isOwnProfile: boolean;
}

const ProfileActionButtons: React.FC<ProfileActionButtonsProps> = ({
  viewMode,
  onViewModeChange,
  isOwnProfile
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.actionButton,
          viewMode === 'grid' && styles.activeButton
        ]}
        onPress={() => onViewModeChange('grid')}
        accessibilityLabel="Vizualizare grid"
        accessibilityHint="Afișează postările în format grid"
      >
        <Ionicons
          name="grid-outline"
          size={24}
          color={viewMode === 'grid' ? '#007AFF' : '#666'}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionButton,
          viewMode === 'list' && styles.activeButton
        ]}
        onPress={() => onViewModeChange('list')}
        accessibilityLabel="Vizualizare listă"
        accessibilityHint="Afișează postările în format listă"
      >
        <Ionicons
          name="list-outline"
          size={24}
          color={viewMode === 'list' ? '#007AFF' : '#666'}
        />
      </TouchableOpacity>

      {isOwnProfile && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            viewMode === 'saved' && styles.activeButton
          ]}
          onPress={() => onViewModeChange('saved')}
          accessibilityLabel="Postări salvate"
          accessibilityHint="Afișează postările salvate"
        >
          <Ionicons
            name="bookmark-outline"
            size={24}
            color={viewMode === 'saved' ? '#007AFF' : '#666'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#fff',
    paddingVertical: 10,
    marginBottom: 1,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  activeButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
});

export default ProfileActionButtons; 