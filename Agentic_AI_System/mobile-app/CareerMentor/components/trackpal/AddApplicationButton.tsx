import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CAREER_COLORS } from '../../constants/Colors';

interface AddApplicationButtonProps {
  onPress: () => void;
}

const AddApplicationButton: React.FC<AddApplicationButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
    >
      <LinearGradient
        colors={[CAREER_COLORS.rose, CAREER_COLORS.sky]}
        style={styles.fabGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.fabText}>Add Application</Text>
        <Ionicons name="add" size={30} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRadius: 50,
    zIndex: 999,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 50,
  },
  fabText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
});

export default AddApplicationButton;
