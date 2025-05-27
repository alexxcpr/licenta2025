import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '@/utils/supabase';
import ConnectionRequestList from './ConnectionRequestList';

interface ConnectionRequestButtonProps {
  onClose?: () => void;
}

// Folosim această interfață pentru a declara funcția expusă global pentru actualizarea numărului de cereri
declare global {
  interface Window {
    updateConnectionRequestCount?: () => void;
  }
}

const ConnectionRequestButton: React.FC<ConnectionRequestButtonProps> = ({ onClose }) => {
  const { user } = useUser();
  const [requestCount, setRequestCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  // Funcție pentru a încărca numărul de cereri de conexiune
  const loadRequestCount = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { count, error } = await supabase
        .from('connection_request')
        .select('*', { count: 'exact', head: true })
        .eq('id_user_receiver', user.id);
      
      if (error) {
        console.error('Eroare la obținerea numărului de cereri:', error);
        return;
      }
      
      setRequestCount(count || 0);
    } catch (error) {
      console.error('Eroare la obținerea numărului de cereri:', error);
    }
  }, [user?.id]);

  // Încarcă numărul de cereri la montarea componentei
  useEffect(() => {
    loadRequestCount();
    
    // Opțional: Se poate seta un interval pentru a actualiza periodic numărul de cereri
    const interval = setInterval(loadRequestCount, 60000); // Actualizează la fiecare minut
    
    // Expunem funcția de actualizare a contorului la nivel global
    if (typeof window !== 'undefined') {
      window.updateConnectionRequestCount = loadRequestCount;
    }
    
    return () => {
      clearInterval(interval);
      // Curățăm funcția globală la demontare
      if (typeof window !== 'undefined') {
        window.updateConnectionRequestCount = undefined;
      }
    };
  }, [loadRequestCount]);

  // Deschide/închide modalul cu lista de cereri
  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  // Închide modalul și notifică părinte dacă este necesar
  const handleCloseModal = () => {
    setModalVisible(false);
    loadRequestCount(); // Reîncarcă numărul de cereri după închiderea modalului
    if (onClose) onClose();
  };

  return (
    <>
      <TouchableOpacity style={styles.menuItem} onPress={toggleModal}>
        <Ionicons name="people-outline" size={24} color="#333" style={styles.menuItemIcon} />
        <Text style={styles.menuItemText}>Cereri conexiune</Text>
        
        {requestCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{requestCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ConnectionRequestList onClose={handleCloseModal} />
        </View>
      </Modal>
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
  badgeContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 8,
  },
});

// Utilizăm memo pentru a evita rerenderizările inutile ale componentei
export default memo(ConnectionRequestButton); 