import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Platform, Image, Dimensions, TouchableOpacity, Alert, SafeAreaView, Pressable, Modal } from 'react-native';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import PostDetailModal from '../app/ui/postari/PostDetailModal';
import PostOptionsDialog from './PostOptionsDialog';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { getApiUrl } from '../config/backend';
import FullPost from '../app/ui/postari/FullPost';

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

// // Componenta de dialog cross-platform
// const CustomDialog = ({ visible, title, message, buttons = [], onClose }: DialogProps) => {
//   if (!visible) return null;

//   return (
//     <Modal
//       transparent={true}
//       visible={visible}
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <View style={dialogStyles.overlay}>
//         <View style={dialogStyles.dialogContainer}>
//           <View style={dialogStyles.dialogHeader}>
//             <Text style={dialogStyles.dialogTitle}>{title}</Text>
//           </View>
//           <View style={dialogStyles.dialogContent}>
//             <Text style={dialogStyles.dialogMessage}>{message}</Text>
//           </View>
//           <View style={dialogStyles.dialogActions}>
//             {buttons.map((button, index) => (
//               <Pressable
//                 key={index}
//                 style={({ pressed }) => [
//                   dialogStyles.dialogButton,
//                   button.style === 'cancel' && dialogStyles.cancelButton,
//                   button.style === 'destructive' && dialogStyles.destructiveButton,
//                   pressed && dialogStyles.dialogButtonPressed
//                 ]}
//                 onPress={() => {
//                   button.onPress();
//                   onClose();
//                 }}
//               >
//                 <Text 
//                   style={[
//                     dialogStyles.dialogButtonText, 
//                     button.style === 'destructive' && dialogStyles.destructiveButtonText
//                   ]}
//                 >
//                   {button.text}
//                 </Text>
//               </Pressable>
//             ))}
//             {buttons.length === 0 && (
//               <Pressable
//                 style={({ pressed }) => [
//                   dialogStyles.dialogButton,
//                   pressed && dialogStyles.dialogButtonPressed
//                 ]}
//                 onPress={onClose}
//               >
//                 <Text style={dialogStyles.dialogButtonText}>OK</Text>
//               </Pressable>
//             )}
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

interface Props {
  onRefreshTriggered?: () => void;
}

