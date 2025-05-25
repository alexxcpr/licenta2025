import React, { useState, useEffect, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import EditProfileModal from './components/EditProfileModal';
import ProfileHeader from './components/ProfileHeader';
import UserPostsGrid from '../(home)/components/UserPostsGrid';
import PostDetailModal from '../(home)/components/PostDetailModal';
import { Post, UserProfile } from '../../utils/types';
import { getApiUrl } from '../../config/backend';

interface ProfileData {
  user: UserProfile;
  posts: Post[];
  postCount: number;
  connectionCount: number;
}

export default function DynamicProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useUser();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // State pentru modal-ul de detalii postare
  const [postDetailVisible, setPostDetailVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedPostUser, setSelectedPostUser] = useState<any>(null);

  // Verificăm explicit dacă ID-urile sunt string-uri și le comparăm corect
  const isOwnProfile = useMemo(() => {
    // Verifică dacă ambele ID-uri există și sunt de tip string
    if (!currentUser?.id || !id) return false;
    // Compară ID-urile exact
    const currentUserId = String(currentUser.id);
    const profileId = String(id);
    console.log('Comparare ID-uri:', { 
      currentUserId, 
      profileId, 
      areEqual: currentUserId === profileId 
    });
    return currentUserId === profileId;
  }, [currentUser?.id, id]);

  const loadProfile = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // Asigură că id-ul este trimis corect către backend
      const cleanId = String(id).trim();      
      // Adăugăm headerul necesar pentru a evita avertizarea ngrok
      const response = await fetch(getApiUrl(`/users/profile/${cleanId}`), {
        headers: {
          'ngrok-skip-browser-warning': 'true', // Acest header permite evitarea paginii de avertizare ngrok
          'Content-Type': 'application/json',
        }
      });
      
      // Verificăm dacă răspunsul e valid înainte de a încerca să-l parsăm ca JSON
      if (!response.ok) {
        console.error(`Eroare HTTP: ${response.status} - ${response.statusText}`);
        const text = await response.text();
        console.error('Conținut răspuns:', text);
        throw new Error(`Eroare la încărcarea profilului: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setProfileData(data.data);
      } else {
        console.error('API a returnat eroare:', data);
        Alert.alert('Eroare', 'Nu s-au putut încărca datele profilului');
      }
    } catch (error) {
      console.error('Eroare la încărcarea profilului:', error);
      Alert.alert('Eroare', 'Nu s-au putut încărca datele profilului');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
    console.log('useEffect[id]: currentUser.id:', currentUser?.id, 'profile id:', id, 'isOwnProfile:', isOwnProfile);
  }, [id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
  };

  const openEditModal = () => {
    setEditModalVisible(true);
  };

  const openPostDetail = (post: Post) => {
    const postData = {
      id_post: post.id_post,
      content: post.content,
      image_url: post.image_url || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images/post-error.png',
      id_user: post.id_user,
      is_published: post.is_published,
      date_created: post.date_created,
      date_updated: post.date_updated,
    };

    const userData = {
      id: profileData?.user.id_user || '',
      username: profileData?.user.username || 'Utilizator',
      avatar_url: profileData?.user.profile_picture || undefined,
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

  if (!profileData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Profilul nu a fost găsit</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(home)' as any)}
        >
          <Text style={styles.backButtonText}>Acasă</Text>
        </TouchableOpacity>
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
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.push('/(home)' as any);
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {profileData.user.username || 'Profil'}
            </Text>
            <TouchableOpacity 
              style={styles.settingsButton} 
              onPress={() => console.log('TODO: Setări')}
            >
              <Ionicons name="settings-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ProfileHeader 
            user={null}
            profile={profileData.user}
            postCount={profileData.postCount}
            connectionCount={profileData.connectionCount}
            onEditPress={isOwnProfile ? openEditModal : () => {}}
            isOwnProfile={isOwnProfile}
          />

          <UserPostsGrid 
            posts={profileData.posts} 
            onPostPress={openPostDetail} 
            isOwnProfile={isOwnProfile}
          />
          
        </ScrollView>

        {isOwnProfile && (
          <EditProfileModal
            visible={editModalVisible}
            onClose={() => setEditModalVisible(false)}
            user={null}
            profile={profileData.user}
            loadProfile={loadProfile}
            requestUsernameChangeVerification={async () => false}
          />
        )}

        <PostDetailModal
          visible={postDetailVisible}
          onClose={closePostDetail}
          post={selectedPost}
          postUser={selectedPostUser}
          currentUserId={currentUser?.id}
        />

        {/* Bottom Navigation */}
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
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => {
              if (currentUser?.id) {
                router.push(`/(profile)/${currentUser.id}` as any);
              }
            }}
          >
            <Ionicons 
              name={isOwnProfile ? "person" : "person-outline"} 
              size={24} 
              color={isOwnProfile ? "#007AFF" : "#666"} 
            />
            <Text style={isOwnProfile ? styles.navTextActive : styles.navText}>
              Profil
            </Text>
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
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
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
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
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
  noPostsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  noPostsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  createPostButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  createPostButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
}); 