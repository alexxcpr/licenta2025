import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../utils/supabase';
import ExploreSearchBarDialog from './ExploreSearchBarDialog';

// Interfața pentru datele utilizatorului
interface UserData {
  id_user: string;
  username: string;
  profile_picture?: string;
  id_domeniu?: number;
  id_functie?: number;
  id_ocupatie?: number;
}

export default function ExploreSearchBar() {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  // Debounced search function
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user')
        .select('id_user, username, profile_picture, id_domeniu, id_functie, id_ocupatie')
        .ilike('username', `%${query}%`)
        .limit(10);

      if (error) {
        console.error('Eroare la căutarea utilizatorilor:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Eroare la căutarea utilizatorilor:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, searchUsers]);

  const handleClearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleResultSelect = (user: UserData) => {
    setSearchText(user.username);
    setShowResults(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Caută utilizatori..."
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Dialog cu rezultatele căutării */}
      <ExploreSearchBarDialog
        visible={showResults && searchResults.length > 0}
        results={searchResults}
        loading={loading}
        onClose={() => setShowResults(false)}
        onSelectUser={handleResultSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
  },
}); 