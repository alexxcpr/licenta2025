import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  Animated
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import EditProfileModal from './components/EditProfileModal';
import PostDetailModal from '../ui/postari/PostDetailModal';
import { Post, UserProfile } from '../../utils/types';
import { getApiUrl } from '../../config/backend';
import AppSettingsMenu from '../../app/ui/postari/AppSettingsMenu';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import FullProfilePage from '../ui/profile/FullProfilePage';
import BottomNavigation from '../ui/navigation/BottomNavigation';

// Constante și praguri pentru gesturi
const SWIPE_THRESHOLD = 80;
const IS_WEB = Platform.OS === 'web';
const IS_IOS = Platform.OS === 'ios';

interface ProfileData {
  user: UserProfile;
  posts: Post[];
  postCount: number;
  connectionCount: number;
}

// Interfața pentru props-urile AnimatedProfileContent
interface AnimatedProfileContentProps {
  translateX: Animated.Value;
  scaleX: Animated.Value;
  currentUser: any;
  profileData: ProfileData;
  isOwnProfile: boolean;
  refreshing: boolean;
  handleRefresh: () => Promise<void>;
  openEditModal: () => void;
  openPostDetail: (post: Post) => void;
  goBack: () => void;
  toggleProfileMenu: () => void;
}

// Separăm logica de animație într-o componentă dedicată
const AnimatedProfileContent: React.FC<AnimatedProfileContentProps> = React.memo(({ 
  translateX, 
  scaleX, 
  currentUser, 
  profileData, 
  isOwnProfile, 
  refreshing, 
  handleRefresh, 
  openEditModal, 
  openPostDetail, 
  goBack, 
  toggleProfileMenu 
}) => {
  if (!profileData || !profileData.user) return null;
  
  // Folosim React.createElement pentru a evita probleme cu reconcilierea React
  return React.createElement(FullProfilePage, {
    user: currentUser,
    profile: profileData.user,
    posts: profileData.posts,
    postCount: profileData.postCount,
    connectionCount: profileData.connectionCount,
    isOwnProfile: isOwnProfile,
    isCurrentUserProfile: isOwnProfile,
    refreshing: refreshing,
    onRefresh: handleRefresh,
    onEditPress: openEditModal,
    onPostPress: openPostDetail,
    onGoBack: goBack,
    onSettingsPress: toggleProfileMenu,
    currentUserId: currentUser?.id
  });
});

// Creăm un cache global pentru datele profilului
const profileCache = new Map<string, { data: ProfileData, timestamp: number }>();
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minute

