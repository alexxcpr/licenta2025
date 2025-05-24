import React, { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useReverification } from '@clerk/clerk-react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import * as ImagePicker from 'expo-image-picker';

// Tipuri de date
interface UserProfile {
  id_user: string;
  username: string;
  email: string;
  profile_picture: string | null;
  bio: string | null;
  date_created: string;
  date_updated: string;
}

interface Post {
  id_post: number;
  date_created: string;
  date_updated: string;
  content: string;
  is_published: boolean;
  image_url: string | null;
  id_user: string;
}

export default function ProfileScreen() {
  const { user, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const windowWidth = Dimensions.get('window').width;
  
  // State pentru modalul de editare profil
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // State pentru a urmări starea verificării
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  // Utilizăm useReverification pentru metoda user.update
  const updateUserWithReverification = useReverification((params: { username: string }) => {
    if (!user) throw new Error("Utilizatorul nu este disponibil");
    return user.update(params);
  });

  // Funcție pentru a încărca datele profilului din Supabase
  const loadProfile = async () => {
    if (!user) return;

    try {
      console.log('Încărcare date profil pentru utilizatorul:', user.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('user')
        .select('*')
        .eq('id_user', user.id)
        .single();

      if (profileError) {
        console.error('Eroare la încărcarea profilului:', profileError);
        return;
      }

      console.log('Date profil încărcate:', profileData);
      setProfile(profileData);

      const { data: postsData, error: postsError } = await supabase
        .from('post')
        .select('*')
        .eq('id_user', user.id)
        .eq('is_published', true)
        .order('date_created', { ascending: false });

      if (postsError) {
        console.error('Eroare la încărcarea postărilor:', postsError);
        return;
      }

      setPosts(postsData);
      setPostCount(postsData.length);

      const { count: memberCount, error: memberError } = await supabase
        .from('group_member')
        .select('*', { count: 'exact' })
        .eq('id_user', user.id);

      if (memberError) {
        console.error('Eroare la încărcarea conexiunilor:', memberError);
        return;
      }

      setConnectionCount(memberCount || 0);
      
    } catch (error) {
      console.error('Eroare generală:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn && user) {
      loadProfile();
    }
  }, [isSignedIn, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={[styles.postItem, { width: windowWidth / 3 - 4 }]}
      onPress={() => {
        console.log('Vizualizare postare:', item.id_post);
      }}
    >
      {item.image_url ? (
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.postImage} 
          resizeMode="cover"
        />
      ) : (
        <View style={styles.textPostItem}>
          <Text style={styles.textPostContent} numberOfLines={4}>
            {item.content}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0].uri) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Eroare la selectarea imaginii:', error);
      Alert.alert('Eroare', 'Nu s-a putut selecta imaginea. Încercați din nou.');
    }
  };

  const openEditModal = () => {
    setEditUsername(profile?.username || user?.username || '');
    setEditBio(profile?.bio || '');
    setSelectedImage(profile?.profile_picture || user?.imageUrl || null);
    setEditModalVisible(true);
  };

  const openVerificationLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('Eroare la deschiderea link-ului de verificare:', err);
      Alert.alert('Eroare', 'Nu s-a putut deschide link-ul de verificare. Verificați email-ul manual.');
    });
  };

  const requestUsernameChangeVerification = async (newUsername: string) => {
    if (!user) {
      console.error('User este null, nu putem actualiza username-ul');
      Alert.alert('Eroare', 'Utilizatorul nu este autentificat.');
      return false;
    }

    try {
      console.log('Încercare de actualizare a username-ului în Clerk (cu reverificare):', newUsername);
      
      // Apelăm funcția îmbunătățită de useReverification
      const response = await updateUserWithReverification({ username: newUsername });

      console.log('Răspuns de la Clerk (după reverificare dacă a fost necesară):', JSON.stringify(response, null, 2));

      if (user.username === newUsername || (response && response.username === newUsername)) {
        console.log('Numele de utilizator a fost actualizat.');
        Alert.alert('Succes', 'Numele de utilizator a fost actualizat cu succes!');
        await loadProfile(); 
        return true;
      }
      
      // Cazuri suplimentare de verificare a răspunsului, deși useReverification ar trebui să gestioneze fluxul.
      const verifications = (response as any)?.verifications;
      if (verifications && verifications.emailAddress) {
        setVerificationPending(true);
        const verificationUrl = verifications.emailAddress.verificationURL;
        if (verificationUrl) {
          Alert.alert(
            'Verificare necesară',
            'Pentru a finaliza schimbarea numelui, trebuie să verificați email-ul. Doriți să deschideți link-ul de verificare?',
            [
              { text: 'Deschide link', onPress: () => openVerificationLink(verificationUrl) },
              { text: 'Mai târziu', style: 'cancel' },
            ]
          );
        } else {
           Alert.alert('Verificare necesară', 'Un email de verificare a fost trimis. Verificați email-ul pentru a finaliza schimbarea.');
        }
        return true; 
      }
      
      console.warn('Actualizarea username-ului a fost procesată, dar starea finală este neclară. Răspuns:', response);
      Alert.alert('Info', 'Solicitarea de actualizare a numelui de utilizator a fost procesată.');
      return false; 

    } catch (error: any) {
      // Verificăm dacă eroarea este din cauza anulării reverificării de către utilizator
      if (error.clerkError && error.code === 'reverification_cancelled') { // Sau un cod similar specificat de Clerk pentru anulare
        console.log('Utilizatorul a anulat procesul de reverificare.');
        Alert.alert('Anulat', 'Procesul de reverificare a fost anulat.');
      } else {
        console.error('Eroare detaliată la actualizarea username-ului (cu reverificare):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        let errorMessage = 'Nu s-a putut actualiza numele de utilizator.';
        if (error.clerkError && Array.isArray(error.errors) && error.errors.length > 0) {
          errorMessage = error.errors.map((e: any) => e.longMessage || e.message).join('\n');
        } else if (error.message) {
          errorMessage = error.message;
        }
        Alert.alert('Eroare la actualizare', errorMessage);
      }
      return false;
    }
  };

  const saveProfileChanges = async () => {
    if (!user) return;
    
    setSavingProfile(true);
    
    try {
      const { error: testError } = await supabase
        .from('user')
        .select('id_user')
        .eq('id_user', user.id)
        .single();
      
      if (testError) {
        console.error('Eroare la verificarea conexiunii Supabase:', testError);
        Alert.alert('Eroare de conexiune', 'Nu se poate conecta la baza de date. Verificați conexiunea la internet.');
        setSavingProfile(false);
        return;
      }

      let clerkImageUrl = user.imageUrl;
      
      if (selectedImage && selectedImage !== profile?.profile_picture && selectedImage !== user?.imageUrl) {
        try {
          console.log('Încercare de actualizare a imaginii de profil în Clerk:', selectedImage);

          if (!selectedImage) {
            throw new Error('URI-ul imaginii este invalid');
          }
          
          const imageResponse = await fetch(selectedImage);
          if (!imageResponse.ok) {
            throw new Error(`Eroare la descărcarea imaginii: ${imageResponse.status}`);
          }
          
          const blob = await imageResponse.blob();
          if (!blob) {
            throw new Error('Nu s-a putut converti imaginea în format blob');
          }
          
          await user.setProfileImage({ file: blob });
          console.log('Imaginea de profil a fost actualizată în Clerk');
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await user.reload();
          console.log('Noul URL imagine din Clerk:', user.imageUrl);
          
          clerkImageUrl = user.imageUrl;
        } catch (imageError) {
          console.error('Eroare la actualizarea imaginii de profil în Clerk:', imageError);
          Alert.alert(
            'Eroare la încărcarea imaginii', 
            'Nu s-a putut actualiza imaginea de profil. Încercați din nou mai târziu.'
          );
        }
      }
      
      const { error: updateError } = await supabase
        .from('user')
        .update({
          username: editUsername,
          bio: editBio,
          profile_picture: clerkImageUrl, 
          date_updated: new Date().toISOString()
        })
        .eq('id_user', user.id);
        
      if (updateError) {
        console.error('Eroare la actualizarea profilului în Supabase:', updateError);
        Alert.alert('Eroare', 'Nu s-a putut actualiza profilul în baza de date.');
        setSavingProfile(false);
        return;
      }
      
      console.log('URL-ul imaginii de profil a fost actualizat în Supabase:', clerkImageUrl);
      
      let usernameUpdated = false;
      if (editUsername !== user.username) {
        console.log('Încercare actualizare username în Clerk:', editUsername);
        
        usernameUpdated = await requestUsernameChangeVerification(editUsername);
      }
      
      await loadProfile();
      setEditModalVisible(false);
      
      if (editUsername !== user.username && !usernameUpdated) {
        Alert.alert(
          'Actualizare parțială', 
          'Profilul a fost actualizat, dar schimbarea numelui necesită verificare. Verificați email-ul pentru instrucțiuni.'
        );
      } else {
        Alert.alert('Succes', 'Profilul a fost actualizat cu succes!');
      }
    } catch (error) {
      console.error('Eroare generală la salvarea profilului:', error);
      Alert.alert('Eroare', 'A apărut o eroare la salvarea profilului. Încercați din nou.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Se încarcă profilul...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor={'#007AFF'}
              title={'Se reîmprospătează...'}
              titleColor={'#666'}
            />
          }
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                const canGoBack = router.canGoBack();
                if (canGoBack) {
                  router.back();
                } else {
                  console.log('Nu există o pagină anterioară, navigare către home');
                  router.replace('/(home)');
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {profile?.username || 'Profil'}
            </Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfoContainer}>
            <View style={styles.profileHeader}>
              <Image 
                source={{ 
                  uri: profile?.profile_picture || user?.imageUrl 
                }} 
                style={styles.profileImage}
              />
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{postCount}</Text>
                  <Text style={styles.statLabel}>Postări</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{connectionCount}</Text>
                  <Text style={styles.statLabel}>Conexiuni</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>0</Text>
                  <Text style={styles.statLabel}>Grupuri</Text>
                </View>
              </View>
            </View>

            <View style={styles.bioSection}>
              <Text style={styles.username}>{profile?.username || user?.username}</Text>
              <Text style={styles.userEmail}>{profile?.email || user?.emailAddresses[0]?.emailAddress}</Text>
              {profile?.bio && <Text style={styles.bioText}>{profile.bio}</Text>}
              <Text style={styles.joinedDate}>
                Membru din {new Date(profile?.date_created || Date.now()).toLocaleDateString('ro-RO')}
              </Text>
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.editProfileButton}
                onPress={openEditModal}
              >
                <Text style={styles.editButtonText}>Editează profilul</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.shareProfileButton}>
                <Ionicons name="share-outline" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.postsContainer}>
            <View style={styles.postsHeader}>
              <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
                <Ionicons name="grid-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabButton}>
                <Ionicons name="list-outline" size={24} color="#999" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabButton}>
                <Ionicons name="bookmark-outline" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {posts.length > 0 ? (
              <FlatList
                data={posts}
                renderItem={renderPostItem}
                keyExtractor={(item) => item.id_post.toString()}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.postsGrid}
              />
            ) : (
              <View style={styles.emptyPostsContainer}>
                <Ionicons name="images-outline" size={50} color="#ddd" />
                <Text style={styles.emptyPostsText}>Nu există postări încă</Text>
                <TouchableOpacity 
                  style={styles.createPostButton}
                  onPress={() => router.push('/(home)/create-post')}
                >
                  <Text style={styles.createPostText}>Adaugă prima postare</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.centeredView}
          >
            <View style={styles.modalView}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => setEditModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close-outline" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Editează profilul</Text>
                <TouchableOpacity 
                  onPress={saveProfileChanges}
                  style={styles.saveButton}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Salvează</Text>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <View style={styles.imageSection}>
                  <Image 
                    source={{ uri: selectedImage || user?.imageUrl }} 
                    style={styles.editProfileImage} 
                  />
                  <TouchableOpacity 
                    style={styles.changeImageButton}
                    onPress={pickImage}
                  >
                    <Text style={styles.changeImageText}>Schimbă imaginea</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Nume utilizator</Text>
                  <TextInput
                    style={styles.input}
                    value={editUsername}
                    onChangeText={setEditUsername}
                    placeholder="Introduceți numele de utilizator"
                    maxLength={50}
                  />
                  
                  <Text style={styles.inputLabel}>Despre mine</Text>
                  <TextInput
                    style={[styles.input, styles.bioInput]}
                    value={editBio}
                    onChangeText={setEditBio}
                    placeholder="Scrieți câteva cuvinte despre dvs."
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(home)')}
          >
            <Ionicons name="home-outline" size={24} color="#666" />
            <Text style={styles.navText}>Acasă</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {
              console.log('Pagina de explore trebuie configurată');
            }}
          >
            <Ionicons name="compass-outline" size={24} color="#666" />
            <Text style={styles.navText}>Explorează</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(home)/create-post')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#666" />
            <Text style={styles.navText}>Postează</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {
              console.log('Pagina de notificări trebuie configurată');
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#666" />
            <Text style={styles.navText}>Notificări</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="person" size={24} color="#007AFF" />
            <Text style={styles.navTextActive}>Profil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  profileInfoContainer: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bioSection: {
    marginBottom: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  joinedDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  shareProfileButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  postsContainer: {
    flex: 1,
    marginTop: 8,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  postsGrid: {
    paddingVertical: 2,
  },
  postItem: {
    height: 120,
    margin: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  textPostItem: {
    backgroundColor: '#f5f5f5',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  textPostContent: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  emptyPostsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyPostsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  createPostButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createPostText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  navTextActive: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
  },
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 'auto',
    height: '90%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  saveButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  changeImageButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  changeImageText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  bioInput: {
    height: 120,
    paddingTop: 12,
  },
}); 