import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, typography, borderRadius, spacing } from '@/constants/DesignSystem';

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.experienceLevel}
            onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
            style={styles.picker}
          >
            <Picker.Item label="Entry-level" value="Entry-level" />
            <Picker.Item label="Mid-level" value="Mid-level" />
            <Picker.Item label="Senior" value="Senior" />
            <Picker.Item label="Lead" value="Lead" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Interview Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.interviewType}
            onValueChange={(value) => setFormData({ ...formData, interviewType: value })}
            style={styles.picker}
          >
            <Picker.Item label="Technical" value="Technical" />
            <Picker.Item label="Behavioral" value="Behavioral" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Company Culture</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.companyCulture}
            onValueChange={(value) => setFormData({ ...formData, companyCulture: value })}
            style={styles.picker}
          >
            <Picker.Item label="Innovative" value="Innovative" />
            <Picker.Item label="Collaborative" value="Collaborative" />
            <Picker.Item label="Competitive" value="Competitive" />
            <Picker.Item label="Detail-oriented" value="Detail-oriented" />
          </Picker>
        </View>
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
  },
  formGroup: {
    marginBottom: spacing.lg,
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
  },
  pickerContainer: {
    backgroundColor: colors.neutral.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.neutral.grey300,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
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
