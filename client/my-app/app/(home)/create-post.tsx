import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function CreatePostScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Funcție pentru selectarea unei imagini din galerie
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permisiune necesară', 'Avem nevoie de permisiunea de a accesa galeria ta de imagini.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  // Funcție pentru a captura o imagine cu camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permisiune necesară', 'Avem nevoie de permisiunea de a accesa camera ta.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  // Funcție pentru a trimite postarea la Supabase
  const uploadPost = async () => {
    if (!image) {
      Alert.alert('Imagine lipsă', 'Te rugăm să selectezi o imagine pentru postare.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Descriere lipsă', 'Te rugăm să adaugi o descriere la postarea ta.');
      return;
    }

    try {
      setIsLoading(true);

      // 1. Mai întâi încărcăm imaginea
      const imageResponse = await uploadImageToSupabase(image);
      if (!imageResponse.success) {
        throw new Error(imageResponse.error);
      }

      // 2. Apoi cream postarea în baza de date
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user?.id,
          image_url: imageResponse.url,
          description: description,
          location: location || null,
          is_public: isPublic,
          username: user?.username || 'Utilizator',
          user_image: user?.imageUrl || null,
        });

      if (error) {
        throw error;
      }

      // Postare creată cu succes, resetăm formularul
      setImage(null);
      setDescription('');
      setLocation('');
      Alert.alert('Succes', 'Postarea ta a fost creată cu succes!');
      
      // Redirecționăm utilizatorul la pagina principală
      router.push('/(home)');

    } catch (error: any) {
      console.error('Eroare la crearea postării:', error);
      Alert.alert('Eroare', error.message || 'A apărut o eroare la crearea postării. Încearcă din nou.');
    } finally {
      setIsLoading(false);
    }
  };

  // Funcție pentru încărcarea imaginii în Supabase Storage
  const uploadImageToSupabase = async (uri: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      // Generăm un nume unic pentru fișier
      const fileExt = uri.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      // Convertim uri la Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Încărcăm imaginea în Supabase Storage
      const { error } = await supabase.storage
        .from('images')
        .upload(filePath, blob);

      if (error) {
        throw error;
      }

      // Obținem URL-ul public al imaginii
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return { success: true, url: data.publicUrl };
    } catch (error: any) {
      console.error('Eroare la încărcarea imaginii:', error);
      return { success: false, error: error.message || 'A apărut o eroare la încărcarea imaginii.' };
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      ref={scrollViewRef}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creează o postare</Text>
        <TouchableOpacity 
          onPress={uploadPost}
          disabled={isLoading}
          style={[styles.shareButton, (!image || !description.trim() || isLoading) && styles.shareButtonDisabled]}
        >
          <Text style={styles.shareButtonText}>Partajează</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        {image ? (
          <>
            <Image source={{ uri: image }} style={styles.previewImage} />
            <TouchableOpacity 
              style={styles.changeImageButton}
              onPress={pickImage}
            >
              <Text style={styles.changeImageText}>Schimbă imaginea</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <TouchableOpacity 
              style={styles.imagePickerButton}
              onPress={pickImage}
            >
              <Ionicons name="images-outline" size={40} color="#007AFF" />
              <Text style={styles.imagePickerText}>Selectează din galerie</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.imagePickerButton}
              onPress={takePhoto}
            >
              <Ionicons name="camera-outline" size={40} color="#007AFF" />
              <Text style={styles.imagePickerText}>Folosește camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Descriere</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Despre ce este postarea ta?"
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Locație (opțional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Adaugă o locație"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Postare publică</Text>
          <TouchableOpacity 
            style={[styles.toggleButton, isPublic ? styles.toggleActive : styles.toggleInactive]}
            onPress={() => setIsPublic(!isPublic)}
          >
            <View style={[styles.toggleIndicator, isPublic ? styles.toggleIndicatorRight : styles.toggleIndicatorLeft]} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Se creează postarea...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  shareButtonDisabled: {
    backgroundColor: '#B0C4DE',
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  imageContainer: {
    margin: 15,
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeImageText: {
    color: 'white',
    fontWeight: 'bold',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  imagePickerButton: {
    alignItems: 'center',
    margin: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    width: 150,
    height: 150,
    justifyContent: 'center',
  },
  imagePickerText: {
    marginTop: 10,
    color: '#007AFF',
    textAlign: 'center',
  },
  formContainer: {
    padding: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    minHeight: 50,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleInactive: {
    backgroundColor: '#ddd',
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
  },
  toggleIndicatorLeft: {
    alignSelf: 'flex-start',
  },
  toggleIndicatorRight: {
    alignSelf: 'flex-end',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
}); 