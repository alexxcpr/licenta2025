import { useUser } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { Text, View, StyleSheet, Image, TouchableOpacity, FlatList, SafeAreaView, RefreshControl, Alert, StatusBar, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import PostList from '../../components/PostList'
import SvgLogo from '../../components/SvgLogo'
import DeveloperInfoDialog from '../../components/DeveloperInfoDialog'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import AppSettingsMenu from '../../app/ui/postari/AppSettingsMenu'

// Tipul datelor pentru un post în feed
interface FeedItem {
  id: string;
  type: 'story' | 'post' | 'dbdata';
  content?: React.ReactNode;
}

export default function HomePage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const postListRef = useRef<any>(null)
  const [developerInfoVisible, setDeveloperInfoVisible] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    // Populăm feed-ul doar cu PostList
    setFeedItems([
      { id: 'db-data', type: 'dbdata' }
    ]);
  }, []);

  const onRefresh = useCallback(async () => {
    console.log('Începe reîmprospătarea tuturor datelor...')
    setRefreshing(true)
    
    if (isSignedIn && user) {
      try {
        await user.reload();
        console.log('Datele utilizatorului au fost reîmprospătate');
      } catch (error) {
        console.error('Eroare la reîmprospătarea datelor utilizatorului:', error);
      }
    }
    
    // 2. Generăm noi ID-uri pentru toate elementele din feed pentru a forța re-renderarea
    const newFeedItems: FeedItem[] = [
      { id: 'db-data-' + new Date().getTime(), type: 'dbdata' }
    ];
    
    setFeedItems(newFeedItems);
    
    // 3. Simulăm sfârșitul reîmprospatării după o scurtă întârziere
    setTimeout(() => {
      setRefreshing(false);
      console.log('Reîmprospătare completă');
    }, 1000);
  }, [isSignedIn, user])

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

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color="#007AFF" />
            <Text style={styles.navTextActive}>Acasă</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {
              console.log('Pagina de explore trebuie configurată');
              Alert.alert('Informație', 'Această pagină nu este încă configurată.');
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
              Alert.alert('Informație', 'Această pagină nu este încă configurată.');
            }}
          >
            <Ionicons name="notifications-outline" size={24} color="#666" />
            <Text style={styles.navText}>Notificări</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {
              if (user?.id) {
                router.push(`/(profile)/${user.id}` as any);
              }
            }}
          >
            <Ionicons name="person-outline" size={24} color="#666" />
            <Text style={styles.navText}>Profil</Text>
          </TouchableOpacity>
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
    backgroundColor: '#f5f5f5',
  },
  feedList: {
    paddingBottom: 10,
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
    backgroundColor: '#f9f9f9',
    marginTop: 10,
  },
  dbDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
    marginLeft: 15,
    color: '#333',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 5,
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
})
