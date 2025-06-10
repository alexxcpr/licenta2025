import React, { useState, memo } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import ConnectionsList from './ConnectionsList';

interface MyConnectionsButtonProps {
  onClose?: () => void;
}

const MyConnectionsButton: React.FC<MyConnectionsButtonProps> = ({ onClose }) => {
  const { user } = useUser();
  const [modalVisible, setModalVisible] = useState(false);

  // Deschide/închide modalul cu lista de conexiuni
  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  // Închide modalul și notifică părinte dacă este necesar
  const handleCloseModal = () => {
    setModalVisible(false);
    if (onClose) onClose();
  };

  return (
    <>
      <TouchableOpacity style={styles.menuItem} onPress={toggleModal}>
        <Ionicons name="people-outline" size={24} color="#333" style={styles.menuItemIcon} />
        <Text style={styles.menuItemText}>Conexiunile mele</Text>
      </TouchableOpacity>
      
      {user && (
        <ConnectionsList
          visible={modalVisible}
          userId={user.id}
          onClose={handleCloseModal}
          username={user.username || 'Utilizator'}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemIcon: {
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
});

// Utilizăm memo pentru a evita rerenderizările inutile ale componentei
export default memo(MyConnectionsButton); 