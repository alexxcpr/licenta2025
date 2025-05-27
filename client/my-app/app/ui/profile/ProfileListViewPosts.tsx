import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  RefreshControlProps
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../../utils/types';
import FullPost from '../postari/FullPost';
import { supabase } from '../../../utils/supabase';

interface ProfileListViewPostsProps {
  posts: Post[];
  onPostPress: (post: Post) => void;
  isOwnProfile: boolean;
  currentUserId?: string;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

// Interfață pentru datele de post adaptate pentru FullPost
interface PostData {
  id_post: number;
  content: string;
  image_url: string;
  id_user: string;
  is_published: boolean;
  date_created: string;
  date_updated: string;
}

const ProfileListViewPosts: React.FC<ProfileListViewPostsProps> = ({
  posts,
  onPostPress,
  isOwnProfile,
  currentUserId,
  ListHeaderComponent,
  refreshControl
}) => {
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<{[userId: string]: any}>({});
  const [likedPosts, setLikedPosts] = useState<{[postId: number]: boolean}>({});
  const [savedPosts, setSavedPosts] = useState<{[postId: number]: boolean}>({});
  const [loadedUserIds, setLoadedUserIds] = useState<string[]>([]);
  
  // Funcția pentru încărcarea informațiilor utilizatorilor
  const loadUserData = async (userId: string) => {
    if (loadedUserIds.includes(userId)) return;
    
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('id_user', userId)
        .single();
      
      if (error) {
        console.error('Eroare la încărcarea datelor utilizatorului:', error);
        return;
      }
      
      if (data) {
        setUsers(prev => ({
          ...prev,
          [userId]: {
            id: data.id_user,
            username: data.username || 'Utilizator necunoscut',
            avatar_url: data.profile_picture
          }
        }));
        
        setLoadedUserIds(prev => [...prev, userId]);
      }
    } catch (error) {
      console.error('Eroare la procesarea datelor utilizatorului:', error);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // Funcții pentru acțiunile butoanelor
  const handleLike = (postId: number) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };
  
  const handleSend = (postId: number) => {
    console.log('Buton send apăsat pentru postarea', postId);
  };
  
  const handleSave = (postId: number) => {
    setSavedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };
  
  // Funcție pentru gestionarea comentariilor
  const handleComment = (postId: number) => {
    const post = posts.find(p => p.id_post === postId);
    if (post) {
      onPostPress(post);
    }
  };
  
  // Funcție pentru deschiderea meniului de opțiuni
  const handleOptionsPress = (postId: number) => {
    console.log('Opțiuni pentru postarea', postId);
  };
  
  // Funcție pentru navigarea la profilul unui utilizator
  const handleUserPress = (userId: string) => {
    console.log('Navigare la profilul utilizatorului', userId);
  };
  
  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="list-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>
        {isOwnProfile 
          ? "Nu ai postat nimic încă. Începe să postezi pentru a-ți crește rețeaua!" 
          : "Acest utilizator nu a postat nimic încă."}
      </Text>
    </View>
  );
  
  const renderItem = ({ item }: { item: Post }) => {
    // Încărcăm datele utilizatorului dacă nu au fost încărcate deja
    if (!users[item.id_user]) {
      loadUserData(item.id_user);
    }
    
    const postUser = users[item.id_user] || {
      id: item.id_user,
      username: 'Utilizator necunoscut',
      avatar_url: undefined
    };
    
    // Adaptăm postarea pentru FullPost, asigurându-ne că image_url nu este null
    const adaptedPost: PostData = {
      ...item,
      image_url: item.image_url || ''
    };
    
    return (
      <FullPost
        post={adaptedPost}
        postUser={postUser}
        comments={[]} // În lista de posturi, nu afișăm comentarii
        currentUserId={currentUserId}
        onLike={handleLike}
        onSave={handleSave}
        onComment={handleComment}
        onSend={handleSend}
        onOptionsPress={handleOptionsPress}
        onPostPress={() => onPostPress(item)}
        onUserPress={handleUserPress}
        // isLiked={!!likedPosts[item.id_post]}
        // isSaved={!!savedPosts[item.id_post]}
      />
    );
  };
  
  return (
    <View style={styles.container}>
      {loadingUsers && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
      
      <FlatList
        data={posts}
        keyExtractor={(item) => `post-list-${item.id_post}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={refreshControl}
        ListEmptyComponent={posts.length === 0 ? ListEmptyComponent : null}
        contentContainerStyle={posts.length === 0 && !ListHeaderComponent ? styles.emptyFlatListWithNoHeader : {}}
        ListFooterComponent={<View style={{ height: 80 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 5,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  emptyFlatListWithNoHeader: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default ProfileListViewPosts; 