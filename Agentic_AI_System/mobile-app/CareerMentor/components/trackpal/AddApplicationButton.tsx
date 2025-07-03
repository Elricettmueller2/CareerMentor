import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS } from '../../constants/Colors';
import GradientButton from './GradientButton';

interface AddJobButtonProps {
  onPress: () => void;
}

const AddJobButton: React.FC<AddJobButtonProps> = ({ onPress }) => {
  return (
    <View style={styles.fab}>
      <GradientButton
        title="Add Job"
        onPress={onPress}
        style={styles.gradientButton}
        icon={<Ionicons name="add" size={24} color={CAREER_COLORS.white} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    zIndex: 999,
  },
  gradientButton: {
    width: 150,
    height: 50,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 8,
  },
});

export default AddJobButton;
