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
import { getApiUrl } from '../../../config/backend';

// Definim tipurile pentru un mesaj
interface Message {
  id_message: number;
  id_chat_room: number;
  denumire: string;
  descriere?: string | null;
  date_created: string;
  date_updated: string;
  id_sender?: string; // ID-ul expeditorului
  sender?: {
    id_user: string;
    username: string;
    profile_picture?: string;
    functie?: {
      denumire: string;
    }
  };
  sender_info?: {
    username: string;
    email: string;
    profile_picture?: string;
    functie?: {
      denumire: string;
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

  // Încărcăm utilizatorul curent folosind API-ul în loc de Supabase direct
  useEffect(() => {
    if (!clerkUser?.id) return;

    async function loadCurrentUser() {
      try {
        if (!clerkUser?.id) return;
        
        const response = await fetch(getApiUrl(`/users/profile/${clerkUser.id}`), {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          console.error('Eroare la încărcarea utilizatorului:', response.status);
          return;
        }

        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
          setCurrentUser({
            ...data.data,
            functie: data.data.functie ? {
              denumire: data.data.functie.denumire
            } : undefined
          });
        }
      } catch (error) {
        console.error('Eroare neașteptată la încărcarea utilizatorului:', error);
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
      
      // Folosim API-ul pentru ștergerea conversației
      // Deoarece fetch nu poate trimite body direct cu DELETE în unele browsere,
      // folosim query parameter pentru userId pentru compatibilitate maximă
      const response = await fetch(getApiUrl(`/conversations/${chatRoomId}?userId=${clerkUser.id}`), {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`HTTP Error: ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Eroare la ștergerea conversației');
      }
      
      // Folosim o singură comandă de navigare pentru a evita buclele infinite
      router.replace('/(chats)');
      
    } catch (error) {
      console.error('Eroare la ștergerea conversației:', error);
      Alert.alert('Eroare', 'Nu s-a putut șterge conversația. Vă rugăm să încercați din nou.');
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

  // Înlocuim logica de încărcare a conversației cu server-side rendering
  useEffect(() => {
    if (!id) return;

    async function loadChatRoomAndMessages() {
      try {        
        const chatRoomId = parseInt(id as string, 10);
        
        if (isNaN(chatRoomId)) {
          console.error('ID-ul conversației nu este valid:', id);
          Alert.alert('Eroare', 'ID-ul conversației nu este valid.');
          router.replace('/(chats)/index' as any);
          return;
        }

        // Folosim API-ul pentru a obține toate datele conversației
        const response = await fetch(getApiUrl(`/conversations/${chatRoomId}`), {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            Alert.alert('Eroare', 'Conversația nu a fost găsită. Este posibil să fi fost ștearsă.');
            router.replace('/(chats)/index' as any);
            return;
          }
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status !== 'success') {
          throw new Error(data.message || 'Eroare la încărcarea conversației');
        }

        const conversationData = data.data;
        
        // Verificăm dacă utilizatorul este membru al conversației
        const isUserMember = conversationData.participants.some((p: any) => p.id_user === clerkUser?.id);
        
        if (!isUserMember) {
          Alert.alert('Acces interzis', 'Nu aveți acces la această conversație.');
          router.replace('/(chats)/index' as any);
          return;
        }

        // Setăm datele conversației
        setChatRoom({
          ...conversationData.chatRoom,
          membri: conversationData.participants
        });

        // Procesăm mesajele pentru a avea structura corectă
        const processedMessages = conversationData.messages.map((message: any) => {
          console.log("Message from server:", message);
          console.log("Sender from server:", message.sender);
          console.log("Functie din sender:", message.sender?.functie);
          
          return {
            ...message,
            sender_info: message.sender ? {
              username: message.sender.username,
              email: message.sender.email || '',
              profile_picture: message.sender.profile_picture,
              functie: message.sender.functie || { denumire: 'Utilizator' }
            } : undefined
          };
        });

        setMessages(processedMessages);
        
        // Scroll la ultimul mesaj
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);

      } catch (error) {
        console.error('Eroare la încărcarea conversației:', error);
        Alert.alert('Eroare', 'A apărut o eroare la încărcarea conversației. Vă rugăm să încercați din nou.');
        router.replace('/(chats)/index' as any);
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
    
    console.log('Sender info:', item.sender_info);
    console.log('Sender function:', senderFunction);
    
    console.log('Sender info:', item.sender_info);
    console.log('Sender function:', senderFunction);
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <View style={styles.senderInfoContainer}>
            <Text style={styles.senderName}>{senderName}</Text>
            {senderFunction && (
              <Text style={[styles.senderFunction, { color: '#6633CC' }]}>
                {senderFunction.denumire || "Funcție"}
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

  // Funcție pentru a trimite un mesaj nou - o vom actualiza să folosească API-ul
  const sendMessage = async () => {
    if (!newMessage.trim() || !clerkUser || !id || !currentUser) return;

    try {
      const response = await fetch(getApiUrl(`/conversations/${id}/messages`), {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_sender: clerkUser.id,
          denumire: newMessage,
          descriere: `Mesaj de la ${currentUser.username || currentUser.email}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setNewMessage('');
        // Mesajul va fi încărcat automat prin refresh-ul periodic
      } else {
        throw new Error(data.message || 'Eroare la trimiterea mesajului');
      }
    } catch (error) {
      console.error('Eroare la trimiterea mesajului:', error);
      Alert.alert('Eroare', 'Nu s-a putut trimite mesajul. Vă rugăm să încercați din nou.');
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