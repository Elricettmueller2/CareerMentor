import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS } from '@/constants/Colors';
import { formatFileSize } from '@/utils/formatters';

interface FileUploadStatusProps {
  fileName?: string;
  fileSize?: number;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress?: number;
  errorMessage?: string;
}

const FileUploadStatus: React.FC<FileUploadStatusProps> = ({
  fileName,
  fileSize,
  status,
  progress = 0,
  errorMessage,
}) => {
  // Render different content based on status
  const renderContent = () => {
    switch (status) {
      case 'idle':
        return null;
      
      case 'uploading':
        return (
          <>
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={CAREER_COLORS.sky} />
              <Text style={styles.statusText}>Uploading resume...</Text>
            </View>
            {fileName && (
              <Text style={styles.fileInfo}>
                {fileName} {fileSize ? `(${formatFileSize(fileSize)})` : ''}
              </Text>
            )}
          </>
        );
      
      case 'processing':
        return (
          <>
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={CAREER_COLORS.rose} />
              <Text style={styles.statusText}>Analyzing resume...</Text>
            </View>
            <Text style={styles.processingText}>
              Our AI is extracting and analyzing your resume content.
              This may take a moment.
            </Text>
          </>
        );
      
      case 'success':
        return (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={24} color={CAREER_COLORS.sky} />
            <Text style={[styles.statusText, { color: CAREER_COLORS.sky }]}>
              Resume uploaded successfully!
            </Text>
          </View>
        );
      
      case 'error':
        return (
          <>
            <View style={styles.statusRow}>
              <Ionicons name="alert-circle" size={24} color="#FF4D4F" />
              <Text style={[styles.statusText, { color: "#FF4D4F" }]}>
                Upload failed
              </Text>
            </View>
            {errorMessage && (
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            )}
          </>
        );
    }
  };

  if (status === 'idle') return null;

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: CAREER_COLORS.salt,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    color: CAREER_COLORS.midnight,
  },
  fileInfo: {
    fontSize: 14,
    color: CAREER_COLORS.nightSky,
    marginTop: 4,
  },
  processingText: {
    fontSize: 14,
    color: CAREER_COLORS.midnight,
    lineHeight: 20,
    marginTop: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#FF4D4F",
    marginTop: 8,
    lineHeight: 20,
  },
});

export default FileUploadStatus;
