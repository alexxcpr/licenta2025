import React, { useState } from 'react'
import { useClerk } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Platform,
  View,
  Text,
  Modal,
  Pressable 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export const SignOutButton: React.FC = () => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useClerk()
  const router = useRouter()
  const [modalVisible, setModalVisible] = useState(false)

  const performSignOut = async (): Promise<void> => {
    try {
      await signOut()
      
      // Utilizăm expo-router pentru a redirecționa către pagina de autentificare
      router.replace('/(auth)/sign-in')
      
      // Folosim și metoda Linking ca o soluție de rezervă
      setTimeout(() => {
        Linking.openURL(Linking.createURL('/(auth)/sign-in'))
      }, 500)
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
      if (Platform.OS === 'web') {
        alert("A apărut o eroare la deconectare. Încercați din nou.")
      } else {
        Alert.alert("Eroare", "A apărut o eroare la deconectare. Încercați din nou.")
      }
    }
  }

  const handleSignOut = async (): Promise<void> => {
    // Pentru web, folosim Modal-ul React Native
    if (Platform.OS === 'web') {
      setModalVisible(true)
    } else {
      // Pentru dispozitive mobile, folosim Alert-ul nativ
      Alert.alert(
        "Confirmare",
        "Sunteți sigur că doriți să vă deconectați?",
        [
          {
            text: "Nu",
            style: "cancel"
          },
          {
            text: "Da",
            onPress: performSignOut
          }
        ],
        { cancelable: true }
      )
    }
  }

  return (
    <>
      <TouchableOpacity 
        onPress={handleSignOut}
        style={styles.signOutButton}
      >
        <Ionicons name="log-out-outline" size={24} color="#333" />
      </TouchableOpacity>
      
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Confirmare</Text>
            <Text style={styles.modalText}>Sunteți sigur că doriți să vă deconectați?</Text>
            
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Nu</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonConfirm]}
                onPress={() => {
                  setModalVisible(false);
                  performSignOut();
                }}
              >
                <Text style={styles.confirmText}>Da</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  signOutButton: {
    padding: 5,
    marginLeft: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: 300,
    maxWidth: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 5,
    padding: 10,
    paddingHorizontal: 20,
    elevation: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#e0e0e0',
    marginRight: 10,
  },
  buttonConfirm: {
    backgroundColor: '#007AFF',
  },
  confirmText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelText: {
    color: '#333',
    textAlign: 'center',
  },
});