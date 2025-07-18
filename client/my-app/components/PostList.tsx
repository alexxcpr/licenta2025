import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Platform, Image, Dimensions, TouchableOpacity, Alert, SafeAreaView, Pressable, Modal } from 'react-native';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import PostOptionsDialog from './PostOptionsDialog';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import FullPost from '../app/ui/postari/FullPost';
import PostDetailOpener from './PostDetailOpener';
import { toggleLike, toggleSave, handleSend as postActionHandleSend, addComment, checkPostStatus } from '../utils/postActions';

//utils
import navigateToProfile from '@/app/utils/Navigation';

// Definim interfața pentru datele din tabelul post conform structurii din Supabase
interface PostData {
  id_post: number;
  content: string;
  image_url: string;
  id_user: string;
  is_published: boolean;
  date_created: string;
  date_updated: string;
}

interface CommentData {
  id_comment: number;
  content: string;
  date_created: string;
  id_post: number;
  id_user: string;
  user?: UserData;
}

interface UserData {
  id: string;
  username: string;
  avatar_url?: string;
}

interface DialogProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose: () => void;
}

interface Props {
  onRefreshTriggered?: () => void;
}

// Verificăm dacă suntem în browser sau în mediul server
const isBrowser = typeof window !== 'undefined';
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';
const isNative = isIOS || isAndroid;

// Cache pentru postări
const postsCache = {
  data: null as any,
  timestamp: 0,
  expiryTime: 5 * 60 * 1000 // 5 minute
};

