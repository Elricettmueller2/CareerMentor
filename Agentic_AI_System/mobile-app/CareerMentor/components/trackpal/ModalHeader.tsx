import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/Themed';
import GradientButton from './GradientButton';

interface ModalHeaderProps {
  title: string;
  onDone: () => void;
  loading?: boolean;
  loadingText?: string;
  style?: ViewStyle;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onDone,
  loading = false,
  loadingText = 'Saving...',
  style
}) => {
  return (
    <View style={[styles.modalHeader, style]}>
      <Text style={styles.modalTitle}>{title}</Text>
      <GradientButton
        title="Done"
        onPress={onDone}
        loading={loading}
        loadingText={loadingText}
        small
        style={styles.doneButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5D5B8D',
    flex: 1,
  },
  doneButton: {
    minWidth: 80,
  },
});

export default ModalHeader;
