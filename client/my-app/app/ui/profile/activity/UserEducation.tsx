import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../utils/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  const [formData, setFormData] = useState<Partial<Education>>({
    denumire_institutie: '',
    denumire_profil: '',
  });
  
  // State pentru selectarea datelor
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isCurrentEducation, setIsCurrentEducation] = useState(false);

  // Funcție pentru formatarea datelor
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Prezent';
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', { year: 'numeric', month: 'short' });
  };

  // Funcție pentru formatarea datelor pentru afișare în input
  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('ro-RO', { year: 'numeric', month: 'long' });
  };

  const handleInputChange = (field: keyof Education, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const toggleCurrentEducation = () => {
    setIsCurrentEducation(!isCurrentEducation);
    if (!isCurrentEducation) {
      setEndDate(null);
    }
  };

  const resetForm = () => {
    setFormData({
      denumire_institutie: '',
      denumire_profil: '',
    });
    setStartDate(null);
    setEndDate(null);
    setIsCurrentEducation(false);
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Eroare', 'Trebuie să fiți autentificat pentru a adăuga educație');
      return;
    }
    
    if (!formData.denumire_institutie) {
      Alert.alert('Eroare', 'Numele instituției este obligatoriu');
      return;
    }
    
    if (!startDate) {
      Alert.alert('Eroare', 'Data de început este obligatorie');
      return;
    }
    
    setLoading(true);
    try {
      const newEducation = {
        id_user: userId,
        denumire_institutie: formData.denumire_institutie,
        denumire_profil: formData.denumire_profil || null,
        data_inceput: startDate?.toISOString(),
        data_sfarsit: isCurrentEducation ? null : endDate?.toISOString() || null,
        date_created: new Date().toISOString(),
        date_updated: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('education_activity')
        .insert(newEducation);
      
      if (error) {
        console.error('Eroare la adăugarea educației:', error);
        Alert.alert('Eroare', 'Nu s-a putut adăuga educația. Vă rugăm încercați din nou.');
        return;
      }
      
      resetForm();
      setIsModalVisible(false);
      await onRefresh(); // Reîmprospătăm datele
      Alert.alert('Succes', 'Educația a fost adăugată cu succes.');
    } catch (error) {
      console.error('Eroare la adăugarea educației:', error);
      Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const renderEducationItem = ({ item }: { item: Education }) => (
    <View style={styles.educationItem}>
      <View style={styles.timelineContainer}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>
      
      <View style={styles.educationContent}>
        <Text style={styles.institutionName}>{item.denumire_institutie}</Text>
        
        {item.denumire_profil && (
          <Text style={styles.degreeField}>{item.denumire_profil}</Text>
        )}
        
        <Text style={styles.dateRange}>
          {formatDate(item.data_inceput)} - {formatDate(item.data_sfarsit)}
        </Text>
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
            <Text style={styles.modalTitle}>Adaugă educație</Text>
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
                style={styles.input}
                value={formData.denumire_institutie}
                onChangeText={(text) => handleInputChange('denumire_institutie', text)}
                placeholder="Ex: Universitatea București"
              />
              
              <Text style={styles.inputLabel}>Profil de studiu</Text>
              <TextInput
                style={styles.input}
                value={formData.denumire_profil}
                onChangeText={(text) => handleInputChange('denumire_profil', text)}
                placeholder="Ex: Informatică"
              />
              
              <Text style={styles.inputLabel}>Data de început *</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.datePickerButtonText}>
                  {startDate ? formatDateForDisplay(startDate) : 'Selectează data de început'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleStartDateChange}
                />
              )}
              
              <View style={styles.checkboxContainer}>
                <TouchableOpacity 
                  style={styles.checkbox}
                  onPress={toggleCurrentEducation}
                >
                  <View style={[
                    styles.checkboxInner, 
                    isCurrentEducation && styles.checkboxChecked
                  ]}>
                    {isCurrentEducation && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Învăț aici în prezent</Text>
              </View>
              
              {!isCurrentEducation && (
                <>
                  <Text style={styles.inputLabel}>Data de sfârșit</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {endDate ? formatDateForDisplay(endDate) : 'Selectează data de sfârșit'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={endDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleEndDateChange}
                    />
                  )}
                </>
              )}
              
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.submitButtonText}>Se adaugă...</Text>
                ) : (
                  <Text style={styles.submitButtonText}>Adaugă educație</Text>
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
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Adaugă educație</Text>
            <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
        )}
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

export default UserEducation; 