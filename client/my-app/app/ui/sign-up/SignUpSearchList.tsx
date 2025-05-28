import * as React from 'react';
import { FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Item {
  denumire: string;
  [key: string]: any;
}

interface SignUpSearchListProps<T extends Item> {
  data: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
}

function SignUpSearchList<T extends Item>({ 
  data, 
  onSelect, 
  onClose 
}: SignUpSearchListProps<T>) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item: any) => {
        if ('id_domeniu' in item) return item.id_domeniu.toString();
        if ('id_functie' in item) return item.id_functie.toString();
        if ('id_ocupatie' in item) return item.id_ocupatie.toString();
        return '';
      }}
      renderItem={({ item }) => (
        <TouchableOpacity 
          style={styles.item}
          onPress={() => {
            onSelect(item);
            onClose();
          }}
        >
          <Text style={styles.itemText}>{item.denumire}</Text>
        </TouchableOpacity>
      )}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 300,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default SignUpSearchList; 