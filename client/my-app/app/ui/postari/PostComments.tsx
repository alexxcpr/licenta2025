import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable
} from 'react-native';

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

interface PostCommentsProps {
  comments: CommentData[];
  postId: number;
  onViewAllComments: () => void;
  onUserPress: (userId: string) => void;
}

const PostComments = ({
  comments,
  postId,
  onViewAllComments,
  onUserPress
}: PostCommentsProps) => {
  if (!comments || comments.length === 0) {
    return (
      <TouchableOpacity onPress={onViewAllComments}>
        <Text style={styles.noComments}>Nu există comentarii pentru această postare</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.commentsSection}>
      {comments.map(comment => {
        const username = comment.user?.username;
        const displayName = (username && username.length > 20 ? username.substring(0, 20) + '..' : username) || 'Utilizator';
        return (
          <View key={comment.id_comment} style={styles.commentItem}>
            <TouchableOpacity onPress={() => onUserPress(comment.id_user)}>
              <Text style={styles.commentUsername}>
                {displayName}:
              </Text>
            </TouchableOpacity>
            <Text style={styles.commentContent}>{comment.content}</Text>
          </View>
        );
      })}
      
      {/* Link pentru a vedea toate comentariile - afișat doar dacă avem exact 2 comentarii */}
      {comments.length === 2 && (
        <Pressable
          style={({ pressed }) => [
            styles.viewAllCommentsButton,
            pressed && styles.linkPressed
          ]}
          onPress={onViewAllComments}
        >
          <Text style={styles.viewAllComments}>Vezi toate comentariile...</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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

export default PostComments; 