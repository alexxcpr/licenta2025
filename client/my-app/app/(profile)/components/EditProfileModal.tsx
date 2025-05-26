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
  Dimensions,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { UserProfile } from '../../../utils/types';
import { UserResource } from '@clerk/types'; 
import { supabase } from '../../../utils/supabase';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const IS_IOS = Platform.OS === 'ios';

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

  // Încărcăm datele profilului când devine vizibil modalul
  useEffect(() => {
    if (visible) {
      // Setăm datele
      if (profile) {
        setEditUsername(profile.username || user?.username || '');
        setEditBio(profile.bio || '');
        setSelectedImage(profile.profile_picture || user?.imageUrl || null);
      } else if (user) {
        setEditUsername(user.username || '');
        setEditBio('');
        setSelectedImage(user.imageUrl || null);
      }
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
    if (!user) {
      console.log('User is null or undefined, exiting handleSaveProfile.');
      return;
    }
    
    setSavingProfile(true);
    
    try {
      // Verificare conexiune
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
        }
      }
      
      // 2. Actualizare date în Supabase
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
      
      // 3. Actualizare username în Clerk (dacă s-a schimbat)
      let usernameUpdatedInClerk = true;
      if (editUsername !== user.username) {
        console.log('Încercare actualizare username în Clerk:', editUsername);
        usernameUpdatedInClerk = await requestUsernameChangeVerification(editUsername);
      }
      
      await loadProfile(); // Reîncarcă datele
      onClose(); // Închide modalul
      
      if (editUsername !== user.username && !usernameUpdatedInClerk) {
        Alert.alert(
          'Actualizare parțială', 
          'Profilul a fost actualizat, dar schimbarea numelui de utilizator necesită verificare sau a eșuat.'
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

  // Nu afișăm nimic dacă modalul nu este vizibil
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close-outline" size={28} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Editează profilul</Text>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.saveText}>Salvează</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={IS_IOS ? "padding" : "height"}
          style={styles.content}
        >
          <ScrollView style={styles.scrollContent}>
            <View style={styles.imageSection}>
              <Image 
                source={{ 
                  uri: selectedImage || 
                       user?.imageUrl || 
                       'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png' 
                }} 
                style={styles.profileImage} 
              />
              <TouchableOpacity 
                style={styles.changeImageButton}
                onPress={pickImage}
              >
                <Text style={styles.changeImageText}>Schimbă imaginea</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Nume utilizator</Text>
              <TextInput
                style={styles.input}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Introduceți numele de utilizator"
                maxLength={50}
              />
              
              <Text style={styles.label}>Despre mine</Text>
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: IS_IOS ? 50 : 14,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  saveText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    backgroundColor: '#e0e0e0',
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
  formSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  label: {
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
    marginBottom: 20,
    color: '#000',
  },
  bioInput: {
    height: 120,
    paddingTop: 12,
  },
}); 