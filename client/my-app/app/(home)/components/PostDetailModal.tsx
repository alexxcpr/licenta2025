import React, { useState, useEffect } from 'react';
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
  Pressable,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';

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

  // Încărcare comentarii când se deschide modalul
  useEffect(() => {
    if (visible && post) {
      console.log('[PostDetailModal] Date postare primite:', JSON.stringify(post, null, 2));
      loadComments();
    }
  }, [visible, post]);

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

  const addComment = async () => {
    if (!newComment.trim() || !post || !currentUserId) return;

    setAddingComment(true);
    try {
      const { data, error } = await supabase
        .from('comment')
        .insert([
          {
            content: newComment.trim(),
            id_post: post.id_post,
            id_user: currentUserId,
          }
        ])
        .select();

      if (error) {
        console.error('Eroare la adăugarea comentariului:', error);
        Alert.alert('Eroare', 'Nu s-a putut adăuga comentariul. Încercați din nou.');
        return;
      }

      setNewComment('');
      await loadComments(); // Reîncărcăm comentariile
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

  const handleLike = () => {
    setLiked(!liked);
    console.log('Buton like apăsat pentru postarea', post?.id_post);
  };

  const handleSave = () => {
    setSaved(!saved);
    console.log('Buton save apăsat pentru postarea', post?.id_post);
  };

  const handleSend = () => {
    console.log('Buton send apăsat pentru postarea', post?.id_post);
    Alert.alert('Trimite', 'Postarea a fost trimisă');
  };

  const handleReport = () => {
    Alert.alert(
      'Raportează postarea',
      'Ești sigur că vrei să raportezi această postare?',
      [
        {
          text: 'Anulează',
          style: 'cancel'
        },
        {
          text: 'Raportează',
          onPress: () => {
            console.log(`Postarea ${post?.id_post} a fost raportată`);
            Alert.alert('Mulțumim', 'Raportarea ta a fost trimisă și va fi analizată.');
          }
        }
      ]
    );
  };

  if (!post || !postUser) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Postare</Text>
          <TouchableOpacity onPress={handleReport} style={styles.optionsButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Informații utilizator */}
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: postUser.avatar_url || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png' }} 
              style={styles.avatar} 
            />
            <Text style={styles.username}>{postUser.username}</Text>
          </View>

          {/* Imaginea postării (dacă există) */}
          {post.image_url && (
            <Image 
              source={{ uri: post.image_url }} 
              style={[styles.postImage, { height: 600, backgroundColor: 'transparent' }]}
              onError={(e) => {
                console.error(`[PostDetailModal] Eroare la încărcarea imaginii postării. URL încercat: ${post.image_url}`);
                console.error('[PostDetailModal] Detalii eroare nativă:', e.nativeEvent.error);
              }}
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                console.log(`[PostDetailModal] Layout imagine: width=${width}, height=${height}`);
              }}
            />
          )}

          {/* Conținutul postării */}
          <View style={styles.postContentContainer}>
            <Text style={styles.postText}>{post.content}</Text>
            <Text style={styles.postDate}>{formatTimeAgo(post.date_created)}</Text>
          </View>

          {/* Acțiuni postare */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={28} color={liked ? "#007AFF" : "#333"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => console.log("Comment action")} style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={28} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSend} style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={28} color="#333" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} /> 
            <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
              <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={28} color={saved ? "#007AFF" : "#333"} />
            </TouchableOpacity>
          </View>

          {/* Secțiune Comentarii */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comentarii ({comments.length})
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Se încarcă comentariile...</Text>
              </View>
            ) : (
              <>
                {comments.length > 0 ? (
                  comments.map((comment) => {
                    return (
                      <View key={comment.id_comment} style={styles.commentContainer}>
                        <Image 
                          source={{ 
                            uri: comment.user?.avatar_url || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png' 
                          }} 
                          style={styles.commentAvatar} 
                          onError={(e) => {
                            console.error(`[PostDetailModal] Eroare la încărcarea avatarului pentru comentariul ${comment.id_comment}. URL încercat: ${comment.user?.avatar_url}`);
                            console.error('[PostDetailModal] Detalii eroare nativă avatar:', e.nativeEvent.error);
                          }}
                        />
                        <View style={styles.commentContent}>
                          <View style={styles.commentHeader}>
                            <Text style={styles.commentUser}>
                              { (comment.user?.username && comment.user.username.length > 20 ? comment.user.username.substring(0, 20) + '..' : comment.user?.username) || 'Utilizator necunoscut'}
                            </Text>
                            <Text style={styles.commentDate}>
                              {formatTimeAgo(comment.date_created)}
                            </Text>
                          </View>
                          <Text style={styles.commentText}>{comment.content}</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.noCommentsText}>Nu există comentarii încă.</Text>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Input pentru comentarii */}
        <View style={styles.addCommentContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Adaugă un comentariu..."
            placeholderTextColor="#999"
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            onPress={addComment}
            disabled={!newComment.trim() || addingComment}
            style={[
              styles.sendButton,
              (!newComment.trim() || addingComment) && styles.sendButtonDisabled
            ]}
          >
            {addingComment ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
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
  }
}); 