// Verificăm dacă suntem în browser sau în mediul server
const isBrowser = typeof window !== 'undefined';
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';
const isNative = isIOS || isAndroid;

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

  // State pentru modal-ul de detalii postare
  const [postDetailVisible, setPostDetailVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [selectedPostUser, setSelectedPostUser] = useState<UserData | null>(null);

  // Funcție universală de afișare a dialogurilor
  const showDialog = (title: string, message: string, buttons?: any[]) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };

  // Expunem metoda de reîncărcare a datelor prin ref
  useImperativeHandle(ref, () => ({
    reload: fetchData
  }));

  const fetchData = useCallback(async () => {
    // Adăugăm console.log aici pentru a se executa doar la încărcare și refresh
    console.log(`Platformă curentă: ${Platform.OS}`);
    
    console.log('Încercăm să încărcăm date de pe platforma', Platform.OS);
    
    // Verificăm dacă suntem în browser
    if (!isBrowser && !isNative) {
      console.log('Componenta rulează în afara mediului browser sau nativ');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Executăm interogarea către tabelul post
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
        
        try {
          // Colectăm toate id-urile utilizatorilor pentru a le obține detaliile
          const userIds = [...new Set(postData.map(post => post.id_user))];
          
          // Obținem datele utilizatorilor din tabelul 'user'
          const { data: userData, error: userError } = await supabase
            .from('user')
            .select('*')
            .in('id_user', userIds);
          
          if (userError) {
            console.error('Eroare la obținerea utilizatorilor:', userError);
          } else if (userData) {
            const usersMap: {[userId: string]: UserData} = {};
            userData.forEach(user => {
              usersMap[user.id_user] = {
                id: user.id_user,
                username: user.username || 'Utilizator necunoscut',
                avatar_url: user.profile_picture
              };
            });
            setUsers(usersMap);
          }
        } catch (error) {
          console.error('Eroare la procesarea datelor utilizatorilor:', error);
        }
        
        try {
          // Pentru fiecare postare, obținem ultimele 2 comentarii
          const commentsMap: {[postId: number]: CommentData[]} = {};
          const commentUserIds = new Set<string>(); // Set pentru a colecta ID-urile utilizatorilor din comentarii

          for (const post of postData) {
            try {
              const { data: commentData, error: commentError } = await supabase
                .from('comment')
                .select('*')
                .eq('id_post', post.id_post)
                .order('date_created', { ascending: false })
                .limit(2);
              
              if (commentError) {
                console.error(`Eroare la obținerea comentariilor pentru postarea ${post.id_post}:`, commentError);
              } else if (commentData) {
                commentsMap[post.id_post] = commentData as CommentData[];
                // Adăugăm ID-urile utilizatorilor din comentarii la set
                commentData.forEach(comment => commentUserIds.add(comment.id_user));
              }
            } catch (error) {
              console.error(`Eroare la procesarea comentariilor pentru postarea ${post.id_post}:`, error);
            }
          }
          
          setComments(commentsMap);

          // Verificăm dacă trebuie să încărcăm date suplimentare pentru utilizatorii din comentarii
          const existingUserIds = new Set(Object.keys(users));
          const newCommentUserIds = Array.from(commentUserIds).filter(id => !existingUserIds.has(id));

          if (newCommentUserIds.length > 0) {
            console.log('Încărcare date suplimentare pentru utilizatorii din comentarii:', newCommentUserIds);
            const { data: newUserData, error: newUserError } = await supabase
              .from('user')
              .select('*')
              .in('id_user', newCommentUserIds);

            if (newUserError) {
              console.error('Eroare la obținerea utilizatorilor suplimentari din comentarii:', newUserError);
            } else if (newUserData) {
              const updatedUsersMap = { ...users }; // Copiem usersMap-ul existent
              newUserData.forEach(user => {
                updatedUsersMap[user.id_user] = {
                  id: user.id_user,
                  username: user.username || 'Utilizator necunoscut',
                  avatar_url: user.profile_picture
                };
              });
              setUsers(updatedUsersMap); // Actualizăm starea users
            }
          }

        } catch (error) {
          console.error('Eroare la procesarea comentariilor:', error);
        }
      } else {
        console.log('Nu s-au primit postări');
        setPosts([]);
      }
    } catch (error: any) {
      setError(error.message || 'A apărut o eroare la încărcarea datelor');
      console.error('Eroare la încărcarea datelor:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Notificăm componenta părinte când datele sunt reîncărcate cu succes
  useEffect(() => {
    if (!loading && !error && onRefreshTriggered) {
      onRefreshTriggered();
    }
  }, [loading, error, onRefreshTriggered]);

  useEffect(() => {
    // Adăugăm un timp de întârziere pentru a permite încărcarea completă a mediului
    const loadTimer = setTimeout(() => {
      fetchData();
    }, isNative ? 500 : 0); // Întârziere mai mare pe platformele native

    return () => clearTimeout(loadTimer);
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Se încarcă postările...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Eroare: {error}</Text>
        <Pressable 
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed
          ]}
          onPress={() => fetchData()}
        >
          <Text style={styles.retryText}>Încearcă din nou</Text>
        </Pressable>
      </View>
    );
  }

  // Funcția pentru a deschide meniul de opțiuni
  const openOptionsMenu = (postId: number) => {
    console.log('Apăsat buton opțiuni pentru postId:', postId);
    
    // Găsim postarea selectată
    const post = posts.find(p => p.id_post === postId);
    console.log('Post găsit:', post);
    
    if (!post) {
      console.log('Nu s-a găsit postarea cu ID:', postId);
      return;
    }
    
    // Verificăm dacă utilizatorul curent este autorul postării
    const isAuthor = !!(user?.id && post.id_user === user.id);
    console.log('Este autor:', isAuthor, 'User ID:', user?.id, 'Post User ID:', post.id_user);
    
    // Setăm stările pentru dialogul cu acțiuni
    setSelectedPost(post);
    setDialogVisible(true);
    console.log('Dialog visible setat la true');
  };

  // Funcția pentru a gestiona acțiunea de raportare
  const handleReportPost = () => {
    if (!selectedPost) return;
    
    setDialogVisible(false);
    console.log(`Postarea ${selectedPost.id_post} a fost raportată`);
  };

  // Funcții pentru acțiunile butoanelor
  const handleLike = (postId: number) => {
    console.log('Buton like apăsat pentru postarea', postId);
    
    // Actualizăm starea de like pentru postare
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleSend = (postId: number) => {
    console.log('Buton send apăsat pentru postarea', postId);
  };

  const handleSave = (postId: number) => {
    console.log('Buton save apăsat pentru postarea', postId);
    
    // Actualizăm starea de salvare pentru postare
    setSavedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Funcție pentru ștergerea postării
  const handleDeletePost = async () => {
    if (!selectedPost || !user?.id || selectedPost.id_user !== user.id) return;
    
    setDialogVisible(false);
    
    try {
      // Ștergem imaginea din bucket (dacă există)
      if (selectedPost.image_url) {
        try {
          // Extragem numele fișierului din URL
          const urlParts = selectedPost.image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          
          // Determinăm calea corectă în bucket - 'images' e bucket-ul, 'posts' e folder-ul
          let filePath = fileName;
          
          // Dacă URL-ul conține calea specifică folderului posts
          if (selectedPost.image_url.includes('/posts/')) {
            filePath = `posts/${fileName}`;
          }
          
          // Ștergem fișierul din bucket
          const { error: storageError } = await supabase.storage
            .from('images')
            .remove([filePath]);
            
          if (storageError) {
            console.error('Eroare la ștergerea imaginii din bucket:', storageError);
            // Continuăm cu ștergerea postării chiar dacă imaginea nu a putut fi ștearsă
          }
        } catch (storageError) {
          console.error('Eroare la procesarea ștergerii imaginii:', storageError);
          // Continuăm cu ștergerea postării chiar dacă imaginea nu a putut fi ștearsă
        }
      }
      
      // Ștergem mai întâi comentariile asociate postării
      const { error: commentsError } = await supabase
        .from('comment')
        .delete()
        .eq('id_post', selectedPost.id_post);
      
      if (commentsError) {
        console.error('Eroare la ștergerea comentariilor:', commentsError);
        if (isNative) {
          Alert.alert('Eroare', 'Nu s-au putut șterge comentariile postării. Încercați din nou.');
        } else {
          showDialog('Eroare', 'Nu s-au putut șterge comentariile postării. Încercați din nou.');
        }
        return;
      }
      
      // Apoi ștergem postarea
      const { error: postError } = await supabase
        .from('post')
        .delete()
        .eq('id_post', selectedPost.id_post);
      
      if (postError) {
        console.error('Eroare la ștergerea postării:', postError);
        if (isNative) {
          Alert.alert('Eroare', 'Nu s-a putut șterge postarea. Încercați din nou.');
        } else {
          showDialog('Eroare', 'Nu s-a putut șterge postarea. Încercați din nou.');
        }
        return;
      }
      
      // Notificăm utilizatorul că postarea a fost ștearsă
      if (isNative) {
        Alert.alert('Succes', 'Postarea a fost ștearsă cu succes.');
      } else {
        showDialog('Succes', 'Postarea a fost ștearsă cu succes.');
      }
      
      // Reîncărcăm lista de postări
      fetchData();
      
    } catch (error) {
      console.error('Eroare la ștergerea postării:', error);
      if (isNative) {
        Alert.alert('Eroare', 'A apărut o eroare la ștergerea postării. Încercați din nou.');
      } else {
        showDialog('Eroare', 'A apărut o eroare la ștergerea postării. Încercați din nou.');
      }
    }
  };

  // Funcție pentru deschiderea modalului de detalii postare
  const openPostDetail = (post: PostData) => {
    setSelectedPost(post);
    setSelectedPostUser(users[post.id_user] || null);
    setPostDetailVisible(true);
  };

  // Funcție pentru închiderea modalului de detalii postare
  const closePostDetail = () => {
    setPostDetailVisible(false);
    setSelectedPost(null);
    setSelectedPostUser(null);
  };

  // Funcție pentru navigarea către profilul unui utilizator
  const navigateToProfile = (userId: string) => {
    router.push(`/(profile)/${userId}` as any);
  };

  // Funcție pentru deschiderea comentariilor
  const handleComment = (postId: number) => {
    const post = posts.find(p => p.id_post === postId);
    if (post) {
      openPostDetail(post);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>        
        {/* Dialog pentru acțiunile postării */}
        <PostOptionsDialog 
          visible={dialogVisible}
          onClose={() => setDialogVisible(false)}
          onReport={handleReportPost}
          onDelete={handleDeletePost}
          canDelete={!!(user?.id && selectedPost?.id_user === user.id)}
        />
        
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Nu există postări încă</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id_post.toString()}
            renderItem={({ item }) => {
              // Pregătim comentariile și utilizatorul pentru postare
              const postComments = comments[item.id_post] || [];
              const postUser = users[item.id_user] || { 
                id: item.id_user, 
                username: 'Utilizator necunoscut'
              };

              // Adăugăm informații despre utilizator în comentarii
              const enrichedComments = postComments.map(comment => ({
                ...comment,
                user: users[comment.id_user]
              }));
              
              return (
                <FullPost 
                  post={item}
                  postUser={postUser}
                  comments={enrichedComments}
                  currentUserId={user?.id}
                  onLike={handleLike}
                  onSave={handleSave}
                  onComment={handleComment}
                  onSend={handleSend}
                  onOptionsPress={openOptionsMenu}
                  onPostPress={openPostDetail}
                  onUserPress={navigateToProfile}
                  // isLiked={!!likedPosts[item.id_post]}
                  // isSaved={!!savedPosts[item.id_post]}
                />
              );
            }}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* Modal pentru detaliile postării */}
        <PostDetailModal
          visible={postDetailVisible}
          onClose={closePostDetail}
          post={selectedPost}
          postUser={selectedPostUser}
          currentUserId={user?.id}
        />
      </View>
    </SafeAreaView>
  );
});

// Stiluri pentru dialog
const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dialogHeader: {
    marginBottom: 15,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  dialogContent: {
    marginBottom: 20,
  },
  dialogMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  dialogButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 5,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogButtonPressed: {
    opacity: 0.8,
  },
  dialogButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#8e8e93',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
  },
  destructiveButtonText: {
    color: 'white',
  },
});

export default PostList;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 20,
    marginTop: 16,
    alignSelf: 'center',
  },
  retryButtonPressed: {
    backgroundColor: '#0056b3',
    opacity: 0.8,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 