export default function DynamicProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useUser();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);

  // State pentru meniul de setări
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // State pentru modal-ul de detalii postare
  const [postDetailVisible, setPostDetailVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedPostUser, setSelectedPostUser] = useState<any>(null);

  // Referințe pentru animații - utilizăm referințe separate pentru animațiile JS și Native
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  
  // Culoare de fundal separată - Nu putem utiliza useNativeDriver pentru backgroundColor
  const [bgColor, setBgColor] = useState('#ffffff');

  // Verificăm explicit dacă ID-urile sunt string-uri și le comparăm corect
  const isOwnProfile = useMemo(() => {
    if (!currentUser?.id || !id) return false;
    const currentUserId = String(currentUser.id);
    const profileId = String(id);
    return currentUserId === profileId;
  }, [currentUser?.id, id]);

  // Înfășurăm loadProfile în useCallback
  const loadProfile = useCallback(async (forceFetch = false) => {
    if (!id) {
      setLoading(false);
      setProfileData(null);
      console.warn("ID-ul profilului lipsește.");
      return;
    }

    const cleanId = String(id).trim();
    
    // Verificăm dacă datele sunt în cache și nu au expirat, și nu s-a solicitat refresh
    const cachedData = profileCache.get(cleanId);
    const now = Date.now();
    
    if (!forceFetch && cachedData && (now - cachedData.timestamp < CACHE_EXPIRY_TIME)) {
      console.log("Folosind datele din cache pentru profilul", cleanId);
      setProfileData(cachedData.data);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true); 
    setRefreshing(true); 
    try {
      const response = await fetch(getApiUrl(`/users/profile/${cleanId}`), {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error(`Eroare HTTP: ${response.status} - ${response.statusText}`);
        const text = await response.text();
        console.error('Conținut răspuns:', text);
        setProfileData(null); 
        Alert.alert('Eroare Server', `Eroare la încărcarea profilului: ${response.status}`);
        throw new Error(`Eroare la încărcarea profilului: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Salvăm datele în cache
        profileCache.set(cleanId, {
          data: data.data,
          timestamp: now
        });
        
        setProfileData(data.data);
      } else {
        console.error('API a returnat eroare:', data);
        setProfileData(null); 
        Alert.alert('Eroare API', data.message || 'Nu s-au putut încărca datele profilului');
      }
    } catch (error) {
      console.error('Eroare la încărcarea profilului:', error);
      setProfileData(null); 
      Alert.alert('Eroare Critică', 'Nu s-au putut încărca datele profilului din cauza unei erori neașteptate.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  // Efect pentru resetarea animațiilor la navigare
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      translateX.setValue(0);
      scaleX.setValue(1);
      setBgColor('#ffffff');
      
      // La reîncărcarea paginii, verificăm dacă avem datele în cache
      if (id) {
        loadProfile(forceRefresh);
        setForceRefresh(false); // Resetăm flag-ul
      }
    });

    return unsubscribe;
  }, [navigation, translateX, scaleX, id, loadProfile, forceRefresh]);

  // Încărcăm profilul doar prima dată
  useEffect(() => {
    loadProfile(false);
  }, [loadProfile]);

  const handleRefresh = useCallback(async () => {
    // La refresh explicit, forțăm reîncărcarea datelor
    await loadProfile(true);
  }, [loadProfile]);

  const openEditModal = useCallback(() => {
    setEditModalVisible(true);
  }, []);

  const toggleProfileMenu = useCallback(() => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  }, [isProfileMenuOpen]);

  const openPostDetail = useCallback((post: Post) => {
    if (!profileData) return;
    
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
      id: profileData.user.id_user || '',
      username: profileData.user.username || 'Utilizator',
      avatar_url: profileData.user.profile_picture || undefined,
    };

    setSelectedPost(postData);
    setSelectedPostUser(userData);
    setPostDetailVisible(true);
  }, [profileData]);

  const closePostDetail = useCallback(() => {
    setPostDetailVisible(false);
    setSelectedPost(null);
    setSelectedPostUser(null);
  }, []);

  // Navigare înapoi cu animație
  const goBack = useCallback(() => {
    // Asigurăm că utilizăm separate animația pentru culoare (JS) de cele native
    // iOS are probleme când amestecăm useNativeDriver true/false pe același nod
    setBgColor('#f2f2f2');
    
    // Animațiile native separat
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleX, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/(home)' as any);
      }
    });
  }, [router, translateX, scaleX]);

  // Funcție pentru gestionarea gestului de swipe pe web
  const handleWebSwipe = useCallback((e: any) => {
    if (!IS_WEB) return;
    
    const touchStartX = (e.touches?.[0]?.clientX || e.nativeEvent?.pageX || 0);
    
    const handleTouchMove = (moveEvent: any) => {
      const currentX = moveEvent.touches?.[0]?.clientX || moveEvent.nativeEvent?.pageX || 0;
      const deltaX = currentX - touchStartX;
      
      if (deltaX > 0) {
        // Actualizăm transformările (native)
        translateX.setValue(deltaX);
        const scale = Math.max(0.9, 1 - (deltaX / 1000));
        scaleX.setValue(scale);
        
        // Culoarea de fundal (non-nativă) - gestionată separat
        if (deltaX > 30) {
          setBgColor('#f2f2f2');
        }
      }
    };
    
    const handleTouchEnd = (endEvent: any) => {
      const endX = endEvent.changedTouches?.[0]?.clientX || endEvent.nativeEvent?.pageX || 0;
      const deltaX = endX - touchStartX;
      
      if (deltaX > SWIPE_THRESHOLD) {
        goBack();
      } else {
        // Anulăm animația
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 5,
          }),
          Animated.spring(scaleX, {
            toValue: 1,
            useNativeDriver: true,
            bounciness: 5,
          })
        ]).start();
        
        // Resetăm culoarea separat
        setBgColor('#ffffff');
      }
      
      // Curățăm event listeners
      if (IS_WEB && typeof document !== 'undefined') {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    // Adăugăm event listeners
    if (IS_WEB && typeof document !== 'undefined') {
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
  }, [translateX, scaleX, goBack]);

  // Gestionarea gestului de swipe pentru dispozitive mobile
  const onGestureEvent = useCallback(({ nativeEvent }: { nativeEvent: any }) => {
    if (nativeEvent.translationX > 0) {
      // Animații native
      translateX.setValue(nativeEvent.translationX);
      const scale = Math.max(0.9, 1 - (nativeEvent.translationX / 1000));
      scaleX.setValue(scale);
      
      // Culoarea de fundal non-nativă - actualizată separat
      if (nativeEvent.translationX > 30) {
        setBgColor('#f2f2f2');
      }
    }
  }, [translateX, scaleX]);

  const onGestureEnd = useCallback(({ nativeEvent }: { nativeEvent: any }) => {
    if (nativeEvent.translationX > SWIPE_THRESHOLD) {
      goBack();
    } else {
      // Animațiile native separat
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 5,
        }),
        Animated.spring(scaleX, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 5,
        })
      ]).start();
      
      // Resetăm culoarea separat
      setBgColor('#ffffff');
    }
  }, [translateX, scaleX, goBack]);

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

  // Randare condiționată simplificată
  const renderContent = () => {
    if (!profileData) return null;

    // Folosim variabile constante pentru a evita re-evaluări
    const profileProps: AnimatedProfileContentProps = {
      translateX,
      scaleX,
      currentUser,
      profileData,
      isOwnProfile,
      refreshing,
      handleRefresh,
      openEditModal,
      openPostDetail,
      goBack,
      toggleProfileMenu
    };

    return (
      <AnimatedProfileContent {...profileProps} />
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {IS_WEB ? (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          <Animated.View 
            style={[
              styles.animatedContent,
              {
                transform: [
                  { translateX }, 
                  { scaleX }
                ]
              }
            ]}
            onTouchStart={handleWebSwipe}
          >
            {renderContent()}
          </Animated.View>
          
          {/* Bottom Navigation */}
          <BottomNavigation activePage="profile" />
        </View>
      ) : (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onEnded={onGestureEnd}
          >
            <Animated.View 
              style={[
                styles.animatedContent,
                {
                  transform: [
                    { translateX }, 
                    { scaleX }
                  ]
                }
              ]}
            >
              {renderContent()}
            </Animated.View>
          </PanGestureHandler>
          
          {/* Bottom Navigation */}
          <BottomNavigation activePage="profile" />
        </View>
      )}
      
      {isOwnProfile && (
        <EditProfileModal
          visible={editModalVisible}
          onClose={() => {
            setEditModalVisible(false);
            // Marcare că trebuie reîncărcat profilul la următorul focus
            setForceRefresh(true);
          }}
          user={currentUser}
          profile={profileData.user}
          loadProfile={loadProfile}
          requestUsernameChangeVerification={async (newUsername: string) => {
            if (!currentUser) return false;
            try {
              await currentUser.update({ username: newUsername }); 
              return true; 
            } catch (error) {
              console.error('Eroare la actualizarea username-ului în Clerk:', error);
              Alert.alert('Eroare', 'Nu s-a putut actualiza numele de utilizator.');
              return false;
            }
          }}
        />
      )}

      <PostDetailModal
        visible={postDetailVisible}
        onClose={closePostDetail}
        post={selectedPost}
        postUser={selectedPostUser}
        currentUserId={currentUser?.id}
      />

      <AppSettingsMenu isVisible={isProfileMenuOpen} onClose={toggleProfileMenu} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContent: {
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
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
}); 