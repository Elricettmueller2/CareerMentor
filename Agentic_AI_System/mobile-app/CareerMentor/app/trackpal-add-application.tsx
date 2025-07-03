import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import components
import FormInput from '@/components/trackpal/FormInput';
import DatePickerField from '@/components/trackpal/DatePickerField';
import StatusPicker from '@/components/trackpal/StatusPicker';
import GradientButton from '@/components/trackpal/GradientButton';
import { Text } from '@/components/Themed';

// Import services
import JobService from '@/services/JobService';
import NotificationService from '@/services/NotificationService';

export default function TrackPalAddJobScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [application, setApplication] = useState({
    jobTitle: '',
    company: '',
    location: '',
    applicationDeadline: null as Date | null,
    applicationDeadlineReminder: null as string | null,
    status: 'saved',
    followUpDate: null as Date | null,
    followUpTime: '12:00',
    appliedDate: new Date().toISOString(),
    interviewReminder: null as string | null,
    notes: '',
  });

  // Update form field handler
  const updateField = (field: string, value: any) => {
    setApplication(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save job
  const handleSaveJob = async () => {
    // Validate required fields
    if (!application.jobTitle.trim()) {
      Alert.alert('Missing Information', 'Please enter a job title');
      return;
    }
    
    if (!application.company.trim()) {
      Alert.alert('Missing Information', 'Please enter a company name');
      return;
    }
    
    try {
      setSaving(true);
      
      // Format dates for storage
      const applicationData = {
        ...application,
        applicationDeadline: application.applicationDeadline ? 
          application.applicationDeadline.toISOString() : null,
        followUpDate: application.followUpDate ? 
          application.followUpDate.toISOString() : null,
        applicationDeadlineReminder: null,
        interviewReminder: null
      };
      
      // Add the job
      const newJob = await JobService.addJob(applicationData);
      
      // Schedule follow-up reminder if needed
      if (application.followUpDate && application.status !== 'rejected' && application.status !== 'accepted') {
        try {
          await NotificationService.scheduleFollowUpReminder(
            newJob.id,
            application.jobTitle,
            application.company,
            application.followUpDate
          );
        } catch (notificationError) {
          console.error('Error scheduling notification:', notificationError);
          // Don't alert the user about notification errors, just log them
        }
      }
      
      Alert.alert('Success', 'Job added successfully');
      router.back();
    } catch (error) {
      console.error('Error adding application:', error);
      Alert.alert('Error', 'Failed to add job');
    } finally {
      setSaving(false);
    }
  };

  // Get label for deadline field based on status
  const getDeadlineLabel = () => {
    switch (application.status) {
      case 'saved': return 'Job Deadline';
      case 'applied': return 'Date Applied';
      case 'interview': return 'Interview Date';
      default: return 'Important Date';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Add New Job",
          headerTintColor: '#5D5B8D',
          headerTitleStyle: {
            color: '#5D5B8D',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#5D5B8D" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtonContainer}>
              <GradientButton
                title="Save"
                onPress={handleSaveJob}
                small={true}
                loading={saving}
                loadingText="Saving..."
                style={styles.headerSaveButton}
              />
            </View>
          )
        }} 
      />
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.formContainer}>
          <FormInput
            label="Job Title"
            value={application.jobTitle}
            onChangeText={(text) => updateField('jobTitle', text)}
            placeholder="Enter job title"
            iconName="briefcase-outline"
            required
          />
          
          <FormInput
            label="Company"
            value={application.company}
            onChangeText={(text) => updateField('company', text)}
            placeholder="Enter company name"
            iconName="business-outline"
            required
          />
          
          <FormInput
            label="Location"
            value={application.location}
            onChangeText={(text) => updateField('location', text)}
            placeholder="Enter job location"
            iconName="location-outline"
          />
          
          <DatePickerField
            label={getDeadlineLabel()}
            value={application.applicationDeadline}
            onChange={(date) => updateField('applicationDeadline', date)}
            mode="date"
          />
          
          <Text style={styles.label}>Status</Text>
          <StatusPicker
            status={application.status}
            onStatusChange={(status) => updateField('status', status)}
          />
          
          <DatePickerField
            label="Follow-up Date"
            value={application.followUpDate}
            onChange={(date) => updateField('followUpDate', date)}
            mode="date"
          />
          
          <FormInput
            label="Notes"
            value={application.notes}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="Add your notes here..."
            multiline
            numberOfLines={4}
            iconName="document-text-outline"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#5D5B8D',
  },
  headerButtonContainer: {
    marginRight: 10,
  },
  headerSaveButton: {
    height: 36,
    minWidth: 100,
    width: 100,
    borderRadius: 18,
    marginVertical: 0,
  }
});
