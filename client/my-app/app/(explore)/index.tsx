import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import ExploreSearchBar from './components/ExploreSearchBar';
import ExploreNewConnectionsRow from './components/ExploreNewConnectionsRow';
import ExploreFeed from './components/ExploreFeed';
import BottomNavigation from '../ui/navigation/BottomNavigation';

export default function ExplorePage() {
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Funcție pentru refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Incrementăm key-ul pentru a forța reîncărcarea componentelor copil
    setRefreshKey(prev => prev + 1);
    
    // Simulăm un delay pentru refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor={'#007AFF'}
              title={'Se reîncarcă...'}
              titleColor={'#666'}
            />
          }
        >
          {/* Search Bar */}
          <ExploreSearchBar key={`search-${refreshKey}`} />

          {/* Utilizatori recomandați */}
          <ExploreNewConnectionsRow 
            key={`connections-${refreshKey}`} 
            currentUserId={user?.id || ''}
          />

          {/* Feed cu postări aleatorii */}
          <ExploreFeed 
            key={`feed-${refreshKey}`} 
            currentUserId={user?.id || ''}
          />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavContainer}>
          <BottomNavigation activePage="explore" />
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Spațiu pentru bottom navigation
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
}); 