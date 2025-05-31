import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../../utils/supabase';

// Definim tipurile pentru un mesaj
interface Message {
  id_message: number;
  id_chat_room: number;
  denumire: string;
  descriere?: string | null;
  date_created: string;
  date_updated: string;
  id_sender?: string; // ID-ul expeditorului
  sender_info?: {
    username: string;
    email: string;
    profile_picture?: string;
    functie?: {
      denumire: string;
      culoare: string;
    }
  };
}

// Definim tipul pentru camera de chat
interface ChatRoom {
  id_chat_room: number;
  denumire: string;
  descriere: string | null;
  date_created: string;
  date_updated: string;
  membri?: {
    id_user: string;
    username: string;
    email: string;
    profile_picture?: string;
  }[];
}

// Definim tipul pentru utilizator din baza de date Supabase
interface SupabaseUser {
  id_user: string;
  username: string;
  email: string;
  profile_picture?: string;
  bio?: string;
  date_created: string;
  date_updated: string;
  id_domeniu?: number;
  id_functie?: number;
  id_ocupatie?: number;
  functie?: {
    denumire: string;
    culoare: string;
  }
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { user: clerkUser } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Încărcăm utilizatorul curent din Supabase
  useEffect(() => {
    if (!clerkUser) return;

    async function loadCurrentUser() {
      try {
        const { data, error } = await supabase
          .from('user')
          .select(`
            *,
            functii (
              denumire
            )
          `)
          .eq('id_user', clerkUser?.id)
          .single();

        if (error) {
          console.error('Eroare la încărcarea utilizatorului:', error);
          return;
        }

        if (data) {
          const functiiArray = Array.isArray(data.functii) ? data.functii : [data.functii].filter(Boolean);
          setCurrentUser({
            ...data,
            functie: functiiArray.length > 0 ? {
              denumire: functiiArray[0].denumire,
              culoare: '#6633CC'
            } : undefined
          });
        }
      } catch (error) {
        console.error('Eroare neașteptată:', error);
      }
    }

    loadCurrentUser();
  }, [clerkUser]);

  // Obținem numele de afișare pentru o cameră de chat
  const getChatName = (chatRoom: ChatRoom) => {
    // Dacă chat-ul are doar doi membri (1 vs 1), afișăm numele celuilalt utilizator
    if (chatRoom.membri && chatRoom.membri.length === 2 && clerkUser) {
      const otherUser = chatRoom.membri.find(membru => membru.id_user !== clerkUser.id);
      if (otherUser) {
        return otherUser.username || otherUser.email || 'Utilizator';
      }
    }
    
    // Pentru chat-uri de grup sau alte situații, arătăm numele implicit al chat-ului
    return chatRoom.denumire;
  };

  // Funcție pentru editarea conversației
  const handleEditChat = useCallback(() => {
    if (chatRoom) {
      router.push(`/(chats)/edit/${chatRoom.id_chat_room}` as any);
    }
  }, [chatRoom, router]);

