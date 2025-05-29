import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../utils/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

interface JobActivity {
  id_job_activity?: number;
  id_user?: string;
  companie: string;
  id_domeniu?: number;
  id_functie?: number;
  data_inceput?: string;
  data_sfarsit?: string | null;
  descriere?: string;
  date_created?: string;
  date_updated?: string;
}

interface UserPastActivityProps {
  jobActivities: JobActivity[];
  userId?: string;
  isOwnProfile: boolean;
  onRefresh: () => Promise<void>;
}

const UserPastActivity: React.FC<UserPastActivityProps> = ({ 
  jobActivities, 
  userId, 
  isOwnProfile,
  onRefresh 
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<JobActivity>>({
    companie: '',
    id_domeniu: undefined,
    id_functie: undefined,
    descriere: ''
  });
  
  // State pentru selectarea datelor
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isCurrentJob, setIsCurrentJob] = useState(false);

  // State pentru domenii și funcții
  const [domenii, setDomenii] = useState<{id_domeniu: number, denumire: string}[]>([]);
  const [functii, setFunctii] = useState<{id_functie: number, denumire: string}[]>([]);
  const [showDomeniiModal, setShowDomeniiModal] = useState(false);
  const [showFunctiiModal, setShowFunctiiModal] = useState(false);
  const [selectedDomeniu, setSelectedDomeniu] = useState<{id_domeniu: number, denumire: string} | null>(null);
  const [selectedFunctie, setSelectedFunctie] = useState<{id_functie: number, denumire: string} | null>(null);

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

  const handleInputChange = (field: keyof JobActivity, value: string) => {
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

  const toggleCurrentJob = () => {
    setIsCurrentJob(!isCurrentJob);
    if (!isCurrentJob) {
      setEndDate(null);
    }
  };

  const resetForm = () => {
    setFormData({
      companie: '',
      id_domeniu: undefined,
      id_functie: undefined,
      descriere: ''
    });
    setStartDate(null);
    setEndDate(null);
    setIsCurrentJob(false);
    setSelectedDomeniu(null);
    setSelectedFunctie(null);
  };

  const handleOpenModal = async () => {
    // Încărcăm domeniile și funcțiile când se deschide modalul
    try {
      const { data: domeniiData } = await supabase
        .from('domenii')
        .select('id_domeniu, denumire')
        .order('denumire', { ascending: true });
      
      const { data: functiiData } = await supabase
        .from('functii')
        .select('id_functie, denumire')
        .order('denumire', { ascending: true });
      
      setDomenii(domeniiData || []);
      setFunctii(functiiData || []);
    } catch (error) {
      console.error('Eroare la încărcarea domeniilor și funcțiilor:', error);
    }
    
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Eroare', 'Trebuie să fiți autentificat pentru a adăuga experiență profesională');
      return;
    }
    
    if (!formData.companie) {
      Alert.alert('Eroare', 'Numele companiei este obligatoriu');
      return;
    }
    
    if (!startDate) {
      Alert.alert('Eroare', 'Data de început este obligatorie');
      return;
    }
    
    setLoading(true);
    try {
      const newJobActivity = {
        id_user: userId,
        companie: formData.companie,
        id_domeniu: formData.id_domeniu || null,
        id_functie: formData.id_functie || null,
        data_inceput: startDate?.toISOString(),
        data_sfarsit: isCurrentJob ? null : endDate?.toISOString() || null,
        descriere: formData.descriere || null,
        date_created: new Date().toISOString(),
        date_updated: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('job_activity')
        .insert(newJobActivity);
      
      if (error) {
        console.error('Eroare la adăugarea experienței profesionale:', error);
        Alert.alert('Eroare', 'Nu s-a putut adăuga experiența profesională. Vă rugăm încercați din nou.');
        return;
      }
      
      resetForm();
      setIsModalVisible(false);
      await onRefresh(); // Reîmprospătăm datele
      Alert.alert('Succes', 'Experiența profesională a fost adăugată cu succes.');
    } catch (error) {
      console.error('Eroare la adăugarea experienței profesionale:', error);
      Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const renderJobItem = ({ item }: { item: JobActivity }) => (
    <View style={styles.jobItem}>
      <View style={styles.timelineContainer}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>
      
      <View style={styles.jobContent}>
        <Text style={styles.companyName}>{item.companie}</Text>
        
        <Text style={styles.dateRange}>
          {formatDate(item.data_inceput)} - {formatDate(item.data_sfarsit)}
        </Text>
        
        {item.descriere && (
          <Text style={styles.description}>{item.descriere}</Text>
        )}
      </View>
    </View>
  );

  const renderAddJobModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adaugă experiență profesională</Text>
            <TouchableOpacity 
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Numele companiei *</Text>
              <TextInput
                style={styles.input}
                value={formData.companie}
                onChangeText={(text) => handleInputChange('companie', text)}
                placeholder="Ex: Google"
              />
              
              <Text style={styles.inputLabel}>Domeniu</Text>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowDomeniiModal(true)}
              >
                <Text style={styles.selectButtonText}>
                  {selectedDomeniu ? selectedDomeniu.denumire : 'Selectează domeniul'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#007AFF" />
              </TouchableOpacity>
              
              <Text style={styles.inputLabel}>Funcție</Text>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowFunctiiModal(true)}
              >
                <Text style={styles.selectButtonText}>
                  {selectedFunctie ? selectedFunctie.denumire : 'Selectează funcția'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#007AFF" />
              </TouchableOpacity>
              
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
                  onPress={toggleCurrentJob}
                >
                  <View style={[
                    styles.checkboxInner, 
                    isCurrentJob && styles.checkboxChecked
                  ]}>
                    {isCurrentJob && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Lucrez aici în prezent</Text>
              </View>
              
              {!isCurrentJob && (
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
              
              <Text style={styles.inputLabel}>Descriere</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.descriere}
                onChangeText={(text) => handleInputChange('descriere', text)}
                placeholder="Descrieți responsabilitățile și realizările"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.submitButtonText}>Se adaugă...</Text>
                ) : (
                  <Text style={styles.submitButtonText}>Adaugă experiență</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
          
          {/* Modal pentru selectarea domeniului */}
          <Modal
            visible={showDomeniiModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDomeniiModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.pickerModalContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Selectează domeniul</Text>
                  <TouchableOpacity onPress={() => setShowDomeniiModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pickerScrollView}>
                  {domenii.map((domeniu) => (
                    <TouchableOpacity
                      key={domeniu.id_domeniu}
                      style={styles.pickerItem}
                      onPress={() => {
                        setSelectedDomeniu(domeniu);
                        setFormData(prev => ({...prev, id_domeniu: domeniu.id_domeniu}));
                        setShowDomeniiModal(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>{domeniu.denumire}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
          
          {/* Modal pentru selectarea funcției */}
          <Modal
            visible={showFunctiiModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowFunctiiModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.pickerModalContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Selectează funcția</Text>
                  <TouchableOpacity onPress={() => setShowFunctiiModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pickerScrollView}>
                  {functii.map((functie) => (
                    <TouchableOpacity
                      key={functie.id_functie}
                      style={styles.pickerItem}
                      onPress={() => {
                        setSelectedFunctie(functie);
                        setFormData(prev => ({...prev, id_functie: functie.id_functie}));
                        setShowFunctiiModal(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>{functie.denumire}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Experiență profesională</Text>
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleOpenModal}
          >
            <Text style={styles.addButtonText}>Adaugă experiență</Text>
            <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
      
      {(!jobActivities || jobActivities.length === 0) ? (
        <Text style={styles.emptyText}>Nu există informații despre experiența profesională</Text>
      ) : (
        <FlatList
          data={jobActivities}
          renderItem={renderJobItem}
          keyExtractor={(item, index) => `job-${item.id_job_activity || index}`}
          scrollEnabled={false}
        />
      )}
      
      {renderAddJobModal()}
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
  jobItem: {
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
  jobContent: {
    flex: 1,
    marginLeft: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  position: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  location: {
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
  selectButton: {
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
  selectButtonText: {
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
  pickerModalContainer: {
    width: '90%',
    maxHeight: '60%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  pickerScrollView: {
    paddingHorizontal: 16,
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default UserPastActivity; 