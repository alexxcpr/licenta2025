import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, Platform, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../utils/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

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
  const [formData, setFormData] = useState<Partial<OtherActivity>>({
    denumire: ''
  });
  
  // State pentru încărcarea fișierelor
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size?: number;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const handleInputChange = (field: keyof OtherActivity, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      denumire: ''
    });
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setUploadProgress(0);
  };

  const pickImage = async () => {
    try {
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
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
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
      }
    } catch (error) {
      console.error('Eroare la selectarea imaginii:', error);
      Alert.alert('Eroare', 'Nu s-a putut selecta imaginea. Vă rugăm încercați din nou.');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (result.assets && result.assets.length > 0) {
        const document = result.assets[0];
        // Verificăm dimensiunea fișierului (max 10MB)
        const fileInfo = await FileSystem.getInfoAsync(document.uri);
        
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
      const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convertim Base64 la ArrayBuffer folosind o bibliotecă
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
      Alert.alert('Eroare', 'Trebuie să fiți autentificat pentru a adăuga activități');
      return;
    }
    
    if (!formData.denumire) {
      Alert.alert('Eroare', 'Numele activității este obligatoriu');
      return;
    }
    
    if (!selectedFile) {
      Alert.alert('Eroare', 'Este necesară încărcarea unui document/imagine (diplomă, certificat)');
      return;
    }
    
    setLoading(true);
    try {
      // Încărcăm fișierul și obținem URL-ul
      const fileUrl = await uploadFile();
      
      if (!fileUrl) {
        Alert.alert('Eroare', 'Nu s-a putut încărca fișierul. Vă rugăm încercați din nou.');
        setLoading(false);
        return;
      }
      
      const newActivity = {
        id_user: userId,
        denumire: formData.denumire,
        storage_file: fileUrl,
        date_created: new Date().toISOString(),
        date_updated: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('other_activity')
        .insert(newActivity);
      
      if (error) {
        console.error('Eroare la adăugarea activității:', error);
        Alert.alert('Eroare', 'Nu s-a putut adăuga activitatea. Vă rugăm încercați din nou.');
        return;
      }
      
      resetForm();
      setIsModalVisible(false);
      await onRefresh(); // Reîmprospătăm datele
      Alert.alert('Succes', 'Activitatea a fost adăugată cu succes.');
    } catch (error) {
      console.error('Eroare la adăugarea activității:', error);
      Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const renderActivityItem = ({ item }: { item: OtherActivity }) => (
    <View style={styles.activityItem}>
      <View style={styles.timelineContainer}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>
      
      <View style={styles.activityContent}>
        <Text style={styles.activityName}>{item.denumire}</Text>
        
        {item.storage_file && (
          <TouchableOpacity 
            style={styles.certificateButton}
            onPress={() => {
              // Deschide certificatul într-o vizualizare separată sau browser
              if (Platform.OS === 'web') {
                window.open(item.storage_file, '_blank');
              } else {
                // Ar putea fi implementat un vizualizator intern
                Alert.alert('Certificat', 'Vizualizarea certificatului în aplicație va fi implementată în curând.');
              }
            }}
          >
            <Text style={styles.certificateButtonText}>Vezi certificatul</Text>
            <Ionicons name="document-text-outline" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}
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
            <Text style={styles.modalTitle}>Adaugă activitate</Text>
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
                style={styles.input}
                value={formData.denumire}
                onChangeText={(text) => handleInputChange('denumire', text)}
                placeholder="Ex: Curs de dezvoltare web"
              />
              
              <Text style={styles.inputLabel}>Încarcă certificat/diplomă *</Text>
              <View style={styles.fileUploadContainer}>
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
              
              {selectedFile && (
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
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              )}
              
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.submitButtonText}>Se adaugă...</Text>
                ) : (
                  <Text style={styles.submitButtonText}>Adaugă activitate</Text>
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
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Adaugă activitate</Text>
            <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
        )}
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
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  fileUploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
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
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
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