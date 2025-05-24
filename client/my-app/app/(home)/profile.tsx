import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import EditProfileModal from './components/EditProfileModal';
import ProfileHeader from './components/ProfileHeader';
import UserPostsGrid from './components/UserPostsGrid';
import useUserProfile from './hooks/useUserProfile';
import PostDetailModal from '../../components/PostDetailModal';
import { Post } from '../utils/types';

export default function ProfileScreen() {
  const router = useRouter();
  
  const {
    user, 
    profile,
    posts,
    refreshing,
    loading, 
    postCount,
    connectionCount,
    loadProfile,
    handleRefresh,
    requestUsernameChangeVerification,
  } = useUserProfile();

  const [editModalVisible, setEditModalVisible] = useState(false);

  // State pentru modal-ul de detalii postare
  const [postDetailVisible, setPostDetailVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedPostUser, setSelectedPostUser] = useState<any>(null);

  const openEditModal = () => {
    setEditModalVisible(true);
  };

  // Funcții pentru gestionarea modalului de detalii postare
  const openPostDetail = (post: Post) => {
    // Convertim tipul Post la tipul compatibil cu PostDetailModal
    const postData = {
      id_post: post.id_post,
      content: post.content,
      image_url: post.image_url || '',
      id_user: post.id_user,
      is_published: post.is_published,
      date_created: post.date_created,
      date_updated: post.date_updated,
    };

    const userData = {
      id: user?.id || '',
      username: user?.username || profile?.username || 'Utilizator',
      avatar_url: user?.imageUrl || profile?.profile_picture || undefined,
    };

    setSelectedPost(postData);
    setSelectedPostUser(userData);
    setPostDetailVisible(true);
  };

  const closePostDetail = () => {
    setPostDetailVisible(false);
    setSelectedPost(null);
    setSelectedPostUser(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Se încarcă profilul...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor={'#007AFF'}
              title={'Se reîmprospătează...'}
              titleColor={'#666'}
            />
          }
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                const canGoBack = router.canGoBack();
                if (canGoBack) {
                  router.back();
                } else {
                  console.log('Nu există o pagină anterioară, navigare către home');
                  router.replace('/(home)');
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {profile?.username || user?.username || 'Profil'}
            </Text>
            <TouchableOpacity style={styles.settingsButton} onPress={() => console.log('TODO: De facut trimiterea catre setari')}>
              <Ionicons name="settings-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ProfileHeader 
            user={user}
            profile={profile}
            postCount={postCount}
            connectionCount={connectionCount}
            onEditPress={openEditModal}
          />

          <UserPostsGrid posts={posts} onPostPress={openPostDetail} />
          
        </ScrollView>

        <EditProfileModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          user={user}
          profile={profile}
          loadProfile={loadProfile}
          requestUsernameChangeVerification={requestUsernameChangeVerification}
        />

        <PostDetailModal
          visible={postDetailVisible}
          onClose={closePostDetail}
          post={selectedPost}
          postUser={selectedPostUser}
          currentUserId={user?.id}
        />

        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(home)')}
          >
            <Ionicons name="home-outline" size={24} color="#666" />
            <Text style={styles.navText}>Acasă</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {
              console.log('Pagina de explore trebuie configurată');
            }}
          >
            <Ionicons name="compass-outline" size={24} color="#666" />
            <Text style={styles.navText}>Explorează</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/(home)/create-post')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#666" />
            <Text style={styles.navText}>Postează</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {
              console.log('Pagina de notificări trebuie configurată');
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#666" />
            <Text style={styles.navText}>Notificări</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(home)/profile')}>
            <Ionicons name="person" size={24} color="#007AFF" />
            <Text style={styles.navTextActive}>Profil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  navTextActive: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
  },
}); 