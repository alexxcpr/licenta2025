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
import { supabase } from '../utils/supabase';

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
        const enrichedComments = commentData.map(comment => ({
          ...comment,
          user: userData?.find(user => user.id_user === comment.id_user) || {
            id: comment.id_user,
            username: 'Utilizator necunoscut',
          }
        }));

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
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Postare</Text>
          <TouchableOpacity onPress={handleReport} style={styles.optionsButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Informații utilizator */}
          <View style={styles.userInfo}>
            <Image 
              source={{ 
                uri: postUser.avatar_url || 'https://via.placeholder.com/40'
              }} 
              style={styles.avatar} 
            />
            <View style={styles.userNameTime}>
              <Text style={styles.username}>{postUser.username}</Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(post.date_created)}</Text>
            </View>
          </View>

          {/* Imaginea postării */}
          {post.image_url && (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: post.image_url }} 
                style={styles.postImage} 
                resizeMode="contain"
              />
            </View>
          )}

          {/* Conținutul postării */}
          <View style={styles.contentContainer}>
            <Text style={styles.contentText}>{post.content}</Text>
          </View>

          {/* Butoane de acțiune */}
          <View style={styles.actionButtons}>
            <View style={styles.leftButtons}>
              <Pressable 
                onPress={handleLike}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed
                ]}
              >
                <Ionicons 
                  name={liked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={liked ? "#FF6B6B" : "#fff"} 
                />
              </Pressable>
              <Pressable 
                onPress={() => {/* Focus pe input pentru comentarii */}}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed
                ]}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#fff" />
              </Pressable>
              <Pressable 
                onPress={handleSend}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed
                ]}
              >
                <Ionicons name="paper-plane-outline" size={24} color="#fff" />
              </Pressable>
            </View>
            <View style={styles.rightButtons}>
              <Pressable 
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed
                ]}
              >
                <Ionicons 
                  name={saved ? "bookmark" : "bookmark-outline"} 
                  size={24} 
                  color={saved ? "#6495ED" : "#fff"} 
                />
              </Pressable>
            </View>
          </View>

          {/* Secțiunea comentariilor */}
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
                  comments.map((comment) => (
                    <View key={comment.id_comment} style={styles.commentItem}>
                      <Image 
                        source={{ 
                          uri: comment.user?.avatar_url || 'https://via.placeholder.com/30'
                        }} 
                        style={styles.commentAvatar} 
                      />
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentUsername}>
                            {comment.user?.username || 'Utilizator necunoscut'}
                          </Text>
                          <Text style={styles.commentTime}>
                            {formatTimeAgo(comment.date_created)}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{comment.content}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noComments}>Nu există comentarii încă.</Text>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Input pentru comentarii */}
        <View style={styles.commentInputContainer}>
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
              <Ionicons name="send" size={20} color="#007AFF" />
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
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#333',
  },
  userNameTime: {
    flexDirection: 'column',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#fff',
  },
  timeAgo: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 2,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    minHeight: 300,
    maxHeight: screenHeight * 0.6,
  },
  postImage: {
    width: screenWidth,
    height: screenHeight * 0.5,
  },
  contentContainer: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
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
    marginHorizontal: 8,
    borderRadius: 20,
  },
  buttonPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    opacity: 0.7,
  },
  commentsSection: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingHorizontal: 16,
    paddingTop: 16,
    minHeight: 200,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#ccc',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: '#333',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 18,
  },
  noComments: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,122,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
}); 