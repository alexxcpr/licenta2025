import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';

interface ContactDetailsProps {
  username?: string;
  domeniu?: string;
  functie?: string;
  ocupatie?: string;
  email?: string;
  userId?: string;
  isOwnProfile: boolean;
  onRefresh?: () => Promise<void>;
}

const ContactDetails: React.FC<ContactDetailsProps> = ({
  username,
  domeniu,
  functie,
  ocupatie,
  email,
  userId,
  isOwnProfile,
  onRefresh
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State pentru domenii, funcții și ocupații
  const [domenii, setDomenii] = useState<{id_domeniu: number, denumire: string}[]>([]);
  const [functii, setFunctii] = useState<{id_functie: number, denumire: string}[]>([]);
  const [ocupatii, setOcupatii] = useState<{id_ocupatie: number, denumire: string}[]>([]);
  const [showDomeniiModal, setShowDomeniiModal] = useState(false);
  const [showFunctiiModal, setShowFunctiiModal] = useState(false);
  const [showOcupatiiModal, setShowOcupatiiModal] = useState(false);
  const [selectedDomeniu, setSelectedDomeniu] = useState<{id_domeniu: number, denumire: string} | null>(null);
  const [selectedFunctie, setSelectedFunctie] = useState<{id_functie: number, denumire: string} | null>(null);
  const [selectedOcupatie, setSelectedOcupatie] = useState<{id_ocupatie: number, denumire: string} | null>(null);

  // State pentru validări și erori
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!selectedDomeniu) {
      newErrors.domeniu = 'Vă rugăm să selectați un domeniu';
    }

    if (!selectedFunctie) {
      newErrors.functie = 'Vă rugăm să selectați o funcție';
    }

    if (!selectedOcupatie) {
      newErrors.ocupatie = 'Vă rugăm să selectați o ocupație';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenModal = async () => {
    // Încărcăm domeniile, funcțiile și ocupațiile când se deschide modalul
    try {
      const [domeniiResponse, functiiResponse, ocupatiiResponse] = await Promise.all([
        supabase.from('domenii').select('id_domeniu, denumire').order('denumire', { ascending: true }),
        supabase.from('functii').select('id_functie, denumire').order('denumire', { ascending: true }),
        supabase.from('ocupatii').select('id_ocupatie, denumire').order('denumire', { ascending: true })
      ]);
      
      setDomenii(domeniiResponse.data || []);
      setFunctii(functiiResponse.data || []);
      setOcupatii(ocupatiiResponse.data || []);
      
      // Setăm valorile curente din props
      if (domeniu) {
        const currentDomeniu = domeniiResponse.data?.find(d => d.denumire === domeniu);
        setSelectedDomeniu(currentDomeniu || null);
      }
      if (functie) {
        const currentFunctie = functiiResponse.data?.find(f => f.denumire === functie);
        setSelectedFunctie(currentFunctie || null);
      }
      if (ocupatie) {
        const currentOcupatie = ocupatiiResponse.data?.find(o => o.denumire === ocupatie);
        setSelectedOcupatie(currentOcupatie || null);
      }
      
    } catch (error) {
      console.error('Eroare la încărcarea datelor:', error);
      Alert.alert('Eroare', 'Nu s-au putut încărca datele necesare. Vă rugăm încercați din nou.');
    }
    
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Eroare', 'Trebuie să fiți autentificat pentru a modifica informațiile');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const updateData: any = {
        id_domeniu: selectedDomeniu?.id_domeniu || null,
        id_functie: selectedFunctie?.id_functie || null,
        id_ocupatie: selectedOcupatie?.id_ocupatie || null,
      };
      
      const { error } = await supabase
        .from('user')
        .update(updateData)
        .eq('id_user', userId);
      
      if (error) {
        console.error('Eroare la actualizarea informațiilor:', error);
        Alert.alert('Eroare', 'Nu s-au putut actualiza informațiile. Vă rugăm încercați din nou.');
        return;
      }
      
      setIsModalVisible(false);
      if (onRefresh) {
        await onRefresh();
      }
      Alert.alert('Succes', 'Informațiile au fost actualizate cu succes.');
    } catch (error) {
      console.error('Eroare la actualizarea informațiilor:', error);
      Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const renderEditModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editează informații de contact</Text>
            <TouchableOpacity 
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Domeniu *</Text>
              <TouchableOpacity 
                style={[styles.selectButton, errors.domeniu && styles.inputError]}
                onPress={() => setShowDomeniiModal(true)}
              >
                <Text style={[
                  styles.selectButtonText,
                  !selectedDomeniu && styles.placeholderText
                ]}>
                  {selectedDomeniu ? selectedDomeniu.denumire : 'Selectează domeniul'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#007AFF" />
              </TouchableOpacity>
              {errors.domeniu && <Text style={styles.errorText}>{errors.domeniu}</Text>}
              
              <Text style={styles.inputLabel}>Funcție *</Text>
              <TouchableOpacity 
                style={[styles.selectButton, errors.functie && styles.inputError]}
                onPress={() => setShowFunctiiModal(true)}
              >
                <Text style={[
                  styles.selectButtonText,
                  !selectedFunctie && styles.placeholderText
                ]}>
                  {selectedFunctie ? selectedFunctie.denumire : 'Selectează funcția'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#007AFF" />
              </TouchableOpacity>
              {errors.functie && <Text style={styles.errorText}>{errors.functie}</Text>}
              
              <Text style={styles.inputLabel}>Ocupație *</Text>
              <TouchableOpacity 
                style={[styles.selectButton, errors.ocupatie && styles.inputError]}
                onPress={() => setShowOcupatiiModal(true)}
              >
                <Text style={[
                  styles.selectButtonText,
                  !selectedOcupatie && styles.placeholderText
                ]}>
                  {selectedOcupatie ? selectedOcupatie.denumire : 'Selectează ocupația'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#007AFF" />
              </TouchableOpacity>
              {errors.ocupatie && <Text style={styles.errorText}>{errors.ocupatie}</Text>}
              
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.submitButtonText}>Se actualizează...</Text>
                ) : (
                  <Text style={styles.submitButtonText}>Actualizează informații</Text>
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

          {/* Modal pentru selectarea ocupației */}
          <Modal
            visible={showOcupatiiModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowOcupatiiModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.pickerModalContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Selectează ocupația</Text>
                  <TouchableOpacity onPress={() => setShowOcupatiiModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pickerScrollView}>
                  {ocupatii.map((ocupatie) => (
                    <TouchableOpacity
                      key={ocupatie.id_ocupatie}
                      style={styles.pickerItem}
                      onPress={() => {
                        setSelectedOcupatie(ocupatie);
                        setShowOcupatiiModal(false);
                        setErrors(prev => ({ ...prev, ocupatie: '' }));
                      }}
                    >
                      <Text style={styles.pickerItemText}>{ocupatie.denumire}</Text>
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
        <Text style={styles.sectionTitle}>Informații de contact</Text>
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleOpenModal}
          >
            <Text style={styles.editButtonText}>Editează informații de contact</Text>
            <Ionicons name="create-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>Nume utilizator:</Text>
        <Text style={styles.value}>{username || 'Nespecificat'}</Text>
      </View>
      
      {domeniu && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Domeniu:</Text>
          <Text style={styles.value}>{domeniu}</Text>
        </View>
      )}
      
      {functie && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Funcție:</Text>
          <Text style={styles.value}>{functie}</Text>
        </View>
      )}
      
      {ocupatie && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Ocupație:</Text>
          <Text style={styles.value}>{ocupatie}</Text>
        </View>
      )}
      
      {email && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{email}</Text>
        </View>
      )}
      
      {renderEditModal()}
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
    marginBottom: 12,
    color: '#333',
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    marginRight: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    flex: 2,
    fontSize: 14,
    color: '#333',
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
  placeholderText: {
    color: '#999',
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

export default ContactDetails; 