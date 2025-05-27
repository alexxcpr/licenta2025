import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions
} from 'react-native';

interface PostContentProps {
  imageUrl?: string;
  onPress: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const PostContent = ({ imageUrl, onPress }: PostContentProps) => {
  // Dacă nu există imagine, nu afișăm nimic
  if (!imageUrl) return null;

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.postImage} 
          resizeMode={Platform.OS === 'web' ? 'contain' : 'cover'}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
    overflow: 'hidden',
  },
  postImage: {
    height: Platform.OS === 'web' ? 320 : 300,
    width: '100%',
    backgroundColor: '#f0f0f0', // Culoare de fundal pentru a evita probleme de transparență
  },
});

export default PostContent; 