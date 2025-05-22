import { useUser } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { Text, View, StyleSheet, Image, TouchableOpacity, FlatList, SafeAreaView, RefreshControl, Alert, StatusBar, Platform } from 'react-native'
import { SignOutButton } from '../../components/SignOutButton'
import { Ionicons } from '@expo/vector-icons'
import PostList from '../../components/PostList'
import SvgLogo from '../../components/SvgLogo'
import DeveloperInfoDialog from '../../components/DeveloperInfoDialog'
import React, { useState, useEffect, useCallback, useRef } from 'react'

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

  useEffect(() => {
    // Populăm feed-ul cu toate tipurile de conținut
    setFeedItems([
      { id: 'stories', type: 'story' },
      { id: 'post-empty', type: 'post' },
      { id: 'db-data', type: 'dbdata' }
    ])
  }, [])

  // Funcția care se declanșează când un PostList a terminat de reîncărcat datele
  const handlePostsRefreshed = useCallback(() => {
    console.log('Datele din PostList au fost reîmprospătate')
  }, [])

  // Funcție pentru a reîncărca toate datele din aplicație, inclusiv datele utilizatorului
  const onRefresh = useCallback(async () => {
    console.log('Începe reîmprospătarea tuturor datelor...')
    setRefreshing(true)
    
    // 1. Reîncărcăm datele utilizatorului de la Clerk pentru a actualiza poza de profil
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
      { id: 'stories-' + new Date().getTime(), type: 'story' },
      { id: 'post-empty-' + new Date().getTime(), type: 'post' },
      { id: 'db-data-' + new Date().getTime(), type: 'dbdata' }
    ]
    
    setFeedItems(newFeedItems)
    
    // 3. Simulăm sfârșitul reîmprospatării după o scurtă întârziere
    setTimeout(() => {
      setRefreshing(false);
      console.log('Reîmprospătare completă');
    }, 1000);
  }, [isSignedIn, user])

  // Funcție pentru a renderiza diferite tipuri de conținut în feed
  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    switch (item.type) {
      case 'story':
        return (
          <View style={styles.storiesContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: 'add-story' }]}
              keyExtractor={(item) => item.id}
              renderItem={() => (
                <TouchableOpacity style={styles.storyItem}>
                  <View style={styles.addStoryButton}>
                    <Ionicons name="add" size={24} color="#fff" />
                  </View>
                  <Text style={styles.storyText}>Adaugă</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )
      
      case 'post':
        return (
          <View style={styles.feedContainer}>
            <Text style={styles.sectionTitle}>Feed</Text>
            <View style={styles.emptyFeed}>
              <Ionicons name="newspaper-outline" size={50} color="#ddd" />
              <Text style={styles.emptyFeedText}>Nu există postări încă</Text>
              <TouchableOpacity 
                style={styles.createPostButton}
                onPress={() => {
                  router.push('/(home)/create-post');
                }}
              >
                <Text style={styles.createPostText}>Creează prima postare</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      
      case 'dbdata':
        return (
          <View style={styles.dbDataContainer}>
            <Text style={styles.dbDataTitle}>Postari acasa</Text>
            <PostList 
              key={item.id} // Important pentru a forța re-renderarea
              onRefreshTriggered={handlePostsRefreshed}
              ref={postListRef}
            />
          </View>
        )
      
      default:
        return null
    }
  }

  // Header pentru feed
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: user?.imageUrl }} 
            style={styles.profileImage}
            // Adăugăm un cache buster pentru a forța reîncărcarea imaginii
            key={`profile-image-${refreshing ? 'refreshing' : 'idle'}`}
          />
          <View style={styles.welcomeText}>
            <Text style={styles.greeting}>Bună,</Text>
            <Text style={styles.username}>{user?.username || 'Utilizator'}</Text>
          </View>
        </View>
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
            onPress={() => {
              console.log('Pagina de explore trebuie configurată');
              Alert.alert('Informație', 'Această pagină nu este încă configurată.');
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </TouchableOpacity>
          <SignOutButton />
        </View>
      </View>
    </View>
  )

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
              console.log('Pagina de profil trebuie configurată');
              Alert.alert('Informație', 'Această pagină nu este încă configurată.');
            }}
          >
            <Ionicons name="person-outline" size={24} color="#666" />
            <Text style={styles.navText}>Profil</Text>
          </TouchableOpacity>
        </View>
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
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 40,
    marginRight: 10,
  },
  welcomeText: {
    flexDirection: 'column',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 25,
  },
  headerButton: {
    padding: 8,
    marginLeft: 12,
    zIndex: 30,
  },
  storiesContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  addStoryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  storyText: {
    fontSize: 12,
    color: '#333',
  },
  feedContainer: {
    padding: 15,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyFeed: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyFeedText: {
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
})
