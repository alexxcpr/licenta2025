import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

//utils
import navigateToProfile from '@/app/utils/Navigation';

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

interface ExploreFeedPostProps {
  post: PostData;
  postUser: UserData;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onPostPress: () => void;
  onUserPress: () => void;
}

export default function ExploreFeedPost({
  post,
  postUser,
  isLiked,
  isSaved,
  onLike,
  onComment,
  onShare,
  onSave,
  onPostPress,
  onUserPress,
}: ExploreFeedPostProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'ieri';
    } else if (diffDays < 7) {
      return `acum ${diffDays} zile`;
    } else {
      return date.toLocaleDateString('ro-RO');
    }
  };

  const profileImageUrl = postUser.avatar_url || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png';

  return (
    <View style={styles.container}>
      {/* Header cu informațiile utilizatorului */}
      <TouchableOpacity style={styles.header} onPress={() => navigateToProfile(postUser.id)}>
        <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{postUser.username}</Text>
          <Text style={styles.timeStamp}>{formatDate(post.date_created)}</Text>
        </View>
      </TouchableOpacity>

      {/* Conținutul postării */}
      <TouchableOpacity style={styles.content} onPress={onPostPress}>
        <Text style={styles.contentText} numberOfLines={3}>
          {post.content}
        </Text>
        
        {/* Imaginea postării dacă există */}
        {post.image_url && (
          <Image source={{ uri: post.image_url }} style={styles.postImage} />
        )}
      </TouchableOpacity>

      {/* Footer cu acțiuni - ordinea conform PostActions.tsx */}
      <View style={styles.footer}>
        <View style={styles.leftButtons}>
          {/* Buton Like */}
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={isLiked ? "#007AFF" : "#666"} 
            />
          </TouchableOpacity>

          {/* Buton Comment */}
          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
          </TouchableOpacity>

          {/* Buton Share */}
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Ionicons name="paper-plane-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Spațiere flexibilă */}
        <View style={{ flex: 1 }} />

        <View style={styles.rightButtons}>
          {/* Buton Save */}
          <TouchableOpacity style={styles.actionButton} onPress={onSave}>
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={isSaved ? "#6495ED" : "#666"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  timeStamp: {
    fontSize: 12,
    color: '#888',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  contentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
}); 