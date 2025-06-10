import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Platform
} from 'react-native';

// Interfața pentru dialogul de opțiuni postare
interface PostOptionsDialogProps {
  visible: boolean;
  onClose: () => void;
  onReport?: () => void;
  onDelete?: () => void;
  canDelete: boolean;
}

// Interfața pentru dialogul de confirmare
interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Componentă pentru dialogul de confirmare
const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel
}: ConfirmDialogProps) => {
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.dialogOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogContainer}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>{title}</Text>
              </View>
              <View style={styles.dialogContent}>
                <Text style={styles.dialogMessage}>{message}</Text>
              </View>
              <View style={styles.dialogActions}>
                <TouchableOpacity 
                  style={[styles.dialogButton, styles.cancelButton]} 
                  onPress={onCancel}
                >
                  <Text style={styles.dialogButtonText}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dialogButton, styles.confirmButton]} 
                  onPress={onConfirm}
                >
                  <Text style={[styles.dialogButtonText, styles.confirmButtonText]}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Componentă pentru notificări simple
interface NotificationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText: string;
  onClose: () => void;
}

const NotificationDialog = ({
  visible,
  title,
  message,
  buttonText,
  onClose
}: NotificationDialogProps) => {
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.dialogOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogContainer}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>{title}</Text>
              </View>
              <View style={styles.dialogContent}>
                <Text style={styles.dialogMessage}>{message}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.dialogButton, styles.singleButton]} 
                onPress={onClose}
              >
                <Text style={styles.dialogButtonText}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Componenta principală PostOptionsDialog
const PostOptionsDialog = ({ visible, onClose, onReport, onDelete, canDelete }: PostOptionsDialogProps) => {
  console.log('PostOptionsDialog render - visible:', visible, 'canDelete:', canDelete);
  
  const [confirmReportVisible, setConfirmReportVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notification, setNotification] = useState({
    title: '',
    message: ''
  });
  
  // Pentru a evita ca dialogul principal să dispară
  const [mainDialogVisible, setMainDialogVisible] = useState(visible);
  
  // Actualizăm mainDialogVisible când props visible se schimbă
  useEffect(() => {
    setMainDialogVisible(visible);
  }, [visible]);

  // Gestionarea raportării
  const handleReportPress = () => {
    // Ascundem dialogul principal (dar nu îl închidem complet)
    setMainDialogVisible(false);
    // Afișăm dialogul de confirmare
    setConfirmReportVisible(true);
  };

  const handleReportConfirm = () => {
    setConfirmReportVisible(false);
    if (onReport) onReport();
    
    // Ascundem dialogul de confirmare și afișăm notificarea
    setNotification({
      title: 'Mulțumim',
      message: 'Raportarea ta a fost trimisă și va fi analizată.'
    });
    setNotificationVisible(true);
    
    // Nu mai închid dialogul principal aici (onClose) 
    // Dialogul de notificare va avea propriul buton de închidere
  };

  const handleReportCancel = () => {
    setConfirmReportVisible(false);
    // Dacă utilizatorul anulează, redeschide dialogul principal
    setMainDialogVisible(true);
  };

  // Gestionarea ștergerii
  const handleDeletePress = () => {
    // Ascundem dialogul principal (dar nu îl închidem complet)
    setMainDialogVisible(false);
    // Afișăm dialogul de confirmare
    setConfirmDeleteVisible(true);
  };

  const handleDeleteConfirm = () => {
    setConfirmDeleteVisible(false);
    if (onDelete) onDelete();
    
    // Închiderea completă (notificăm părintele)
    onClose();
  };

  const handleDeleteCancel = () => {
    setConfirmDeleteVisible(false);
    // Dacă utilizatorul anulează, redeschide dialogul principal
    setMainDialogVisible(true);
  };

  // Dialog de notificare
  const handleNotificationClose = () => {
    setNotificationVisible(false);
    // Acum închidem complet dialogul principal după ce s-a închis notificarea
    onClose();
  };

  if (!visible) return null;
  
  return (
    <>
      <Modal
        transparent={true}
        visible={mainDialogVisible}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.dialogOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dialogContainer}>
                <TouchableOpacity 
                  style={styles.dialogOption}
                  onPress={handleReportPress}
                >
                  <Text style={styles.dialogText}>Raportează postarea</Text>
                </TouchableOpacity>
                
                {canDelete && onDelete && (
                  <TouchableOpacity 
                    style={styles.dialogOption}
                    onPress={handleDeletePress}
                  >
                    <Text style={[styles.dialogText, styles.dialogTextDanger]}>Șterge postarea</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.dialogOption, styles.dialogLastOption]}
                  onPress={onClose}
                >
                  <Text style={styles.dialogTextCancel}>Anulează</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Dialog de confirmare pentru raportare */}
      <ConfirmDialog
        visible={confirmReportVisible}
        title="Raportează postarea"
        message="Doriți să confirmați raportarea?"
        confirmText="Da"
        cancelText="Nu"
        onConfirm={handleReportConfirm}
        onCancel={handleReportCancel}
      />

      {/* Dialog de confirmare pentru ștergere */}
      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Șterge postarea"
        message="Ești sigur că vrei să ștergi această postare? Acțiunea nu poate fi anulată."
        confirmText="Șterge"
        cancelText="Anulează"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Dialog de notificare */}
      <NotificationDialog
        visible={notificationVisible}
        title={notification.title}
        message={notification.message}
        buttonText="OK"
        onClose={handleNotificationClose}
      />
    </>
  );
};

const styles = StyleSheet.create({
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '80%',
    maxWidth: 350,
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  dialogOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  dialogLastOption: {
    borderBottomWidth: 0,
  },
  dialogText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
  dialogTextDanger: {
    color: '#FF3B30',
  },
  dialogTextCancel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  dialogHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  dialogContent: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  dialogMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  dialogActions: {
    flexDirection: 'row',
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e0e0e0',
  },
  confirmButton: {
    // Nu avem nevoie de stiluri suplimentare pentru butonul de confirmare
  },
  singleButton: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  dialogButtonText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#FF3B30', // Roșu pentru acțiunile de confirmare
    fontWeight: 'bold',
  },
});

export default PostOptionsDialog; 