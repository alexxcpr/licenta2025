import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Platform, Image, Dimensions, TouchableOpacity, Alert, SafeAreaView, Pressable, Modal } from 'react-native';
import { supabase } from '../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import PostDetailModal from '../app/(home)/components/PostDetailModal';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { getApiUrl } from '../config/backend';

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

// Componenta de dialog cross-platform
const CustomDialog = ({ visible, title, message, buttons = [], onClose }: DialogProps) => {
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={dialogStyles.overlay}>
        <View style={dialogStyles.dialogContainer}>
          <View style={dialogStyles.dialogHeader}>
            <Text style={dialogStyles.dialogTitle}>{title}</Text>
          </View>
          <View style={dialogStyles.dialogContent}>
            <Text style={dialogStyles.dialogMessage}>{message}</Text>
          </View>
          <View style={dialogStyles.dialogActions}>
            {buttons.map((button, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  dialogStyles.dialogButton,
                  button.style === 'cancel' && dialogStyles.cancelButton,
                  button.style === 'destructive' && dialogStyles.destructiveButton,
                  pressed && dialogStyles.dialogButtonPressed
                ]}
                onPress={() => {
                  button.onPress();
                  onClose();
                }}
              >
                <Text 
                  style={[
                    dialogStyles.dialogButtonText, 
                    button.style === 'destructive' && dialogStyles.destructiveButtonText
                  ]}
                >
                  {button.text}
                </Text>
              </Pressable>
            ))}
            {buttons.length === 0 && (
              <Pressable
                style={({ pressed }) => [
                  dialogStyles.dialogButton,
                  pressed && dialogStyles.dialogButtonPressed
                ]}
                onPress={onClose}
              >
                <Text style={dialogStyles.dialogButtonText}>OK</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

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

  // Funcția pentru a formata timpul scurs de la postare
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

  // Funcția pentru a gestiona acțiunea de raportare
  const handleReport = (postId: number) => {
    console.log('Raportare pentru postarea', postId);
    
    if (isNative) {
      Alert.alert(
        "Raportează postarea",
        "Ești sigur că vrei să raportezi această postare?",
        [
          {
            text: "Anulează",
            style: "cancel"
          },
          {
            text: "Raportează",
            onPress: () => {
              console.log(`Postarea ${postId} a fost raportată`);
              Alert.alert(
                "Mulțumim",
                "Raportarea ta a fost trimisă și va fi analizată."
              );
            }
          }
        ]
      );
    } else {
      showDialog(
        "Raportează postarea",
        "Ești sigur că vrei să raportezi această postare?",
        [
          {
            text: "Anulează",
            style: "cancel",
            onPress: () => console.log("Raportare anulată")
          },
          {
            text: "Raportează",
            style: "destructive",
            onPress: () => {
              console.log(`Postarea ${postId} a fost raportată`);
              showDialog(
                "Mulțumim",
                "Raportarea ta a fost trimisă și va fi analizată."
              );
            }
          }
        ]
      );
    }
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
    
    if (isNative) {
      Alert.alert("Trimite", "Postarea a fost trimisă");
    } else {
      showDialog("Trimite", "Postarea a fost trimisă");
    }
  };

  const handleSave = (postId: number) => {
    console.log('Buton save apăsat pentru postarea', postId);
    
    // Actualizăm starea de salvare pentru postare
    setSavedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Funcție pentru a deschide meniul de opțiuni
  const openOptionsMenu = (postId: number) => {
    console.log('Apăsat buton opțiuni');
    
    if (isNative) {
      Alert.alert(
        "Opțiuni",
        "Ce dorești să faci?",
        [
          {
            text: "Raportează postarea",
            onPress: () => handleReport(postId)
          },
          {
            text: "Anulează",
            style: "cancel"
          }
        ]
      );
    } else {
      showDialog(
        "Opțiuni",
        "Ce dorești să faci?",
        [
          {
            text: "Raportează postarea",
            onPress: () => handleReport(postId)
          },
          {
            text: "Anulează",
            style: "cancel",
            onPress: () => console.log("Opțiuni anulate")
          }
        ]
      );
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
    router.push(`/(home)/profile/${userId}` as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Dialogul personalizat */}
        <CustomDialog 
          visible={dialogVisible} 
          title={dialogConfig.title} 
          message={dialogConfig.message} 
          buttons={dialogConfig.buttons}
          onClose={() => setDialogVisible(false)}
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
              // Aplicăm stilul condiționat pentru web direct aici
              let webStyles: import('react-native').ViewStyle | undefined;
              if (Platform.OS === 'web') {
                webStyles = {
                  maxWidth: screenWidth * 0.7, 
                  width: '100%', 
                  alignSelf: 'center', 
                  borderWidth: 1,
                  borderColor: '#dbdbdb',
                  borderRadius: 8,
                  marginTop: 8,
                  marginBottom: 8,
                };
              }

              const postContainerStyles = [
                styles.postContainer,
                webStyles
              ];

              return (
                <View style={postContainerStyles as import('react-native').StyleProp<import('react-native').ViewStyle>}>
                  {/* Header postare */}
                  <View style={styles.postHeader}>
                    <TouchableOpacity 
                      style={styles.userInfo}
                      onPress={() => navigateToProfile(item.id_user)}
                      activeOpacity={0.7}
                    >
                      <Image 
                        source={{ 
                          uri: users[item.id_user]?.avatar_url || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png'
                        }} 
                        style={styles.avatar} 
                      />
                      <View style={styles.userNameTime}>
                        <Text style={styles.username}>{users[item.id_user]?.username || 'Utilizator'}</Text>
                        <Text style={styles.timeAgo}>{formatTimeAgo(item.date_created)}</Text>
                      </View>
                    </TouchableOpacity>
                    <Pressable 
                      style={({ pressed }) => [
                        styles.optionsButton,
                        pressed && styles.buttonPressed
                      ]}
                      android_ripple={{ color: '#ddd', borderless: true }}
                      onPress={() => openOptionsMenu(item.id_post)}
                    >
                      <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
                    </Pressable>
                  </View>

                  {/* Conținutul postării - clickabil */}
                  <TouchableOpacity 
                    onPress={() => openPostDetail(item)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.contentText}>{item.content}</Text>

                    {/* Imaginea postării - clickabilă */}
                    {item.image_url && (
                      <View style={styles.imageContainer}>
                        <Image 
                          source={{ uri: item.image_url }} 
                          style={styles.postImage} 
                          resizeMode={Platform.OS === 'web' ? 'contain' : 'cover'}
                        />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Butoane de acțiune */}
                  <View style={styles.actionButtons}>
                    <View style={styles.leftButtons}>
                      <Pressable 
                        onPress={() => {
                          handleLike(item.id_post);
                        }}
                        android_ripple={{ color: '#ddd', borderless: true }}
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && styles.buttonPressed
                        ]}
                      >
                        <Ionicons 
                          name={likedPosts[item.id_post] ? "heart" : "heart-outline"} 
                          size={24} 
                          color={likedPosts[item.id_post] ? "#007AFF" : "#333"} 
                        />
                      </Pressable>
                      <Pressable 
                        onPress={() => {
                          openPostDetail(item);
                        }}
                        android_ripple={{ color: '#ddd', borderless: true }}
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && styles.buttonPressed
                        ]}
                      >
                        <Ionicons name="chatbubble-outline" size={24} color="#333" />
                      </Pressable>
                    </View>
                    <View style={styles.rightButtons}>
                      <Pressable 
                        onPress={() => {
                          handleSend(item.id_post);
                        }}
                        android_ripple={{ color: '#ddd', borderless: true }}
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && styles.buttonPressed
                        ]}
                      >
                        <Ionicons name="paper-plane-outline" size={24} color="#333" />
                      </Pressable>
                      <Pressable 
                        onPress={() => {
                          handleSave(item.id_post);
                        }}
                        android_ripple={{ color: '#ddd', borderless: true }}
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && styles.buttonPressed
                        ]}
                      >
                        <Ionicons 
                          name={savedPosts[item.id_post] ? "bookmark" : "bookmark-outline"} 
                          size={24} 
                          color={savedPosts[item.id_post] ? "#6495ED" : "#333"} 
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Comentarii */}
                  {comments[item.id_post] && comments[item.id_post].length > 0 ? (
                    <View style={styles.commentsSection}>
                      {comments[item.id_post].map(comment => {
                        const username = users[comment.id_user]?.username;
                        const displayName = (username && username.length > 20 ? username.substring(0, 20) + '..' : username) || 'Utilizator';
                        return (
                          <View key={comment.id_comment} style={styles.commentItem}>
                            <TouchableOpacity onPress={() => navigateToProfile(comment.id_user)}>
                              <Text style={styles.commentUsername}>
                                {displayName}:
                              </Text>
                            </TouchableOpacity>
                            <Text style={styles.commentContent}>{comment.content}</Text>
                          </View>
                        );
                      })}
                      {/* Link pentru a vedea toate comentariile */}
                      {comments[item.id_post] && comments[item.id_post].length === 2 && (
                        <Pressable
                          style={({ pressed }) => [
                            styles.viewAllCommentsButton,
                            pressed && styles.linkPressed
                          ]}
                          onPress={() => openPostDetail(item)}
                        >
                          <Text style={styles.viewAllComments}>Vezi toate comentariile...</Text>
                        </Pressable>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => openPostDetail(item)}>
                      <Text style={styles.noComments}>Nu există comentarii pentru această postare</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  postContainer: {
    backgroundColor: '#fff',
    // marginBottom: 8, // Mutat în stilul condiționat pentru web sau păstrat pentru mobil
    // Stilurile specifice web vor fi adăugate dinamic în renderItem
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0', // Culoare de fundal pentru a evita probleme de transparență pe iOS
  },
  userNameTime: {
    flexDirection: 'column',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  timeAgo: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  optionsButton: {
    padding: 8, // Adăugăm padding pentru a mări zona de atingere pe iOS
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
    overflow: 'hidden',
  },
  postImage: {
    height: isNative ? 300 : 320,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#f0f0f0', // Culoare de fundal pentru a evita probleme de transparență pe iOS
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    padding: 16,
    paddingTop: 12,
    marginHorizontal: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 4,
    paddingBottom: 8,
    width: '100%',
    marginHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  buttonPressed: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
  commentsSection: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginHorizontal: 0,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 6,
    color: '#333',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  viewAllComments: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  noComments: {
    fontSize: 14,
    color: '#888',
    padding: 12,
    paddingTop: 10,
    fontStyle: 'italic',
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
  viewAllCommentsButton: {
    padding: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  linkPressed: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
}); 