const PostList = forwardRef(({ onRefreshTriggered }: Props, ref) => {
  const { user } = useUser();
  const router = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [comments, setComments] = useState<{[postId: number]: CommentData[]}>({});
  const [users, setUsers] = useState<{[userId: string]: UserData}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const isMountedRef = useRef(false);
  const forceRefreshRef = useRef(false);

  // State pentru dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    buttons?: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({ title: '', message: '' });

  // State pentru starea de like și salvare pentru fiecare postare
  const [likedPosts, setLikedPosts] = useState<{[postId: number]: boolean}>({});
  const [savedPosts, setSavedPosts] = useState<{[postId: number]: boolean}>({});
  
  // State pentru dialogul cu opțiuni pentru postare
  const [optionsDialogVisible, setOptionsDialogVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  // Funcție universală de afișare a dialogurilor
  const showDialog = (title: string, message: string, buttons?: any[]) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };

  // Expunem metoda de reîncărcare a datelor prin ref
  useImperativeHandle(ref, () => ({
    reload: () => fetchData(true) // Forțăm refresh când metoda este apelată explicit
  }));

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Verificăm dacă putem folosi datele din cache
    const now = Date.now();
    if (!forceRefresh && 
        postsCache.data && 
        now - postsCache.timestamp < postsCache.expiryTime) {
      console.log('Folosim datele din cache pentru postări');
      setPosts(postsCache.data.posts || []);
      setComments(postsCache.data.comments || {});
      setUsers(postsCache.data.users || {});
      setLoading(false);
      return;
    }
    
    // Adăugăm console.log aici pentru a se executa doar la încărcare și refresh
    console.log(`Încărcăm postările de pe platforma: ${Platform.OS}`);
    
    // Verificăm dacă suntem în browser
    if (!isBrowser && !isNative) {
      console.log('Componenta rulează în afara mediului browser sau nativ');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null); // Reset error state

    try {
      // 1. Fetch posts
      const { data: postData, error: postError } = await supabase
        .from('post')
        .select('*')
        .eq('is_published', true)
        .order('date_created', { ascending: false });

      if (postError) {
        console.error('Eroare la încărcarea postărilor:', postError);
        throw postError;
      }
      
      // Verificăm dacă avem date
      if (postData && postData.length > 0) {
        console.log('Postări primite:', postData.length);
        setPosts(postData as PostData[]);

        // 2. Collect all user IDs from posts
        const allUserIds = new Set<string>();
        postData.forEach(post => allUserIds.add(post.id_user));

        // 3. Fetch raw comments for all posts and collect comment user IDs
        const rawCommentsByPostId: { [postId: number]: any[] } = {};
        for (const post of postData) {
          try {
            const { data: commentDataForPost, error: commentError } = await supabase
              .from('comment')
              .select('*') // Raw comment data
              .eq('id_post', post.id_post)
              .order('date_created', { ascending: false })
              .limit(2);

            if (commentError) {
              console.error(`Eroare la obținerea comentariilor pentru postarea ${post.id_post}:`, commentError);
              rawCommentsByPostId[post.id_post] = [];
            } else if (commentDataForPost) {
              rawCommentsByPostId[post.id_post] = commentDataForPost;
              commentDataForPost.forEach(comment => allUserIds.add(comment.id_user));
            } else {
              rawCommentsByPostId[post.id_post] = [];
            }
          } catch (error) {
            console.error(`Eroare la procesarea comentariilor pentru postarea ${post.id_post}:`, error);
            rawCommentsByPostId[post.id_post] = [];
          }
        }

        // 4. Fetch all unique users (post authors and comment authors)
        let usersMap: { [userId: string]: UserData } = {};
        if (allUserIds.size > 0) {
          const { data: userDataFromDb, error: userFetchError } = await supabase
            .from('user')
            .select('id_user, username, profile_picture')
            .in('id_user', Array.from(allUserIds));

          if (userFetchError) {
            console.error('Eroare la obținerea utilizatorilor:', userFetchError);
            // Continuăm chiar dacă există erori la încărcarea unor utilizatori, postările și comentariile pot fi afișate
          } else if (userDataFromDb) {
            userDataFromDb.forEach(user => {
              usersMap[user.id_user] = {
                id: user.id_user,
                username: user.username || 'Utilizator necunoscut',
                avatar_url: user.profile_picture || undefined
              };
            });
          }
        }
        setUsers(usersMap);

        // 5. Enrich comments using the comprehensive usersMap
        const enrichedCommentsMap: { [postId: number]: CommentData[] } = {};
        for (const postIdStr in rawCommentsByPostId) {
          const postId = parseInt(postIdStr, 10);
          const rawComments = rawCommentsByPostId[postId];
          enrichedCommentsMap[postId] = rawComments.map(comment => {
            const commentAuthor = usersMap[comment.id_user];
            return {
              ...comment, // Păstrăm toate câmpurile originale ale comentariului
              user: commentAuthor // Atribuim direct obiectul UserData dacă există
                    ? commentAuthor
                    : { id: comment.id_user, username: 'Utilizator necunoscut' } // Fallback
            };
          }) as CommentData[];
        }
        setComments(enrichedCommentsMap);

        // Update cache
        postsCache.data = {
          posts: postData,
          comments: enrichedCommentsMap,
          users: usersMap
        };
        postsCache.timestamp = now;

      } else {
        console.log('Nu s-au găsit postări.');
        setPosts([]);
        setComments({});
        setUsers({});
        // Actualizăm și cache-ul în acest caz
        postsCache.data = { posts: [], comments: {}, users: {} };
        postsCache.timestamp = now;
      }
    } catch (error) {
      console.error('Eroare generală la încărcarea datelor:', error);
      // Asigură-te că error este un string sau convertește-l
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError('Nu s-au putut încărca postările. Vă rugăm încercați din nou mai târziu. Detaliu: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Încărcăm datele o singură dată la montarea componentei
  useEffect(() => {
    if (!isMountedRef.current) {
      fetchData(forceRefreshRef.current);
      isMountedRef.current = true;
      forceRefreshRef.current = false;
    }
  }, [fetchData]);

  // Notificăm componenta părinte când datele sunt reîncărcate cu succes
  useEffect(() => {
    if (!loading && !error && onRefreshTriggered) {
      onRefreshTriggered();
    }
  }, [loading, error, onRefreshTriggered]);

  // Funcție pentru deschiderea meniului de opțiuni pentru o postare
  const openOptionsMenu = (postId: number) => {
    setSelectedPostId(postId);
    setOptionsDialogVisible(true);
  };
  
  // Funcție pentru raportarea unei postări
  const handleReportPost = () => {
    Alert.alert('Succes', 'Postarea a fost raportată. Mulțumim pentru feedback!');
  };
  
  // Funcție pentru a încărca starea like/save pentru toate postările
  const loadPostStatuses = useCallback(async () => {
    if (!user?.id || posts.length === 0) return;
    
    const likeStatus: {[postId: number]: boolean} = {};
    const saveStatus: {[postId: number]: boolean} = {};
    
    for (const post of posts) {
      try {
        const { isLiked, isSaved } = await checkPostStatus(post.id_post, user.id);
        likeStatus[post.id_post] = isLiked;
        saveStatus[post.id_post] = isSaved;
      } catch (error) {
        console.error(`Eroare la verificarea statusului pentru postarea ${post.id_post}:`, error);
      }
    }
    
    setLikedPosts(likeStatus);
    setSavedPosts(saveStatus);
  }, [posts, user?.id]);

  // Încărcăm starea postărilor după ce datele sunt încărcate
  useEffect(() => {
    if (!loading && posts.length > 0 && user?.id) {
      loadPostStatuses();
    }
  }, [loading, posts, user?.id, loadPostStatuses]);

  // Funcție pentru like la o postare
  const handleLike = async (postId: number) => {
    if (!user?.id) {
      Alert.alert('Atenție', 'Trebuie să fiți autentificat pentru a aprecia o postare.');
      return;
    }
    
    const currentLikeStatus = likedPosts[postId] || false;
    
    // Actualizăm starea UI imediat pentru feedback instantaneu
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !currentLikeStatus
    }));
    
    // Apelăm API-ul pentru a actualiza baza de date
    try {
      const newLikeStatus = await toggleLike(postId, user.id, currentLikeStatus);
      
      // Dacă rezultatul din backend diferă de așteptări, actualizăm UI-ul
      if (newLikeStatus !== !currentLikeStatus) {
        setLikedPosts(prev => ({
          ...prev,
          [postId]: newLikeStatus
        }));
      }
    } catch (error) {
      console.error('Eroare la actualizarea stării like:', error);
      
      // Revertim la starea inițială în caz de eroare
      setLikedPosts(prev => ({
        ...prev,
        [postId]: currentLikeStatus
      }));
      
      Alert.alert('Eroare', 'Nu s-a putut actualiza aprecierea. Încercați din nou.');
    }
  };
  
  // Funcție pentru comentarii la o postare
  const handleComment = (postId: number) => {
    // Folosim openPostDetail din PostDetailOpener pentru a deschide detaliile postării
    // Această funcționalitate este deja implementată în renderul FlatList-ului
    const post = posts.find(p => p.id_post === postId);
    if (!post) return;
    
    const postUser = users[post.id_user] || {
      id: post.id_user,
      username: 'Utilizator necunoscut',
      avatar_url: undefined
    };
    
    // Vom apela openPostDetail care este transmisă ca render prop în FlatList
  };
  
  // Funcție pentru trimiterea unei postări
  const handleSend = (postId: number) => {
    postActionHandleSend(postId);
  };
  
  // Funcție pentru salvarea unei postări
  const handleSave = async (postId: number) => {
    if (!user?.id) {
      Alert.alert('Atenție', 'Trebuie să fiți autentificat pentru a salva o postare.');
      return;
    }
    
    const currentSaveStatus = savedPosts[postId] || false;
    
    // Actualizăm starea UI imediat pentru feedback instantaneu
    setSavedPosts(prev => ({
      ...prev,
      [postId]: !currentSaveStatus
    }));
    
    // Apelăm API-ul pentru a actualiza baza de date
    try {
      const newSaveStatus = await toggleSave(postId, user.id, currentSaveStatus);
      
      // Dacă rezultatul din backend diferă de așteptări, actualizăm UI-ul
      if (newSaveStatus !== !currentSaveStatus) {
        setSavedPosts(prev => ({
          ...prev,
          [postId]: newSaveStatus
        }));
      }
      
    } catch (error) {
      console.error('Eroare la actualizarea stării salvării:', error);
      
      // Revertim la starea inițială în caz de eroare
      setSavedPosts(prev => ({
        ...prev,
        [postId]: currentSaveStatus
      }));
      
      Alert.alert('Eroare', 'Nu s-a putut actualiza salvarea. Încercați din nou.');
    }
  };
  
  // Funcție pentru ștergerea unei postări
  const handleDeletePost = async () => {
    if (!selectedPostId) return;
    
    try {
      const { error } = await supabase
        .from('post')
        .delete()
        .eq('id_post', selectedPostId);
      
      if (error) {
        console.error('Eroare la ștergerea postării:', error);
        Alert.alert('Eroare', 'Nu s-a putut șterge postarea. Încercați din nou.');
      } else {
        // Eliminăm postarea din starea locală
        setPosts(prevPosts => prevPosts.filter(post => post.id_post !== selectedPostId));
        Alert.alert('Succes', 'Postarea a fost ștearsă cu succes!');
      }
    } catch (error) {
      console.error('Eroare la ștergerea postării:', error);
      Alert.alert('Eroare', 'A apărut o eroare la ștergerea postării.');
    }
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Se încarcă postările...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchData(true)}
        >
          <Text style={styles.retryButtonText}>Încearcă din nou</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Nu există postări disponibile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PostDetailOpener currentUserId={user?.id}>
        {(openPostDetail) => (
          <FlatList
            data={posts}
            keyExtractor={(item) => `post-${item.id_post}`}
            renderItem={({ item }) => (
              <FullPost 
                post={item}
                postUser={users[item.id_user] || { id: item.id_user, username: 'Utilizator necunoscut' }}
                comments={comments[item.id_post] || []}
                currentUserId={user?.id}
                onLike={() => handleLike(item.id_post)}
                onComment={() => {
                  const postUser = users[item.id_user] || {
                    id: item.id_user,
                    username: 'Utilizator necunoscut',
                    avatar_url: undefined
                  };
                  openPostDetail(item, postUser);
                }}
                onSend={() => handleSend(item.id_post)}
                onSave={() => handleSave(item.id_post)}
                onPostPress={() => {
                  const postUser = users[item.id_user] || {
                    id: item.id_user,
                    username: 'Utilizator necunoscut',
                    avatar_url: undefined
                  };
                  openPostDetail(item, postUser);
                }}
                onUserPress={(userId) => navigateToProfile(userId)}
                onOptionsPress={() => openOptionsMenu(item.id_post)}
                isLiked={likedPosts[item.id_post] || false}
                isSaved={savedPosts[item.id_post] || false}
              />
            )}
            contentContainerStyle={styles.listContainer}
            onRefresh={() => fetchData(true)}
            refreshing={loading}
          />
        )}
      </PostDetailOpener>

      {/* Dialog de opțiuni pentru postare */}
      <PostOptionsDialog 
        visible={optionsDialogVisible}
        onClose={() => setOptionsDialogVisible(false)}
        onReport={handleReportPost}
        onDelete={handleDeletePost}
        canDelete={selectedPostId ? posts.find(p => p.id_post === selectedPostId)?.id_user === user?.id : false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PostList;