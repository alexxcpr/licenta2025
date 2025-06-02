import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { getApiUrl } from '../../config/backend';
import BottomNavigation from '../ui/navigation/BottomNavigation';
import { Ionicons } from '@expo/vector-icons';

// Definim tipul pentru o cameră de chat
interface ChatRoom {
  id_chat_room: number;
  denumire: string;
  descriere: string | null;
  date_created: string;
  date_updated: string;
  last_message?: {
    denumire: string;
    date_created: string;
  } | null;
  // Adăugăm utilizatorii pentru a determina numele chat-ului
  participants?: {
    id_user: string;
    username: string;
    email: string;
    profile_picture?: string;
  }[];
}

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Funcția pentru a încărca camerele de chat prin API
    async function loadChatRooms() {
      try {
        if (!user) return;
        
        console.log('Încărcare conversații pentru utilizatorul:', user.id);
        
        const response = await fetch(getApiUrl(`/conversations?userId=${user.id}`), {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          console.error(`Eroare HTTP: ${response.status} - ${response.statusText}`);
          return;
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          // Mapăm datele pentru a fi compatibile cu interfața existentă
          const mappedChatRooms = data.data.map((conversation: any) => ({
            id_chat_room: conversation.id_chat_room,
            denumire: conversation.denumire,
            descriere: conversation.descriere,
            date_created: conversation.date_updated, // Folosim date_updated ca fallback
            date_updated: conversation.date_updated,
            last_message: conversation.lastMessage ? {
              denumire: conversation.lastMessage.denumire,
              date_created: conversation.lastMessage.date_created
            } : null,
            participants: conversation.participants || []
          }));
          
          setChatRooms(mappedChatRooms);
          console.log(`Încărcate ${mappedChatRooms.length} conversații`);
        } else {
          console.error('API a returnat eroare:', data.message);
        }
      } catch (error) {
        console.error('Eroare la încărcarea conversațiilor:', error);
      } finally {
        setLoading(false);
      }
    }

    loadChatRooms();

    // Folosim un interval simplu pentru a reîmprospăta datele periodic
    // în loc de Realtime pentru a evita problemele cu WebSocket
    const refreshInterval = setInterval(() => {
      loadChatRooms();
    }, 2000); // Reîmprospătăm la fiecare 5 secunde

    return () => {
      clearInterval(refreshInterval);
    };
  }, [user]);

  // Formatăm data pentru a afișa cât timp a trecut
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Acum';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} z`;
    
    return date.toLocaleDateString('ro-RO');
  };

  // Obținem numele de afișare pentru o cameră de chat
  const getChatName = (chatRoom: ChatRoom) => {
    // Dacă chat-ul are doar doi membri (1 vs 1), afișăm numele celuilalt utilizator
    if (chatRoom.participants && chatRoom.participants.length === 2 && user) {
      const otherUser = chatRoom.participants.find(participant => participant.id_user !== user.id);
      if (otherUser) {
        return otherUser.username || otherUser.email || 'Utilizator';
      }
    }
    
    // Pentru chat-uri de grup sau alte situații, arătăm numele implicit al chat-ului
    return chatRoom.denumire;
  };

  // Navigăm către o cameră de chat specifică
  const navigateToChatRoom = (id: number) => {
    router.push(`/(chats)/${id}` as any);
  };

  // Navigăm către pagina de creare a unui nou chat
  const navigateToCreateChat = () => {
    router.push('/(chats)/create' as any);
  };

  // Renderăm un element de cameră de chat
  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const lastMessageDate = item.last_message?.date_created || item.date_updated;
    const chatDisplayName = getChatName(item);
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigateToChatRoom(item.id_chat_room)}
      >
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{chatDisplayName}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message?.denumire || 'Conversație nouă'}
          </Text>
        </View>
        <View style={styles.chatMeta}>
          <Text style={styles.timestamp}>{formatDate(lastMessageDate)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {chatRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nu ai nicio conversație încă</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={navigateToCreateChat}
          >
            <Text style={styles.createButtonText}>Creează o conversație</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={chatRooms}
            renderItem={renderChatRoom}
            keyExtractor={(item) => item.id_chat_room.toString()}
            contentContainerStyle={styles.listContainer}
          />
          <TouchableOpacity 
            style={styles.floatingButton}
            onPress={navigateToCreateChat}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}
      <BottomNavigation activePage="chats" />
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 80,
  },
  chatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 1,
  },
  chatInfo: {
    flex: 1,
    marginRight: 10,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  chatMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
}); 