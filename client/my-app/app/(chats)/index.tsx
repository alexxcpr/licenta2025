import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../../utils/supabase';
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
  membri?: {
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

    // Funcția pentru a încărca camerele de chat
    async function loadChatRooms() {
      try {
        if (!user) return;
        
        // Obținem doar chat-urile în care utilizatorul curent este membru
        const { data, error } = await supabase
          .from('chat_room_individual')
          .select(`
            id_chat_room,
            chat_rooms!inner (
              id_chat_room,
              denumire,
              descriere,
              date_created,
              date_updated
            )
          `)
          .eq('id_user', user.id)
          .order('date_updated', { foreignTable: 'chat_rooms', ascending: false });

        if (error) {
          console.error('Eroare la încărcarea chat-urilor:', error);
          return;
        }

        if (data) {
          // Pentru fiecare chat, obținem ultimul mesaj și membrii
          const chatRoomsWithDetails = await Promise.all(
            data.map(async (item) => {
              const chatRoom = Array.isArray(item.chat_rooms) ? item.chat_rooms[0] : item.chat_rooms;
              
              // Obținem ultimul mesaj
              const { data: lastMessageData } = await supabase
                .from('messages')
                .select('denumire, date_created')
                .eq('id_chat_room', chatRoom.id_chat_room)
                .order('date_created', { ascending: false })
                .limit(1)
                .single();

              // Obținem toți membrii chat-ului
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
                .eq('id_chat_room', chatRoom.id_chat_room);
              
              let membri: any[] = [];
              if (!membersError && membersData) {
                membri = membersData.map(memberItem => {
                  const userObj = Array.isArray(memberItem.user) ? memberItem.user[0] : memberItem.user;
                  return {
                    id_user: userObj.id_user,
                    username: userObj.username || userObj.email,
                    email: userObj.email,
                    profile_picture: userObj.profile_picture
                  };
                });
              }
              
              return {
                id_chat_room: chatRoom.id_chat_room,
                denumire: chatRoom.denumire,
                descriere: chatRoom.descriere,
                date_created: chatRoom.date_created,
                date_updated: chatRoom.date_updated,
                last_message: lastMessageData ? {
                  denumire: lastMessageData.denumire,
                  date_created: lastMessageData.date_created
                } : null,
                membri
              };
            })
          );
          
          setChatRooms(chatRoomsWithDetails);
        }
      } catch (error) {
        console.error('Eroare neașteptată:', error);
      } finally {
        setLoading(false);
      }
    }

    loadChatRooms();

    // Folosim un interval simplu pentru a reîmprospăta datele periodic
    // în loc de Realtime pentru a evita problemele cu WebSocket
    const refreshInterval = setInterval(() => {
      loadChatRooms();
    }, 5000); // Reîmprospătăm la fiecare 5 secunde

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
    if (chatRoom.membri && chatRoom.membri.length === 2 && user) {
      const otherUser = chatRoom.membri.find(membru => membru.id_user !== user.id);
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