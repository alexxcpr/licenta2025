import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../utils/types';
import { useRouter } from 'expo-router'; // Necesar pentru butonul "Adaugă prima postare"

interface UserPostsGridProps {
  posts: Post[];
  // onPostPress: (postId: number) => void; // TODO: Definește acțiunea la apăsarea unei postări
}

const windowWidth = Dimensions.get('window').width;

export default function UserPostsGrid({ posts }: UserPostsGridProps) {
  const router = useRouter();

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={[styles.postItem, { width: windowWidth / 3 - 4 }]}
      onPress={() => {
        console.log('Vizualizare postare (din UserPostsGrid):', item.id_post);
        // Implementează navigarea către vizualizarea postării dacă este necesar
      }}
    >
      {item.image_url ? (
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.postImage} 
          resizeMode="cover"
        />
      ) : (
        <View style={styles.textPostItem}>
          <Text style={styles.textPostContent} numberOfLines={4}>
            {item.content}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.postsContainer}>
      <View style={styles.postsHeader}>
        <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
          <Ionicons name="grid-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton} onPress={() => console.log('List view tab')}>
          <Ionicons name="list-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton} onPress={() => console.log('Bookmarks tab')}>
          <Ionicons name="bookmark-outline" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {posts.length > 0 ? (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id_post.toString()}
          numColumns={3}
          scrollEnabled={false} // De obicei, ScrollView-ul părinte gestionează scroll-ul
          contentContainerStyle={styles.postsGrid}
        />
      ) : (
        <View style={styles.emptyPostsContainer}>
          <Ionicons name="images-outline" size={50} color="#ddd" />
          <Text style={styles.emptyPostsText}>Nu există postări încă</Text>
          <TouchableOpacity 
            style={styles.createPostButton}
            onPress={() => router.push('/(home)/create-post')} // Navigare către crearea postării
          >
            <Text style={styles.createPostText}>Adaugă prima postare</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  postsContainer: {
    flex: 1,
    marginTop: 8,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  postsGrid: {
    paddingVertical: 2,
  },
  postItem: {
    height: 120, // Sau windowWidth / 3 - 4 pentru a fi pătrat
    margin: 1,
    backgroundColor: '#eee', // Placeholder în caz că imaginea nu se încarcă
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  textPostItem: {
    backgroundColor: '#f5f5f5',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  textPostContent: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  emptyPostsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyPostsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
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
    fontWeight: 'bold',
  },
}); 