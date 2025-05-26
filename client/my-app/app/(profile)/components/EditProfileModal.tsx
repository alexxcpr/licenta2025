import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { UserProfile } from '../../../utils/types'; // Calea corectată pentru tipuri
import { UserResource } from '@clerk/types'; 
import { supabase } from '../../../utils/supabase'; // Calea pentru supabase este corectă

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserResource | null | undefined;
  profile: UserProfile | null;
  loadProfile: () => Promise<void>;
  requestUsernameChangeVerification: (newUsername: string) => Promise<boolean>;
}

export default function EditProfileModal({
  visible,
  onClose,
  user,
  profile,
  loadProfile,
  requestUsernameChangeVerification,
}: EditProfileModalProps) {
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setEditUsername(profile.username || user?.username || '');
      setEditBio(profile.bio || '');
      setSelectedImage(profile.profile_picture || user?.imageUrl || null);
    } else if (visible && user) {
      setEditUsername(user.username || '');
      setEditBio('');
      setSelectedImage(user.imageUrl || null);
    }
  }, [visible, profile, user]);

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

  const handleSaveProfile = async () => {
    console.log('handleSaveProfile called');
    console.log('User object:', JSON.stringify(user, null, 2));

    if (!user) {
      console.log('User is null or undefined, exiting handleSaveProfile.');
      return;
    }
    
    setSavingProfile(true);
    
    try {
      // Verificare conexiune (poate fi opțională aici dacă se face în funcția principală)
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
      
      // 1. Actualizare imagine în Clerk (dacă s-a schimbat)
      if (selectedImage && selectedImage !== (profile?.profile_picture || user?.imageUrl)) {
        try {
          console.log('Încercare de actualizare a imaginii de profil în Clerk:', selectedImage);
          if (!selectedImage) throw new Error('URI-ul imaginii este invalid');
          
          const imageResponse = await fetch(selectedImage);
          if (!imageResponse.ok) throw new Error(`Eroare la descărcarea imaginii: ${imageResponse.status}`);
          
          const blob = await imageResponse.blob();
          if (!blob) throw new Error('Nu s-a putut converti imaginea în format blob');
          
          await user.setProfileImage({ file: blob });
          console.log('Imaginea de profil a fost actualizată în Clerk');
          
          await new Promise(resolve => setTimeout(resolve, 1000)); // Așteaptă propagarea
          await user.reload();
          clerkImageUrl = user.imageUrl;
          console.log('Noul URL imagine din Clerk:', clerkImageUrl);

        } catch (imageError) {
          console.error('Eroare la actualizarea imaginii de profil în Clerk:', imageError);
          Alert.alert('Eroare la încărcarea imaginii', 'Nu s-a putut actualiza imaginea de profil. Încercați din nou mai târziu.');
          // Considerăm dacă vrem să oprim salvarea aici sau continuăm cu restul
        }
      }
      
      // 2. Actualizare date în Supabase
      const { error: updateError } = await supabase
        .from('user')
        .update({
          username: editUsername, // Username-ul din Supabase se va actualiza direct
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
      console.log('Profilul a fost actualizat în Supabase. Imagine:', clerkImageUrl);
      
      // 3. Actualizare username în Clerk (dacă s-a schimbat și e diferit de cel curent)
      let usernameUpdatedInClerk = true; // Presupunem că e ok dacă nu trebuie schimbat
      if (editUsername !== user.username) {
        console.log('Încercare actualizare username în Clerk (din modal):', editUsername);
        usernameUpdatedInClerk = await requestUsernameChangeVerification(editUsername);
      }
      
      await loadProfile(); // Reîncarcă datele în ecranul principal
      onClose(); // Închide modalul
      
      if (editUsername !== user.username && !usernameUpdatedInClerk) {
        Alert.alert(
          'Actualizare parțială', 
          'Profilul a fost actualizat, dar schimbarea numelui de utilizator necesită verificare sau a eșuat. Verificați email-ul sau încercați din nou.'
        );
      } else {
        Alert.alert('Succes', 'Profilul a fost actualizat cu succes!');
      }

    } catch (error) {
      console.error('Eroare generală la salvarea profilului (din modal):', error);
      Alert.alert('Eroare', 'A apărut o eroare la salvarea profilului. Încercați din nou.');
    } finally {
      setSavingProfile(false);
    }
  };


  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close-outline" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editează profilul</Text>
            <TouchableOpacity 
              onPress={handleSaveProfile}
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
                source={{ uri: selectedImage || user?.imageUrl || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png' }} 
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
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 'auto',
    maxHeight: Dimensions.get('window').height * 0.9, // Limitat la 90% din înălțime
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
    backgroundColor: '#e0e0e0', // Placeholder color
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
    color: '#000',
  },
  bioInput: {
    height: 120,
    paddingTop: 12,
  },
}); 