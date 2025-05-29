import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, SafeAreaView, RefreshControl, RefreshControlProps } from 'react-native';
import { UserResource } from '@clerk/types';
import { UserProfile, Post } from '../../../utils/types';
import ProfileHeaderTab from './ProfileHeaderTab';
import ProfileUserInfo from './ProfileUserInfo';
import ProfileActionButtons from './ProfileActionButtons';
import ProfileUserPosts from './ProfileUserPosts';
import ProfileListViewPosts from './ProfileListViewPosts';
import ProfileSavedPosts from './ProfileSavedPosts';
import ProfileProfessionalActivity from './ProfileProfessionalActivity';
import { supabase } from '../../../utils/supabase';

export type ViewMode = 'grid' | 'list' | 'saved' | 'info';

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

interface ViewComponentProps {
  posts: Post[];
  onPostPress: (post: Post) => void;
  isOwnProfile: boolean;
  refreshControl: React.ReactElement<RefreshControlProps>;
  currentUserId?: string;
}

interface SavedViewComponentProps {
  savedPosts: Post[];
  onPostPress: (post: Post) => void;
  currentUserId?: string;
  refreshControl: React.ReactElement<RefreshControlProps>;
  loadingSaved: boolean;
}

interface InfoViewComponentProps {
  userId?: string;
  profile: UserProfile | null;
  refreshControl: React.ReactElement<RefreshControlProps>;
  isOwnProfile: boolean;
}

// Componente separate pentru fiecare tip de vizualizare
const GridViewComponent = React.memo(({ 
  posts, 
  onPostPress, 
  isOwnProfile, 
  refreshControl 
}: ViewComponentProps) => (
  <ProfileUserPosts 
    posts={posts} 
    onPostPress={onPostPress} 
    isOwnProfile={isOwnProfile}
    refreshControl={refreshControl} 
  />
));

const ListViewComponent = React.memo(({ 
  posts, 
  onPostPress, 
  isOwnProfile, 
  currentUserId, 
  refreshControl 
}: ViewComponentProps) => (
  <ProfileListViewPosts 
    posts={posts} 
    onPostPress={onPostPress} 
    isOwnProfile={isOwnProfile}
    currentUserId={currentUserId}
    refreshControl={refreshControl}
  />
));

const SavedPostsComponent = React.memo(({ 
  savedPosts, 
  onPostPress, 
  currentUserId, 
  refreshControl, 
  loadingSaved 
}: SavedViewComponentProps) => (
  loadingSaved ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Se încarcă postările salvate...</Text>
    </View>
  ) : (
    <ProfileSavedPosts 
      posts={savedPosts} 
      onPostPress={onPostPress}
      currentUserId={currentUserId}
      refreshControl={refreshControl}
    />
  )
));

const InfoComponent = React.memo(({ 
  userId, 
  profile, 
  refreshControl, 
  isOwnProfile 
}: InfoViewComponentProps) => (
  <ProfileProfessionalActivity
    userId={userId || ''}
    profile={profile}
    refreshControl={refreshControl}
    isOwnProfile={isOwnProfile}
  />
));

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
  }, [viewMode, isOwnProfile, savedPosts.length]);

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

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

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

  const renderProfileInfo = useCallback(() => (
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
  ), [user, profile, postCount, connectionCount, onEditPress, isOwnProfile, isCurrentUserProfile]);

  const renderContent = () => {
    switch (viewMode) {
      case 'grid':
        return <GridViewComponent 
                posts={posts} 
                onPostPress={onPostPress} 
                isOwnProfile={isOwnProfile}
                refreshControl={refreshControl} 
              />;
      case 'list':
        return <ListViewComponent 
                posts={posts} 
                onPostPress={onPostPress} 
                isOwnProfile={isOwnProfile}
                currentUserId={currentUserId}
                refreshControl={refreshControl} 
              />;
      case 'saved':
        return isOwnProfile ? 
              <SavedPostsComponent 
                savedPosts={savedPosts} 
                onPostPress={onPostPress}
                currentUserId={currentUserId}
                refreshControl={refreshControl}
                loadingSaved={loadingSaved}
              /> : 
              <GridViewComponent 
                posts={posts} 
                onPostPress={onPostPress} 
                isOwnProfile={isOwnProfile}
                refreshControl={refreshControl} 
              />;
      case 'info':
        return <InfoComponent 
                userId={profile?.id_user} 
                profile={profile}
                refreshControl={refreshControl}
                isOwnProfile={isOwnProfile}
              />;
      default:
        return <GridViewComponent 
                posts={posts} 
                onPostPress={onPostPress} 
                isOwnProfile={isOwnProfile}
                refreshControl={refreshControl} 
              />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeaderTab 
        username={profile?.username || 'Profil'} 
        onGoBack={onGoBack} 
        onSettingsPress={onSettingsPress}
      />
      <View style={styles.content}>
        {renderProfileInfo()}
        <ProfileActionButtons 
          viewMode={viewMode} 
          onViewModeChange={handleViewModeChange}
          isOwnProfile={isOwnProfile}
        />
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
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