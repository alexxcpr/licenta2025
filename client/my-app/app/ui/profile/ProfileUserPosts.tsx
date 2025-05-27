import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControlProps
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../../utils/types';

interface ProfileUserPostsProps {
  posts: Post[];
  onPostPress: (post: Post) => void;
  isOwnProfile: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

// Componentă separată pentru a afișa fiecare post
const PostItem: React.FC<{
  item: Post;
  itemSize: number;
  onPress: (post: Post) => void;
}> = ({ item, itemSize, onPress }) => {
  const [imageLoading, setImageLoading] = useState(true);
  
  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      style={[styles.gridItem, { width: itemSize, height: itemSize }]}
    >
      {item.image_url ? (
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}
          <Image
            source={{ uri: item.image_url }}
            style={styles.postImage}
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
        </View>
      ) : (
        <View style={styles.textPostContainer}>
          <Text style={styles.textPostIndicator} numberOfLines={3}>
            {item.content}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const ProfileUserPosts: React.FC<ProfileUserPostsProps> = ({
  posts,
  onPostPress,
  isOwnProfile,
  ListHeaderComponent,
  refreshControl
}) => {
  // Calculăm dimensiunea fiecărei imagini din grid (3 pe rând)
  const screenWidth = Dimensions.get('window').width;
  const itemSize = screenWidth / 3 - 2;
  
  // Folosim o componentă separată în loc de funcția renderItem
  const renderItem = ({ item }: { item: Post }) => (
    <PostItem item={item} itemSize={itemSize} onPress={onPostPress} />
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>
        {isOwnProfile 
          ? "Nu ai postat nimic încă. Începe să postezi pentru a-ți crește rețeaua!" 
          : "Acest utilizator nu a postat nimic încă."}
      </Text>
      {isOwnProfile && (
        <TouchableOpacity 
          style={styles.createPostButton}
          onPress={() => console.log('Navigate to create post')}
        >
          <Text style={styles.createPostText}>Creează o postare</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => `post-${item.id_post}`}
      numColumns={3}
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      refreshControl={refreshControl}
      ListEmptyComponent={posts.length === 0 ? ListEmptyComponent : null}
      contentContainerStyle={posts.length === 0 && !ListHeaderComponent ? styles.emptyFlatListWithNoHeader : styles.contentContainer}
      // Adăugăm un spațiu suplimentar la sfârșit pentru a evita acoperirea conținutului cu bottom navigation
      ListFooterComponent={<View style={{ height: 80 }} />}
    />
  );
};

const styles = StyleSheet.create({
  gridItem: {
    margin: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  textPostContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  textPostIndicator: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  createPostButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createPostText: {
    color: '#fff',
    fontWeight: '600',
  },
  contentContainer: {
    // Poate fi folosit pentru padding sau alte stiluri generale ale conținutului listei
  },
  emptyFlatListWithNoHeader: {
    flex: 1, // Asigură că ListEmptyComponent umple ecranul dacă nu există header
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default ProfileUserPosts; 