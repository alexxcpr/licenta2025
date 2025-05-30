import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';

interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  title?: string;
  placeholder?: string;
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialDate,
  minimumDate,
  maximumDate,
  title = 'Selectează data',
  placeholder = 'Selectează data'
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [showWebCalendar, setShowWebCalendar] = useState(false);

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  // Funcție pentru formatarea datei pentru afișare (dd/mm/yyyy)
  const formatDateForDisplay = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Funcție pentru formatarea datei pentru react-native-calendars (yyyy-mm-dd)
  const formatDateForCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Funcție pentru parsarea datei din formatul calendar (yyyy-mm-dd)
  const parseCalendarDate = (dateString: string): Date => {
    const parts = dateString.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
    onClose();
  };

  const handleCancel = () => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
    onClose();
  };

  const renderContent = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webContainer}>
          <Text style={styles.currentDateText}>
            Data selectată: {formatDateForDisplay(selectedDate)}
          </Text>
          
          <TouchableOpacity
            style={styles.webDateButton}
            onPress={() => setShowWebCalendar(true)}
          >
            <Text style={styles.webDateButtonText}>Schimbă data</Text>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          {showWebCalendar && (
            <View style={styles.calendarContainer}>
              <Calendar
                current={formatDateForCalendar(selectedDate)}
                minDate={minimumDate ? formatDateForCalendar(minimumDate) : undefined}
                maxDate={maximumDate ? formatDateForCalendar(maximumDate) : undefined}
                onDayPress={(day) => {
                  const date = parseCalendarDate(day.dateString);
                  setSelectedDate(date);
                  setShowWebCalendar(false);
                }}
                markedDates={{
                  [formatDateForCalendar(selectedDate)]: {
                    selected: true,
                    selectedColor: '#007AFF'
                  }
                }}
                firstDay={1}
                hideExtraDays={false}
                enableSwipeMonths={true}
                theme={{
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#555',
                  selectedDayBackgroundColor: '#007AFF',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#007AFF',
                  dayTextColor: '#333',
                  textDisabledColor: '#ccc',
                  dotColor: '#007AFF',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#007AFF',
                  monthTextColor: '#333',
                  textDayFontWeight: '400',
                  textMonthFontWeight: '600',
                  textDayHeaderFontWeight: '500',
                  textDayFontSize: 16,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 14,
                  // @ts-ignore - Proprietatea stylesheet.calendar.header este suportată de react-native-calendars
                  'stylesheet.calendar.header': {
                    header: {
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingLeft: 10,
                      paddingRight: 10,
                      alignItems: 'center',
                      marginTop: 10,
                      marginBottom: 10
                    }
                  }
                }}
              />
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.mobileContainer}>
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          textColor="#000"
          style={Platform.OS === 'ios' ? { backgroundColor: '#fff' } : undefined}
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.contentContainer}>
            {renderContent()}
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Anulează</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.confirmButton]} 
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirmă</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    padding: 16,
    minHeight: Platform.OS === 'ios' ? 200 : 100,
  },
  webContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  currentDateText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    fontWeight: '500',
  },
  webDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  webDateButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
  },
  calendarContainer: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  mobileContainer: {
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    borderRightWidth: 0.5,
    borderRightColor: '#eee',
  },
  confirmButton: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  cancelButtonText: {
    color: '#777',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DateTimePickerModal; 