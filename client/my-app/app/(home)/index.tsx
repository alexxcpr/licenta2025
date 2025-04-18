import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Text, View, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native'
import { SignOutButton } from '../../components/SignOutButton'
import { Ionicons } from '@expo/vector-icons'
import DbTestQuery from '../../components/DbTestQuery'

export default function HomePage() {
  const { user } = useUser()
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: user?.imageUrl }} 
            style={styles.profileImage}
          />
          <View style={styles.welcomeText}>
            <Text style={styles.greeting}>Bună,</Text>
            <Text style={styles.username}>{user?.username || 'Utilizator'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {/* Stories Section */}
        <View style={styles.storiesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.storyItem}>
              <View style={styles.addStoryButton}>
                <Ionicons name="add" size={24} color="#fff" />
              </View>
              <Text style={styles.storyText}>Adaugă</Text>
            </TouchableOpacity>
            {/* Add more story items here */}
          </ScrollView>
        </View>

        {/* Feed Section */}
        <View style={styles.feedContainer}>
          <DbTestQuery />
          <Text style={styles.sectionTitle}>Feed</Text>
          {/* Add feed items here */}
          <View style={styles.emptyFeed}>
            <Ionicons name="newspaper-outline" size={50} color="#ddd" />
            <Text style={styles.emptyFeedText}>Nu există postări încă</Text>
            <TouchableOpacity 
              style={styles.createPostButton}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.createPostText}>Creează prima postare</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#007AFF" />
          <Text style={styles.navTextActive}>Acasă</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Ionicons name="compass-outline" size={24} color="#666" />
          <Text style={styles.navText}>Explorează</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#666" />
          <Text style={styles.navText}>Postează</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Ionicons name="notifications-outline" size={24} color="#666" />
          <Text style={styles.navText}>Notificări</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Ionicons name="person-outline" size={24} color="#666" />
          <Text style={styles.navText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  settingsButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  storiesContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    padding: 30,
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