import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '@/utils/types';
import { UserResource } from '@clerk/types';
import ConnectionButton from '../conexiuni/ConnectionButton';
import { supabase } from '@/utils/supabase';
import ConnectionsList from '../conexiuni/ConnectionsList';
import { useUser } from '@clerk/clerk-expo';

interface ProfileUserInfoProps {
  user: UserResource | null | undefined;
  profile: UserProfile | null;
  postCount: number;
  connectionCount: number; // Păstrăm prop-ul pentru compatibilitate, dar îl ignorăm
  onEditPress: () => void;
  isOwnProfile?: boolean;
  profileUserId?: string;
  isCurrentUserProfile: boolean;
}

const ProfileUserInfo: React.FC<ProfileUserInfoProps> = ({
  user,
  profile,
  postCount,
  connectionCount: initialConnectionCount, // Ignorăm această valoare
  onEditPress,
  isOwnProfile = false,
  profileUserId,
  isCurrentUserProfile,
}) => {
  const { user: clerkUser } = useUser();
  const [connectionCount, setConnectionCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionModalVisible, setConnectionsModalVisible] = useState<boolean>(false);

  // Funcție pentru actualizarea numărului de conexiuni
  const fetchConnectionCount = useCallback(async () => {
    if (!profileUserId) return;

    try {
      setLoading(true);
      
      // Calculăm numărul de conexiuni pentru profilul vizitat folosind COUNT
      const { count, error } = await supabase
        .from('connection')
        .select('*', { count: 'exact', head: true })
        .or(`id_user_1.eq.${profileUserId},id_user_2.eq.${profileUserId}`);

      if (error) {
        console.error('Eroare la obținerea numărului de conexiuni:', error);
        setConnectionCount(0);
      } else {
        setConnectionCount(count || 0);
      }
    } catch (error) {
      console.error('Eroare la actualizarea numărului de conexiuni:', error);
      setConnectionCount(0);
    } finally {
      setLoading(false);
    }
  }, [profileUserId]);

  // Actualizăm numărul de conexiuni la fiecare randare a componentei
  useEffect(() => {
    fetchConnectionCount();
  }, [fetchConnectionCount, profileUserId]);

  // Afișează data de înregistrare formatată
  const formatJoinDate = () => {
    const dateValue = profile?.date_created || user?.createdAt;
    if (dateValue) {
      return `Membru din ${new Date(dateValue).toLocaleDateString('ro-RO')}`;
    }
    return 'Dată înregistrare indisponibilă';
  };

  // Afișează modalul cu conexiuni
  const showConnectionsModal = () => {
    setConnectionsModalVisible(true);
  };

  // Închide modalul cu conexiuni
  const closeConnectionsModal = () => {
    setConnectionsModalVisible(false);
    // Opțional: reîncarcă numărul de conexiuni după închiderea modalului
    fetchConnectionCount();
  };

  // Construim numele complet pentru afișare
  const displayName = profile?.username
    ? profile.username
    : profile?.email || 'Utilizator';

  // URL-ul imaginii de profil sau placeholder
  const profileImageUrl = profile?.profile_picture || user?.imageUrl || 'https://azyiyrvsaqyqkuwrgykl.supabase.co/storage/v1/object/public/images//user.png';

  // Fix: Determinăm corect dacă suntem pe profilul propriu
  const isCurrentUser = isCurrentUserProfile || (clerkUser?.id === profileUserId);

  // Randarea profilului
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : (
            <Image 
              source={{ uri: profileImageUrl }} 
              style={styles.profileImage}
            />
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{postCount}</Text>
              <Text style={styles.statLabel}>Postări</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={showConnectionsModal}
              accessibilityLabel="Vezi conexiunile"
              accessibilityHint="Deschide lista cu toate conexiunile utilizatorului"
              disabled={connectionCount === 0}
            >
              <Text style={styles.statNumber}>{connectionCount}</Text>
              <Text style={styles.statLabel}>Conexiuni</Text>
            </TouchableOpacity>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Grupuri</Text>
            </View>
          </View>

          {isCurrentUser ? (
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={onEditPress}
              accessibilityLabel="Editează profilul"
              accessibilityHint="Deschide formularul de editare a profilului"
            >
              <Text style={styles.editButtonText}>Editează profilul</Text>
            </TouchableOpacity>
          ) : (
            <ConnectionButton
              profileUserId={profileUserId || ''}
              onConnectionChange={fetchConnectionCount}
            />
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.bioSection}>
          <Text style={styles.username}>{displayName}</Text>
          <Text style={styles.joinDate}>{formatJoinDate()}</Text>
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>
      </View>

      {/* Modal pentru afișarea listei de conexiuni */}
      <ConnectionsList
        visible={connectionModalVisible}
        userId={profileUserId || ''}
        onClose={closeConnectionsModal}
        username={profile?.username || clerkUser?.username || 'Utilizator'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    padding: 15,
  },
  avatarContainer: {
    marginRight: 15,
  },
  loadingContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    marginRight: 10,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    padding: 15,
    paddingTop: 0,
  },
  bioSection: {
    marginBottom: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  joinDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  editProfileButton: {
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
});

export default ProfileUserInfo; 