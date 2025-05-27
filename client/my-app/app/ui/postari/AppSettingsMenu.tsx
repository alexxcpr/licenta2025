import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  Alert, 
  Animated, 
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '@/utils/supabase';
import { SignOutButton } from '../../../components/SignOutButton';
import { 
  PanGestureHandler, 
  GestureHandlerRootView 
} from 'react-native-gesture-handler';
import ConnectionRequestButton from '../conexiuni/ConnectionRequestButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 10; // Pragul pentru a considera swipe-ul valid

interface AppSettingsMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

// Funcția de fetch roluri, similară cu cea din HomePage
const fetchUserRolesFromSupabase = async (userId: string): Promise<string[]> => {
  console.log(`[AppSettingsMenu] Fetching roles for user ID: ${userId}`);
  try {
    const { data, error } = await supabase
      .from('user_role')
      .select(`
        role!inner (
          denumire
        )
      `)
      .eq('id_user', userId);

    if (error) {
      console.error('[AppSettingsMenu] Error fetching user roles:', error);
      return [];
    }

    if (data && data.length > 0) {
      const roles = data.map(item => {
        if (item.role && typeof item.role === 'object' && 'denumire' in item.role) {
          return (item.role as { denumire: string }).denumire;
        }
        return null;
      }).filter(Boolean) as string[];
      console.log("[AppSettingsMenu] User roles fetched:", roles);
      return roles;
    }
    return [];
  } catch (error) {
    console.error('[AppSettingsMenu] Exception fetching user roles:', error);
    return [];
  }
};

// Componenta pentru numărul de cereri de conexiune - stare globală
const useConnectionRequestCount = () => {
  const { user } = useUser();
  const [requestCount, setRequestCount] = useState(0);

  // Funcția pentru a încărca numărul de cereri de conexiune
  const loadRequestCount = useCallback(async () => {
    if (!user?.id) return 0;
    
    try {
      const { count, error } = await supabase
        .from('connection_request')
        .select('*', { count: 'exact', head: true })
        .eq('id_user_receiver', user.id);
      
      if (error) {
        console.error('Eroare la obținerea numărului de cereri:', error);
        return 0;
      }
      
      setRequestCount(count || 0);
      return count || 0;
    } catch (error) {
      console.error('Eroare la obținerea numărului de cereri:', error);
      return 0;
    }
  }, [user?.id]);

  // Încărcăm numărul de cereri la montarea hook-ului
  useEffect(() => {
    loadRequestCount();
    
    // Opțional: Setăm un interval pentru a actualiza periodic numărul de cereri
    const interval = setInterval(loadRequestCount, 60000); // Actualizează la fiecare minut
    
    return () => clearInterval(interval);
  }, [loadRequestCount]);

  return { requestCount, loadRequestCount };
};

