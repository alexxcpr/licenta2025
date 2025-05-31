import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../../../utils/supabase';
import ExploreFeedPost from './ExploreFeedPost';
import PostDetailOpener from '../../../components/PostDetailOpener';

// Interfețe pentru datele postării și utilizatorului
interface PostData {
  id_post: number;
  content: string;
  image_url: string;
  id_user: string;
  is_published: boolean;
  date_created: string;
  date_updated: string;
}

interface UserData {
  id: string;
  username: string;
  avatar_url?: string;
}

interface EnrichedPostData extends PostData {
  user: UserData;
}

interface ExploreFeedProps {
  currentUserId: string;
}

export default function ExploreFeed({ currentUserId }: ExploreFeedProps) {
  const [posts, setPosts] = useState<EnrichedPostData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State pentru like și saved pentru fiecare postare
  const [likedPosts, setLikedPosts] = useState<{[postId: number]: boolean}>({});
  const [savedPosts, setSavedPosts] = useState<{[postId: number]: boolean}>({});

  // Funcție pentru obținerea postărilor aleatorii (inclusiv ale conexiunilor)
  const fetchRandomPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Obținem postări publicate, exclusiv cele ale utilizatorului curent
      const { data: postsData, error: postsError } = await supabase
        .from('post')
        .select('*')
        .eq('is_published', true)
        .neq('id_user', currentUserId)
        .order('date_created', { ascending: false })
        .limit(50); // Luăm mai multe pentru a avea varietate

      if (postsError) {
        console.error('Eroare la obținerea postărilor:', postsError);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Amestecăm postările pentru ordine aleatorie
      const shuffledPosts = [...postsData].sort(() => Math.random() - 0.5);

      // Luăm doar primele 15 postări pentru a nu încărca prea mult ecranul
      const limitedPosts = shuffledPosts.slice(0, 15);

      // Obținem utilizatorii unici din postări
      const userIds = [...new Set(limitedPosts.map(post => post.id_user))];
      
      const { data: usersData, error: usersError } = await supabase
        .from('user')
        .select('id_user, username, profile_picture')
        .in('id_user', userIds);

      if (usersError) {
        console.error('Eroare la obținerea utilizatorilor:', usersError);
        return;
      }

      // Creăm un map pentru utilizatori
      const usersMap: { [userId: string]: UserData } = {};
      usersData?.forEach(user => {
        usersMap[user.id_user] = {
          id: user.id_user,
          username: user.username || 'Utilizator necunoscut',
          avatar_url: user.profile_picture || undefined
        };
      });

      // Îmbogățim postările cu datele utilizatorilor
      const enrichedPosts: EnrichedPostData[] = limitedPosts.map(post => ({
        ...post,
        user: usersMap[post.id_user] || {
          id: post.id_user,
          username: 'Utilizator necunoscut'
        }
      }));

      setPosts(enrichedPosts);

      // Încărcăm starea de like și saved pentru postările afișate
      await loadLikesAndSavedStatus(limitedPosts.map(p => p.id_post));

    } catch (error) {
      console.error('Eroare la încărcarea postărilor din feed:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Funcție pentru încărcarea stării de like și saved din baza de date
  const loadLikesAndSavedStatus = async (postIds: number[]) => {
    if (!currentUserId || postIds.length === 0) return;

    try {
      // Încărcăm like-urile
      const { data: likesData } = await supabase
        .from('like')
        .select('id_post')
        .eq('id_user', currentUserId)
        .in('id_post', postIds);

      // Încărcăm postările salvate
      const { data: savedData } = await supabase
        .from('saved_post')
        .select('id_post')
        .eq('id_user', currentUserId)
        .in('id_post', postIds);

      // Actualizăm state-ul local
      const likedPostsMap: { [postId: number]: boolean } = {};
      const savedPostsMap: { [postId: number]: boolean } = {};

      likesData?.forEach(like => {
        likedPostsMap[like.id_post] = true;
      });

      savedData?.forEach(saved => {
        savedPostsMap[saved.id_post] = true;
      });

      setLikedPosts(prev => ({ ...prev, ...likedPostsMap }));
      setSavedPosts(prev => ({ ...prev, ...savedPostsMap }));

    } catch (error) {
      console.error('Eroare la încărcarea stării like/saved:', error);
    }
  };

  useEffect(() => {
    fetchRandomPosts();
  }, [fetchRandomPosts]);

  // Funcție pentru like la o postare - salvează în baza de date
  const handleLike = async (postId: number) => {
    if (!currentUserId) return;

    const isCurrentlyLiked = likedPosts[postId] || false;
    
    try {
      if (isCurrentlyLiked) {
        // Eliminăm like-ul din baza de date
        const { error } = await supabase
          .from('like')
          .delete()
          .eq('id_post', postId)
          .eq('id_user', currentUserId);

        if (error) {
          console.error('Eroare la eliminarea like-ului:', error);
          return;
        }
      } else {
        // Adăugăm like în baza de date
        const { error } = await supabase
          .from('like')
          .insert({
            id_post: postId,
            id_user: currentUserId,
            date_created: new Date().toISOString(),
            date_updated: new Date().toISOString()
          });

        if (error) {
          console.error('Eroare la adăugarea like-ului:', error);
          return;
        }
      }

      // Actualizăm state-ul local doar dacă operația din DB a fost cu succes
      setLikedPosts(prev => ({
        ...prev,
        [postId]: !isCurrentlyLiked
      }));

    } catch (error) {
      console.error('Eroare la gestionarea like-ului:', error);
    }
  };

  // Funcție pentru salvarea unei postări - salvează în baza de date
  const handleSave = async (postId: number) => {
    if (!currentUserId) return;

    const isCurrentlySaved = savedPosts[postId] || false;
    
    try {
      if (isCurrentlySaved) {
        // Eliminăm postarea salvată din baza de date
        const { error } = await supabase
          .from('saved_post')
          .delete()
          .eq('id_post', postId)
          .eq('id_user', currentUserId);

        if (error) {
          console.error('Eroare la eliminarea postării salvate:', error);
          return;
        }

        Alert.alert('Postare nesalvată', 'Postarea a fost eliminată din favorite');
      } else {
        // Adăugăm postarea în lista de salvate
        const { error } = await supabase
          .from('saved_post')
          .insert({
            id_post: postId,
            id_user: currentUserId,
            saved_at: new Date().toISOString()
          });

        if (error) {
          console.error('Eroare la salvarea postării:', error);
          return;
        }

        Alert.alert('Postare salvată', 'Postarea a fost adăugată la favorite');
      }

      // Actualizăm state-ul local doar dacă operația din DB a fost cu succes
      setSavedPosts(prev => ({
        ...prev,
        [postId]: !isCurrentlySaved
      }));

    } catch (error) {
      console.error('Eroare la gestionarea salvării:', error);
    }
  };

  // Funcție pentru share
  const handleShare = (postId: number) => {
    Alert.alert('Distribuire', 'Funcționalitatea de distribuire va fi implementată în curând.');
  };

  const renderPostItem = ({ item }: { item: EnrichedPostData }) => (
    <PostDetailOpener currentUserId={currentUserId}>
      {(openPostDetail) => (
        <ExploreFeedPost
          post={item}
          postUser={item.user}
          isLiked={likedPosts[item.id_post] || false}
          isSaved={savedPosts[item.id_post] || false}
          onLike={() => handleLike(item.id_post)}
          onComment={() => openPostDetail(item, item.user)}
          onShare={() => handleShare(item.id_post)}
          onSave={() => handleSave(item.id_post)}
          onPostPress={() => openPostDetail(item, item.user)}
          onUserPress={() => {
            // Navigarea la profil se face în componenta ExploreFeedPost
          }}
        />
      )}
    </PostDetailOpener>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Se încarcă postările...</Text>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nu există postări disponibile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Postări recomandate</Text>
      <FlatList
        data={posts}
        keyExtractor={(item) => `explore-post-${item.id_post}`}
        renderItem={renderPostItem}
        style={styles.feedList}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Dezactivăm scroll-ul intern pentru că avem scroll extern
        nestedScrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  feedList: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 