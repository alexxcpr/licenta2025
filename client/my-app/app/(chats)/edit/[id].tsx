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
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../../../utils/supabase';
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

export default function EditChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useUser();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [connections, setConnections] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [chatMembers, setChatMembers] = useState<User[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Setăm titlul paginii
  useEffect(() => {
    navigation.setOptions({
      title: 'Editează conversația',
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
      },
    });
  }, [navigation]);

  // Încărcăm datele conversației
  useEffect(() => {
    if (!user || !id) return;

    async function loadChatData() {
      try {
        console.log('[Edit] Searching for chat room with ID:', id, 'Type:', typeof id);
        
        // Convertim ID-ul la integer pentru a fi siguri
        const chatRoomId = parseInt(id as string, 10);
        
        if (isNaN(chatRoomId)) {
          console.error('[Edit] ID-ul conversației nu este valid:', id);
          Alert.alert('Eroare', 'ID-ul conversației nu este valid.');
          router.back();
          return;
        }

        console.log('[Edit] Converted chat room ID:', chatRoomId);

        // Obținem detaliile conversației
        const { data: chatData, error: chatError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id_chat_room', chatRoomId);

        console.log('[Edit] Chat room query result:', { chatData, chatError, searchedId: chatRoomId });

        if (chatError) {
          console.error('Eroare la încărcarea datelor conversației:', chatError);
          Alert.alert('Eroare', 'Nu s-au putut încărca datele conversației. Vă rugăm să încercați din nou.');
          router.back();
          return;
        }

        // Verificăm dacă conversația există
        if (!chatData || chatData.length === 0) {
          console.error('[Edit] Conversația nu a fost găsită pentru ID:', chatRoomId);
          Alert.alert('Eroare', 'Conversația nu a fost găsită. Este posibil să fi fost ștearsă.');
          router.back();
          return;
        }

        const chatRoomData = chatData[0];

        // Verificăm dacă utilizatorul este membru al conversației
        const { data: membershipData, error: membershipError } = await supabase
          .from('chat_room_individual')
          .select('id_user')
          .eq('id_chat_room', chatRoomId)
          .eq('id_user', user?.id);

        if (membershipError) {
          console.error('Eroare la verificarea membri:', membershipError);
          Alert.alert('Eroare', 'Nu s-a putut verifica accesul la conversație.');
          router.back();
          return;
        }

        if (!membershipData || membershipData.length === 0) {
          Alert.alert('Acces interzis', 'Nu aveți acces să editați această conversație.');
          router.back();
          return;
        }

        setName(chatRoomData.denumire);
        setDescription(chatRoomData.descriere || '');

        // Obținem membrii actuali ai conversației
        const { data: membersData, error: membersError } = await supabase
          .from('chat_room_individual')
          .select(`
            user (
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
          .eq('id_chat_room', chatRoomId);

        if (membersError) {
          console.error('Eroare la încărcarea membrilor:', membersError);
        } else if (membersData) {
          // Transformăm datele pentru a obține o listă de utilizatori
          const members = membersData
            .map(item => {
              if (!item.user) return null;
              
              const userObj = Array.isArray(item.user) ? item.user[0] : item.user;
              const functiiArray = userObj.functii ? (Array.isArray(userObj.functii) ? userObj.functii : [userObj.functii]).filter(Boolean) : [];

              return {
                id_user: userObj.id_user,
                username: userObj.username || userObj.email,
                email: userObj.email,
                profile_picture: userObj.profile_picture,
                id_functie: userObj.id_functie,
                functie: functiiArray.length > 0 ? {
                  denumire: functiiArray[0].denumire,
                  culoare: '#6633CC'
                } : undefined
              };
            })
            .filter(member => member && user && member.id_user !== user.id); // Excludem utilizatorul curent și valorile null

          setChatMembers(members as User[]);
          setSelectedUsers(members as User[]);
        }
      } catch (error) {
        console.error('Eroare neașteptată:', error);
        Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm să încercați din nou.');
        router.back();
      } finally {
        setInitialLoading(false);
      }
    }

    loadChatData();
  }, [user, id, router]);

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
                denumire,
                culoare
              )
            ),
            user2:user!connection_id_user_2_fkey (
              id_user,
              username,
              email,
              profile_picture,
              id_functie,
              functii (
                denumire,
                culoare
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
              const functiiArray = otherUser.functii ? (Array.isArray(otherUser.functii) ? otherUser.functii : [otherUser.functii]).filter(Boolean) : [];
              const formattedUser: User = {
                id_user: otherUser.id_user || '',
                username: otherUser.username || otherUser.email || 'Utilizator',
                email: otherUser.email || '',
                profile_picture: otherUser.profile_picture,
                id_functie: otherUser.id_functie,
                functie: functiiArray.length > 0 ? {
                  denumire: functiiArray[0].denumire,
                  culoare: '#6633CC'
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

  // Actualizăm conversația
  const updateChat = async () => {
    if (!name.trim() || !user || !id || selectedUsers.length === 0) {
      Alert.alert('Eroare', 'Trebuie să ai cel puțin un membru și să dai un nume conversației.');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Actualizăm detaliile conversației
      const { error: chatRoomError } = await supabase
        .from('chat_rooms')
        .update({
          denumire: name,
          descriere: description,
          date_updated: new Date().toISOString()
        })
        .eq('id_chat_room', id);

      if (chatRoomError) {
        console.error('Eroare la actualizarea conversației:', chatRoomError);
        Alert.alert('Eroare', 'Nu s-a putut actualiza conversația. Vă rugăm să încercați din nou.');
        return;
      }

      // 2. Obținem utilizatorii actuali
      const { data: currentMembersData, error: currentMembersError } = await supabase
        .from('chat_room_individual')
        .select('id_user, id_chat_room_individual')
        .eq('id_chat_room', id);

      if (currentMembersError) {
        console.error('Eroare la obținerea membrilor actuali:', currentMembersError);
        Alert.alert('Eroare', 'Nu s-a putut actualiza lista de membri. Vă rugăm să încercați din nou.');
        return;
      }

      // Identificăm utilizatorii de șters (nu mai sunt în lista de selectați)
      const currentMemberIds = currentMembersData.map(m => m.id_user);
      const selectedUserIds = selectedUsers.map(u => u.id_user).concat(user.id); // Includem și utilizatorul curent
      
      const membersToRemove = currentMembersData.filter(
        m => m.id_user !== user.id && !selectedUserIds.includes(m.id_user)
      );
      
      // Identificăm utilizatorii de adăugat (sunt în lista de selectați dar nu în lista actuală)
      const membersToAdd = selectedUsers.filter(
        u => !currentMemberIds.includes(u.id_user)
      );
      
      // 3. Ștergem membrii care nu mai sunt selectați
      for (const member of membersToRemove) {
        const { error: removeError } = await supabase
          .from('chat_room_individual')
          .delete()
          .eq('id_chat_room_individual', member.id_chat_room_individual);
          
        if (removeError) {
          console.error(`Eroare la ștergerea membrului ${member.id_user}:`, removeError);
        }
      }
      
      // 4. Adăugăm membrii noi
      for (const member of membersToAdd) {
        const { error: addError } = await supabase
          .from('chat_room_individual')
          .insert({
            id_chat_room: parseInt(id as string),
            id_user: member.id_user
          });
          
        if (addError) {
          console.error(`Eroare la adăugarea membrului ${member.username}:`, addError);
        }
      }

      // Navigăm înapoi la conversație
      router.back();
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

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Editează conversația</Text>
      
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
          <Text style={styles.addMemberButtonText}>Adaugă/Șterge membri</Text>
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
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Anulează</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!name.trim() || selectedUsers.length === 0 || loading) && styles.buttonDisabled
          ]}
          onPress={updateChat}
          disabled={!name.trim() || selectedUsers.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Salvează</Text>
          )}
        </TouchableOpacity>
      </View>
      
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
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