const AppSettingsMenu: React.FC<AppSettingsMenuProps> = ({ isVisible, onClose }) => {
  const { user, isSignedIn } = useUser();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const { requestCount } = useConnectionRequestCount();
  
  // Animație pentru meniul lateral
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Folosim useMemo pentru a evita rerandarea componentelor la deschiderea meniului
  const ConnectionRequestButtonMemo = useMemo(() => (
    <ConnectionRequestButton onClose={onClose} />
  ), [onClose]);

  // Exportăm numărul de cereri pentru a fi folosit în afara componentei
  // pentru a afișa bulinuța notificare lângă iconul de setări
  const getRequestCount = () => requestCount;

  // Gestionează montarea/demontarea animată
  useEffect(() => {
    if (isVisible) {
      // Animație de deschidere
      translateX.setValue(SCREEN_WIDTH);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Încarcă rolurile utilizatorului
      const loadUserRoles = async () => {
        if (isSignedIn && user?.id) {
          const roles = await fetchUserRolesFromSupabase(user.id);
          setUserRoles(roles);
        }
      };
      loadUserRoles();
    } else {
      // Resetăm animația când menu-ul este ascuns
      translateX.setValue(SCREEN_WIDTH);
      backdropOpacity.setValue(0);
    }
  }, [isVisible, isSignedIn, user]);

  // Gestionează închiderea animată
  const animateClose = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Gestionare gest de swipe
  const onGestureEvent = ({ nativeEvent }: { nativeEvent: any }) => {
    // Actualizează poziția menu-ului în timp real
    if (nativeEvent.translationX > 0) { // Doar swipe dreapta
      translateX.setValue(nativeEvent.translationX);
    }
  };

  const onGestureEnd = ({ nativeEvent }: { nativeEvent: any }) => {
    if (nativeEvent.translationX > SWIPE_THRESHOLD) {
      // Swipe suficient pentru a închide
      animateClose();
    } else {
      // Revenim la poziția deschisă
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 5,
      }).start();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <Animated.View 
        style={[
          styles.sideMenuContainer,
          { opacity: backdropOpacity }
        ]}
      >
        <TouchableOpacity 
          style={styles.sideMenuBackdrop} 
          onPress={animateClose} 
          activeOpacity={1} 
        />
        
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onEnded={onGestureEnd}
        >
          <Animated.View 
            style={[
              styles.sideMenu,
              { 
                transform: [{ translateX }],
              }
            ]}
          >
            <View style={styles.handleBar} />

            <View style={styles.sideMenuContent}>
              {/* Indicator notificare pentru meniul de setări */}
              <View style={styles.settingsHeaderContainer}>
                <Text style={styles.settingsHeaderText}>Setări și notificări</Text>
                {requestCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{requestCount}</Text>
                  </View>
                )}
              </View>

              {/* Buton cereri conexiune */}
              {ConnectionRequestButtonMemo}
              
              {/* Opțiuni bazate pe rol */}
              {userRoles.includes('Moderator') && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    Alert.alert('Dashboard Moderare', 'Navigarea către dashboard-ul de moderare va fi implementată.');
                    animateClose();
                  }}
                >
                  <Ionicons name="shield-checkmark-outline" size={24} color="#333" style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>Dashboard Moderare</Text>
                </TouchableOpacity>
              )}
              {userRoles.includes('Administrator') && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    Alert.alert('Dashboard Admin', 'Navigarea către dashboard-ul de admin va fi implementată.');
                    animateClose();
                  }}
                >
                  <Ionicons name="cog-outline" size={24} color="#333" style={styles.menuItemIcon} />
                  <Text style={styles.menuItemText}>Dashboard Admin</Text>
                </TouchableOpacity>
              )}
              {/* Adaugă un mesaj dacă nu există roluri speciale sau link-uri */}
              {userRoles.length === 0 && !userRoles.includes('Moderator') && !userRoles.includes('Administrator') && (
                 <View style={styles.menuItem}>
                    <Text style={styles.menuItemText}>Nu există acțiuni specifice rolului.</Text>
                 </View>
              )}
            </View>

            <SignOutButton
              containerStyle={styles.logoutButtonContainer}
              text="Deloghează-te"
              textStyle={styles.logoutText}
              iconColor="red"
              iconStyle={styles.menuItemIcon}
              // onCloseMenu este o prop nouă ce ar putea fi adăugată la SignOutButton dacă e necesar
              // de ex. pentru a apela 'onClose' după inițierea dialogului de sign out.
              // Momentan, SignOutButton gestionează redirectarea, ce ar trebui să ascundă meniul.
            />
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  gestureRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  sideMenuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  sideMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: (Platform.OS === 'ios' ? 40 : 20) + 20,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 2.5,
    marginBottom: 15,
    marginLeft: 20,
  },
  sideMenuContent: {
    flex: 1,
  },
  settingsHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemIcon: {
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginBottom: 20
  },
  logoutText: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AppSettingsMenu;
export { useConnectionRequestCount }; 