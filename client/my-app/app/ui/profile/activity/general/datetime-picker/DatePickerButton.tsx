import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from './DateTimePickerModal';

interface DatePickerButtonProps {
  value?: Date | null;
  onDateChange: (date: Date) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}

const DatePickerButton: React.FC<DatePickerButtonProps> = ({
  value,
  onDateChange,
  placeholder = 'Selectează data',
  label,
  error,
  minimumDate,
  maximumDate,
  disabled = false
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Funcție pentru formatarea datei pentru afișare (dd/mm/yyyy)
  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleOpenModal = () => {
    if (!disabled) {
      setIsModalVisible(true);
    }
  };

  const handleDateConfirm = (selectedDate: Date) => {
    onDateChange(selectedDate);
  };

  return (
    <View>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      
      <TouchableOpacity 
        style={[
          styles.datePickerButton, 
          error ? styles.buttonError : null,
          disabled ? styles.buttonDisabled : null
        ]}
        onPress={handleOpenModal}
        disabled={disabled}
      >
        <Text style={[
          styles.datePickerButtonText, 
          !value ? styles.placeholderText : null,
          disabled ? styles.disabledText : null
        ]}>
          {value ? formatDateForDisplay(value) : placeholder}
        </Text>
        <Ionicons 
          name="calendar-outline" 
          size={20} 
          color={disabled ? "#999" : "#007AFF"} 
        />
      </TouchableOpacity>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      <DateTimePickerModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onConfirm={handleDateConfirm}
        initialDate={value || undefined}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        title={label || 'Selectează data'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonError: {
    borderColor: '#FF3B30',
    marginBottom: 4,
  },
  buttonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  disabledText: {
    color: '#999',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginBottom: 12,
    marginLeft: 4,
  },
});

export default DatePickerButton; 