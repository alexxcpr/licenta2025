import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../../../utils/types';
import { UserResource } from '@clerk/types';

interface ProfileHeaderProps {
  user: UserResource | null | undefined;
  profile: UserProfile | null;
  postCount: number;
  connectionCount: number;
  onEditPress: () => void;
  isOwnProfile?: boolean;
  // onSharePress: () => void; // TODO: Adaugă când implementăm partajarea
}

export default function ProfileHeader({
  user,
  profile,
  postCount,
  connectionCount,
  onEditPress,
  isOwnProfile = false,
}: ProfileHeaderProps) {
  return (
    <View style={styles.profileInfoContainer}>
      <View style={styles.profileHeader}>
        <Image 
          source={{ 
            uri: profile?.profile_picture || user?.imageUrl || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png' 
          }} 
          style={styles.profileImage}
        />
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{postCount}</Text>
            <Text style={styles.statLabel}>Postări</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{connectionCount}</Text>
            <Text style={styles.statLabel}>Conexiuni</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text> 
            <Text style={styles.statLabel}>Grupuri</Text>
          </View>
        </View>
      </View>

      <View style={styles.bioSection}>
        <Text style={styles.username}>{profile?.username || user?.username || 'Nume utilizator indisponibil'}</Text>
        <Text style={styles.userEmail}>
          {profile?.email || user?.emailAddresses?.[0]?.emailAddress || 'Email indisponibil'}
        </Text>
        {profile?.bio && <Text style={styles.bioText}>{profile.bio}</Text>}
        <Text style={styles.joinedDate}>
          {(() => {
            const dateValue = profile?.date_created || user?.createdAt;
            if (dateValue) {
              return `Membru din ${new Date(dateValue).toLocaleDateString('ro-RO')}`;
            }
            return 'Dată înregistrare indisponibilă';
          })()}
        </Text>
      </View>

      <View style={styles.actionButtonsContainer}>
        {isOwnProfile && (
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={onEditPress}
          >
            <Text style={styles.editButtonText}>Editează profilul</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.shareProfileButton} onPress={() => console.log('Share profile clicked')}>
          <Ionicons name="share-outline" size={20} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileInfoContainer: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    backgroundColor: '#e0e0e0', // Placeholder color
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bioSection: {
    marginBottom: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  joinedDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  shareProfileButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
}); 