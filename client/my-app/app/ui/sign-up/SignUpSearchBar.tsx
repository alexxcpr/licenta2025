import * as React from 'react';
import { TextInput, StyleSheet } from 'react-native';

interface SignUpSearchBarProps {
  searchValue: string;
  onSearchChange: (text: string) => void;
  placeholder?: string;
}

const SignUpSearchBar: React.FC<SignUpSearchBarProps> = ({ 
  searchValue, 
  onSearchChange,
  placeholder = "Caută..." 
}) => {
  return (
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      value={searchValue}
      onChangeText={onSearchChange}
      placeholderTextColor="#666"
    />
  );
};

const styles = StyleSheet.create({
  searchInput: {
    width: '100%',
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
});

export default SignUpSearchBar; 