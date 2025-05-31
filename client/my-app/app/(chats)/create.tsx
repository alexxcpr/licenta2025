import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../../utils/supabase';
import { Ionicons } from '@expo/vector-icons';

// Definim interfața pentru un utilizator
interface User {
  id_user: string;
  username: string;
  email: string;
  profile_picture?: string;
  id_functie?: number;
  functie?: {
    denumire: string;
    culoare: string;
  }
}

export default function CreateChatScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Încărcăm conexiunile utilizatorului
  useEffect(() => {
    if (!user) return;
    
    async function loadConnections() {
      setLoadingConnections(true);
      try {
        // Obținem conexiunile utilizatorului curent
        const { data, error } = await supabase
          .from('connection')
          .select(`
            id_connection,
            id_user_1,
            id_user_2,
            user1:user!connection_id_user_1_fkey (
              id_user,
              username,
              email,
              profile_picture,
              id_functie,
              functii (
                denumire
              )
            ),
            user2:user!connection_id_user_2_fkey (
              id_user,
              username,
              email,
              profile_picture,
              id_functie,
              functii (
                denumire
              )
            )
          `)
          .or(`id_user_1.eq.${user?.id || ''},id_user_2.eq.${user?.id || ''}`);

        if (error) {
          console.error('Eroare la încărcarea conexiunilor:', error);
          return;
        }

        if (data) {
          // Transformăm datele pentru a obține o listă de utilizatori unici
          const usersArray: User[] = [];
          
          data.forEach(conn => {
            // Verificăm care utilizator este cel care nu este utilizatorul curent
            let otherUser: any;
            if (user && conn.id_user_1 === user.id) {
              otherUser = Array.isArray(conn.user2) ? conn.user2[0] : conn.user2;
            } else {
              otherUser = Array.isArray(conn.user1) ? conn.user1[0] : conn.user1;
            }
            
            // Formatăm datele utilizatorului
            if (otherUser) {
              const formattedUser: User = {
                id_user: otherUser.id_user || '',
                username: otherUser.username || otherUser.email || 'Utilizator',
                email: otherUser.email || '',
                profile_picture: otherUser.profile_picture,
                id_functie: otherUser.id_functie,
                functie: otherUser.functii && Array.isArray(otherUser.functii) && otherUser.functii.length > 0 ? {
                  denumire: otherUser.functii[0].denumire,
                  culoare: otherUser.functii[0].culoare || '#6633CC'
                } : undefined
              };
              
              // Verificăm să nu avem duplicate
              if (!usersArray.some(u => u.id_user === formattedUser.id_user)) {
                usersArray.push(formattedUser);
              }
            }
          });
          
          setConnections(usersArray);
        }
      } catch (error) {
        console.error('Eroare neașteptată:', error);
      } finally {
        setLoadingConnections(false);
      }
    }

    loadConnections();
  }, [user]);

  // Adăugăm sau eliminăm un utilizator din selecție
  const toggleUserSelection = (selectedUser: User) => {
    if (selectedUsers.some(u => u.id_user === selectedUser.id_user)) {
      // Dacă utilizatorul este deja selectat, îl eliminăm
      setSelectedUsers(selectedUsers.filter(u => u.id_user !== selectedUser.id_user));
    } else {
      // Altfel, îl adăugăm la selecție
      setSelectedUsers([...selectedUsers, selectedUser]);
    }
  };

  // Afișăm sau ascundem modalul cu conexiuni
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  // Creăm o nouă cameră de chat
  const createChatRoom = async () => {
    if (!name.trim() || !user || selectedUsers.length === 0) {
      Alert.alert('Eroare', 'Trebuie să adaugi cel puțin un membru și să dai un nume conversației.');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Inserăm camera de chat în baza de date
      const { data: chatRoomData, error: chatRoomError } = await supabase
        .from('chat_rooms')
        .insert([
          {
            denumire: name,
            descriere: description,
          },
        ])
        .select();

      if (chatRoomError) {
        console.error('Eroare la crearea camerei de chat:', chatRoomError);
        Alert.alert('Eroare', 'Nu s-a putut crea camera de chat. Vă rugăm să încercați din nou.');
        return;
      }

      if (chatRoomData && chatRoomData.length > 0) {
        const chatRoomId = chatRoomData[0].id_chat_room;
        
        // 2. Adăugăm utilizatorul curent ca membru
        const { error: currentUserError } = await supabase
          .from('chat_room_individual')
          .insert([
            {
              id_chat_room: chatRoomId,
              id_user: user.id,
            },
          ]);

        if (currentUserError) {
          console.error('Eroare la adăugarea utilizatorului curent:', currentUserError);
          Alert.alert('Eroare', 'Nu s-a putut finaliza crearea camerei de chat.');
          return;
        }

        // 3. Adăugăm membrii selectați
        for (const selectedUser of selectedUsers) {
          const { error: memberError } = await supabase
            .from('chat_room_individual')
            .insert([
              {
                id_chat_room: chatRoomId,
                id_user: selectedUser.id_user,
              },
            ]);

          if (memberError) {
            console.error(`Eroare la adăugarea membrului ${selectedUser.username}:`, memberError);
          }
        }

        // Navigăm către noua cameră de chat
        router.push(`/(chats)/${chatRoomId}` as any);
      }
    } catch (error) {
      console.error('Eroare neașteptată:', error);
      Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm să încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  // Renderăm un element de utilizator în modal
  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.some(u => u.id_user === item.id_user);
    
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => toggleUserSelection(item)}
      >
        <Image 
          source={{ 
            uri: item.profile_picture || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png'
          }} 
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username}</Text>
          {item.functie && (
            <Text style={[styles.userFunction, { color: item.functie.culoare }]}>
              {item.functie.denumire}
            </Text>
          )}
        </View>
        <View style={styles.checkboxContainer}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          ) : (
            <Ionicons name="ellipse-outline" size={24} color="#ccc" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Creează o conversație nouă</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nume</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Introduceți un nume pentru conversație"
          placeholderTextColor="#888"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Descriere (opțional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Adăugați o descriere pentru conversație"
          placeholderTextColor="#888"
          multiline
          numberOfLines={4}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Membri ({selectedUsers.length})</Text>
        
        <TouchableOpacity 
          style={styles.addMemberButton}
          onPress={toggleModal}
        >
          <Ionicons name="person-add" size={20} color="#007AFF" />
          <Text style={styles.addMemberButtonText}>Adaugă membri</Text>
        </TouchableOpacity>
        
        {selectedUsers.length > 0 && (
          <View style={styles.selectedUsersContainer}>
            {selectedUsers.map(user => (
              <View key={user.id_user} style={styles.selectedUserItem}>
                <Image 
                  source={{ 
                    uri: user.profile_picture || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png'
                  }} 
                  style={styles.selectedUserAvatar}
                />
                <Text style={styles.selectedUserName} numberOfLines={1}>
                  {user.username}
                </Text>
                <TouchableOpacity 
                  onPress={() => toggleUserSelection(user)}
                  style={styles.removeUserButton}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={[
          styles.button,
          (!name.trim() || selectedUsers.length === 0 || loading) && styles.buttonDisabled
        ]}
        onPress={createChatRoom}
        disabled={!name.trim() || selectedUsers.length === 0 || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Creează conversația</Text>
        )}
      </TouchableOpacity>
      
      {/* Modal pentru selecția membrilor */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selectează membri</Text>
              <TouchableOpacity onPress={toggleModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {loadingConnections ? (
              <ActivityIndicator size="large" color="#007AFF" style={styles.loadingIndicator} />
            ) : connections.length === 0 ? (
              <Text style={styles.noConnectionsText}>Nu ai nicio conexiune încă</Text>
            ) : (
              <FlatList
                data={connections}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id_user}
                contentContainerStyle={styles.usersList}
              />
            )}
            
            <TouchableOpacity
              style={styles.doneButton}
              onPress={toggleModal}
            >
              <Text style={styles.doneButtonText}>Gata ({selectedUsers.length} selectați)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addMemberButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedUsersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  selectedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 8,
    paddingRight: 12,
    margin: 4,
  },
  selectedUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  selectedUserName: {
    fontSize: 14,
    color: '#333',
    maxWidth: 100,
  },
  removeUserButton: {
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    height: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  usersList: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  userFunction: {
    fontSize: 14,
    marginTop: 2,
  },
  checkboxContainer: {
    width: 30,
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingIndicator: {
    marginTop: 20,
  },
  noConnectionsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
}); 