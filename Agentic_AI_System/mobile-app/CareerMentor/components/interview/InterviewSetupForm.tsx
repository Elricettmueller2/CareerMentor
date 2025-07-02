import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  ActionSheetIOS
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, borderRadius, spacing } from '@/constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';

interface InterviewSetupFormProps {
  onStartInterview: (data: InterviewSetupData) => void;
  loading?: boolean;
}

export interface InterviewSetupData {
  jobTitle: string;
  experienceLevel: string;
  interviewType: 'Technical' | 'Behavioral';
  companyCulture: string;
}

export const InterviewSetupForm: React.FC<InterviewSetupFormProps> = ({
  onStartInterview,
  loading = false,
}) => {
  // Define the picker item interface
  interface PickerItem<T = string> {
    label: string;
    value: T;
  }

  // Platform-specific picker renderer
  const renderPicker = <T extends string>(label: string, selectedValue: T, onValueChange: (value: T) => void, items: PickerItem<T>[]) => {
    if (Platform.OS === 'ios') {
      // Get the currently selected item's label
      const selectedLabel = items.find(item => item.value === selectedValue)?.label || 'Select';
      
      return (
        <TouchableOpacity 
          style={styles.iosPickerButton}
          onPress={() => {
            ActionSheetIOS.showActionSheetWithOptions(
              {
                options: [...items.map(item => item.label), 'Cancel'],
                cancelButtonIndex: items.length,
                title: label
              },
              (buttonIndex) => {
                if (buttonIndex < items.length) {
                  onValueChange(items[buttonIndex].value);
                }
              }
            );
          }}
        >
          <Text style={styles.iosPickerText}>{selectedLabel}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.neutral.grey600} />
        </TouchableOpacity>
      );
    }
    
    // Android/Web implementation
    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
        >
          {items.map(item => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
    );
  };
  const [formData, setFormData] = useState<InterviewSetupData>({
    jobTitle: 'Software Engineer',
    experienceLevel: 'Mid-level',
    interviewType: 'Technical',
    companyCulture: 'Innovative',
  });

  const handleSubmit = () => {
    onStartInterview(formData);
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Job Title</Text>
        <TextInput
          style={styles.input}
          value={formData.jobTitle}
          onChangeText={(text) => setFormData({ ...formData, jobTitle: text })}
          placeholder="e.g. Software Engineer"
          placeholderTextColor={colors.neutral.grey400}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Experience Level</Text>
        {renderPicker(
          'Experience Level',
          formData.experienceLevel,
          (value) => setFormData({ ...formData, experienceLevel: value }),
          [
            { label: 'Entry-level', value: 'Entry-level' },
            { label: 'Mid-level', value: 'Mid-level' },
            { label: 'Senior', value: 'Senior' },
            { label: 'Lead', value: 'Lead' }
          ]
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Interview Type</Text>
        {renderPicker(
          'Interview Type',
          formData.interviewType,
          (value: 'Technical' | 'Behavioral') => setFormData({ ...formData, interviewType: value }),
          [
            { label: 'Technical', value: 'Technical' as const },
            { label: 'Behavioral', value: 'Behavioral' as const }
          ] as PickerItem<'Technical' | 'Behavioral'>[]
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Company Culture</Text>
        {renderPicker(
          'Company Culture',
          formData.companyCulture,
          (value) => setFormData({ ...formData, companyCulture: value }),
          [
            { label: 'Innovative', value: 'Innovative' },
            { label: 'Collaborative', value: 'Collaborative' },
            { label: 'Competitive', value: 'Competitive' },
            { label: 'Detail-oriented', value: 'Detail-oriented' }
          ]
        )}
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSubmit} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.neutral.white} />
        ) : (
          <Text style={styles.buttonText}>Start Interview</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.neutral.white,
  },
  contentContainer: {
    paddingVertical: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.neutral.grey700,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral.grey800,
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
    height: Platform.OS === 'ios' ? 50 : 'auto',
  },
  pickerContainer: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  // iOS specific picker styles
  iosPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
    padding: spacing.md,
    height: 50,
    marginBottom: 4,
    // iOS-specific shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  iosPickerText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral.grey800,
  },
  button: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginHorizontal: spacing.md,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: colors.neutral.white,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
});

export default InterviewSetupForm;