  // Funcție pentru ștergerea conversației
  const handleDeleteChat = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  // Funcția care face ștergerea propriu-zisă
  const confirmDeleteChat = async () => {
    if (!id || !clerkUser) return;
    
    try {
      setLoading(true);
      setShowDeleteModal(false);
      
      // Convertim ID-ul la integer pentru a fi siguri
      const chatRoomId = parseInt(id as string, 10);
      
      // 1. Ștergem întâi toate înregistrările din chat_room_individual
      const { error: membersError } = await supabase
        .from('chat_room_individual')
        .delete()
        .eq('id_chat_room', chatRoomId);
      
      if (membersError) {
        console.error('Eroare la ștergerea membrilor:', membersError);
        Alert.alert('Eroare', 'Nu s-a putut șterge conversația. Vă rugăm să încercați din nou.');
        return;
      }
      
      // 2. Ștergem toate mesajele
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('id_chat_room', chatRoomId);
      
      if (messagesError) {
        console.error('Eroare la ștergerea mesajelor:', messagesError);
        Alert.alert('Eroare', 'Nu s-a putut șterge conversația. Vă rugăm să încercați din nou.');
        return;
      }
      
      // 3. Ștergem camera de chat
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id_chat_room', chatRoomId);
      
      if (roomError) {
        console.error('Eroare la ștergerea camerei de chat:', roomError);
        Alert.alert('Eroare', 'Nu s-a putut șterge conversația. Vă rugăm să încercați din nou.');
        return;
      }
      
      // Navigăm înapoi la lista de conversații
      router.push('/(chats)' as any);
    } catch (error) {
      console.error('Eroare neașteptată:', error);
      Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm să încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  // Setăm titlul camerei de chat și adăugăm butoane de acțiune
  useEffect(() => {
    if (chatRoom) {
      // Setăm titlul
      navigation.setOptions({
        title: getChatName(chatRoom),
        headerRight: () => (
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity 
              style={{ marginRight: 15 }}
              onPress={handleEditChat}
            >
              <Ionicons name="create-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDeleteChat}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [chatRoom, navigation, handleEditChat, handleDeleteChat]);

  // Încărcăm detaliile camerei de chat și mesajele
  useEffect(() => {
    if (!id) return;

    async function loadChatRoomAndMessages() {
      try {        
        // Convertim ID-ul la integer pentru a fi siguri
        const chatRoomId = parseInt(id as string, 10);
        
        if (isNaN(chatRoomId)) {
          console.error('ID-ul conversației nu este valid:', id);
          Alert.alert('Eroare', 'ID-ul conversației nu este valid.');
          router.push('/(chats)' as any);
          return;
        }
        // Încărcăm detaliile camerei de chat
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id_chat_room', chatRoomId);

        console.log('Chat room query result:', { roomData, roomError, searchedId: chatRoomId });

        if (roomError) {
          console.error('Eroare la încărcarea detaliilor camerei de chat:', roomError);
          Alert.alert('Eroare', 'Nu s-a putut încărca conversația. Vă rugăm să încercați din nou.');
          router.push('/(chats)' as any);
          return;
        }

        // Verificăm dacă conversația există
        if (!roomData || roomData.length === 0) {
          console.error('Conversația nu a fost găsită pentru ID:', chatRoomId);
          
          // Să verificăm ce conversații există în baza de date
          const { data: allChats } = await supabase
            .from('chat_rooms')
            .select('id_chat_room, denumire');
          console.log('Toate conversațiile din baza de date:', allChats);
          
          Alert.alert('Eroare', 'Conversația nu a fost găsită. Este posibil să fi fost ștearsă.');
          router.push('/(chats)' as any);
          return;
        }

        const chatRoomData = roomData[0];
        console.log('Found chat room:', chatRoomData);

        // Verificăm dacă utilizatorul este membru al conversației
        const { data: membershipData, error: membershipError } = await supabase
          .from('chat_room_individual')
          .select('id_user')
          .eq('id_chat_room', chatRoomId)
          .eq('id_user', clerkUser?.id);

        console.log('Membership check:', { membershipData, membershipError, userId: clerkUser?.id, chatRoomId });

        if (membershipError) {
          console.error('Eroare la verificarea membri:', membershipError);
          Alert.alert('Eroare', 'Nu s-a putut verifica accesul la conversație.');
          router.push('/(chats)' as any);
          return;
        }

        if (!membershipData || membershipData.length === 0) {
          console.log('User is not a member of this chat');
          Alert.alert('Acces interzis', 'Nu aveți acces la această conversație.');
          router.push('/(chats)' as any);
          return;
        }

        // Obținem și membrii chat-ului
        const { data: membersData, error: membersError } = await supabase
          .from('chat_room_individual')
          .select(`
            user (
              id_user,
              username,
              email,
              profile_picture
            )
          `)
          .eq('id_chat_room', chatRoomData.id_chat_room);
        
        if (!membersError && membersData) {
          const membri = membersData.map(item => {
            const userObj = Array.isArray(item.user) ? item.user[0] : item.user;
            return {
              id_user: userObj.id_user,
              username: userObj.username,
              email: userObj.email,
              profile_picture: userObj.profile_picture
            };
          });
          setChatRoom({
            ...chatRoomData,
            membri
          });
        } else {
          setChatRoom(chatRoomData);
        }

        // Încărcăm mesajele și informațiile despre expeditori
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('id_chat_room', chatRoomId)
          .order('date_created', { ascending: true });

        if (messagesError) {
          console.error('Eroare la încărcarea mesajelor:', messagesError);
          return;
        }

        if (messagesData) {
          // Pentru fiecare mesaj, obținem informații despre expeditor
          const messagesWithSenderInfo = await Promise.all(
            messagesData.map(async (message) => {
              if (message.id_sender) {
                const { data: senderData, error: senderError } = await supabase
                  .from('user')
                  .select(`
                    username,
                    email,
                    profile_picture,
                    functii (
                      denumire
                    )
                  `)
                  .eq('id_user', message.id_sender)
                  .single();
                
                if (!senderError && senderData) {
                  const functiiArray = Array.isArray(senderData.functii) ? senderData.functii : [senderData.functii].filter(Boolean);
                  return {
                    ...message,
                    sender_info: {
                      username: senderData.username || senderData.email,
                      email: senderData.email,
                      profile_picture: senderData.profile_picture,
                      functie: functiiArray.length > 0 ? {
                        denumire: functiiArray[0].denumire,
                        culoare: '#6633CC'
                      } : undefined
                    }
                  };
                }
              }
              
              return message;
            })
          );
          
          setMessages(messagesWithSenderInfo);
          
          // Scroll la ultimul mesaj
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }
      } catch (error) {
        console.error('Eroare neașteptată:', error);
        Alert.alert('Eroare', 'A apărut o eroare neașteptată. Vă rugăm să încercați din nou.');
        router.push('/(chats)' as any);
      } finally {
        setLoading(false);
      }
    }

    loadChatRoomAndMessages();

    // Reactivez refresh-ul automat pentru mesaje în timp real
    const refreshInterval = setInterval(() => {
      loadChatRoomAndMessages();
    }, 3000); // Reîmprospătăm la fiecare 3 secunde

    return () => {
      clearInterval(refreshInterval);
    };
  }, [id, clerkUser?.id]);

  // Verificăm dacă mesajul a fost trimis de utilizatorul curent
  const isCurrentUser = (message: Message) => {
    if (!clerkUser) return false;
    return message.id_sender === clerkUser.id;
  };

  // Renderăm un mesaj
  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = isCurrentUser(item);
    
    // Obținem informațiile despre expeditor
    const senderName = item.sender_info?.username || 'Utilizator';
    const senderFunction = item.sender_info?.functie;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <View style={styles.senderInfoContainer}>
            <Text style={styles.senderName}>{senderName}</Text>
            {senderFunction && (
              <Text style={[styles.senderFunction, { color: senderFunction.culoare }]}>
                {senderFunction.denumire}
              </Text>
            )}
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText, 
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>{item.denumire}</Text>
          <Text style={styles.messageTime}>{formatMessageDate(item.date_created)}</Text>
        </View>
      </View>
    );
  };

  // Funcție pentru a trimite un mesaj nou
  const sendMessage = async () => {
    if (!newMessage.trim() || !clerkUser || !id || !currentUser) return;

    try {
      // Adăugăm id_sender ca un câmp distinct
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            id_chat_room: parseInt(id as string),
            denumire: newMessage,
            descriere: `Mesaj de la ${currentUser.username || currentUser.email}`,
            id_sender: clerkUser.id // Adăugăm explicit ID-ul expeditorului
          },
        ])
        .select();

      if (error) {
        console.error('Eroare la trimiterea mesajului:', error);
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Eroare neașteptată:', error);
    }
  };

  // Formatăm data pentru afișare
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id_message.toString()}
        contentContainerStyle={styles.messagesList}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Scrie un mesaj..."
          placeholderTextColor="#888"
          multiline
        />
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={sendMessage}
          disabled={!newMessage.trim() || !currentUser}
        >
          <Ionicons 
            name="send" 
            size={24} 
            color={newMessage.trim() && currentUser ? "#007AFF" : "#999"}
          />
        </TouchableOpacity>
      </View>

      {/* Modal de confirmare pentru ștergere */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={32} color="#FF3B30" />
            </View>
            
            <Text style={styles.modalTitle}>Șterge conversația</Text>
            <Text style={styles.modalMessage}>
              Ești sigur că vrei să ștergi această conversație? Toate mesajele vor fi șterse permanent și această acțiune nu poate fi anulată.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Anulează</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={confirmDeleteChat}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalDeleteButtonText}>Șterge</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  senderInfoContainer: {
    marginBottom: 2,
    marginLeft: 10,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  senderFunction: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 5,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    marginBottom: 16,
    backgroundColor: '#FFE5E5',
    padding: 16,
    borderRadius: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalDeleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  modalDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
}); 