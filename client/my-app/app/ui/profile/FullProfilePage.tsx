import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, SafeAreaView, RefreshControl, ScrollView } from 'react-native';
import { UserResource } from '@clerk/types';
import { UserProfile, Post } from '../../../utils/types';
import ProfileHeaderTab from './ProfileHeaderTab';
import ProfileUserInfo from './ProfileUserInfo';
import ProfileActionButtons from './ProfileActionButtons';
import ProfileUserPosts from './ProfileUserPosts';
import ProfileListViewPosts from './ProfileListViewPosts';
import ProfileSavedPosts from './ProfileSavedPosts';
import { supabase } from '../../../utils/supabase';

export type ViewMode = 'grid' | 'list' | 'saved';

interface FullProfilePageProps {
  user: UserResource | null | undefined;
  profile: UserProfile | null;
  posts: Post[];
  postCount: number;
  connectionCount: number;
  isOwnProfile: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onEditPress: () => void;
  onPostPress: (post: Post) => void;
  onGoBack: () => void;
  onSettingsPress: () => void;
  currentUserId?: string;
  isCurrentUserProfile: boolean;
}

const FullProfilePage: React.FC<FullProfilePageProps> = ({
  user,
  profile,
  posts,
  postCount,
  connectionCount,
  isOwnProfile,
  refreshing,
  onRefresh,
  onEditPress,
  onPostPress,
  onGoBack,
  onSettingsPress,
  currentUserId,
  isCurrentUserProfile
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  
  // Încarcă postările salvate doar când este nevoie (lazy loading)
  useEffect(() => {
    if (viewMode === 'saved' && isOwnProfile && savedPosts.length === 0) {
      loadSavedPosts();
    }
  }, [viewMode, isOwnProfile]);

  const loadSavedPosts = async () => {
    if (!currentUserId) return;
    
    setLoadingSaved(true);
    try {
      // Obținem id-urile postărilor salvate
      const { data: savedPostsData, error: savedPostsError } = await supabase
        .from('saved_post')
        .select('id_post')
        .eq('id_user', currentUserId);
      
      if (savedPostsError) {
        console.error('Eroare la încărcarea postărilor salvate:', savedPostsError);
        return;
      }
      
      if (!savedPostsData || savedPostsData.length === 0) {
        setSavedPosts([]);
        return;
      }
      
      // Extragem id-urile postărilor
      const postIds = savedPostsData.map(item => item.id_post);
      
      // Obținem detaliile postărilor
      const { data: postsData, error: postsError } = await supabase
        .from('post')
        .select('*')
        .in('id_post', postIds)
        .eq('is_published', true)
        .order('date_created', { ascending: false });
      
      if (postsError) {
        console.error('Eroare la încărcarea detaliilor postărilor salvate:', postsError);
        return;
      }
      
      setSavedPosts(postsData || []);
    } catch (error) {
      console.error('Eroare la încărcarea postărilor salvate:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Componentă pentru header-ul listei, conținând informațiile de profil și butoanele de acțiune
  const ListHeader = () => (
    <>
      <ProfileUserInfo 
        user={user}
        profile={profile}
        postCount={postCount}
        connectionCount={connectionCount}
        onEditPress={onEditPress}
        isOwnProfile={isOwnProfile}
        profileUserId={profile?.id_user}
        isCurrentUserProfile={isCurrentUserProfile}
      />
      <ProfileActionButtons 
        viewMode={viewMode} 
        onViewModeChange={handleViewModeChange}
        isOwnProfile={isOwnProfile}
      />
    </>
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#007AFF']}
      tintColor={'#007AFF'}
      title={'Se reîmprospătează...'}
      titleColor={'#666'}
    />
  );

  let content;
  if (viewMode === 'grid') {
    content = (
      <ProfileUserPosts 
        posts={posts} 
        onPostPress={onPostPress} 
        isOwnProfile={isOwnProfile}
        ListHeaderComponent={ListHeader}
        refreshControl={refreshControl} 
      />
    );
  } else if (viewMode === 'list') {
    content = (
      <ProfileListViewPosts 
        posts={posts} 
        onPostPress={onPostPress} 
        isOwnProfile={isOwnProfile}
        currentUserId={currentUserId}
        ListHeaderComponent={ListHeader}
        refreshControl={refreshControl}
      />
    );
  } else if (viewMode === 'saved' && isOwnProfile) {
    if (loadingSaved) {
      content = (
        <View style={styles.container}>
          <ListHeader />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Se încarcă postările salvate...</Text>
          </View>
        </View>
      );
    } else {
      content = (
        <ProfileSavedPosts 
          posts={savedPosts} 
          onPostPress={onPostPress}
          currentUserId={currentUserId}
          ListHeaderComponent={ListHeader}
          refreshControl={refreshControl}
        />
      );
    }
  } else {
    content = (
      <ScrollView refreshControl={refreshControl} showsVerticalScrollIndicator={false}>
        <ListHeader />
      </ScrollView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeaderTab 
        username={profile?.username || 'Profil'} 
        onGoBack={onGoBack} 
        onSettingsPress={onSettingsPress}
      />
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default FullProfilePage; 