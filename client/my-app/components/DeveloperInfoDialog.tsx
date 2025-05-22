import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Platform, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DeveloperInfoDialogProps {
  visible: boolean;
  onClose: () => void;
}

const DeveloperInfoDialog: React.FC<DeveloperInfoDialogProps> = ({ visible, onClose }) => {
  // Informațiile developerului
  const developerInfo = {
    name: "Stănciulescu Alex Ciprian",
    role: "Developer Full-Stack",
    instagram: "alexxcpr",
    email: "alexciprian1501@gmail.com",
    linkedin: "alexstanciulescu"
  };

  // Funcții pentru deschiderea link-urilor
  const openInstagram = () => {
    const instagramUrl = `https://instagram.com/${developerInfo.instagram}`;
    Linking.openURL(instagramUrl);
  };

  const openEmail = () => {
    Linking.openURL(`mailto:${developerInfo.email}`);
  };

  const openLinkedIn = () => {
    const linkedinUrl = `https://linkedin.com/in/${developerInfo.linkedin}`;
    Linking.openURL(linkedinUrl);
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.dialogContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Informații Developer</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.content}>
                <Text style={styles.name}>{developerInfo.name}</Text>
                <Text style={styles.role}>{developerInfo.role}</Text>
                
                <View style={styles.contactButtons}>
                  <TouchableOpacity style={styles.contactButton} onPress={openInstagram}>
                    <Ionicons name="logo-instagram" size={24} color="#E1306C" />
                    <Text style={styles.buttonText}>Instagram</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
                    <Ionicons name="mail" size={24} color="#D44638" />
                    <Text style={styles.buttonText}>Email</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.contactButton} onPress={openLinkedIn}>
                    <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
                    <Text style={styles.buttonText}>LinkedIn</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.footer}>© 2025 Toate drepturile rezervate</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  role: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  contactButtons: {
    width: '100%',
    marginBottom: 24,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  buttonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  footer: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
});

export default DeveloperInfoDialog; 