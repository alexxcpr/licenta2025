import * as React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SignUpSearchCloseButtonProps {
  onClose: () => void;
  text?: string;
}

const SignUpSearchCloseButton: React.FC<SignUpSearchCloseButtonProps> = ({ 
  onClose,
  text = "Închide" 
}) => {
  return (
    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
      <Text style={styles.closeButtonText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    marginTop: 15,
    alignSelf: 'center',
    padding: 10,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignUpSearchCloseButton; 