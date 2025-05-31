import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';

// Definim tipurile de pagini active posibile
export type ActivePage = 'home' | 'explore' | 'post' | 'chats' | 'profile';

interface BottomNavigationProps {
  activePage: ActivePage;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activePage }) => {
  const router = useRouter();
  const { user } = useUser();

  // Obținem iconițe și text pentru fiecare tab
  const getIconName = (page: string): any => {
    switch (page) {
      case 'home':
        return activePage === 'home' ? 'home' : 'home-outline';
      case 'explore':
        return activePage === 'explore' ? 'compass' : 'compass-outline';
      case 'post':
        return activePage === 'post' ? 'add-circle' : 'add-circle-outline';
      case 'chats':
        return activePage === 'chats' ? 'chatbubbles' : 'chatbubbles-outline';
      case 'profile':
        return activePage === 'profile' ? 'person' : 'person-outline';
      default:
        return 'help-circle-outline';
    }
  };

  // Obținem culoarea pentru fiecare tab
  const getColor = (page: string): string => {
    return activePage === page ? '#007AFF' : '#666';
  };

  // Funcție pentru navigare
  const navigate = (page: ActivePage) => {
    switch (page) {
      case 'home':
        router.push('/(home)' as any);
        break;
      case 'explore':
        // Implementare viitoare
        break;
      case 'post':
        router.push('/(home)/create-post' as any);
        break;
      case 'chats':
        router.push('/(chats)' as any);
        break;
      case 'profile':
        if (user?.id) {
          router.push(`/(profile)/${user.id}` as any);
        }
        break;
    }
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigate('home')}
      >
        <Ionicons name={getIconName('home')} size={24} color={getColor('home')} />
        <Text style={[styles.navText, activePage === 'home' && styles.navTextActive]}>
          Acasă
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigate('explore')}
      >
        <Ionicons name={getIconName('explore')} size={24} color={getColor('explore')} />
        <Text style={[styles.navText, activePage === 'explore' && styles.navTextActive]}>
          Explorează
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigate('post')}
      >
        <Ionicons name={getIconName('post')} size={24} color={getColor('post')} />
        <Text style={[styles.navText, activePage === 'post' && styles.navTextActive]}>
          Postează
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigate('chats')}
      >
        <Ionicons name={getIconName('chats')} size={24} color={getColor('chats')} />
        <Text style={[styles.navText, activePage === 'chats' && styles.navTextActive]}>
          Chat-uri
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigate('profile')}
      >
        <Ionicons name={getIconName('profile')} size={24} color={getColor('profile')} />
        <Text style={[styles.navText, activePage === 'profile' && styles.navTextActive]}>
          Profil
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
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
    color: '#007AFF',
  },
});

export default BottomNavigation; 