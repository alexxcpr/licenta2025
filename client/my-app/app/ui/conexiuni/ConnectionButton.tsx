import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '@/utils/supabase';
import ConfirmationModal from './ConfirmationModal';

interface ConnectionButtonProps {
  profileUserId: string;
  onConnectionChange?: () => void; // Callback pentru actualizarea numărului de conexiuni
}

const ConnectionButton: React.FC<ConnectionButtonProps> = ({ 
  profileUserId,
  onConnectionChange
}) => {
  const { user } = useUser();
  const [hasConnection, setHasConnection] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State pentru modalul de confirmare
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  // Verifică dacă există deja o conexiune între utilizatori
  const checkConnection = async () => {
    if (!user?.id || !profileUserId) return;
    
    try {
      setLoading(true);
      
      // Verifică conexiunea în ambele direcții (id_user_1 și id_user_2)
      const { data, error } = await supabase
        .from('connection')
        .select('*')
        .or(`and(id_user_1.eq.${user.id},id_user_2.eq.${profileUserId}),and(id_user_1.eq.${profileUserId},id_user_2.eq.${user.id})`);
      
      if (error) {
        console.error('Eroare la verificarea conexiunii:', error);
        return;
      }
      
      // Verifică dacă există o conexiune între utilizatori
      const connectionExists = data && data.length > 0;
      
      setHasConnection(connectionExists);
      
      // Dacă nu există conexiune, verifică dacă există o cerere de conexiune în așteptare
      if (!connectionExists) {
        const { data: requestData, error: requestError } = await supabase
          .from('connection_request')
          .select('*')
          .eq('id_user_sender', user.id)
          .eq('id_user_receiver', profileUserId);
          
        if (requestError) {
          console.error('Eroare la verificarea cererilor de conexiune:', requestError);
          return;
        }
        
        setHasPendingRequest(requestData && requestData.length > 0);
      } else {
        setHasPendingRequest(false);
      }
    } catch (error) {
      console.error('Eroare la verificarea conexiunii:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verifică conexiunea la montarea componentei și după modificări
  useEffect(() => {
    checkConnection();
  }, [user, profileUserId]);

  // Trimite cerere de conexiune
  const sendConnectionRequest = async () => {
    if (!user?.id || !profileUserId) return;
    
    try {
      setLoading(true);
      
      // Verifică dacă există deja o cerere trimisă
      const { data: existingRequests, error: checkError } = await supabase
        .from('connection_request')
        .select('*')
        .eq('id_user_sender', user.id)
        .eq('id_user_receiver', profileUserId);
      
      if (checkError) {
        console.error('Eroare la verificarea cererilor existente:', checkError);
        return;
      }
      
      if (existingRequests && existingRequests.length > 0) {
        setModalTitle('Cerere existentă');
        setModalMessage('Ai trimis deja o cerere de conexiune acestui utilizator.');
        setErrorModalVisible(true);
        setLoading(false);
        return;
      }
      
      // Verificăm dacă există o cerere de conexiune în sens invers
      // (utilizatorul curent este destinatar și profilul vizitat este expeditor)
      const { data: reverseRequests, error: reverseError } = await supabase
        .from('connection_request')
        .select('*')
        .eq('id_user_sender', profileUserId)
        .eq('id_user_receiver', user.id);
      
      if (reverseError) {
        console.error('Eroare la verificarea cererilor inverse:', reverseError);
        return;
      }
      
      // Dacă există o cerere în sens invers, acceptăm automat conexiunea
      if (reverseRequests && reverseRequests.length > 0) {
        // Creăm conexiunea
        const { error: connectionError } = await supabase
          .from('connection')
          .insert({
            id_user_1: profileUserId,
            id_user_2: user.id,
            date_created: new Date().toISOString(),
            date_updated: new Date().toISOString()
          });
        
        if (connectionError) {
          console.error('Eroare la crearea conexiunii:', connectionError);
          return;
        }
        
        // Ștergem cererea inversă
        const { error: deleteError } = await supabase
          .from('connection_request')
          .delete()
          .eq('id_connection_request', reverseRequests[0].id_connection_request);
        
        if (deleteError) {
          console.error('Eroare la ștergerea cererii inverse:', deleteError);
        }
        
        setHasConnection(true);
        setHasPendingRequest(false);
        
        setModalTitle('Conexiune stabilită');
        setModalMessage('Conexiunea a fost acceptată automat deoarece utilizatorul ți-a trimis deja o cerere.');
        setSuccessModalVisible(true);
        
        // Notifică părintele să actualizeze numărul de conexiuni
        if (onConnectionChange) {
          onConnectionChange();
        }
        
        return;
      }
      
      // Adaugă noua cerere
      const { error } = await supabase
        .from('connection_request')
        .insert({
          id_user_sender: user.id,
          id_user_receiver: profileUserId,
          status: 'pending',
          date_created: new Date().toISOString(),
          date_updated: new Date().toISOString()
        });
      
      if (error) {
        console.error('Eroare la trimiterea cererii de conexiune:', error);
        setModalTitle('Eroare');
        setModalMessage('Nu s-a putut trimite cererea de conexiune.');
        setErrorModalVisible(true);
        return;
      }
      
      setHasPendingRequest(true);
      setModalTitle('Succes');
      setModalMessage('Cerere de conexiune trimisă cu succes!');
      setSuccessModalVisible(true);
      
      // Reîncărcăm starea butonului după trimiterea cererii
      checkConnection();
    } catch (error) {
      console.error('Eroare la trimiterea cererii:', error);
      setModalTitle('Eroare');
      setModalMessage('A apărut o eroare la trimiterea cererii.');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // Șterge conexiunea existentă
  const confirmDeleteConnection = () => {
    setModalTitle('Șterge conexiunea');
    setModalMessage('Ești sigur că dorești să ștergi această conexiune?');
    setConfirmModalVisible(true);
  };

  const deleteConnection = async () => {
    if (!user?.id || !profileUserId) return;
    
    try {
      setLoading(true);
      
      // Caută conexiunea existentă
      const { data, error: findError } = await supabase
        .from('connection')
        .select('*')
        .or(`and(id_user_1.eq.${user.id},id_user_2.eq.${profileUserId}),and(id_user_1.eq.${profileUserId},id_user_2.eq.${user.id})`);
      
      if (findError) {
        console.error('Eroare la căutarea conexiunii:', findError);
        return;
      }
      
      if (!data || data.length === 0) {
        console.error('Conexiunea nu a fost găsită');
        return;
      }
      
      // Șterge conexiunea
      const { error } = await supabase
        .from('connection')
        .delete()
        .eq('id_connection', data[0].id_connection);
      
      if (error) {
        console.error('Eroare la ștergerea conexiunii:', error);
        setModalTitle('Eroare');
        setModalMessage('Nu s-a putut șterge conexiunea.');
        setErrorModalVisible(true);
        return;
      }
      
      setHasConnection(false);
      setModalTitle('Succes');
      setModalMessage('Conexiunea a fost ștearsă.');
      setSuccessModalVisible(true);
      
      // Notifică părintele să actualizeze numărul de conexiuni
      if (onConnectionChange) {
        onConnectionChange();
      }
    } catch (error) {
      console.error('Eroare la ștergerea conexiunii:', error);
      setModalTitle('Eroare');
      setModalMessage('A apărut o eroare la ștergerea conexiunii.');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // Gestionează apăsarea butonului
  const handlePress = () => {
    if (hasConnection) {
      confirmDeleteConnection();
    } else if (!hasPendingRequest) {
      sendConnectionRequest();
    }
  };

  // Determină textul butonului în funcție de stare
  const getButtonText = () => {
    if (hasConnection) {
      return 'Șterge conexiune';
    } else if (hasPendingRequest) {
      return 'Așteaptă răspuns';
    } else {
      return 'Trimite conexiune';
    }
  };

  // Determină stilul butonului în funcție de stare
  const getButtonStyle = () => {
    if (hasConnection) {
      return styles.deleteButton;
    } else if (hasPendingRequest) {
      return styles.pendingButton;
    } else {
      return styles.connectButton;
    }
  };

  // Determină stilul textului în funcție de stare
  const getTextStyle = () => {
    if (hasConnection) {
      return styles.deleteButtonText;
    } else if (hasPendingRequest) {
      return styles.pendingButtonText;
    } else {
      return styles.connectButtonText;
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          getButtonStyle()
        ]}
        onPress={handlePress}
        disabled={loading || hasPendingRequest}
        accessibilityLabel={getButtonText()}
        accessibilityHint={hasConnection ? "Șterge conexiunea cu acest utilizator" : "Trimite o cerere de conexiune acestui utilizator"}
      >
        <Text style={[
          styles.buttonText,
          getTextStyle()
        ]}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>

      {/* Modalul de confirmare pentru ștergerea conexiunii */}
      <ConfirmationModal
        visible={confirmModalVisible}
        title={modalTitle}
        message={modalMessage}
        confirmText="Șterge"
        onConfirm={() => {
          setConfirmModalVisible(false);
          deleteConnection();
        }}
        onCancel={() => setConfirmModalVisible(false)}
        type="danger"
      />

      {/* Modalul pentru mesajele de succes */}
      <ConfirmationModal
        visible={successModalVisible}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        onConfirm={() => setSuccessModalVisible(false)}
        onCancel={() => setSuccessModalVisible(false)}
        type="success"
      />

      {/* Modalul pentru mesajele de eroare */}
      <ConfirmationModal
        visible={errorModalVisible}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        onConfirm={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
        type="danger"
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: 5,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
    minHeight: 42,
  },
  connectButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pendingButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  connectButtonText: {
    color: '#fff',
  },
  deleteButtonText: {
    color: '#666',
  },
  pendingButtonText: {
    color: '#999',
  },
});

export default ConnectionButton; 