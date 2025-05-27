import { useUser } from '@clerk/clerk-expo'
import { useRouter, useFocusEffect } from 'expo-router'
import { Text, View, StyleSheet, Image, TouchableOpacity, FlatList, SafeAreaView, RefreshControl, Alert, StatusBar, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import PostList from '../../components/PostList'
import SvgLogo from '../../components/SvgLogo'
import DeveloperInfoDialog from '../../components/DeveloperInfoDialog'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import AppSettingsMenu from '../../app/ui/postari/AppSettingsMenu'
import BottomNavigation from '../../app/ui/navigation/BottomNavigation'

// Tipul datelor pentru un post în feed
interface FeedItem {
  id: string;
  type: 'story' | 'post' | 'dbdata';
  content?: React.ReactNode;
}

// Cache pentru datele din feed
const feedCache = new Map<string, { data: FeedItem[], timestamp: number }>();
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minute

export default function HomePage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const postListRef = useRef<any>(null)
  const [developerInfoVisible, setDeveloperInfoVisible] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [forceRefresh, setForceRefresh] = useState(false)
  const initialLoadDoneRef = useRef(false) // Flag pentru încărcarea inițială
  
  // Funcție pentru a încărca feedul cu verificare cache
  const loadFeedData = useCallback(async (forceFetch = false) => {
    const cacheKey = 'home-feed' + (user?.id || 'guest');
    const now = Date.now();
    
    // Verificăm dacă datele sunt în cache și nu au expirat
    const cachedData = feedCache.get(cacheKey);
    
    if (!forceFetch && cachedData && (now - cachedData.timestamp < CACHE_EXPIRY_TIME)) {
      console.log("Folosim datele din cache pentru feed");
      setFeedItems(cachedData.data);
      return;
    }
    
    console.log('Încărcăm date noi pentru feed...');
    setRefreshing(true);
    
    try {
      // În acest caz, nu avem o cerere API reală, doar simulăm încărcarea
      // și generăm o listă de elemente pentru feed
      const newFeedItems: FeedItem[] = [
        { id: 'db-data-' + now, type: 'dbdata' }
      ];
      
      // Salvăm datele în cache
      feedCache.set(cacheKey, {
        data: newFeedItems,
        timestamp: now
      });
      
      setFeedItems(newFeedItems);
    } catch (error) {
      console.error('Eroare la încărcarea datelor feed:', error);
      Alert.alert('Eroare', 'Nu s-au putut încărca postările. Încercați din nou.');
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  // Folosim useFocusEffect pentru a ne asigura că nu reîncărcăm datele la fiecare focus
  // decât dacă este necesar (forceRefresh)
  useFocusEffect(
    useCallback(() => {
      // Verificăm dacă este prima încărcare sau dacă forțăm refresh-ul
      if (!initialLoadDoneRef.current || forceRefresh) {
        console.log('Încărcăm date la focus (inițial sau forțat)');
        loadFeedData(forceRefresh);
        initialLoadDoneRef.current = true;
        if (forceRefresh) {
          setForceRefresh(false);
        }
      } else {
        console.log('Screen refocat, folosim datele din cache');
      }
    }, [loadFeedData, forceRefresh])
  );
  
  // Efectul nu mai este necesar deoarece folosim useFocusEffect
  // useEffect(() => {
  //   loadFeedData(false);
  // }, [loadFeedData]);

  // Funcție pentru a actualiza datele
  const onRefresh = useCallback(async () => {
    console.log('Începe reîmprospătarea tuturor datelor...')
    
    if (isSignedIn && user) {
      try {
        await user.reload();
        console.log('Datele utilizatorului au fost reîmprospătate');
      } catch (error) {
        console.error('Eroare la reîmprospătarea datelor utilizatorului:', error);
      }
    }
    
    // Forțăm reîncărcarea datelor din feed
    await loadFeedData(true);
  }, [isSignedIn, user, loadFeedData])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <TouchableOpacity 
          style={styles.profileSection} 
          onPress={() => {
            if (user?.id) {
              router.push(`/(profile)/${user.id}` as any);
            }
          }}
        >
          <Image 
            source={{ uri: user?.imageUrl }} 
            style={styles.profileImage}
            key={`profile-image-${refreshing ? 'refreshing' : 'idle'}`}
          />
          <Text style={styles.profileNameText}>
            @{ (user?.username && user.username.length > 10 ? user.username.substring(0, 10) + '..' : user?.username) || 'Profil'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logoWrapper}>
        <SvgLogo 
          width={100} 
          height={100}
          color="#007AFF" 
          onPress={() => setDeveloperInfoVisible(true)}
        />
      </View>

      <View style={styles.rightSection}>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              console.log('Notificări');
              Alert.alert('Informație', 'Notificările vor fi implementate în curând.');
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleMenu}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    switch (item.type) {
      case 'dbdata':
        return (
          <View style={styles.dbDataContainer}>
            <Text style={styles.dbDataTitle}>Postari acasa</Text>
            <PostList 
              key={item.id}
              ref={postListRef}
            />
          </View>
        )
      
      default:
        return null
    }
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.container}>
        {/* Dialog cu informațiile developerului */}
        <DeveloperInfoDialog 
          visible={developerInfoVisible} 
          onClose={() => setDeveloperInfoVisible(false)} 
        />
        
        {/* Main Feed with Continuous Scroll and Pull to Refresh */}
        <View style={styles.mainContent}>
          <FlatList
            data={feedItems}
            keyExtractor={(item) => item.id}
            renderItem={renderFeedItem}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.feedList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#007AFF']} // Culoarea spinner-ului pe Android
                tintColor={'#007AFF'} // Culoarea spinner-ului pe iOS
                title={'Se reîncarcă...'} // Text afișat pe iOS sub spinner
                titleColor={'#666'} // Culoarea textului pe iOS
              />
            }
          />
        </View>

        {/* Bottom Navigation utilizând componenta reutilizabilă */}
        <View style={styles.bottomNavContainer}>
          <BottomNavigation activePage="home" />
        </View>

        {/* Side Menu refactorizat pentru a folosi AppSettingsMenu */}
        <AppSettingsMenu isVisible={isMenuOpen} onClose={toggleMenu} />

      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Schimbat din #f5f5f5 pentru a elimina spațiul gri
  },
  mainContent: {
    flex: 1,
  },
  feedList: {
    paddingBottom: 10,
  },
  bottomNavContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
    height: Platform.OS === 'ios' ? 110 : 100,
    paddingTop: Platform.OS === 'ios' ? 20 : 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logoWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Platform.OS === 'ios' ? 0 : 30,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 5,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
  },
  profileNameText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 12,
  },
  dbDataContainer: {
    backgroundColor: '#fff', // Schimbat din #f9f9f9 pentru consistență
    marginTop: 10,
    paddingBottom: 80, // Adăugăm padding pentru a permite scroll sub navbar
  },
  dbDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
    marginLeft: 15,
    color: '#333',
  },
})
