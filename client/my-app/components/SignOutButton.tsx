import { useClerk } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export const SignOutButton = () => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
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
          onPress: async () => {
            try {
              await signOut()
              
              // Utilizăm expo-router pentru a redirecționa către pagina de autentificare
              // Acest lucru ar trebui să funcționeze pe toate platformele
              router.replace('/(auth)/sign-in')
              
              // Folosim și metoda Linking ca o soluție de rezervă
              setTimeout(() => {
                Linking.openURL(Linking.createURL('/(auth)/sign-in'))
              }, 500)
            } catch (err) {
              // See https://clerk.com/docs/custom-flows/error-handling
              // for more info on error handling
              console.error(JSON.stringify(err, null, 2))
              Alert.alert("Eroare", "A apărut o eroare la deconectare. Încercați din nou.")
            }
          }
        }
      ],
      { cancelable: true }
    )
  }

  return (
    <TouchableOpacity 
      onPress={handleSignOut}
      style={styles.signOutButton}
    >
      <Ionicons name="log-out-outline" size={24} color="#333" />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  signOutButton: {
    padding: 5,
    marginLeft: 10,
  }
});