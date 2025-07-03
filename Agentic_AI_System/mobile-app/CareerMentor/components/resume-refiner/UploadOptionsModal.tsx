import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import SmartActionCard from '../trackpal/SmartActionCard';

interface UploadOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onCameraSelect: () => void;
  onDocumentSelect: () => void;
  onGallerySelect: () => void;
}

const UploadOptionsModal: React.FC<UploadOptionsModalProps> = ({
  visible,
  onClose,
  onCameraSelect,
  onDocumentSelect,
  onGallerySelect,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Upload Resume</Text>
              <Text style={styles.modalSubtitle}>Choose an upload method</Text>
              
              <View style={styles.optionsContainer}>
                <SmartActionCard
                  title="Take Photo"
                  description="Use your camera to take a picture of your resume"
                  iconName="camera"
                  onPress={onCameraSelect}
                  style={styles.actionCard}
                />
                
                <SmartActionCard
                  title="Choose from Gallery"
                  description="Select an existing image from your photo library"
                  iconName="images"
                  onPress={onGallerySelect}
                  style={styles.actionCard}
                />
                
                <SmartActionCard
                  title="Select Document"
                  description="Choose a PDF or document file from your device"
                  iconName="document-text"
                  onPress={onDocumentSelect}
                  style={styles.actionCard}
                />
              </View>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  modalContent: {
    width: '85%',
    backgroundColor: CAREER_COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: CAREER_COLORS.midnight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: CAREER_COLORS.nightSky,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: CAREER_COLORS.sky,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  actionCard: {
    marginVertical: 6,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: CAREER_COLORS.nightSky,
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: CAREER_COLORS.salt,
  },
});

export default UploadOptionsModal;
