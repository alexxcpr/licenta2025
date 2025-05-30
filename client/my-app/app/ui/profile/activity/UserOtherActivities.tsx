import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, Platform, ScrollView, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../utils/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { decode } from 'base64-arraybuffer';

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
const readAsBase64 = async (uri: string, selectedFile?: File) => {
  if (Platform.OS === 'web') {
    // On web, if we have the actual file object, use it directly
    if (selectedFile) {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
    }
    // Fallback for data URLs
    if (uri.startsWith('data:')) {
      const base64 = uri.split(',')[1];
      return base64;
    }
    // For blob URLs, convert to base64
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

interface OtherActivity {
  id_other_activity?: number;
  id_user?: string;
  denumire: string;
  storage_file?: string;
  date_created?: string;
  date_updated?: string;
}

interface UserOtherActivitiesProps {
  otherActivities: OtherActivity[];
  userId?: string;
  isOwnProfile: boolean;
  onRefresh: () => Promise<void>;
}

const UserOtherActivities: React.FC<UserOtherActivitiesProps> = ({ 
  otherActivities, 
  userId, 
  isOwnProfile,
  onRefresh 
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<OtherActivity | null>(null);
  const [formData, setFormData] = useState<Partial<OtherActivity>>({
    denumire: ''
  });
  
  // State pentru încărcarea fișierelor
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size?: number;
    file?: File; // For web platform
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  // State pentru validări și erori
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (field: keyof OtherActivity, value: string) => {
    setFormData((prev) => {
      return { ...prev, [field]: value };
    });
    
    setErrors((prev) => {
      return { ...prev, [field]: '' };
    });
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.denumire?.trim()) {
      newErrors.denumire = 'Numele activității este obligatoriu';
    }

    if (!editingItem && !selectedFile) {
      newErrors.file = 'Este necesară încărcarea unui document/imagine (diplomă, certificat)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      denumire: ''
    });
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setUploadProgress(0);
    setErrors({});
    setEditingItem(null);
  };

  const handleOpenModal = (item?: OtherActivity) => {
    if (item) {
      // Editare
      setEditingItem(item);
      setFormData({
        denumire: item.denumire,
      });
    } else {
      // Adăugare nouă
      resetForm();
    }
    setIsModalVisible(true);
  };

  const openFile = async (fileUrl: string) => {
    try {
      if (Platform.OS === 'web') {
        window.open(fileUrl, '_blank');
      } else {
        // Pentru mobile, folosim Linking pentru a deschide fișierul
        const supported = await Linking.canOpenURL(fileUrl);
        if (supported) {
          await Linking.openURL(fileUrl);
        } else {
          Alert.alert(
            'Vizualizare fișier', 
            'Fișierul va fi deschis în browserul implicit.',
            [
              { text: 'Anulează', style: 'cancel' },
              { text: 'Deschide', onPress: () => Linking.openURL(fileUrl) }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Eroare la deschiderea fișierului:', error);
      Alert.alert('Eroare', 'Nu s-a putut deschide fișierul. Vă rugăm încercați din nou.');
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        // Verifică dacă suntem pe client-side
        if (typeof document === 'undefined') {
          console.warn('Document nu este disponibil pe server-side');
          return;
        }
        
        // Create file input for web
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
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
          // Check file size (max 10MB)
          if (file.size > 10 * 1024 * 1024) {
            Alert.alert('Fișier prea mare', 'Imaginea selectată depășește 10MB. Vă rugăm să selectați o imagine mai mică.');
            return;
          }

          const fileURL = URL.createObjectURL(file);
          setSelectedFile({
            uri: fileURL,
            name: file.name,
            type: file.type,
            size: file.size,
            file: file
          });
          
          setFilePreviewUrl(fileURL);
          setErrors(prev => ({ ...prev, file: '' }));
        }
        return;
      }

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permisiune respinsă', 'Avem nevoie de permisiunea de a accesa biblioteca media pentru a selecta o imagine.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Verificăm dimensiunea fișierului (max 10MB)
        const fileInfo = await getFileInfo(asset.uri);
        
        if (fileInfo.exists && fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
          Alert.alert('Fișier prea mare', 'Imaginea selectată depășește 10MB. Vă rugăm să selectați o imagine mai mică.');
          return;
        }

        // Obținem numele fișierului și tipul MIME
        const uriParts = asset.uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1];
        
        setSelectedFile({
          uri: asset.uri,
          name: `certificate_${Date.now()}.${fileExtension}`,
          type: `image/${fileExtension}`,
          size: fileInfo.exists ? fileInfo.size : undefined
        });
        
        setFilePreviewUrl(asset.uri);
        setErrors(prev => ({ ...prev, file: '' }));
      }
    } catch (error) {
      console.error('Eroare la selectarea imaginii:', error);
      Alert.alert('Eroare', 'Nu s-a putut selecta imaginea. Vă rugăm încercați din nou.');
    }
  };

  const pickDocument = async () => {
    try {
      if (Platform.OS === 'web') {
        // Verifică dacă suntem pe client-side
        if (typeof document === 'undefined') {
          console.warn('Document nu este disponibil pe server-side');
          return;
        }
        
        // Create file input for web
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        
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
          // Check file size (max 10MB)
          if (file.size > 10 * 1024 * 1024) {
            Alert.alert('Fișier prea mare', 'Documentul selectat depășește 10MB. Vă rugăm să selectați un document mai mic.');
            return;
          }

          setSelectedFile({
            uri: 'pdf-placeholder', // We don't need a URL for PDFs
            name: file.name,
            type: file.type,
            size: file.size,
            file: file
          });
          
          setFilePreviewUrl('pdf-preview');
          setErrors(prev => ({ ...prev, file: '' }));
        }
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (result.assets && result.assets.length > 0) {
        const document = result.assets[0];
        // Verificăm dimensiunea fișierului (max 10MB)
        const fileInfo = await getFileInfo(document.uri);
        
        if (fileInfo.exists && fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
          Alert.alert('Fișier prea mare', 'Documentul selectat depășește 10MB. Vă rugăm să selectați un document mai mic.');
          return;
        }

        setSelectedFile({
          uri: document.uri,
          name: document.name,
          type: 'application/pdf',
          size: fileInfo.exists ? fileInfo.size : undefined
        });
        
        // Pentru PDF-uri, folosim o imagine placeholder
        setFilePreviewUrl('pdf-preview');
        setErrors(prev => ({ ...prev, file: '' }));
      }
    } catch (error) {
      console.error('Eroare la selectarea documentului:', error);
      Alert.alert('Eroare', 'Nu s-a putut selecta documentul. Vă rugăm încercați din nou.');
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return null;
    
    try {
      // Citim fișierul ca Base64
      const base64 = await readAsBase64(selectedFile.uri, selectedFile.file);
      
      // Convertim Base64 la ArrayBuffer
      const arrayBuffer = decode(base64);
      
      // Creăm un nume unic pentru fișier
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `profile-activity/${fileName}`;
      
      // Încărcăm fișierul în bucket-ul "images" în folderul "profile-activity"
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, arrayBuffer, {
          contentType: selectedFile.type,
        });
      
      if (error) {
        throw error;
      }
      
      // Returnăm URL-ul public pentru fișierul încărcat
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Eroare la încărcarea fișierului:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Eroare', 'Trebuie să fiți autentificat pentru a gestiona activitățile');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      let fileUrl = editingItem?.storage_file || null;
      
      // Încărcăm fișierul doar dacă a fost selectat unul nou
      if (selectedFile) {
        fileUrl = await uploadFile();
        
        if (!fileUrl) {
          Alert.alert('Eroare', 'Nu s-a putut încărca fișierul. Vă rugăm încercați din nou.');
          setLoading(false);
          return;
        }
      }
      
      const activityData = {
        id_user: userId,
        denumire: formData.denumire,
        storage_file: fileUrl,
        date_updated: new Date().toISOString()
      };

      if (editingItem) {
        // Actualizare
        const { error } = await supabase
          .from('other_activity')
          .update(activityData)
          .eq('id_other_activity', editingItem.id_other_activity);
        
        if (error) {
          console.error('Eroare la actualizarea activității:', error);
          Alert.alert('Eroare', 'Nu s-a putut actualiza activitatea. Vă rugăm încercați din nou.');
          return;
        }
        
        Alert.alert('Succes', 'Activitatea a fost actualizată cu succes.');
      } else {
        // Adăugare nouă
        const newActivity = {
          ...activityData,
          date_created: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('other_activity')
          .insert(newActivity);
        
        if (error) {
          console.error('Eroare la adăugarea activității:', error);
          Alert.alert('Eroare', 'Nu s-a putut adăuga activitatea. Vă rugăm încercați din nou.');
          return;
        }
        
        Alert.alert('Succes', 'Activitatea a fost adăugată cu succes.');
      }
      
      resetForm();
      setIsModalVisible(false);
      await onRefresh();
    } catch (error) {
      console.error('Eroare la gestionarea activității:', error);
      Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: OtherActivity) => {
    Alert.alert(
      'Confirmare ștergere',
      'Sunteți sigur că doriți să ștergeți această activitate?',
      [
        { text: 'Anulează', style: 'cancel' },
        { 
          text: 'Șterge', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('other_activity')
                .delete()
                .eq('id_other_activity', item.id_other_activity);
              
              if (error) {
                console.error('Eroare la ștergerea activității:', error);
                Alert.alert('Eroare', 'Nu s-a putut șterge activitatea. Vă rugăm încercați din nou.');
                return;
              }
              
              await onRefresh();
              Alert.alert('Succes', 'Activitatea a fost ștearsă cu succes.');
            } catch (error) {
              console.error('Eroare la ștergerea activității:', error);
              Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm încercați din nou.');
            }
          }
        }
      ]
    );
  };

  const renderActivityItem = ({ item }: { item: OtherActivity }) => (
    <View style={styles.activityItem}>
      <View style={styles.timelineContainer}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>
      
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{item.denumire}</Text>
            
            {item.storage_file ? (
              <TouchableOpacity 
                style={styles.certificateButton}
                onPress={() => openFile(item.storage_file!)}
              >
                <Text style={styles.certificateButtonText}>Vezi certificatul</Text>
                <Ionicons name="document-text-outline" size={16} color="#007AFF" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          {isOwnProfile ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleOpenModal(item)}
              >
                <Ionicons name="create-outline" size={18} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(item)}
              >
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  const renderAddActivityModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Editează activitate' : 'Adaugă activitate'}
            </Text>
            <TouchableOpacity 
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Numele activității *</Text>
              <TextInput
                style={[styles.input, errors.denumire ? styles.inputError : null]}
                value={formData.denumire ? String(formData.denumire) : ''}
                onChangeText={(text) => handleInputChange('denumire', text)}
                placeholder="Ex: Curs de dezvoltare web"
                placeholderTextColor="#999"
              />
              {errors.denumire ? <Text style={styles.errorText}>{errors.denumire}</Text> : null}
              
              <Text style={styles.inputLabel}>
                {editingItem ? 'Încarcă certificat/diplomă nou (opțional)' : 'Încarcă certificat/diplomă *'}
              </Text>
              <View style={[styles.fileUploadContainer, errors.file ? styles.inputError : null]}>
                <TouchableOpacity
                  style={styles.filePickerButton}
                  onPress={pickImage}
                >
                  <Ionicons name="image-outline" size={20} color="#007AFF" />
                  <Text style={styles.filePickerText}>Imagine</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.filePickerButton}
                  onPress={pickDocument}
                >
                  <Ionicons name="document-outline" size={20} color="#007AFF" />
                  <Text style={styles.filePickerText}>PDF</Text>
                </TouchableOpacity>
              </View>
              {errors.file ? <Text style={styles.errorText}>{errors.file}</Text> : null}
              
              {selectedFile ? (
                <View style={styles.filePreviewContainer}>
                  {filePreviewUrl === 'pdf-preview' ? (
                    <View style={styles.pdfPreview}>
                      <Ionicons name="document-text" size={40} color="#FF9500" />
                      <Text style={styles.pdfName} numberOfLines={1} ellipsizeMode="middle">
                        {selectedFile.name}
                      </Text>
                    </View>
                  ) : (
                    <Image 
                      source={{ uri: filePreviewUrl || '' }} 
                      style={styles.imagePreview} 
                      resizeMode="cover"
                    />
                  )}
                  
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => {
                      setSelectedFile(null);
                      setFilePreviewUrl(null);
                      setErrors(prev => ({ ...prev, file: '' }));
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : null}
              
              <TouchableOpacity
                style={[styles.submitButton, loading ? styles.submitButtonDisabled : null]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.submitButtonText}>
                    {editingItem ? 'Se actualizează...' : 'Se adaugă...'}
                  </Text>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingItem ? 'Actualizează activitate' : 'Adaugă activitate'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Alte activități</Text>
        {isOwnProfile ? (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => handleOpenModal()}
          >
            <Text style={styles.addButtonText}>Adaugă activitate</Text>
            <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {(!otherActivities || otherActivities.length === 0) ? (
        <Text style={styles.emptyText}>Nu există informații despre alte activități</Text>
      ) : (
        <FlatList
          data={otherActivities}
          renderItem={renderActivityItem}
          keyExtractor={(item, index) => `activity-${item.id_other_activity || index}`}
          scrollEnabled={false}
        />
      )}
      
      {renderAddActivityModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 14,
    marginRight: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineContainer: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
    marginLeft: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityInfo: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  organization: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  activityType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dateRange: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    lineHeight: 20,
  },
  certificateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  certificateButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: '90%',
  },
  formContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  inputError: {
    borderColor: '#FF3B30',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginBottom: 12,
    marginLeft: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  fileUploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    padding: 8,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    width: '45%',
  },
  filePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  pdfPreview: {
    width: '100%',
    height: 100,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  pdfName: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    maxWidth: '80%',
  },
  removeFileButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 15,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserOtherActivities; 