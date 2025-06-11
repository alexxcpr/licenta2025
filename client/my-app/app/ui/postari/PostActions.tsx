import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import { toggleLike, toggleSave, handleSend, checkPostStatus } from '../../../utils/postActions';

interface PostActionsProps {
  postId: number;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onComment: () => void;
  onSend: () => void;
  onSave: () => void;
}

const PostActions = ({
  postId,
  isLiked,
  isSaved,
  onLike,
  onComment,
  onSend,
  onSave
}: PostActionsProps) => {
  return (
    <View style={styles.actionsContainer}>
      <View style={styles.leftButtons}>
        {/* Buton Like */}
        <Pressable 
          onPress={onLike}
          android_ripple={{ color: '#ddd', borderless: true }}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? "#007AFF" : "#333"} 
          />
        </Pressable>
        
        {/* Buton Comment */}
        <Pressable 
          onPress={onComment}
          android_ripple={{ color: '#ddd', borderless: true }}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#333" />
        </Pressable>
        
        {/* Buton Send - mutat lângă Comment conform cerinței */}
        {/* <Pressable 
          onPress={onSend}
          android_ripple={{ color: '#ddd', borderless: true }}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Ionicons name="paper-plane-outline" size={24} color="#333" />
        </Pressable> */}
      </View>
      
      {/* Spațiere flexibilă */}
      <View style={{ flex: 1 }} />
      
      <View style={styles.rightButtons}>
        {/* Buton Save */}
        <Pressable 
          onPress={onSave}
          android_ripple={{ color: '#ddd', borderless: true }}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isSaved ? "#6495ED" : "#333"} 
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
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
});

export default PostActions; 