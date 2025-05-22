import { useSignIn, } from '@clerk/clerk-expo'

import { Link, useRouter } from 'expo-router'
import { Text, TextInput, TouchableOpacity, View, StyleSheet, KeyboardAvoidingView, Platform, StatusBar } from 'react-native'
import React from 'react'

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return
    
    // Reset error on new submission
    setError('')

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2))
        setError('Autentificarea nu a fost completată. Verificați datele introduse.')
      }
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
      setError(err?.errors?.[0]?.message || 'A apărut o eroare la autentificare. Încercați din nou.')
    }
  }

  // Handle key press in text inputs
  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      onSignInPress();
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Sign in</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Enter email"
            placeholderTextColor="#666"
            onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
            onKeyPress={handleKeyPress}
          />
          
          <TextInput
            style={styles.input}
            value={password}
            placeholder="Enter password"
            placeholderTextColor="#666"
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
            onKeyPress={handleKeyPress}
          />
          
          <TouchableOpacity style={styles.button} onPress={onSignInPress}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
          
          <View style={styles.linkContainer}>
            <Text style={styles.text}>Don't have an account?</Text>
            <Link href="../(auth)/sign-up">
              <Text style={styles.link}>Sign up</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    color: '#333',
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 5,
  },
  text: {
    color: '#666',
  },
  link: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
})