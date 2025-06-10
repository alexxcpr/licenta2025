import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import PostOptionsDialog from '../../../components/PostOptionsDialog';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';
import { checkPostStatus, toggleLike, toggleSave, handleSend, addComment } from '../../../utils/postActions';

//utils
import navigateToProfile from '@/app/utils/Navigation';

// Constante pentru gesturi
const SWIPE_THRESHOLD = 80;
const IS_IOS = Platform.OS === 'ios';

// Interfețe pentru tipurile de date
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

interface CommentData {
  id_comment: number;
  content: string;
  date_created: string;
  id_post: number;
  id_user: string;
  user?: UserData;
}

interface PostDetailModalProps {
  visible: boolean;
  onClose: () => void;
  post: PostData | null;
  postUser: UserData | null;
  currentUserId?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function PostDetailModal({
  visible,
  onClose,
  post,
  postUser,
  currentUserId,
}: PostDetailModalProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionsDialogVisible, setActionsDialogVisible] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  
  // Referințe pentru animații de swipe
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const [bgColor, setBgColor] = useState('#ffffff');

  // Verificăm dacă utilizatorul curent este autorul postării
  const isAuthor = !!(currentUserId && post?.id_user === currentUserId);

  // Resetăm animațiile când se deschide modalul
  useEffect(() => {
    if (visible) {
      translateX.setValue(0);
      scaleX.setValue(1);
      setBgColor('#ffffff');
    }
  }, [visible]);

  // Încărcare comentarii când se deschide modalul
  useEffect(() => {
    if (visible && post) {
      console.log('[PostDetailModal] Date postare primite:', JSON.stringify(post, null, 2));
      loadComments();
      loadPostStatus(); // Încărcăm starea de like și save
    }
  }, [visible, post]);

  // Încărcăm starea de like și save pentru postare
  const loadPostStatus = async () => {
    if (!post || !currentUserId) return;
    
    try {
      const { isLiked, isSaved } = await checkPostStatus(post.id_post, currentUserId);
      setLiked(isLiked);
      setSaved(isSaved);
    } catch (error) {
      console.error('Eroare la încărcarea statusului postării:', error);
    }
  };

