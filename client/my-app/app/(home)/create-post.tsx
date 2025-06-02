import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase, getSupabaseUrl, getSupabaseAnonKey } from '../../utils/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS,
  Easing,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { decode } from 'base64-arraybuffer';
import BottomNavigation from '../ui/navigation/BottomNavigation';

// Conditional import for FileSystem
let FileSystem: any = null;
if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
}

// Helper function to get file info that works on all platforms
const getFileInfo = async (uri: string) => {
  if (Platform.OS === 'web') {
    // On web, we'll assume the file is valid since we can't easily check size
    return { exists: true, size: undefined };
  } else if (FileSystem) {
    return await FileSystem.getInfoAsync(uri);
  }
  return { exists: true, size: undefined };
};

// Helper function to read file as base64 that works on all platforms
const readAsBase64 = async (uri: string) => {
  if (Platform.OS === 'web') {
    // On web, convert file to base64 using fetch and FileReader
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else if (FileSystem) {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  throw new Error('Cannot read file on this platform');
};

// Interfața pentru postare, conformă cu structura din baza de date
interface PostData {
  id_post?: number;
  content: string;
  image_url: string | null;
  id_user: string;
  is_published: boolean;
  date_created?: string;
  date_updated?: string;
}

export default function CreatePostScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  const goBack = () => {
    // Animăm înainte de a naviga efectiv înapoi
    translateX.value = withTiming(500, { 
      duration: 300,
      easing: Easing.bezier(0.25, 1, 0.5, 1)
    }, () => {
      runOnJS(router.back)();
    });
    opacity.value = withTiming(0.5, { duration: 300 });
  };
  
  const swipeBackGesture = Gesture.Pan()
    .activeOffsetX(10)
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = Math.min(event.translationX, 300);
        
        // Scădem opacitatea pe măsură ce tragem
        opacity.value = interpolate(
          translateX.value,
          [0, 300],
          [1, 0.7],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd((event) => {
      if (event.translationX > 50) {
        // Dacă am tras suficient, navigăm înapoi cu animație fluidă
        runOnJS(goBack)();
      } else {
        // Altfel, revenim la poziția inițială cu animație
        translateX.value = withTiming(0, { 
          duration: 300,
          easing: Easing.bezier(0.25, 1, 0.5, 1)
        });
        opacity.value = withTiming(1, { duration: 300 });
      }
    });
    
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });
  
  // Funcție pentru selectarea unei imagini din galerie
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permisiune necesară', 'Avem nevoie de permisiunea de a accesa galeria ta de imagini.');
      return;
    }

    try {
      // Dacă suntem pe web, folosim un input de tip file pentru a evita problemele CORS
      if (Platform.OS === 'web') {
        // Creăm un input de tip file pentru a selecta imaginea
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        // Așteptăm ca utilizatorul să selecteze o imagine
        const file = await new Promise<File | null>((resolve) => {
          input.onchange = (event) => {
            const target = event.target as HTMLInputElement;
            const files = target.files;
            if (files && files.length > 0) {
              resolve(files[0]);
            } else {
              resolve(null);
            }
          };
          input.click();
        });
        
        if (file) {
          // Creăm un URL pentru fișier
          const fileURL = URL.createObjectURL(file);
          setImage(fileURL);
          
          // Stocăm fișierul pentru încărcare
          (window as any).selectedFile = file;
        }
      } else {
        // Pentru platformele mobile, folosim ImagePicker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.6, // Comprimăm imaginea pentru a reduce dimensiunea
          exif: false, // Nu avem nevoie de metadate EXIF
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          setImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('DEBUG [pickImage] - Eroare la selectarea imaginii:', error);
      Alert.alert('Eroare', 'Nu s-a putut selecta imaginea. Încercați din nou.');
    }
  };

  // Funcție pentru a captura o imagine cu camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permisiune necesară', 'Avem nevoie de permisiunea de a accesa camera ta.');
      return;
    }

    try {
      // Dacă suntem pe web, folosim un input de tip file pentru a evita problemele CORS
      if (Platform.OS === 'web') {
        // Pe web, nu putem accesa direct camera, așa că folosim un input de tip file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Încercăm să folosim camera, dar nu funcționează pe toate browserele
        
        // Așteptăm ca utilizatorul să selecteze o imagine
        const file = await new Promise<File | null>((resolve) => {
          input.onchange = (event) => {
            const target = event.target as HTMLInputElement;
            const files = target.files;
            if (files && files.length > 0) {
              resolve(files[0]);
            } else {
              resolve(null);
            }
          };
          input.click();
        });
        
        if (file) {
          // Creăm un URL pentru fișier
          const fileURL = URL.createObjectURL(file);
          setImage(fileURL);
          
          // Stocăm fișierul pentru încărcare
          (window as any).selectedFile = file;
        }
      } else {
        // Pentru platformele mobile, folosim ImagePicker
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.6, // Comprimăm imaginea pentru a reduce dimensiunea
          exif: false, // Nu avem nevoie de metadate EXIF
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          setImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('DEBUG [takePhoto] - Eroare la capturarea imaginii:', error);
      Alert.alert('Eroare', 'Nu s-a putut captura imaginea. Încercați din nou.');
    }
  };

  // Funcție pentru a trimite postarea la Supabase
  const uploadPost = async () => {
    console.log('DEBUG - Începe procesul de creare a postării');
    
    if (!image) {
      console.log('DEBUG - Eroare: Imagine lipsă');
      Alert.alert('Imagine lipsă', 'Te rugăm să selectezi o imagine pentru postare.');
      return;
    }

    if (!content.trim()) {
      console.log('DEBUG - Eroare: Conținut lipsă');
      Alert.alert('Conținut lipsă', 'Te rugăm să adaugi conținut la postarea ta.');
      return;
    }

    if (!user?.id) {
      console.log('DEBUG - Eroare: Utilizator neautentificat');
      Alert.alert('Eroare de autentificare', 'Trebuie să fii autentificat pentru a crea o postare.');
      return;
    }

    try {
      setIsLoading(true);

      // 1. Mai întâi încărcăm imaginea
      console.log('DEBUG - Pas 1: Începe încărcarea imaginii în storage');
      const imageResponse = await uploadImageToSupabase(image);
      if (!imageResponse.success) {
        console.log('DEBUG - Eroare la încărcarea imaginii:', imageResponse.error);
        throw new Error(imageResponse.error);
      }
      console.log('DEBUG - Imagine încărcată cu succes, URL:', imageResponse.url);

      // 2. Construim obiectul de postare conform structurii din baza de date
      console.log('DEBUG - Pas 2: Construirea obiectului de postare');
      const newPost: PostData = {
        content: content,
        image_url: imageResponse.url || null,
        id_user: user.id,
        is_published: isPublished,
      };
      console.log('DEBUG - Obiect postare creat:', JSON.stringify(newPost, null, 2));

      // 3. Creăm postarea în baza de date
      console.log('DEBUG - Pas 3: Inserarea postării în baza de date');
      const { data, error } = await supabase
        .from('post')
        .insert(newPost)
        .select();

      if (error) {
        console.log('DEBUG - Eroare la inserarea în baza de date:', error);
        throw error;
      }

      console.log('DEBUG - Postare inserată cu succes în baza de date, răspuns:', JSON.stringify(data, null, 2));

      // Postare creată cu succes, resetăm formularul
      console.log('DEBUG - Resetare formular');
      setImage(null);
      setContent('');
      Alert.alert('Succes', 'Postarea ta a fost creată cu succes!');
      
      // Redirecționăm utilizatorul la pagina principală
      console.log('DEBUG - Redirecționare către pagina principală');
      router.push('/(home)');

    } catch (error: any) {
      console.error('DEBUG - EROARE CRITICĂ la crearea postării:', error);
      Alert.alert('Eroare', error.message || 'A apărut o eroare la crearea postării. Încearcă din nou.');
    } finally {
      console.log('DEBUG - Proces finalizat, resetare stare de încărcare');
      setIsLoading(false);
    }
  };

  // Funcție pentru încărcarea imaginilor pe web
  const handleWebUpload = async (uri: string, filePath: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      // Verifică dacă avem un fișier selectat direct
      if (typeof window !== 'undefined' && (window as any).selectedFile) {
        // Folosim fișierul selectat direct
        console.log('DEBUG [uploadImageToSupabase] - Folosim fișierul selectat direct pe web');
        
        const file = (window as any).selectedFile;
        
        // Citim fișierul ca ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        const { data: uploadData, error } = await supabase.storage
          .from('images')
          .upload(filePath, arrayBuffer, {
            contentType: file.type || 'image/jpeg'
          });
          
        // Curățăm referința către fișier
        delete (window as any).selectedFile;
        
        if (error) {
          console.log('DEBUG [uploadImageToSupabase] - Eroare la încărcare:', error);
          throw error;
        }

        console.log('DEBUG [uploadImageToSupabase] - Încărcare reușită:', uploadData);
      }
      // Verifică dacă URI-ul este un blob URL
      else if (uri.startsWith('blob:')) {
        // Pentru blob URLs pe web, folosim fetch pentru a obține blob-ul
        console.log('DEBUG [uploadImageToSupabase] - Procesăm blob URL');
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          
          // Verificăm dacă blob-ul a fost creat corect
          if (blob.size === 0) {
            throw new Error('Blob-ul creat are dimensiunea 0.');
          }
          
          // Convertim blob-ul în ArrayBuffer
          const arrayBuffer = await blob.arrayBuffer();
          
          const { data: uploadData, error } = await supabase.storage
            .from('images')
            .upload(filePath, arrayBuffer, {
              contentType: blob.type || 'image/jpeg'
            });
            
          if (error) {
            console.log('DEBUG [uploadImageToSupabase] - Eroare la încărcare:', error);
            throw error;
          }

          console.log('DEBUG [uploadImageToSupabase] - Încărcare reușită:', uploadData);
        } catch (error) {
          console.error('DEBUG [uploadImageToSupabase] - Eroare la procesarea blob URL pe web:', error);
          throw new Error('Nu s-a putut procesa imaginea. Încercați să folosiți o imagine din galerie.');
        }
      }
      // Verifică dacă URI-ul este un data URL
      else if (uri.startsWith('data:')) {
        // Pentru data URLs pe web, folosim o abordare diferită
        console.log('DEBUG [uploadImageToSupabase] - Folosim abordare specială pentru web cu data URL');
        try {
          // Convertim data URL în ArrayBuffer direct
          const response = await fetch(uri);
          const arrayBuffer = await response.arrayBuffer();
          
          // Verificăm dacă arrayBuffer-ul a fost creat corect
          if (arrayBuffer.byteLength === 0) {
            throw new Error('ArrayBuffer-ul creat are dimensiunea 0.');
          }
          
          const { data: uploadData, error } = await supabase.storage
            .from('images')
            .upload(filePath, arrayBuffer, {
              contentType: 'image/jpeg'
            });
            
          if (error) {
            console.log('DEBUG [uploadImageToSupabase] - Eroare la încărcare:', error);
            throw error;
          }

          console.log('DEBUG [uploadImageToSupabase] - Încărcare reușită:', uploadData);
        } catch (error) {
          console.error('DEBUG [uploadImageToSupabase] - Eroare la procesarea data URL pe web:', error);
          throw new Error('Nu s-a putut procesa imaginea. Încercați să folosiți o imagine din galerie.');
        }
      }
      else {
        // Pentru celelalte platforme sau URI-uri normale, folosim fetch
        console.log('DEBUG [uploadImageToSupabase] - Convertire URI la ArrayBuffer');
        try {
          const response = await fetch(uri);
          if (!response.ok) {
            throw new Error(`Eroare la preluarea imaginii: ${response.status} ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error('Nu s-a putut crea arrayBuffer-ul pentru imagine sau are dimensiunea 0.');
          }
          
          console.log('DEBUG [uploadImageToSupabase] - ArrayBuffer creat, dimensiune:', arrayBuffer.byteLength, 'bytes');
          
          const { data: uploadData, error } = await supabase.storage
            .from('images')
            .upload(filePath, arrayBuffer, {
              contentType: 'image/jpeg'
            });
            
          if (error) {
            console.log('DEBUG [uploadImageToSupabase] - Eroare la încărcare:', error);
            throw error;
          }

          console.log('DEBUG [uploadImageToSupabase] - Încărcare reușită:', uploadData);
        } catch (error) {
          console.error('DEBUG [uploadImageToSupabase] - Eroare la fetch:', error);
          throw new Error('Eroare la preluarea imaginii. Verificați conexiunea la internet.');
        }
      }

      // Obținem URL-ul public al imaginii
      console.log('DEBUG [uploadImageToSupabase] - Obținere URL public');
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      console.log('DEBUG [uploadImageToSupabase] - URL public obținut:', data.publicUrl);
      return { success: true, url: data.publicUrl };
    } catch (error: any) {
      console.error('DEBUG [handleWebUpload] - Eroare:', error);
      return { success: false, error: error.message || 'Eroare la încărcarea imaginii pe web' };
    }
  };

  // Funcție pentru încărcarea imaginilor pe iOS
  const handleIosUpload = async (uri: string, fileName: string, filePath: string, supabaseUrl: string, anonKey: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      // Verificăm dacă URI-ul este valid și accesibil
      const fileInfo = await getFileInfo(uri);
      if (!fileInfo.exists) {
        throw new Error(`Fișierul nu există la calea: ${uri}`);
      }
      
      console.log('DEBUG [handleIosUpload] - Informații fișier:', fileInfo);
      
      // Pentru iOS, folosim direct FormData cu cheia anonimă
      console.log('DEBUG [handleIosUpload] - Folosim FormData pentru iOS');
      
      // Creăm un FormData și adăugăm fișierul
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: 'image/jpeg'
      } as any);
      
      // Încărcăm fișierul direct la API-ul Supabase cu cheia anonimă
      const response = await fetch(
        `${supabaseUrl}/storage/v1/object/images/${filePath}`,
        {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'x-upsert': 'true'
          },
          body: formData
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('DEBUG [handleIosUpload] - Răspuns de eroare:', errorText);
        throw new Error(`Eroare la încărcarea fișierului: ${response.status} ${errorText}`);
      }
      
      console.log('DEBUG [handleIosUpload] - Încărcare reușită cu FormData pentru iOS');
      
      // Obținem URL-ul public al imaginii
      console.log('DEBUG [handleIosUpload] - Obținere URL public');
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      console.log('DEBUG [handleIosUpload] - URL public obținut:', data.publicUrl);
      return { success: true, url: data.publicUrl };
    } catch (error: any) {
      console.error('DEBUG [handleIosUpload] - Eroare:', error);
      return { success: false, error: error.message || 'Eroare la încărcarea imaginii pe iOS' };
    }
  };

  // Funcție pentru încărcarea imaginilor pe Android
  const handleAndroidUpload = async (uri: string, fileName: string, filePath: string, supabaseUrl: string, anonKey: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      // Verificăm dacă URI-ul este valid și accesibil
      const fileInfo = await getFileInfo(uri);
      if (!fileInfo.exists) {
        throw new Error(`Fișierul nu există la calea: ${uri}`);
      }
      
      console.log('DEBUG [handleAndroidUpload] - Informații fișier:', fileInfo);
      
      // Pentru Android, încercăm mai întâi metoda cu FormData (ca la iOS)
      try {
        console.log('DEBUG [handleAndroidUpload] - Încercăm metoda cu FormData pentru Android');
        
        // Creăm un FormData și adăugăm fișierul
        const formData = new FormData();
        formData.append('file', {
          uri: uri,
          name: fileName,
          type: 'image/jpeg'
        } as any);
        
        // Încărcăm fișierul direct la API-ul Supabase cu cheia anonimă
        const response = await fetch(
          `${supabaseUrl}/storage/v1/object/images/${filePath}`,
          {
            method: 'POST',
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'x-upsert': 'true'
            },
            body: formData
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('DEBUG [handleAndroidUpload] - Răspuns de eroare:', errorText);
          throw new Error(`Eroare la încărcarea fișierului: ${response.status} ${errorText}`);
        }
        
        console.log('DEBUG [handleAndroidUpload] - Încărcare reușită cu FormData pentru Android');
      } catch (formDataError) {
        console.error('DEBUG [handleAndroidUpload] - Eroare la metoda FormData:', formDataError);
        
        // Dacă metoda cu FormData eșuează, încercăm metoda cu blob
        console.log('DEBUG [handleAndroidUpload] - Încercăm metoda cu blob pentru Android');
        
        // Citim fișierul ca base64
        const fileContent = await readAsBase64(uri);
        
        // Convertim base64 în format binar
        const binaryData = decode(fileContent);
        
        // Încărcăm datele binare
        const { data: uploadData, error } = await supabase.storage
          .from('images')
          .upload(filePath, binaryData, {
            contentType: 'image/jpeg',
            upsert: true
          });
          
        if (error) {
          console.log('DEBUG [handleAndroidUpload] - Eroare la încărcare cu metoda blob:', error);
          throw error;
        }

        console.log('DEBUG [handleAndroidUpload] - Încărcare reușită cu metoda blob');
      }
      
      // Obținem URL-ul public al imaginii
      console.log('DEBUG [handleAndroidUpload] - Obținere URL public');
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      console.log('DEBUG [handleAndroidUpload] - URL public obținut:', data.publicUrl);
      return { success: true, url: data.publicUrl };
    } catch (error: any) {
      console.error('DEBUG [handleAndroidUpload] - Eroare:', error);
      return { success: false, error: error.message || 'Eroare la încărcarea imaginii pe Android' };
    }
  };

  // Funcție pentru încărcarea imaginii în Supabase Storage
  const uploadImageToSupabase = async (uri: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      console.log('DEBUG [uploadImageToSupabase] - Începe procesul de încărcare a imaginii, URI:', uri);
      console.log('DEBUG [uploadImageToSupabase] - Verificare variabile de mediu:',
        'SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'disponibil' : 'nedisponibil',
        'SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'disponibil' : 'nedisponibil'
      );
      
      // Generăm un nume unic pentru fișier
      const fileName = `${uuidv4()}.jpg`;
      const filePath = `posts/${fileName}`;
      console.log('DEBUG [uploadImageToSupabase] - Nume generat pentru fișier:', filePath);

      // Obținem URL-ul și cheia anonimă Supabase
      const supabaseUrl = getSupabaseUrl();
      const anonKey = getSupabaseAnonKey();
      
      console.log('DEBUG [uploadImageToSupabase] - URL Supabase:', supabaseUrl);
      console.log('DEBUG [uploadImageToSupabase] - Cheie anonimă disponibilă:', anonKey ? 'da' : 'nu');
      
      if (!supabaseUrl || !anonKey) {
        throw new Error('Configurația Supabase nu este disponibilă');
      }

      // Strategii diferite în funcție de platformă
      if (Platform.OS === 'web') {
        return await handleWebUpload(uri, filePath);
      } else if (Platform.OS === 'ios') {
        return await handleIosUpload(uri, fileName, filePath, supabaseUrl, anonKey);
      } else {
        return await handleAndroidUpload(uri, fileName, filePath, supabaseUrl, anonKey);
      }
    } catch (error: any) {
      console.error('DEBUG [uploadImageToSupabase] - Eroare completă:', error);
      
      // Verificăm dacă este o eroare CORS
      if (error.message && error.message.includes('CORS')) {
        return { 
          success: false, 
          error: 'Eroare CORS la încărcarea imaginii. Încercați să folosiți o imagine din galerie în loc de o imagine din clipboard sau URL.' 
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'A apărut o eroare la încărcarea imaginii.' 
      };
    }
  };

  const containerStyle = {
    ...StyleSheet.flatten(styles.container),
    backgroundColor: '#ffffff', // Asigurăm că fundalul este alb
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <GestureDetector gesture={swipeBackGesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <ScrollView 
            style={containerStyle}
            ref={scrollViewRef}
            contentContainerStyle={styles.contentContainer}
            scrollEventThrottle={16}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={goBack}>
                <Ionicons name="arrow-back" size={24} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Creează o postare</Text>
              <TouchableOpacity 
                onPress={uploadPost}
                disabled={isLoading}
                style={[styles.shareButton, (!image || !content.trim() || isLoading) && styles.shareButtonDisabled]}
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
                <Text style={styles.inputLabel}>Conținut</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Despre ce este postarea ta?"
                  multiline
                  value={content}
                  onChangeText={setContent}
                />
              </View>

              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Postare publică</Text>
                <TouchableOpacity 
                  style={[styles.toggleButton, isPublished ? styles.toggleActive : styles.toggleInactive]}
                  onPress={() => setIsPublished(!isPublished)}
                >
                  <View style={[styles.toggleIndicator, isPublished ? styles.toggleIndicatorRight : styles.toggleIndicatorLeft]} />
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
        </Animated.View>
      </GestureDetector>
      <BottomNavigation activePage="post" />
    </View>
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
    minHeight: 100,
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