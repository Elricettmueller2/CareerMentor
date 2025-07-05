import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert, Platform, ActionSheetIOS, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CAREER_COLORS } from '../constants/Colors';
import JobService, { JobApplication } from '@/services/JobService';
import NotificationService from '@/services/NotificationService';

// Import custom components
import GradientButton from '@/components/trackpal/GradientButton';
import StatusBadge, { formatStatusText, getStatusColor } from '@/components/trackpal/StatusBadge';
import DatePickerField from '@/components/trackpal/DatePickerField';
import ModalHeader from '@/components/trackpal/ModalHeader';
import FormInput from '@/components/trackpal/FormInput';
import StatusPicker from '@/components/trackpal/StatusPicker';
import InfoCard from '@/components/trackpal/InfoCard';
import SmartActionCard from '@/components/trackpal/SmartActionCard';
import CongratsCard from '@/components/trackpal/CongratsCard';
import JobLinkButton from '@/components/trackpal/JobLinkButton';

export default function TrackPalJobDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedApplication, setEditedApplication] = useState<JobApplication | null>(null);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
  const [showAndroidStatusPicker, setShowAndroidStatusPicker] = useState(false);
  
  // Reminder modal states
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date>(new Date());
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date>(new Date());
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [settingReminder, setSettingReminder] = useState(false);
  const [reminderType, setReminderType] = useState<'application' | 'follow-up' | 'interview'>('follow-up');
  const [reminderTitle, setReminderTitle] = useState('Set Reminder');
  const [reminderMessage, setReminderMessage] = useState('');

  useEffect(() => {
    if (application) {
      setEditedApplication({...application});
    }
  }, [application]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      
      try {
        // Fetch jobs from MongoDB via the JobService
        const jobs = await JobService.getJobs();
        const foundJob = jobs.find(job => job.id === id);
        
        if (foundJob) {
          setApplication(foundJob);
        } else {
          Alert.alert('Error', 'Job application not found');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
        Alert.alert('Error', 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJob();
  }, [id]);
  
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const handleDeadlineChange = (event: any, selectedDate?: Date) => {
    setShowDeadlinePicker(Platform.OS === 'ios');
    
    if (selectedDate && editedApplication) {
      setEditedApplication({...editedApplication, applicationDeadline: selectedDate.toISOString()});
    }
  };

  const handleFollowUpChange = (event: any, selectedDate?: Date) => {
    setShowFollowUpPicker(Platform.OS === 'ios');
    
    if (selectedDate && editedApplication) {
      setEditedApplication({...editedApplication, followUpDate: selectedDate.toISOString()});
    }
  };
  
  // Handle reminder date change
  const handleReminderDateChange = (event: any, selectedDate?: Date) => {
    setShowReminderDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      setReminderDate(selectedDate);
    }
  };
  
  // Handle reminder time change
  const handleReminderTimeChange = (event: any, selectedDate?: Date) => {
    setShowReminderTimePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      setReminderTime(selectedDate);
    }
  };
  
  // Save the reminder
  const saveReminder = async () => {
    if (!application) return;
    
    setSettingReminder(true);
    try {
      // Combine date and time
      const combinedDate = new Date(reminderDate);
      const timeParts = reminderTime.toTimeString().split(':');
      combinedDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
      
      let updatedJob: JobApplication | null = null;
      
      // Update the appropriate field based on reminder type
      if (reminderType === 'application') {
        // Update job with deadline reminder
        updatedJob = await JobService.updateJob(
          application.id,
          { applicationDeadlineReminder: combinedDate.toISOString() }
        );
        
        // Schedule notification
        await NotificationService.scheduleFollowUpReminder(
          application.id,
          application.company,
          application.jobTitle,
          combinedDate
        );
      } else if (reminderType === 'follow-up') {
        // Update job with follow-up date
        updatedJob = await JobService.updateJob(
          application.id,
          { 
            followUpDate: combinedDate.toISOString(),
            followUpTime: `${combinedDate.getHours()}:${combinedDate.getMinutes().toString().padStart(2, '0')}` 
          }
        );
        
        // Schedule notification
        await NotificationService.scheduleFollowUpReminder(
          application.id,
          application.company,
          application.jobTitle,
          combinedDate
        );
      } else if (reminderType === 'interview') {
        // Update job with interview reminder
        updatedJob = await JobService.updateJob(
          application.id,
          { interviewReminder: combinedDate.toISOString() }
        );
        
        // Schedule notification
        await NotificationService.scheduleFollowUpReminder(
          application.id,
          application.company,
          application.jobTitle,
          combinedDate
        );
      }
      
      if (updatedJob) {
        setApplication(updatedJob);
      }
      
      setShowReminderModal(false);
      Alert.alert('Success', 'Reminder set successfully');
    } catch (error) {
      console.error('Error setting reminder:', error);
      Alert.alert('Error', 'Failed to set reminder');
    } finally {
      setSettingReminder(false);
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (!application || application.status === newStatus) return;
    
    setUpdating(true);
    JobService.updateJob(application.id, { status: newStatus })
      .then(updatedJob => {
        if (updatedJob) {
          setApplication(updatedJob);
          Alert.alert('Success', `Status updated to ${formatStatusText(newStatus)}`);
        } else {
          Alert.alert('Error', 'Failed to update job status');
        }
      })
      .catch(error => {
        console.error('Error updating status:', error);
        Alert.alert('Error', 'An error occurred while updating the status');
      })
      .finally(() => {
        setUpdating(false);
      });
  };
  
  const showStatusActionSheet = () => {
    if (!editedApplication) return;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Saved', 'Applied', 'Interview', 'Rejected', 'Accepted'],
          cancelButtonIndex: 0,
          title: 'Update Status',
          message: 'Select a new status for this job'
        },
        (buttonIndex) => {
          if (buttonIndex === 0) return; // Cancel
          
          const statusValues = ['saved', 'applied', 'interview', 'rejected', 'accepted'];
          const newStatus = statusValues[buttonIndex - 1];
          setEditedApplication({...editedApplication, status: newStatus});
        }
      );
    } else {
      // For Android, show a custom modal picker instead of Alert
      setShowAndroidStatusPicker(true);
    }
  };
  
  const handleAndroidStatusSelect = (status: string) => {
    if (editedApplication) {
      setEditedApplication({...editedApplication, status});
    }
    setShowAndroidStatusPicker(false);
  };

  const saveChanges = async () => {
    if (!editedApplication) return;
    
    setUpdating(true);
    try {
      const updatedJob = await JobService.updateJob(
        editedApplication.id,
        editedApplication
      );
      
      if (updatedJob) {
        setApplication(updatedJob);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating job:', error);
      Alert.alert('Error', 'Failed to update job');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePress = () => {
    if (!application) return;
    
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete your job for ${application.jobTitle} at ${application.company}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const success = await JobService.deleteJob(application.id);
              if (success) {
                router.back();
              } else {
                Alert.alert('Error', 'Failed to delete job');
              }
            } catch (error) {
              console.error('Error deleting job:', error);
              Alert.alert('Error', 'An error occurred while deleting the job');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const formatStatusText = (status: string): string => {
    switch(status.toLowerCase()) {
      case 'saved': return 'Saved';
      case 'applied': return 'Applied';
      case 'interview': return 'Interview';
      case 'rejected': return 'Rejected';
      case 'accepted': return 'Accepted';
      default: return 'Saved';
    }
  };

  const getStatusColor = (status: string): string => {
    // Use different colors for rejected and accepted statuses
    if (status.toLowerCase() === 'rejected') {
      return CAREER_COLORS.red; // Red for rejected
    } else if (status.toLowerCase() === 'accepted') {
      return CAREER_COLORS.green; // Green for accepted
    } else {
      return CAREER_COLORS.nightSky; // Brand purple for all other statuses
    }
  };

  const getTimelineSteps = () => {
    // Base steps with dates
    const steps = [
      { 
        status: 'saved', 
        label: 'Saved',
        dates: [] // Saved status doesn't typically have dates
      },
      { 
        status: 'applied', 
        label: 'Applied',
        dates: application ? [
          { 
            label: 'Applied on:', 
            value: new Date(application.appliedDate).toLocaleDateString(),
            icon: 'calendar-outline' as const
          },
          // Add application deadline if it exists
          ...(application.applicationDeadline ? [
            { 
              label: 'Job Deadline:', 
              value: new Date(application.applicationDeadline).toLocaleDateString(),
              icon: 'hourglass-outline' as const
            }
          ] : [])
        ] : []
      },
      { 
        status: 'interview', 
        label: 'Interview',
        dates: application && application.followUpDate && application.status.toLowerCase() === 'interview' ? [
          { 
            label: 'Follow-up Reminder:', 
            value: `${new Date(application.followUpDate).toLocaleDateString()} at ${application.followUpTime}`,
            icon: 'notifications-outline' as const
          }
        ] : []
      },
      { 
        status: 'accepted', 
        label: 'Accepted',
        dates: []
      }
    ];
    
    // If rejected, we want to show a different flow
    if (application?.status.toLowerCase() === 'rejected') {
      // Check if the application has gone through an interview before rejection
      const hasHadInterview = application.notes?.toLowerCase().includes('interview') || 
                             application.notes?.toLowerCase().includes('interviewed');
      
      return [
        { status: 'saved', label: 'Saved', dates: [] },
        { 
          status: 'applied', 
          label: 'Applied',
          dates: application ? [
            { 
              label: 'Applied on:', 
              value: new Date(application.appliedDate).toLocaleDateString(),
              icon: 'calendar-outline' as const
            }
          ] : []
        },
        ...(hasHadInterview ? [{ 
          status: 'interview', 
          label: 'Interview',
          dates: []
        }] : []),
        { status: 'rejected', label: 'Rejected', dates: [] }
      ];
    }
    
    return steps;
  };

  const getCurrentStepIndex = () => {
    if (!application) return -1;
    
    const currentStatus = application.status.toLowerCase();
    const steps = getTimelineSteps();
    return steps.findIndex(step => step.status === currentStatus);
  };

  // Format reminder date for display in Smart Action card
  const formatReminderForDisplay = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Prepare reminder modal with existing data
  const prepareReminderModal = (type: 'application' | 'follow-up' | 'interview', existingDate?: string | null) => {
    setReminderType(type);
    
    // Set title based on whether we're editing or creating
    const action = existingDate ? 'Edit' : 'Set';
    
    // Set appropriate title and message
    switch(type) {
      case 'application':
        setReminderTitle(`${action} Reminder`);
        setReminderMessage(`You will receive a notification at the specified date and time to apply to ${application?.company} before the deadline.`);
        break;
      case 'follow-up':
        setReminderTitle(`${action} Follow-up Reminder`);
        setReminderMessage(`You will receive a notification at the specified date and time to follow up on your application to ${application?.company}.`);
        break;
      case 'interview':
        setReminderTitle(`${action} Interview Reminder`);
        setReminderMessage(`You will receive a notification at the specified date and time to review your notes for the interview with ${application?.company}.`);
        break;
    }
    
    // If editing an existing reminder, set the date and time fields
    if (existingDate) {
      const existingDateTime = new Date(existingDate);
      setReminderDate(existingDateTime);
      setReminderTime(existingDateTime);
    } else {
      // Otherwise use current date/time as default
      const now = new Date();
      setReminderDate(now);
      setReminderTime(now);
    }
    
    setShowReminderModal(true);
  };

  const renderSmartActions = () => {
    if (!application) return null;
    
    const status = application.status.toLowerCase();
    
    switch(status) {
      case 'saved':
        return (
          <>
            <Link href="/resume-refiner" asChild>
              <SmartActionCard
                title="Resume Help"
                description="Need help tailoring your resume?"
                iconName="document-text-outline"
                onPress={() => {}}
              />
            </Link>
            {application.applicationDeadlineReminder ? (
              <SmartActionCard
                title="Job Deadline Reminder"
                description={`Reminder set for: ${formatReminderForDisplay(application.applicationDeadlineReminder)}`}
                iconName="notifications"
                onPress={() => prepareReminderModal('application', application.applicationDeadlineReminder)}
              />
            ) : (
              <SmartActionCard
                title="Set Reminder"
                description="Set a reminder to apply before deadline"
                iconName="notifications-outline"
                onPress={() => prepareReminderModal('application')}
              />
            )}
          </>
        );
        
      case 'applied':
        return (
          <>
            {application.followUpDate ? (
              <SmartActionCard
                title="Follow-up Reminder"
                description={`Reminder set for: ${formatReminderForDisplay(application.followUpDate)}`}
                iconName="notifications"
                onPress={() => prepareReminderModal('follow-up', application.followUpDate)}
              />
            ) : (
              <SmartActionCard
                title="Follow-up Reminder"
                description="Set a follow-up reminder"
                iconName="notifications-outline"
                onPress={() => prepareReminderModal('follow-up')}
              />
            )}
            <Link href="/interview" asChild>
              <SmartActionCard
                title="Interview Prep"
                description="Expecting an interview? Use MockMate"
                iconName="people-outline"
                onPress={() => {}}
              />
            </Link>
          </>
        );
        
      case 'interview':
        return (
          <>
            <Link href="/interview" asChild>
              <SmartActionCard
                title="Interview Prep"
                description="Expecting an interview? Use MockMate"
                iconName="people-outline"
                onPress={() => {}}
              />
            </Link>
            {application.interviewReminder ? (
              <SmartActionCard
                title="Interview Reminder"
                description={`Reminder set for: ${formatReminderForDisplay(application.interviewReminder)}`}
                iconName="notifications"
                onPress={() => prepareReminderModal('interview', application.interviewReminder)}
              />
            ) : (
              <SmartActionCard
                title="Interview Reminder"
                description="Set a reminder for your interview"
                iconName="notifications-outline"
                onPress={() => prepareReminderModal('interview')}
              />
            )}
          </>
        );
        
      case 'rejected':
        return (
          <>
            <Link href="/resume-refiner" asChild>
              <SmartActionCard
                title="Resume Improvement"
                description="Want to improve your resume for next time?"
                iconName="document-text-outline"
                onPress={() => {}}
              />
            </Link>
            <Link href="/pathfinder" asChild>
              <SmartActionCard
                title="Find Jobs"
                description="Find similar jobs"
                iconName="search-outline"
                onPress={() => {}}
              />
            </Link>
          </>
        );
        
      case 'accepted':
        return (
          <CongratsCard
            message="Congratulations on your new job!"
          />
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading job details...</Text>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Job not found</Text>
        <TouchableOpacity 
          style={{ padding: 10, backgroundColor: '#5D5B8D', borderRadius: 8, marginTop: 10 }} 
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaHeader} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={CAREER_COLORS.nightSky} />
          </TouchableOpacity>
          
          <View style={styles.headerButtonContainer}>
            <GradientButton
              title="Edit Job"
              onPress={() => setShowEditModal(true)}
              small={true}
              style={styles.headerEditButton}
            />
          </View>
        </View>
      </SafeAreaView>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Job Info Section */}
        <View style={styles.jobInfoContainer}>
          <Text style={styles.jobTitle}>{application.jobTitle}</Text>
          <Text style={styles.companyName}>{application.company}</Text>
          
          {/* Location and Status Row */}
          <View style={styles.infoStatusRow}>
            {application.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={CAREER_COLORS.nightSky} />
                <Text style={styles.infoText}>{application.location}</Text>
              </View>
            )}
            <StatusBadge status={application.status} style={styles.statusBadge} />
          </View>
          
        </View>
        {/* Separator */}
        <View style={styles.separator} />
        
        {/* Description Section */}
        {application.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{application.description}</Text>
            </View>
          </View>
        )}
        
        {/* Separator */}
        <View style={styles.separator} />
        
        {/* Smart Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Actions</Text>
          <View style={styles.smartActionsContainer}>
            {renderSmartActions()}
          </View>
        </View>
        
        {/* Separator */}
        <View style={styles.separator} />
        
        {/* Timeline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Timeline</Text>
          <View style={styles.timeline}>
            {getTimelineSteps().map((step, index) => {
              const currentIndex = getCurrentStepIndex();
              const isActive = index <= currentIndex;
              const isLastItem = index === getTimelineSteps().length - 1;
              
              return (
                <View key={step.status} style={styles.timelineItem}>
                  <View style={styles.timelineStepRow}>
                    <View style={[
                      styles.timelineStep,
                      isActive ? { backgroundColor: getStatusColor(step.status) } : {}
                    ]}>
                      {isActive && (
                        <Ionicons 
                          name={step.status === 'rejected' ? 'close' : 'checkmark'} 
                          size={16} 
                          color="#fff" 
                        />
                      )}
                    </View>
                    <Text style={[
                      styles.timelineStepText,
                      isActive ? { color: getStatusColor(step.status), fontWeight: 'bold' } : {}
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                  
                  {/* Date information for this step */}
                  {step.dates && step.dates.length > 0 && (
                    <View style={styles.timelineDates}>
                      {step.dates.map((dateItem, dateIndex) => (
                        <View key={dateIndex} style={styles.timelineDateItem}>
                          <Ionicons name={dateItem.icon} size={16} color="#5D5B8D" style={styles.timelineDateIcon} />
                          <Text style={styles.timelineDateLabel}>{dateItem.label}</Text>
                          <Text style={styles.timelineDateValue}>{dateItem.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {!isLastItem && (
                    <View 
                      style={{
                        position: 'absolute',
                        left: 11,
                        top: 24,
                        bottom: -20,
                        width: 2,
                        backgroundColor: index < currentIndex ? CAREER_COLORS.nightSky : '#dee2e6'
                      }}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Separator */}
        <View style={styles.separator} />
        
        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>
              {application.notes || "No notes added yet."}
            </Text>
          </View>
        </View>
        
        {/* Separator */}
        <View style={styles.separator} />
        
        {/* Resume Section (placeholder for future) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resume Used</Text>
          <View style={styles.resumePlaceholder}>
            <Ionicons name="document-text-outline" size={24} color="#aaa" />
            <Text style={styles.placeholderText}>
              Resume tracking will be implemented soon
            </Text>
          </View>
        </View>
        
        {/* Delete Button */}
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeletePress}
            disabled={deleting}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
            <Text style={styles.deleteButtonText}>
              {deleting ? 'Deleting...' : 'Delete Job'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Job Link Button */}
      <View style={styles.floatingButtonContainer}>
        <JobLinkButton 
          url={application.jobUrl} 
          style={styles.floatingButton}
        />
      </View>

      {/* Follow-up Reminder Modal */}
      <Modal
        visible={showReminderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ModalHeader
              title={reminderTitle}
              onDone={saveReminder}
              loading={settingReminder}
              loadingText="Setting..."
            />
            
            <ScrollView style={styles.modalScrollContent}>
              <DatePickerField
                label="Reminder Date"
                value={reminderDate}
                onChange={(date) => handleReminderDateChange({ type: 'set', nativeEvent: { timestamp: date.getTime() } }, date)}
                minimumDate={new Date()}
                mode="date"
              />
              
              <DatePickerField
                label="Reminder Time"
                value={reminderTime}
                onChange={(date) => handleReminderTimeChange({ type: 'set', nativeEvent: { timestamp: date.getTime() } }, date)}
                mode="time"
              />
              
              <InfoCard
                title="Reminder Info"
                message={reminderMessage}
                iconName="information-circle-outline"
                style={styles.reminderInfoContainer}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ModalHeader
              title="Edit Saved Job"
              onDone={saveChanges}
              loading={updating}
              loadingText="Saving..."
            />

            <ScrollView style={styles.modalScrollContent}>
              {editedApplication && (
                <>
                  <FormInput
                    label="Job Title"
                    value={editedApplication.jobTitle}
                    onChangeText={(text) => setEditedApplication({...editedApplication, jobTitle: text})}
                    placeholder="Enter job title"
                    iconName="briefcase-outline"
                    required
                  />

                  <FormInput
                    label="Company"
                    value={editedApplication.company}
                    onChangeText={(text) => setEditedApplication({...editedApplication, company: text})}
                    placeholder="Enter company name"
                    iconName="business-outline"
                    required
                  />

                  <FormInput
                    label="Location"
                    value={editedApplication.location}
                    onChangeText={(text) => setEditedApplication({...editedApplication, location: text})}
                    placeholder="Enter job location"
                    iconName="location-outline"
                  />

                  {/* Custom Description Field with icon in top left */}
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.label}>Description</Text>
                    <View style={styles.descriptionInputContainer}>
                      <TextInput
                        style={styles.descriptionInput}
                        value={editedApplication.description}
                        onChangeText={(text) => setEditedApplication({...editedApplication, description: text})}
                        placeholder="Enter job description"
                        multiline
                        numberOfLines={5}
                      />
                      <View style={styles.iconTopLeft}>
                        <Ionicons 
                          name="document-text-outline" 
                          size={20} 
                          color={CAREER_COLORS.nightSky} 
                        />
                      </View>
                    </View>
                  </View>

                  <DatePickerField
                    label={editedApplication.status === 'saved' ? 'Job Deadline' : 
                          editedApplication.status === 'applied' ? 'Date Applied' : 
                          editedApplication.status === 'interview' ? 'Interview Date' : 
                          'Important Date'}
                    value={editedApplication.applicationDeadline ? new Date(editedApplication.applicationDeadline) : null}
                    onChange={(date) => handleDeadlineChange({ type: 'set', nativeEvent: { timestamp: date.getTime() } }, date)}
                    mode="date"
                  />

                  <Text style={styles.label}>Status</Text>
                  <StatusPicker
                    status={editedApplication.status}
                    onStatusChange={(status) => setEditedApplication({...editedApplication, status})}
                  />

                  <DatePickerField
                    label="Follow-up Date"
                    value={editedApplication.followUpDate ? new Date(editedApplication.followUpDate) : null}
                    onChange={(date) => handleFollowUpChange({ type: 'set', nativeEvent: { timestamp: date.getTime() } }, date)}
                    mode="date"
                  />

                  {/* Custom Notes Field with icon in top left */}
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.label}>Notes</Text>
                    <View style={styles.descriptionInputContainer}>
                      <TextInput
                        style={styles.descriptionInput}
                        value={editedApplication.notes}
                        onChangeText={(text) => setEditedApplication({...editedApplication, notes: text})}
                        placeholder="Add your notes here..."
                        multiline
                        numberOfLines={5}
                      />
                      <View style={styles.iconTopLeft}>
                        <Ionicons 
                          name="document-text-outline" 
                          size={20} 
                          color={CAREER_COLORS.nightSky} 
                        />
                      </View>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Android Status Picker Modal */}
      <Modal
        visible={showAndroidStatusPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAndroidStatusPicker(false)}
      >
        <View style={styles.androidStatusPickerBackdrop}>
          <View style={styles.androidStatusPickerContent}>
            <Text style={styles.androidStatusPickerTitle}>Select Status</Text>
            
            {['saved', 'applied', 'interview', 'rejected', 'accepted'].map((status) => (
              <TouchableOpacity 
                key={status}
                style={styles.androidStatusOption}
                onPress={() => handleAndroidStatusSelect(status)}
              >
                <StatusBadge status={status} />
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.androidStatusCancelButton}
              onPress={() => setShowAndroidStatusPicker(false)}
            >
              <Text style={styles.androidStatusCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CAREER_COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginBottom: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  jobInfoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 32,
    marginBottom: 10,
    alignItems: 'center', // Center children horizontally
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center', // Center text
  },
  companyName: {
    fontSize: 18,
    color: '#495057',
    marginBottom: 12,
    textAlign: 'center', // Center text
  },
  infoStatusRow: {
    flexDirection: 'row',
    justifyContent: 'center', // Center children horizontally
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap', // Allow wrapping if needed
    gap: 12, // Space between location and status
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6c757d',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  timeline: {
    marginLeft: 8,
    paddingBottom: 10,
  },
  timelineItem: {
    marginBottom: 0,
    position: 'relative',
    paddingBottom: 20,
  },
  timelineStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dee2e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineStepText: {
    fontSize: 16,
    color: '#6c757d',
  },
  timelineConnectorContainer: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: -10,
    width: 2,
    zIndex: -1,
  },
  timelineConnector: {
    width: 2,
    height: '100%',
    backgroundColor: CAREER_COLORS.nightSky,
    opacity: 0.7,
  },
  timelineDates: {
    marginLeft: 40,
    marginTop: 5,
    marginBottom: 10,
  },
  timelineDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    paddingVertical: 3,
  },
  timelineDateIcon: {
    marginRight: 5,
  },
  timelineDateLabel: {
    fontSize: 12,
    color: '#5D5B8D',
    marginRight: 5,
    fontWeight: '500',
  },
  timelineDateValue: {
    fontSize: 12,
    color: '#333',
  },
  notesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#5D5B8D',
  },
  notesText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  datesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 8,
    marginRight: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  smartActionsContainer: {
    borderRadius: 8,
  },
  smartAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#5D5B8D',
    borderLeftWidth: 3,
  },
  smartActionText: {
    flex: 1,
    fontSize: 14,
    color: '#212529',
    marginLeft: 12,
  },
  resumePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  placeholderText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    paddingHorizontal: Platform.OS === 'android' ? 15 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5D5B8D',
  },
  modalScrollContent: {
    maxHeight: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#5D5B8D',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  calendarIcon: {
    marginLeft: 5,
  },
  dateText: {
    color: '#000',
  },
  statusInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  saveButton: {
    height: 50,
    borderRadius: 25,
    marginVertical: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButtonContainer: {
    marginTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CAREER_COLORS.red,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  androidStatusPickerBackdrop: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  androidStatusPickerContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
    paddingBottom: 30,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  androidStatusPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D5B8D',
    marginBottom: 15,
    textAlign: 'center',
  },
  androidStatusOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidStatusBadgeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidStatusCancelButton: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  androidStatusCancelText: {
    color: '#5D5B8D',
    fontWeight: '600',
    fontSize: 16,
  },
  reminderInfoContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'flex-start',
  },
  reminderInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#5D5B8D',
    marginLeft: 10,
    lineHeight: 20,
  },
  picker: {
    height: 120,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 15,
  },
  safeAreaHeader: {
    backgroundColor: CAREER_COLORS.white,
    zIndex: 10,
    shadowColor: CAREER_COLORS.midnight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerButtonContainer: {
    marginRight: 10,
  },
  headerEditButton: {
    height: 36,
    minWidth: 100,
    width: 100,
    borderRadius: 18,
    marginVertical: 0,
  },
  floatingButtonContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    zIndex: 999,
  },
  floatingButton: {
    width: 200,
    height: 50,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 8,
  },
  separator: {
    height: 1,
    backgroundColor: CAREER_COLORS.salt,
    marginVertical: 20,
    width: '100%',
  },
  // Status and description styles
  statusBadge: {
    marginLeft: 'auto',
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  // Input styles for multiline fields with top-left icons
  descriptionInputContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    height: 5 * 24, // Height for 5 lines of text
    paddingTop: 8,
    paddingBottom: 8,
  },
  descriptionInput: {
    flex: 1,
    height: '100%',
    color: '#000',
    fontSize: 16,
    textAlignVertical: 'top',
    paddingLeft: 30, // Left padding to prevent text from overlapping with the icon
  },
  iconTopLeft: {
    position: 'absolute',
    top: 12,
    left: 10,
  },

});
