import * as React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import SignUpSearchBar from './SignUpSearchBar';
import SignUpSearchList from './SignUpSearchList';
import SignUpSearchCloseButton from './SignUpSearchCloseButton';

interface Item {
  denumire: string;
  [key: string]: any;
}

interface SignUpSearchModalProps<T extends Item> {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: T[];
  searchValue: string;
  onSearchChange: (text: string) => void;
  onSelect: (item: T) => void;
}

function SignUpSearchModal<T extends Item>({
  visible,
  onClose,
  title,
  data,
  searchValue,
  onSearchChange,
  onSelect
}: SignUpSearchModalProps<T>) {
  // Folosim useRef pentru a stoca conținutul care poate fi modificat fără a declanșa re-randarea
  const modalContentRef = React.useRef<View>(null);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent} ref={modalContentRef}>
          <Text style={styles.modalTitle}>{title}</Text>
          
          {/* Componenta pentru bara de căutare */}
          <SignUpSearchBar 
            searchValue={searchValue}
            onSearchChange={onSearchChange}
          />
          
          {/* Componenta pentru lista de rezultate */}
          <SignUpSearchList 
            data={data}
            onSelect={onSelect}
            onClose={onClose}
          />
          
          {/* Componenta pentru butonul de închidere */}
          <SignUpSearchCloseButton onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
});

export default SignUpSearchModal; 