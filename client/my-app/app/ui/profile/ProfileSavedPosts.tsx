import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControlProps
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../../utils/types';
import FullPost from '../postari/FullPost';
import { supabase } from '../../../utils/supabase';
import { toggleLike, toggleSave, handleSend as postActionHandleSend } from '../../../utils/postActions';

//utils
import navigateToProfile from '@/app/utils/Navigation';

interface ProfileSavedPostsProps {
  posts: Post[];
  onPostPress: (post: Post) => void;
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

const ProfileSavedPosts: React.FC<ProfileSavedPostsProps> = ({
  posts,
  onPostPress,
  currentUserId,
  ListHeaderComponent,
  refreshControl
}) => {
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<{[userId: string]: any}>({});
  const [likedPosts, setLikedPosts] = useState<{[postId: number]: boolean}>({});
  const [savedPosts, setSavedPosts] = useState<{[postId: number]: boolean}>({});
  
  // Inițializăm starea savedPosts cu toate postările marcate ca salvate
  useEffect(() => {
    const initialSavedState: {[postId: number]: boolean} = {};
    posts.forEach(post => {
      initialSavedState[post.id_post] = true;
    });
    setSavedPosts(initialSavedState);
  }, [posts]);
  
  // Încărcăm toate datele utilizatorilor într-un singur useEffect
  useEffect(() => {
    const loadAllUserData = async () => {
      if (posts.length === 0) return;
      
      // Extragem toate ID-urile unice de utilizatori din postări
      const uniqueUserIds = [...new Set(posts.map(post => post.id_user))];
      
      // Verificăm dacă avem toate datele utilizatorilor deja încărcate
      const missingUserIds = uniqueUserIds.filter(userId => !users[userId]);
      
      if (missingUserIds.length === 0) return;
      
      try {
        setLoadingUsers(true);
        
        const { data, error } = await supabase
          .from('user')
          .select('*')
          .in('id_user', missingUserIds);
        
        if (error) {
          console.error('Eroare la încărcarea datelor utilizatorilor:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const newUsers = { ...users };
          
          data.forEach(userData => {
            newUsers[userData.id_user] = {
              id: userData.id_user,
              username: userData.username || 'Utilizator necunoscut',
              avatar_url: userData.profile_picture
            };
          });
          
          setUsers(newUsers);
        }
      } catch (error) {
        console.error('Eroare la procesarea datelor utilizatorilor:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    loadAllUserData();
  }, [posts]);
  
  // Funcții pentru acțiunile butoanelor
  const handleLike = async (postId: number) => {
    if (!currentUserId) return;
    
    const isCurrentlyLiked = likedPosts[postId] || false;
    const newLikeState = await toggleLike(postId, currentUserId, isCurrentlyLiked);
    
    setLikedPosts(prev => ({
      ...prev,
      [postId]: newLikeState
    }));
  };
  
  const handleSend = (postId: number) => {
    postActionHandleSend(postId);
  };
  
  const handleSave = async (postId: number) => {
    if (!currentUserId) return;
    
    const isCurrentlySaved = savedPosts[postId] || false;
    const newSaveState = await toggleSave(postId, currentUserId, isCurrentlySaved);
    
    setSavedPosts(prev => ({
      ...prev,
      [postId]: newSaveState
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
  
  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>
        Nu ai salvat nicio postare încă. Salvează postări pentru a le găsi ușor mai târziu.
      </Text>
    </View>
  );
  
  const renderItem = ({ item }: { item: Post }) => {
    // Nu mai încărcăm datele utilizatorului aici, ci folosim doar datele existente
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
        comments={[]} // În lista de posturi salvate, nu afișăm comentarii
        currentUserId={currentUserId}
        onLike={() => handleLike(item.id_post)}
        onSave={() => handleSave(item.id_post)}
        onComment={() => handleComment(item.id_post)}
        onSend={() => handleSend(item.id_post)}
        onOptionsPress={() => handleOptionsPress(item.id_post)}
        onPostPress={() => onPostPress(item)}
        onUserPress={() => navigateToProfile(postUser.id)}
        isLiked={!!likedPosts[item.id_post]}
        isSaved={!!savedPosts[item.id_post]}
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
        keyExtractor={(item) => `saved-post-${item.id_post}`}
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

export default ProfileSavedPosts; 