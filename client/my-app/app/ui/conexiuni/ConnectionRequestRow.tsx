import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import ConfirmationModal from './ConfirmationModal';

//utils
import { navigateToProfile } from '@/app/utils/Navigation';

interface ConnectionRequestRowProps {
  request: {
    id_connection_request: string;
    id_user_sender: string;
    date_created: string;
    user: {
      username: string;
      profile_picture?: string;
    }
  };
  onRequestProcessed: () => void;
}

const ConnectionRequestRow: React.FC<ConnectionRequestRowProps> = ({ 
  request, 
  onRequestProcessed 
}) => {
  const { user } = useUser();
  const router = useRouter();
  
  // State pentru modaluri
  const [confirmAcceptVisible, setConfirmAcceptVisible] = useState(false);
  const [confirmRejectVisible, setConfirmRejectVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  
  // Funcții pentru confirmări
  const confirmAccept = () => {
    setModalTitle('Acceptă cererea');
    setModalMessage(`Vrei să accepți cererea de conexiune de la ${request.user.username}?`);
    setConfirmAcceptVisible(true);
  };
  
  const confirmReject = () => {
    setModalTitle('Respinge cererea');
    setModalMessage(`Ești sigur că vrei să respingi cererea de conexiune de la ${request.user.username}?`);
    setConfirmRejectVisible(true);
  };
  
  // Acceptă cererea de conexiune
  const handleAccept = async () => {
    if (!user?.id) {
      console.error('ID-ul utilizatorului curent nu este disponibil');
      return;
    }
    
    try {
      // 1. Creează conexiunea în tabelul connection
      const { error: connectionError } = await supabase
        .from('connection')
        .insert({
          id_user_1: request.id_user_sender,
          id_user_2: user.id,
          date_created: new Date().toISOString(),
          date_updated: new Date().toISOString()
        });

      if (connectionError) {
        console.error('Eroare la crearea conexiunii:', connectionError);
        setModalTitle('Eroare');
        setModalMessage('Nu s-a putut crea conexiunea. Te rugăm să încerci din nou.');
        setErrorModalVisible(true);
        return;
      }

      // 2. Șterge cererea din connection_request
      const { error: deleteError } = await supabase
        .from('connection_request')
        .delete()
        .eq('id_connection_request', request.id_connection_request);

      if (deleteError) {
        console.error('Eroare la ștergerea cererii:', deleteError);
        return;
      }

      // Șterge și cererea inversă dacă există (utilizatorul curent a trimis și el o cerere)
      const { error: reverseDeleteError } = await supabase
        .from('connection_request')
        .delete()
        .eq('id_user_sender', user.id)
        .eq('id_user_receiver', request.id_user_sender);
      
      if (reverseDeleteError) {
        console.error('Eroare la ștergerea cererii inverse:', reverseDeleteError);
      }

      setModalTitle('Succes');
      setModalMessage(`Ai acceptat cererea de conexiune de la ${request.user.username}.`);
      setSuccessModalVisible(true);
      
      // Notifică componenta părinte pentru actualizarea listei
      onRequestProcessed();
    } catch (error) {
      console.error('Eroare la procesarea cererii:', error);
      setModalTitle('Eroare');
      setModalMessage('A apărut o eroare la procesarea cererii. Te rugăm să încerci din nou.');
      setErrorModalVisible(true);
    }
  };

  // Respinge cererea de conexiune
  const handleReject = async () => {
    try {
      // Șterge cererea din connection_request
      const { error } = await supabase
        .from('connection_request')
        .delete()
        .eq('id_connection_request', request.id_connection_request);

      if (error) {
        console.error('Eroare la ștergerea cererii:', error);
        setModalTitle('Eroare');
        setModalMessage('Nu s-a putut respinge cererea. Te rugăm să încerci din nou.');
        setErrorModalVisible(true);
        return;
      }

      setModalTitle('Cerere respinsă');
      setModalMessage(`Ai respins cererea de conexiune de la ${request.user.username}.`);
      setSuccessModalVisible(true);
      
      // Notifică componenta părinte pentru actualizarea listei
      onRequestProcessed();
    } catch (error) {
      console.error('Eroare la respingerea cererii:', error);
      setModalTitle('Eroare');
      setModalMessage('A apărut o eroare la respingerea cererii. Te rugăm să încerci din nou.');
      setErrorModalVisible(true);
    }
  };

  return (
    <>
      <View style={styles.container}>
        {/* Partea stângă - Informații utilizator - acum clickable */}
        <TouchableOpacity 
          style={styles.userInfo} 
          onPress={() => navigateToProfile(request.id_user_sender)}
          accessibilityLabel={`Vezi profilul lui ${request.user.username}`}
        >
          <Image 
            source={{ 
              uri: request.user.profile_picture || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png' 
            }} 
            style={styles.avatar} 
          />
          <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
            {request.user.username}
          </Text>
        </TouchableOpacity>

        {/* Partea dreaptă - Butoane acțiune */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.acceptButton} 
            onPress={confirmAccept}
            accessibilityLabel="Acceptă cererea de conexiune"
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.rejectButton} 
            onPress={confirmReject}
            accessibilityLabel="Respinge cererea de conexiune"
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modalul pentru confirmarea acceptării */}
      <ConfirmationModal
        visible={confirmAcceptVisible}
        title={modalTitle}
        message={modalMessage}
        confirmText="Acceptă"
        onConfirm={() => {
          setConfirmAcceptVisible(false);
          handleAccept();
        }}
        onCancel={() => setConfirmAcceptVisible(false)}
        type="info"
      />

      {/* Modalul pentru confirmarea respingerii */}
      <ConfirmationModal
        visible={confirmRejectVisible}
        title={modalTitle}
        message={modalMessage}
        confirmText="Respinge"
        onConfirm={() => {
          setConfirmRejectVisible(false);
          handleReject();
        }}
        onCancel={() => setConfirmRejectVisible(false)}
        type="danger"
      />

      {/* Modalul pentru mesajele de succes */}
      <ConfirmationModal
        visible={successModalVisible}
        title={modalTitle}
        message={modalMessage}
        confirmText="OK"
        onConfirm={() => {
          setSuccessModalVisible(false);
        }}
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    maxWidth: '70%', // Limitează lățimea numelui pentru a lăsa spațiu pentru butoane
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100, // Asigură un spațiu minim pentru butoane
    justifyContent: 'flex-end',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rejectButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ConnectionRequestRow; 