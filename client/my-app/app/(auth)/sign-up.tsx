import * as React from 'react'
import { Text, TextInput, TouchableOpacity, View, StyleSheet, ActivityIndicator } from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { supabase } from '../../utils/supabase'
import SignUpSearchModal from '../ui/sign-up/SignUpSearchModal'

// Definirea tipurilor pentru datele noastre
interface Domeniu {
  id_domeniu: number;
  denumire: string;
  date_created?: string;
  date_updated?: string;
}

interface Functie {
  id_functie: number;
  denumire: string;
  date_created?: string;
  date_updated?: string;
}

interface Ocupatie {
  id_ocupatie: number;
  denumire: string;
  date_created?: string;
  date_updated?: string;
}

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [username, setUsername] = React.useState('')
  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  // State pentru domenii, funcții și ocupații
  const [domenii, setDomenii] = React.useState<Domeniu[]>([])
  const [functii, setFunctii] = React.useState<Functie[]>([])
  const [ocupatii, setOcupatii] = React.useState<Ocupatie[]>([])

  // State pentru dropdown-uri
  const [selectedDomeniu, setSelectedDomeniu] = React.useState<Domeniu | null>(null)
  const [selectedFunctie, setSelectedFunctie] = React.useState<Functie | null>(null)
  const [selectedOcupatie, setSelectedOcupatie] = React.useState<Ocupatie | null>(null)

  // State pentru modal-uri
  const [domeniuModalVisible, setDomeniuModalVisible] = React.useState(false)
  const [functieModalVisible, setFunctieModalVisible] = React.useState(false)
  const [ocupatieModalVisible, setOcupatieModalVisible] = React.useState(false)

  // State pentru căutare
  const [domeniuSearch, setDomeniuSearch] = React.useState('')
  const [functieSearch, setFunctieSearch] = React.useState('')
  const [ocupatieSearch, setOcupatieSearch] = React.useState('')

  // Încărcarea datelor la montarea componentei
  React.useEffect(() => {
    fetchDomenii()
    fetchFunctii()
    fetchOcupatii()
  }, [])

  // Funcții pentru încărcarea datelor din Supabase
  const fetchDomenii = async () => {
    try {
      const { data, error } = await supabase
        .from('domenii')
        .select('*')
        .order('denumire', { ascending: true })
      
      if (error) throw error
      setDomenii(data || [])
    } catch (error) {
      console.error('Eroare la încărcarea domeniilor:', error)
    }
  }

  const fetchFunctii = async () => {
    try {
      const { data, error } = await supabase
        .from('functii')
        .select('*')
        .order('denumire', { ascending: true })
      
      if (error) throw error
      setFunctii(data || [])
    } catch (error) {
      console.error('Eroare la încărcarea funcțiilor:', error)
    }
  }

  const fetchOcupatii = async () => {
    try {
      const { data, error } = await supabase
        .from('ocupatii')
        .select('*')
        .order('denumire', { ascending: true })
      
      if (error) throw error
      setOcupatii(data || [])
    } catch (error) {
      console.error('Eroare la încărcarea ocupațiilor:', error)
    }
  }

  // Filtrarea datelor în funcție de căutare
  const filteredDomenii = React.useMemo(() => 
    domenii.filter(item => 
      item.denumire.toLowerCase().includes(domeniuSearch.toLowerCase())
    ), [domenii, domeniuSearch]
  )
  
  const filteredFunctii = React.useMemo(() => 
    functii.filter(item => 
      item.denumire.toLowerCase().includes(functieSearch.toLowerCase())
    ), [functii, functieSearch]
  )
  
  const filteredOcupatii = React.useMemo(() => 
    ocupatii.filter(item => 
      item.denumire.toLowerCase().includes(ocupatieSearch.toLowerCase())
    ), [ocupatii, ocupatieSearch]
  )

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    if (!selectedDomeniu || !selectedFunctie || !selectedOcupatie) {
      setError('Vă rugăm completați toate câmpurile obligatorii.')
      return
    }

    setLoading(true)
    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
        username,
      })

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true)
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
      setError('A apărut o eroare la înregistrare. Încercați din nou.')
    } finally {
      setLoading(false)
    }
  }

  // Funcția pentru salvarea utilizatorului în Supabase
  const saveUserToSupabase = async (userId: string, email: string, username: string) => {
    try {
      // Verificăm dacă avem toate datele necesare
      if (!selectedDomeniu || !selectedFunctie || !selectedOcupatie) {
        console.error('Datele de selecție lipsesc')
        return false
      }

      const { error } = await supabase
        .from('user')
        .insert([
          { 
            id_user: userId,
            email: email,
            username: username,
            id_domeniu: selectedDomeniu.id_domeniu,
            id_functie: selectedFunctie.id_functie,
            id_ocupatie: selectedOcupatie.id_ocupatie
          }
        ]);
      
      if (error) {
        console.error('Eroare la salvarea în Supabase:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Excepție la salvarea în Supabase:', err);
      return false;
    }
  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return
    setLoading(true)

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        // Obține ID-ul utilizatorului din sesiunea creată
        const userId = signUpAttempt.createdUserId;
        
        // Salvează utilizatorul în Supabase
        if (userId) {
          const savedToSupabase = await saveUserToSupabase(userId, emailAddress, username);
          if (!savedToSupabase) {
            console.error('Nu s-a putut salva utilizatorul în Supabase');
          }
        }
        
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/')
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2))
        setError('Verificarea nu a fost completată. Încercați din nou.')
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
      setError('A apărut o eroare la verificare. Încercați din nou.')
    } finally {
      setLoading(false)
    }
  }

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Verifică-ți adresa de email</Text>
          <Text style={styles.subtitle}>Ți-am trimis un cod de verificare</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TextInput
            style={styles.input}
            value={code}
            placeholder="Introdu codul de verificare"
            placeholderTextColor="#666"
            onChangeText={(code) => setCode(code)}
          />
          
          <TouchableOpacity 
            style={[styles.button, loading ? styles.buttonDisabled : null]} 
            onPress={onVerifyPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verifică Email</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Creează Cont</Text>
        <Text style={styles.subtitle}>Alătură-te astăzi</Text>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={username}
          placeholder="Alege un nume de utilizator"
          placeholderTextColor="#666"
          onChangeText={(username) => setUsername(username)}
        />

        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Introdu adresa de email"
          placeholderTextColor="#666"
          onChangeText={(email) => setEmailAddress(email)}
        />
        
        <TextInput
          style={styles.input}
          value={password}
          placeholder="Introdu parola"
          placeholderTextColor="#666"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />

        {/* Dropdown pentru Domeniul de activitate */}
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setDomeniuModalVisible(true)}
        >
          <Text style={styles.dropdownText}>
            {selectedDomeniu ? selectedDomeniu.denumire : "Selectează domeniul de activitate"}
          </Text>
        </TouchableOpacity>

        {/* Folosim noua componentă modală pentru domenii */}
        <SignUpSearchModal
          visible={domeniuModalVisible}
          onClose={() => setDomeniuModalVisible(false)}
          title="Selectează domeniul"
          data={filteredDomenii}
          searchValue={domeniuSearch}
          onSearchChange={setDomeniuSearch}
          onSelect={(item: Domeniu) => setSelectedDomeniu(item)}
        />

        {/* Dropdown pentru Funcție */}
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setFunctieModalVisible(true)}
        >
          <Text style={styles.dropdownText}>
            {selectedFunctie ? selectedFunctie.denumire : "Selectează funcția"}
          </Text>
        </TouchableOpacity>

        {/* Folosim noua componentă modală pentru funcții */}
        <SignUpSearchModal
          visible={functieModalVisible}
          onClose={() => setFunctieModalVisible(false)}
          title="Selectează funcția"
          data={filteredFunctii}
          searchValue={functieSearch}
          onSearchChange={setFunctieSearch}
          onSelect={(item: Functie) => setSelectedFunctie(item)}
        />

        {/* Dropdown pentru Ocupație */}
        <TouchableOpacity 
          style={styles.dropdownButton} 
          onPress={() => setOcupatieModalVisible(true)}
        >
          <Text style={styles.dropdownText}>
            {selectedOcupatie ? selectedOcupatie.denumire : "Selectează ocupația"}
          </Text>
        </TouchableOpacity>

        {/* Folosim noua componentă modală pentru ocupații */}
        <SignUpSearchModal
          visible={ocupatieModalVisible}
          onClose={() => setOcupatieModalVisible(false)}
          title="Selectează ocupația"
          data={filteredOcupatii}
          searchValue={ocupatieSearch}
          onSearchChange={setOcupatieSearch}
          onSelect={(item: Ocupatie) => setSelectedOcupatie(item)}
        />
        
        <TouchableOpacity 
          style={[styles.button, loading ? styles.buttonDisabled : null]} 
          onPress={onSignUpPress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Creează Cont</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.linkContainer}>
          <Text style={styles.text}>Ai deja un cont?</Text>
          <Link href="../(auth)/sign-in">
            <Text style={styles.link}>Autentifică-te</Text>
          </Link>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
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
  dropdownButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  dropdownText: {
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
  buttonDisabled: {
    opacity: 0.7,
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