  // Funcția de navigare înapoi cu animație
  const closeWithAnimation = () => {
    // Asigurăm că folosim separate animația pentru culoare
    setBgColor('#f2f2f2');
    
    // Animațiile native separat
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleX, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  // Gestionarea gestului de swipe
  const onGestureEvent = ({ nativeEvent }: { nativeEvent: any }) => {
    if (nativeEvent.translationX > 0) {
      // Animații native
      translateX.setValue(nativeEvent.translationX);
      const scale = Math.max(0.9, 1 - (nativeEvent.translationX / 1000));
      scaleX.setValue(scale);
      
      // Culoarea de fundal non-nativă - actualizată separat
      if (nativeEvent.translationX > 30) {
        setBgColor('#f2f2f2');
      }
    }
  };

  const onGestureEnd = ({ nativeEvent }: { nativeEvent: any }) => {
    if (nativeEvent.translationX > SWIPE_THRESHOLD) {
      // Dacă swipe-ul depășește pragul, continuăm animația și închidem
      closeWithAnimation();
    } else {
      // Altfel, revenim la poziția inițială
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 5,
        }),
        Animated.spring(scaleX, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 5,
        })
      ]).start();
      
      // Resetăm culoarea separat
      setBgColor('#ffffff');
    }
  };

  const loadComments = async () => {
    if (!post) return;

    setLoading(true);
    try {
      const { data: commentData, error } = await supabase
        .from('comment')
        .select(`
          id_comment,
          content,
          date_created,
          id_post,
          id_user
        `)
        .eq('id_post', post.id_post)
        .order('date_created', { ascending: true });

      if (error) {
        console.error('Eroare la încărcarea comentariilor:', error);
        return;
      }

      if (commentData && commentData.length > 0) {
        // Obținem utilizatorii pentru comentarii
        const userIds = [...new Set(commentData.map(comment => comment.id_user))];
        const { data: userData, error: userError } = await supabase
          .from('user')
          .select('*')
          .in('id_user', userIds);

        if (userError) {
          console.error('Eroare la obținerea utilizatorilor comentariilor:', userError);
        }

        // Combinăm datele comentariilor cu datele utilizatorilor
        const enrichedComments = commentData.map(comment => {
          const dbUser = userData?.find(u => u.id_user === comment.id_user);
          let commentUser: UserData;
          if (dbUser) {
            commentUser = {
              id: dbUser.id_user, 
              username: dbUser.username || 'Utilizator necunoscut',
              avatar_url: dbUser.profile_picture || undefined 
            };
          } else {
            commentUser = {
              id: comment.id_user,
              username: 'Utilizator necunoscut',
            };
          }
          return {
            ...comment,
            user: commentUser
          };
        });

        setComments(enrichedComments);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Eroare la încărcarea comentariilor:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNewComment = async () => {
    if (!newComment.trim() || !post || !currentUserId) return;

    setAddingComment(true);
    try {
      const result = await addComment(post.id_post, currentUserId, newComment.trim());
      
      if (result.success) {
        setNewComment('');
        await loadComments(); // Reîncărcăm comentariile
      } else {
        Alert.alert('Eroare', result.message || 'Nu s-a putut adăuga comentariul. Încercați din nou.');
      }
    } catch (error) {
      console.error('Eroare la adăugarea comentariului:', error);
      Alert.alert('Eroare', 'Nu s-a putut adăuga comentariul. Încercați din nou.');
    } finally {
      setAddingComment(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffMs = now.getTime() - date.getTime();
      
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `acum ${diffDays} ${diffDays === 1 ? 'zi' : 'zile'}`;
      } else if (diffHours > 0) {
        return `acum ${diffHours} ${diffHours === 1 ? 'oră' : 'ore'}`;
      } else if (diffMinutes > 0) {
        return `acum ${diffMinutes} ${diffMinutes === 1 ? 'minut' : 'minute'}`;
      } else {
        return `acum ${diffSeconds} ${diffSeconds === 1 ? 'secundă' : 'secunde'}`;
      }
    } catch (error) {
      console.error('Eroare la formatarea timpului:', error);
      return 'recent';
    }
  };

  const handleLikePress = async () => {
    if (!post || !currentUserId) return;
    
    const newLikeState = await toggleLike(post.id_post, currentUserId, liked);
    setLiked(newLikeState);
  };

  const handleSavePress = async () => {
    if (!post || !currentUserId) return;
    
    const newSaveState = await toggleSave(post.id_post, currentUserId, saved);
    setSaved(newSaveState);
  };

  const handleSendPress = () => {
    if (!post) return;
    handleSend(post.id_post);
  };

  const handleComment = () => {
    // Focusăm pe câmpul de adăugare comentariu
    // Putem adăuga o referință la TextInput dacă dorim
    console.log('Buton comment apăsat pentru postarea', post?.id_post);
  };

  const handleDelete = async () => {
    if (!post || !currentUserId || post.id_user !== currentUserId) return;
    
    setDeletingPost(true);
    try {
      // Ștergem imaginea din bucket (dacă există)
      if (post.image_url) {
        try {
          // Extragem numele fișierului din URL
          const urlParts = post.image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          
          // Determinăm calea corectă în bucket - 'images' e bucket-ul, 'posts' e folder-ul
          let filePath = fileName;
          
          // Dacă URL-ul conține calea specifică folderului posts
          if (post.image_url.includes('/posts/')) {
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
        .eq('id_post', post.id_post);
      
      if (commentsError) {
        console.error('Eroare la ștergerea comentariilor:', commentsError);
        Alert.alert('Eroare', 'Nu s-au putut șterge comentariile postării. Încercați din nou.');
        return;
      }
      
      // Apoi ștergem postarea
      const { error: postError } = await supabase
        .from('post')
        .delete()
        .eq('id_post', post.id_post);
      
      if (postError) {
        console.error('Eroare la ștergerea postării:', postError);
        Alert.alert('Eroare', 'Nu s-a putut șterge postarea. Încercați din nou.');
        return;
      }
      
      Alert.alert('Succes', 'Postarea a fost ștearsă cu succes.');
      closeWithAnimation(); // Închidem modalul după ștergere
    } catch (error) {
      console.error('Eroare la ștergerea postării:', error);
      Alert.alert('Eroare', 'A apărut o eroare la ștergerea postării. Încercați din nou.');
    } finally {
      setDeletingPost(false);
    }
  };

  const toggleActionsDialog = () => {
    setActionsDialogVisible(!actionsDialogVisible);
  };

  // Funcții pentru gestionarea acțiunilor din dialog
  const handleReport = () => {
    console.log('Raportare postare:', post?.id_post);
    // Adaugă aici logica de raportare
    Alert.alert('Mulțumim', 'Raportarea ta a fost trimisă și va fi analizată.');
  };

  if (!post || !postUser) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={closeWithAnimation}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onEnded={onGestureEnd}
          >
            <Animated.View 
              style={[
                styles.animatedContent,
                {
                  transform: [
                    { translateX }, 
                    { scaleX }
                  ]
                }
              ]}
            >
              <StatusBar barStyle="dark-content" backgroundColor="#fff" />
              <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={closeWithAnimation} style={styles.closeButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Postare</Text>
                  <TouchableOpacity onPress={toggleActionsDialog} style={styles.optionsButton}>
                    <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                  {/* Folosim componenta PostHeader pentru informațiile utilizatorului și conținutul textual */}
                  <PostHeader 
                    postUser={postUser}
                    dateCreated={post.date_created}
                    onOptionsPress={toggleActionsDialog}
                    onUserPress={() => navigateToProfile(postUser.id)}
                    content={post.content}
                  />

                  {/* Folosim componenta PostContent pentru imaginea postării */}
                  <PostContent 
                    imageUrl={post.image_url}
                    onPress={() => console.log('Imagine apăsată')}
                  />

                  {/* Folosim componenta PostActions pentru butoanele de acțiune */}
                  <PostActions 
                    postId={post.id_post}
                    isLiked={liked}
                    isSaved={saved}
                    onLike={handleLikePress}
                    onComment={handleComment}
                    onSend={handleSendPress}
                    onSave={handleSavePress}
                  />

                  {/* Secțiune Comentarii - Păstrăm implementarea specifică modalului */}
                  <View style={styles.commentsSection}>
                    <View style={styles.commentsHeader}>
                      <Text style={styles.commentsTitle}>Comentarii</Text>
                      <TouchableOpacity onPress={() => console.log('Navigare la comentarii')}>
                        <Text style={styles.commentsLink}>Vezi toate</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.commentsList}>
                      {comments.map(comment => (
                        <View key={comment.id_comment} style={styles.commentItem}>
                          <View style={styles.commentHeader}>
                            <Image 
                              source={{ uri: comment.user?.avatar_url || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png' }}
                              style={styles.commentAvatar}
                            />
                            <View style={styles.commentInfo}>
                              <Text style={styles.commentUsername} onPress={() => navigateToProfile(comment.user?.id || '')}>{comment.user?.username}</Text>
                              <Text style={styles.commentDate}>{formatTimeAgo(comment.date_created)}</Text>
                            </View>
                          </View>
                          <Text style={styles.commentContent}>{comment.content}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              </SafeAreaView>
            </Animated.View>
          </PanGestureHandler>

          {/* Dialog opțiuni postare */}
          <PostOptionsDialog
            visible={actionsDialogVisible}
            onClose={() => setActionsDialogVisible(false)}
            onReport={handleReport}
            onDelete={handleDelete}
            canDelete={currentUserId === post.id_user}
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// Exportăm stilurile pentru a putea fi refolosite
export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#e0e0e0', // Placeholder color
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  postImage: {
    width: screenWidth,
    maxHeight: screenHeight * 0.6, // Limitează înălțimea la 60% din ecran
    resizeMode: 'contain', // Asigură afișarea completă a imaginii
    backgroundColor: '#f0f0f0', // Adaugă un fundal pentru a vedea limitele imaginii
  },
  postContentContainer: {
    padding: 16,
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButton: {
    padding: 8,
    marginRight: 10, // Spațiu între butoanele de acțiune
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff', 
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: '#e0e0e0', // Placeholder color
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#f9f9f9', // Fundal ușor diferit pentru comentarii
    padding: 10,
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  commentDate: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 18,
  },
  noCommentsText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
    fontSize: 14,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff', 
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Fundal input
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginRight: 10,
    fontSize: 15,
    color: '#333',
  },
  sendButton: {
    padding: 8,
    borderRadius: 20, // Buton send rotunjit
    backgroundColor: '#007AFF', // Culoare principală pentru send
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentsLink: {
    color: '#007AFF',
    fontSize: 14,
  },
  commentsList: {
    marginTop: 5,
  },
  commentItem: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentInfo: {
    flex: 1,
    marginLeft: 5,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
}); 