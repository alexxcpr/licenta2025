import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PostHeaderProps {
  postUser: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  dateCreated: string;
  content: string;
  onOptionsPress: () => void;
  onUserPress: () => void;
}

const PostHeader = ({
  postUser,
  dateCreated,
  content,
  onOptionsPress,
  onUserPress
}: PostHeaderProps) => {
  
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

  return (
    <View>
      {/* Header postare */}
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={onUserPress}
          activeOpacity={0.7}
        >
          <Image 
            source={{ 
              uri: postUser.avatar_url || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png'
            }} 
            style={styles.avatar} 
          />
          <View style={styles.userNameTime}>
            <Text style={styles.username}>
              {postUser.username && postUser.username.length > 20 
                ? postUser.username.substring(0, 20) + '...' 
                : postUser.username || 'Utilizator'}
            </Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(dateCreated)}</Text>
          </View>
        </TouchableOpacity>
        <Pressable 
          style={({ pressed }) => [
            styles.optionsButton,
            pressed && styles.buttonPressed
          ]}
          android_ripple={{ color: '#ddd', borderless: true }}
          onPress={onOptionsPress}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
        </Pressable>
      </View>

      {/* Conținutul textual al postării */}
      <Text style={styles.contentText}>{content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: '#f0f0f0', // Culoare de fundal pentru a evita probleme de transparență
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
    padding: 8, 
  },
  buttonPressed: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
    borderRadius: 20,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    padding: 16,
    paddingTop: 0,
    marginHorizontal: 0,
  },
});

export default PostHeader; 