import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../utils/supabase';
import { DatePickerButton } from './general/datetime-picker';

interface Education {
  id_education_activity?: number;
  id_user?: string;
  denumire_institutie: string;
  data_inceput?: string;
  data_sfarsit?: string | null;
  denumire_profil?: string;
  date_created?: string;
  date_updated?: string;
}

interface UserEducationProps {
  educationActivities: Education[];
  userId?: string;
  isOwnProfile: boolean;
  onRefresh: () => Promise<void>;
}

const UserEducation: React.FC<UserEducationProps> = ({ 
  educationActivities, 
  userId, 
  isOwnProfile,
  onRefresh 
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Education | null>(null);
  const [formData, setFormData] = useState<Partial<Education>>({
    denumire_institutie: '',
    denumire_profil: '',
  });
  
  // State pentru selectarea datelor
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isCurrentEducation, setIsCurrentEducation] = useState(false);

  // State pentru validări și erori
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Funcție pentru formatarea datelor
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Prezent';
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', { year: 'numeric', month: 'short' });
  };

  const handleInputChange = (field: keyof Education, value: string) => {
    setFormData((prev) => {
      return { ...prev, [field]: String(value) };
    });
    
    setErrors((prev) => {
      return { ...prev, [field]: '' };
    });
  };

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
    setErrors(prev => ({ ...prev, startDate: '' }));
  };

  const handleEndDateChange = (date: Date) => {
    setEndDate(date);
    setErrors(prev => ({ ...prev, endDate: '' }));
  };

  const toggleCurrentEducation = () => {
    setIsCurrentEducation(!isCurrentEducation);
    if (!isCurrentEducation) {
      setEndDate(null);
      setErrors(prev => ({ ...prev, endDate: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.denumire_institutie?.trim()) {
      newErrors.denumire_institutie = 'Numele instituției este obligatoriu';
    }

    if (!startDate) {
      newErrors.startDate = 'Data de început este obligatorie';
    }

    if (!isCurrentEducation && !endDate) {
      newErrors.endDate = 'Data de sfârșit este obligatorie pentru educația încheiată';
    }

    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = 'Data de sfârșit trebuie să fie după data de început';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      denumire_institutie: '',
      denumire_profil: '',
    });
    setStartDate(null);
    setEndDate(null);
    setIsCurrentEducation(false);
    setErrors({});
    setEditingItem(null);
  };

  const handleOpenModal = (item?: Education) => {
    if (item) {
      // Editare
      setEditingItem(item);
      setFormData({
        denumire_institutie: item.denumire_institutie ? String(item.denumire_institutie) : '',
        denumire_profil: item.denumire_profil ? String(item.denumire_profil) : '',
      });
      const startDateObj = item.data_inceput ? new Date(item.data_inceput) : null;
      const endDateObj = item.data_sfarsit ? new Date(item.data_sfarsit) : null;
      setStartDate(startDateObj);
      setEndDate(endDateObj);
      setIsCurrentEducation(!item.data_sfarsit);
    } else {
      // Adăugare nouă
      resetForm();
    }
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Eroare', 'Trebuie să fiți autentificat pentru a gestiona educația');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const educationData = {
        id_user: userId,
        denumire_institutie: formData.denumire_institutie,
        denumire_profil: formData.denumire_profil || null,
        data_inceput: startDate?.toISOString(),
        data_sfarsit: isCurrentEducation ? null : endDate?.toISOString() || null,
        date_updated: new Date().toISOString()
      };

      if (editingItem) {
        // Actualizare
        const { error } = await supabase
          .from('education_activity')
          .update(educationData)
          .eq('id_education_activity', editingItem.id_education_activity);
        
        if (error) {
          console.error('Eroare la actualizarea educației:', error);
          Alert.alert('Eroare', 'Nu s-a putut actualiza educația. Vă rugăm încercați din nou.');
          return;
        }
        
        Alert.alert('Succes', 'Educația a fost actualizată cu succes.');
      } else {
        // Adăugare nouă
        const newEducation = {
          ...educationData,
          date_created: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('education_activity')
          .insert(newEducation);
        
        if (error) {
          console.error('Eroare la adăugarea educației:', error);
          Alert.alert('Eroare', 'Nu s-a putut adăuga educația. Vă rugăm încercați din nou.');
          return;
        }
        
        Alert.alert('Succes', 'Educația a fost adăugată cu succes.');
      }
      
      resetForm();
      setIsModalVisible(false);
      await onRefresh();
    } catch (error) {
      console.error('Eroare la gestionarea educației:', error);
      Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Education) => {
    Alert.alert(
      'Confirmare ștergere',
      'Sunteți sigur că doriți să ștergeți această educație?',
      [
        { text: 'Anulează', style: 'cancel' },
        { 
          text: 'Șterge', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('education_activity')
                .delete()
                .eq('id_education_activity', item.id_education_activity);
              
              if (error) {
                console.error('Eroare la ștergerea educației:', error);
                Alert.alert('Eroare', 'Nu s-a putut șterge educația. Vă rugăm încercați din nou.');
                return;
              }
              
              await onRefresh();
              Alert.alert('Succes', 'Educația a fost ștearsă cu succes.');
            } catch (error) {
              console.error('Eroare la ștergerea educației:', error);
              Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm încercați din nou.');
            }
          }
        }
      ]
    );
  };

  const renderEducationItem = ({ item }: { item: Education }) => (
    <View style={styles.educationItem}>
      <View style={styles.timelineContainer}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>
      
      <View style={styles.educationContent}>
        <View style={styles.educationHeader}>
          <View style={styles.educationInfo}>
            <Text style={styles.institutionName}>{item.denumire_institutie}</Text>
            {item.denumire_profil ? (
              <Text style={styles.degreeField}>{item.denumire_profil}</Text>
            ) : null}
            <Text style={styles.dateRange}>
              {formatDate(item.data_inceput)} - {formatDate(item.data_sfarsit)}
            </Text>
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

  const renderAddEducationModal = () => (
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
              {editingItem ? 'Editează educație' : 'Adaugă educație'}
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
              <Text style={styles.inputLabel}>Numele instituției *</Text>
              <TextInput
                style={[styles.input, errors.denumire_institutie ? styles.inputError : null]}
                value={formData.denumire_institutie ? String(formData.denumire_institutie) : ''}
                onChangeText={(text) => handleInputChange('denumire_institutie', text)}
                placeholder="Ex: Universitatea București"
                placeholderTextColor="#999"
              />
              {errors.denumire_institutie ? <Text style={styles.errorText}>{errors.denumire_institutie}</Text> : null}
              
              <Text style={styles.inputLabel}>Profil de studiu</Text>
              <TextInput
                style={[styles.input, errors.denumire_profil ? styles.inputError : null]}
                value={formData.denumire_profil ? String(formData.denumire_profil) : ''}
                onChangeText={(text) => handleInputChange('denumire_profil', text)}
                placeholder="Ex: Informatică"
                placeholderTextColor="#999"
              />
              {errors.denumire_profil ? <Text style={styles.errorText}>{errors.denumire_profil}</Text> : null}
              
              <DatePickerButton
                value={startDate}
                onDateChange={handleStartDateChange}
                label="Data de început *"
                placeholder="Selectează data de început"
                error={errors.startDate ? errors.startDate : undefined}
                maximumDate={new Date()}
              />
              
              <View style={styles.checkboxContainer}>
                <TouchableOpacity 
                  style={styles.checkbox}
                  onPress={toggleCurrentEducation}
                >
                  <View style={[
                    styles.checkboxInner, 
                    isCurrentEducation ? styles.checkboxChecked : null
                  ]}>
                    {isCurrentEducation ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                  </View>
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Învăț aici în prezent</Text>
              </View>
              
              {!isCurrentEducation ? (
                <DatePickerButton
                  value={endDate}
                  onDateChange={handleEndDateChange}
                  label="Data de sfârșit *"
                  placeholder="Selectează data de sfârșit"
                  error={errors.endDate ? errors.endDate : undefined}
                  minimumDate={startDate || undefined}
                  maximumDate={new Date()}
                />
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
                    {editingItem ? 'Actualizează educație' : 'Adaugă educație'}
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
        <Text style={styles.sectionTitle}>Educație</Text>
        {isOwnProfile ? (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => handleOpenModal()}
          >
            <Text style={styles.addButtonText}>Adaugă educație</Text>
            <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {(!educationActivities || educationActivities.length === 0) ? (
        <Text style={styles.emptyText}>Nu există informații despre educație</Text>
      ) : (
        <FlatList
          data={educationActivities}
          renderItem={renderEducationItem}
          keyExtractor={(item, index) => `education-${item.id_education_activity || index}`}
          scrollEnabled={false}
        />
      )}
      
      {renderAddEducationModal()}
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
  educationItem: {
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
  educationContent: {
    flex: 1,
    marginLeft: 10,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  educationInfo: {
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
  institutionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  degreeField: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  dateRange: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
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

export default UserEducation; 