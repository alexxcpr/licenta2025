import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../utils/supabase';
import { DatePickerButton } from './general/datetime-picker';

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
  const [editingItem, setEditingItem] = useState<JobActivity | null>(null);
  const [formData, setFormData] = useState<Partial<JobActivity>>({
    companie: '',
    id_domeniu: undefined,
    id_functie: undefined,
    descriere: ''
  });
  
  // State pentru selectarea datelor
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isCurrentJob, setIsCurrentJob] = useState(false);

  // State pentru domenii și funcții
  const [domenii, setDomenii] = useState<{id_domeniu: number, denumire: string}[]>([]);
  const [functii, setFunctii] = useState<{id_functie: number, denumire: string}[]>([]);
  const [showDomeniiModal, setShowDomeniiModal] = useState(false);
  const [showFunctiiModal, setShowFunctiiModal] = useState(false);
  const [selectedDomeniu, setSelectedDomeniu] = useState<{id_domeniu: number, denumire: string} | null>(null);
  const [selectedFunctie, setSelectedFunctie] = useState<{id_functie: number, denumire: string} | null>(null);

  // State pentru validări și erori
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Funcție pentru formatarea datelor
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Prezent';
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', { year: 'numeric', month: 'short' });
  };

  const handleInputChange = (field: keyof JobActivity, value: string) => {
    setFormData((prev) => {
      return { ...prev, [field]: value };
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

  const toggleCurrentJob = () => {
    setIsCurrentJob(!isCurrentJob);
    if (!isCurrentJob) {
      setEndDate(null);
      setErrors(prev => ({ ...prev, endDate: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.companie?.trim()) {
      newErrors.companie = 'Numele companiei este obligatoriu';
    }

    if (!selectedDomeniu) {
      newErrors.domeniu = 'Domeniul este obligatoriu';
    }

    if (!selectedFunctie) {
      newErrors.functie = 'Funcția este obligatorie';
    }

    if (!startDate) {
      newErrors.startDate = 'Data de început este obligatorie';
    }

    if (!isCurrentJob && !endDate) {
      newErrors.endDate = 'Data de sfârșit este obligatorie pentru joburile încheiate';
    }

    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = 'Data de sfârșit trebuie să fie după data de început';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    setErrors({});
    setEditingItem(null);
  };

  const handleOpenModal = async (item?: JobActivity) => {
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

      if (item) {
        // Editare
        setEditingItem(item);
        setFormData({
          companie: item.companie,
          id_domeniu: item.id_domeniu,
          id_functie: item.id_functie,
          descriere: item.descriere || ''
        });

        // Setăm domeniile și funcțiile selectate
        const domeniu = domeniiData?.find(d => d.id_domeniu === item.id_domeniu);
        const functie = functiiData?.find(f => f.id_functie === item.id_functie);
        setSelectedDomeniu(domeniu || null);
        setSelectedFunctie(functie || null);

        // Setăm datele
        const startDateObj = item.data_inceput ? new Date(item.data_inceput) : null;
        const endDateObj = item.data_sfarsit ? new Date(item.data_sfarsit) : null;
        setStartDate(startDateObj);
        setEndDate(endDateObj);
        setIsCurrentJob(!item.data_sfarsit);
      } else {
        // Adăugare nouă
        resetForm();
      }
    } catch (error) {
      console.error('Eroare la încărcarea domeniilor și funcțiilor:', error);
    }
    
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Eroare', 'Trebuie să fiți autentificat pentru a gestiona experiența profesională');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const jobActivityData = {
        id_user: userId,
        companie: formData.companie,
        id_domeniu: selectedDomeniu?.id_domeniu || null,
        id_functie: selectedFunctie?.id_functie || null,
        data_inceput: startDate?.toISOString(),
        data_sfarsit: isCurrentJob ? null : endDate?.toISOString() || null,
        descriere: formData.descriere || null,
        date_updated: new Date().toISOString()
      };

      if (editingItem) {
        // Actualizare
        const { error } = await supabase
          .from('job_activity')
          .update(jobActivityData)
          .eq('id_job_activity', editingItem.id_job_activity);
        
        if (error) {
          console.error('Eroare la actualizarea experienței profesionale:', error);
          Alert.alert('Eroare', 'Nu s-a putut actualiza experiența profesională. Vă rugăm încercați din nou.');
          return;
        }
        
        Alert.alert('Succes', 'Experiența profesională a fost actualizată cu succes.');
      } else {
        // Adăugare nouă
        const newJobActivity = {
          ...jobActivityData,
          date_created: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('job_activity')
          .insert(newJobActivity);
        
        if (error) {
          console.error('Eroare la adăugarea experienței profesionale:', error);
          Alert.alert('Eroare', 'Nu s-a putut adăuga experiența profesională. Vă rugăm încercați din nou.');
          return;
        }
        
        Alert.alert('Succes', 'Experiența profesională a fost adăugată cu succes.');
      }
      
      resetForm();
      setIsModalVisible(false);
      await onRefresh();
    } catch (error) {
      console.error('Eroare la gestionarea experienței profesionale:', error);
      Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: JobActivity) => {
    Alert.alert(
      'Confirmare ștergere',
      'Sunteți sigur că doriți să ștergeți această experiență profesională?',
      [
        { text: 'Anulează', style: 'cancel' },
        { 
          text: 'Șterge', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('job_activity')
                .delete()
                .eq('id_job_activity', item.id_job_activity);
              
              if (error) {
                console.error('Eroare la ștergerea experienței profesionale:', error);
                Alert.alert('Eroare', 'Nu s-a putut șterge experiența profesională. Vă rugăm încercați din nou.');
                return;
              }
              
              await onRefresh();
              Alert.alert('Succes', 'Experiența profesională a fost ștearsă cu succes.');
            } catch (error) {
              console.error('Eroare la ștergerea experienței profesionale:', error);
              Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm încercați din nou.');
            }
          }
        }
      ]
    );
  };

  const renderJobItem = ({ item }: { item: JobActivity }) => (
    <View style={styles.jobItem}>
      <View style={styles.timelineContainer}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>
      
      <View style={styles.jobContent}>
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.companyName}>{item.companie}</Text>
            <Text style={styles.dateRange}>
              {formatDate(item.data_inceput)} - {formatDate(item.data_sfarsit)}
            </Text>
            {item.descriere ? (
              <Text style={styles.description}>{item.descriere}</Text>
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
            <Text style={styles.modalTitle}>
              {editingItem ? 'Editează experiență profesională' : 'Adaugă experiență profesională'}
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
              <Text style={styles.inputLabel}>Numele companiei *</Text>
              <TextInput
                style={[styles.input, errors.companie ? styles.inputError : null]}
                value={formData.companie ? String(formData.companie) : ''}
                onChangeText={(text) => handleInputChange('companie', text)}
                placeholder="Ex: Google"
                placeholderTextColor="#999"
              />
              {errors.companie ? <Text style={styles.errorText}>{errors.companie}</Text> : null}
              
              <Text style={styles.inputLabel}>Domeniu *</Text>
              <TouchableOpacity 
                style={[styles.selectButton, errors.domeniu ? styles.inputError : null]}
                onPress={() => setShowDomeniiModal(true)}
              >
                <Text style={[
                  styles.selectButtonText, 
                  !selectedDomeniu ? styles.placeholderText : null
                ]}>
                  {selectedDomeniu ? selectedDomeniu.denumire : 'Selectează domeniul'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#007AFF" />
              </TouchableOpacity>
              {errors.domeniu ? <Text style={styles.errorText}>{errors.domeniu}</Text> : null}
              
              <Text style={styles.inputLabel}>Funcție *</Text>
              <TouchableOpacity 
                style={[styles.selectButton, errors.functie ? styles.inputError : null]}
                onPress={() => setShowFunctiiModal(true)}
              >
                <Text style={[
                  styles.selectButtonText,
                  !selectedFunctie ? styles.placeholderText : null
                ]}>
                  {selectedFunctie ? selectedFunctie.denumire : 'Selectează funcția'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#007AFF" />
              </TouchableOpacity>
              {errors.functie ? <Text style={styles.errorText}>{errors.functie}</Text> : null}
              
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
                  onPress={toggleCurrentJob}
                >
                  <View style={[
                    styles.checkboxInner, 
                    isCurrentJob ? styles.checkboxChecked : null
                  ]}>
                    {isCurrentJob ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                  </View>
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Lucrez aici în prezent</Text>
              </View>
              
              {!isCurrentJob ? (
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
              
              <Text style={styles.inputLabel}>Descriere</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.descriere ? styles.inputError : null]}
                value={formData.descriere ? String(formData.descriere) : ''}
                onChangeText={(text) => handleInputChange('descriere', text)}
                placeholder="Descrieți responsabilitățile și realizările"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.descriere ? <Text style={styles.errorText}>{errors.descriere}</Text> : null}
              
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
                    {editingItem ? 'Actualizează experiență' : 'Adaugă experiență'}
                  </Text>
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
                        setErrors(prev => ({ ...prev, domeniu: '' }));
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
                        setErrors(prev => ({ ...prev, functie: '' }));
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
        {isOwnProfile ? (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => handleOpenModal()}
          >
            <Text style={styles.addButtonText}>Adaugă experiență</Text>
            <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
        ) : null}
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobInfo: {
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
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
  placeholderText: {
    color: '#999',
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
    flex: 1,
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
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserPastActivity; 