import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS } from '@/constants/Colors';

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
      animationType="none"
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
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={onCameraSelect}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="camera" size={32} color={CAREER_COLORS.sky} />
                  </View>
                  <Text style={styles.optionText}>Take Photo</Text>
                  <Text style={styles.optionDescription}>
                    Use your camera to take a photo of your resume
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={onGallerySelect}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="images" size={32} color={CAREER_COLORS.sky} />
                  </View>
                  <Text style={styles.optionText}>Choose from Gallery</Text>
                  <Text style={styles.optionDescription}>
                    Select an image of your resume from your gallery
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={onDocumentSelect}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name="document-text" size={32} color={CAREER_COLORS.rose} />
                  </View>
                  <Text style={styles.optionText}>Select Document</Text>
                  <Text style={styles.optionDescription}>
                    Choose a PDF or document file from your device
                  </Text>
                </TouchableOpacity>
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
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: CAREER_COLORS.salt,
    borderWidth: 1,
    borderColor: CAREER_COLORS.lightRose,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CAREER_COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: CAREER_COLORS.midnight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: CAREER_COLORS.nightSky,
    flex: 1,
  },
  optionDescription: {
    fontSize: 14,
    color: CAREER_COLORS.sky,
    marginTop: 4,
    flex: 1,
    flexWrap: 'wrap',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: CAREER_COLORS.salt,
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: CAREER_COLORS.nightSky,
  },
});

export default UploadOptionsModal;
