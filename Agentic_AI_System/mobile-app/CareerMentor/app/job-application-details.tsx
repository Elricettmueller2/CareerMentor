import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert, Platform, ActionSheetIOS, Modal, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useRouter, Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ApplicationService, JobApplication } from '@/services/ApplicationService';
import NotificationService from '@/services/NotificationService';
import { useState, useEffect } from 'react';

export default function JobApplicationDetailsScreen() {
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
  const [reminderTitle, setReminderTitle] = useState('Set Follow-up Reminder');
  const [reminderMessage, setReminderMessage] = useState('');

  useEffect(() => {
    if (application) {
      setEditedApplication({...application});
    }
  }, [application]);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!id) return;
      
      try {
        const applications = await ApplicationService.getApplications();
        const foundApp = applications.find(app => app.id === id);
        
        if (foundApp) {
          setApplication(foundApp);
        }
      } catch (error) {
        console.error('Error fetching application details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplication();
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
      // Combine date and time into a single Date object
      const combinedDate = new Date(reminderDate);
      combinedDate.setHours(reminderTime.getHours());
      combinedDate.setMinutes(reminderTime.getMinutes());
      
      // Schedule the notification
      const notificationId = await NotificationService.scheduleFollowUpReminder(
        application.id,
        application.company,
        application.jobTitle,
        combinedDate
      );
      
      if (notificationId) {
        // Update application based on reminder type
        let updateData: any = {};
        let successMessage = '';
        
        switch (reminderType) {
          case 'application':
            updateData = {
              applicationDeadlineReminder: combinedDate.toISOString()
            };
            successMessage = 'Application deadline reminder set successfully!';
            break;
            
          case 'follow-up':
            updateData = {
              followUpDate: combinedDate.toISOString(),
              followUpTime: `${combinedDate.getHours().toString().padStart(2, '0')}:${combinedDate.getMinutes().toString().padStart(2, '0')}`
            };
            successMessage = 'Follow-up reminder set successfully!';
            break;
            
          case 'interview':
            updateData = {
              interviewReminder: combinedDate.toISOString()
            };
            successMessage = 'Interview reminder set successfully!';
            break;
        }
        
        const updatedApp = await ApplicationService.updateApplication(application.id, updateData);
        
        if (updatedApp) {
          setApplication(updatedApp);
          Alert.alert('Success', successMessage);
          setShowReminderModal(false);
        }
      } else {
        Alert.alert('Error', 'Failed to schedule notification. Please check notification permissions.');
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      Alert.alert('Error', 'An error occurred while setting the reminder');
    } finally {
      setSettingReminder(false);
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (!application || application.status === newStatus) return;
    
    setUpdating(true);
    ApplicationService.updateApplication(application.id, { status: newStatus })
      .then(updatedApp => {
        if (updatedApp) {
          setApplication(updatedApp);
          Alert.alert('Success', `Status updated to ${formatStatusText(newStatus)}`);
        } else {
          Alert.alert('Error', 'Failed to update application status');
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
          options: ['Cancel', 'Saved', 'Applied', 'Interview', 'Rejected', 'Accepted'],
          cancelButtonIndex: 0,
          title: 'Update Status',
          message: 'Select a new status for this application'
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

  const saveChanges = () => {
    if (!editedApplication) return;
    
    // Validate required fields
    if (!editedApplication.jobTitle.trim() || !editedApplication.company.trim()) {
      Alert.alert('Error', 'Job title and company are required');
      return;
    }
    
    setUpdating(true);
    ApplicationService.updateApplication(editedApplication.id, editedApplication)
      .then(updatedApp => {
        if (updatedApp) {
          setApplication(updatedApp);
          setShowEditModal(false);
          // Alert.alert('Success', 'Job application updated successfully');
        } else {
          Alert.alert('Error', 'Failed to update job application');
        }
      })
      .catch(error => {
        console.error('Error updating application:', error);
        Alert.alert('Error', 'An error occurred while updating the job application');
      })
      .finally(() => {
        setUpdating(false);
      });
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Application',
      'Are you sure you want to delete this job application?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              const success = await ApplicationService.deleteApplication(id as string);
              
              if (success) {
                router.replace('/(tabs)/trackpal');
              } else {
                Alert.alert('Error', 'Failed to delete job application');
                setDeleting(false);
              }
            } catch (error) {
              console.error('Error deleting application:', error);
              Alert.alert('Error', 'An error occurred while deleting the job application');
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

  // Brand color
  const BRAND_PURPLE = '#5D5B8D';
  
  const getStatusColor = (status: string): string => {
    // Use different colors for rejected and accepted statuses
    if (status.toLowerCase() === 'rejected') {
      return '#dc3545'; // Red for rejected
    } else if (status.toLowerCase() === 'accepted') {
      return '#28a745'; // Green for accepted
    } else {
      return BRAND_PURPLE; // Brand purple for all other statuses
    }
  };

  const getTimelineSteps = () => {
    const steps = [
      { status: 'saved', label: 'Saved' },
      { status: 'applied', label: 'Applied' },
      { status: 'interview', label: 'Interview' },
      { status: 'accepted', label: 'Accepted' }
    ];
    
    // If rejected, we want to show a different flow
    if (application?.status.toLowerCase() === 'rejected') {
      // Check if the application has gone through an interview before rejection
      const hasHadInterview = application.notes?.toLowerCase().includes('interview') || 
                             application.notes?.toLowerCase().includes('interviewed');
      
      return [
        { status: 'saved', label: 'Saved' },
        { status: 'applied', label: 'Applied' },
        ...(hasHadInterview ? [{ status: 'interview', label: 'Interview' }] : []),
        { status: 'rejected', label: 'Rejected' }
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

  const renderSmartActions = () => {
    if (!application) return null;
    
    const status = application.status.toLowerCase();
    
    switch(status) {
      case 'saved':
        return (
          <>
            <Link href="/resume-refiner" asChild>
              <TouchableOpacity style={styles.smartAction}>
                <Ionicons name="document-text-outline" size={24} color="#5D5B8D" />
                <Text style={styles.smartActionText}>Need help tailoring your resume?</Text>
                <Ionicons name="chevron-forward" size={20} color="#5D5B8D" />
              </TouchableOpacity>
            </Link>
            <TouchableOpacity 
              style={styles.smartAction}
              onPress={() => {
                setReminderType('application');
                setReminderTitle('Set Application Deadline Reminder');
                setReminderMessage(`You will receive a notification at the specified date and time to apply to ${application?.company} before the deadline.`);
                setShowReminderModal(true);
              }}
            >
              <Ionicons name="notifications-outline" size={24} color="#5D5B8D" />
              <Text style={styles.smartActionText}>Set a reminder to apply before deadline</Text>
              <Ionicons name="chevron-forward" size={20} color="#5D5B8D" />
            </TouchableOpacity>
          </>
        );
        
      case 'applied':
        return (
          <>
            <TouchableOpacity 
              style={styles.smartAction}
              onPress={() => {
                setReminderType('follow-up');
                setReminderTitle('Set Follow-up Reminder');
                setReminderMessage(`You will receive a notification at the specified date and time to follow up on your application to ${application?.company}.`);
                setShowReminderModal(true);
              }}
            >
              <Ionicons name="notifications-outline" size={24} color="#5D5B8D" />
              <Text style={styles.smartActionText}>Set a follow-up reminder</Text>
              <Ionicons name="chevron-forward" size={20} color="#5D5B8D" />
            </TouchableOpacity>
            <Link href="/interview" asChild>
              <TouchableOpacity style={styles.smartAction}>
                <Ionicons name="people-outline" size={24} color="#5D5B8D" />
                <Text style={styles.smartActionText}>Expecting an interview? Use MockMate</Text>
                <Ionicons name="chevron-forward" size={20} color="#5D5B8D" />
              </TouchableOpacity>
            </Link>
          </>
        );
        
      case 'interview':
        return (
          <>
            <Link href="/interview" asChild>
              <TouchableOpacity style={styles.smartAction}>
                <Ionicons name="people-outline" size={24} color="#5D5B8D" />
                <Text style={styles.smartActionText}>Expecting an interview? Use MockMate</Text>
                <Ionicons name="chevron-forward" size={20} color="#5D5B8D" />
              </TouchableOpacity>
            </Link>
            <TouchableOpacity 
              style={styles.smartAction}
              onPress={() => {
                setReminderType('interview');
                setReminderTitle('Set Interview Reminder');
                setReminderMessage(`You will receive a notification at the specified date and time to review your notes for the interview with ${application?.company}.`);
                setShowReminderModal(true);
              }}
            >
              <Ionicons name="time-outline" size={24} color="#5D5B8D" />
              <Text style={styles.smartActionText}>Interview in 24h — Review your notes?</Text>
              <Ionicons name="chevron-forward" size={20} color="#5D5B8D" />
            </TouchableOpacity>
          </>
        );
        
      case 'rejected':
        return (
          <>
            <Link href="/resume-refiner" asChild>
              <TouchableOpacity style={styles.smartAction}>
                <Ionicons name="document-text-outline" size={24} color="#5D5B8D" />
                <Text style={styles.smartActionText}>Want to improve your resume for next time?</Text>
                <Ionicons name="chevron-forward" size={20} color="#5D5B8D" />
              </TouchableOpacity>
            </Link>
            <Link href="/pathfinder" asChild>
              <TouchableOpacity style={styles.smartAction}>
                <Ionicons name="search-outline" size={24} color="#5D5B8D" />
                <Text style={styles.smartActionText}>Find similar jobs</Text>
                <Ionicons name="chevron-forward" size={20} color="#5D5B8D" />
              </TouchableOpacity>
            </Link>
          </>
        );
        
      case 'accepted':
        return (
          <View style={styles.congratsContainer}>
            <Ionicons name="trophy" size={40} color="#FFD700" />
            <Text style={styles.congratsText}>Congratulations on your new job!</Text>
          </View>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading application details...</Text>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Application not found</Text>
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
      <Stack.Screen 
        options={{
          title: "",  // Empty title to remove the job name from header
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
            <TouchableOpacity onPress={() => setShowEditModal(true)} style={{ marginRight: 16 }}>
              <Ionicons name="pencil-outline" size={24} color="#5D5B8D" />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Job Info Section */}
        <View style={styles.jobInfoContainer}>
          <Text style={styles.jobTitle}>{application.jobTitle}</Text>
          <Text style={styles.companyName}>{application.company}</Text>
          
          {application.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{application.location}</Text>
            </View>
          )}
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
            <Text style={styles.statusText}>{formatStatusText(application.status)}</Text>
          </View>
        </View>
        
        {/* Smart Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Actions</Text>
          <View style={styles.smartActionsContainer}>
            {renderSmartActions()}
          </View>
        </View>
        
        {/* Timeline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Timeline</Text>
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
                  
                  {!isLastItem && (
                    <View style={[
                      styles.timelineConnector,
                      index < currentIndex ? { backgroundColor: '#5D5B8D' } : {}
                    ]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>
              {application.notes || "No notes added yet."}
            </Text>
          </View>
        </View>
        
        {/* Dates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Dates</Text>
          <View style={styles.datesContainer}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={20} color="#5D5B8D" />
              <Text style={styles.dateLabel}>Applied on:</Text>
              <Text style={styles.dateValue}>
                {new Date(application.appliedDate).toLocaleDateString()}
              </Text>
            </View>
            
            {application.applicationDeadline && (
              <View style={styles.dateItem}>
                <Ionicons name="hourglass-outline" size={20} color="#5D5B8D" />
                <Text style={styles.dateLabel}>Application Deadline:</Text>
                <Text style={styles.dateValue}>
                  {new Date(application.applicationDeadline).toLocaleDateString()}
                </Text>
              </View>
            )}
            
            {application.followUpDate && (
              <View style={styles.dateItem}>
                <Ionicons name="notifications-outline" size={20} color="#5D5B8D" />
                <Text style={styles.dateLabel}>Follow-up Reminder:</Text>
                <Text style={styles.dateValue}>
                  {new Date(application.followUpDate).toLocaleDateString()} at {application.followUpTime}
                </Text>
              </View>
            )}
          </View>
        </View>
        
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
              {deleting ? 'Deleting...' : 'Delete Application'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Follow-up Reminder Modal */}
      <Modal
        visible={showReminderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{reminderTitle}</Text>
              <TouchableOpacity style={styles.doneButton} onPress={saveReminder} disabled={settingReminder}>
                <LinearGradient
                  colors={['#C29BB8', '#8089B4']}
                  style={styles.doneButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.doneButtonText}>{settingReminder ? 'Setting...' : 'Done'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollContent}>
              <Text style={styles.label}>Reminder Date</Text>
              <TouchableOpacity 
                style={styles.dateInput} 
                onPress={() => {
                  setShowReminderDatePicker(!showReminderDatePicker);
                  setShowReminderTimePicker(false);
                }}
              >
                <Text style={styles.dateText}>
                  {reminderDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#5D5B8D" style={styles.calendarIcon} />
              </TouchableOpacity>
              
              {showReminderDatePicker && (
                <DateTimePicker
                  value={reminderDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleReminderDateChange}
                  minimumDate={new Date()}
                  style={Platform.OS === 'ios' ? styles.picker : undefined}
                />
              )}
              
              <Text style={styles.label}>Reminder Time</Text>
              <TouchableOpacity 
                style={styles.dateInput} 
                onPress={() => {
                  setShowReminderTimePicker(!showReminderTimePicker);
                  setShowReminderDatePicker(false);
                }}
              >
                <Text style={styles.dateText}>
                  {reminderTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
                <Ionicons name="time-outline" size={20} color="#5D5B8D" style={styles.calendarIcon} />
              </TouchableOpacity>
              
              {showReminderTimePicker && (
                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleReminderTimeChange}
                  style={Platform.OS === 'ios' ? styles.picker : undefined}
                />
              )}
              
              <View style={styles.reminderInfoContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#5D5B8D" />
                <Text style={styles.reminderInfoText}>
                  {reminderMessage}
                </Text>
              </View>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Job Application</Text>
              <TouchableOpacity 
                style={styles.doneButton}
                onPress={saveChanges}
              >
                <LinearGradient
                  colors={['#C29BB8', '#8089B4']}
                  style={styles.doneButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent}>
              {editedApplication && (
                <>
                  <Text style={styles.label}>Job Title</Text>
                  <TextInput
                    style={styles.input}
                    value={editedApplication.jobTitle}
                    onChangeText={(text) => setEditedApplication({...editedApplication, jobTitle: text})}
                    placeholder="Enter job title"
                  />

                  <Text style={styles.label}>Company</Text>
                  <TextInput
                    style={styles.input}
                    value={editedApplication.company}
                    onChangeText={(text) => setEditedApplication({...editedApplication, company: text})}
                    placeholder="Enter company name"
                  />

                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={editedApplication.location}
                    onChangeText={(text) => setEditedApplication({...editedApplication, location: text})}
                    placeholder="Enter job location"
                  />

                  <Text style={styles.label}>
                    {editedApplication.status === 'saved' ? 'Application Deadline' : 
                     editedApplication.status === 'applied' ? 'Date Applied' : 
                     editedApplication.status === 'interview' ? 'Interview Date' : 
                     'Important Date'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.dateInput} 
                    onPress={() => setShowDeadlinePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={editedApplication.applicationDeadline ? styles.dateText : styles.placeholderText}>
                      {editedApplication.applicationDeadline ? formatDate(new Date(editedApplication.applicationDeadline)) : 'mm/dd/yyyy'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#5D5B8D" style={styles.calendarIcon} />
                  </TouchableOpacity>

                  {showDeadlinePicker && (
                    <DateTimePicker
                      value={editedApplication.applicationDeadline ? new Date(editedApplication.applicationDeadline) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDeadlineChange}
                    />
                  )}

                  <Text style={styles.label}>Status</Text>
                  <TouchableOpacity 
                    style={[styles.statusInput, { borderColor: getStatusColor(editedApplication.status) }]}
                    onPress={showStatusActionSheet}
                  >
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(editedApplication.status), marginRight: 10 }]}>
                      <Text style={styles.statusText}>{formatStatusText(editedApplication.status)}</Text>
                      {editedApplication.status === 'rejected' && <Ionicons name="close" size={14} color="#fff" style={{marginLeft: 4}} />}
                      {editedApplication.status === 'accepted' && <Ionicons name="checkmark" size={14} color="#fff" style={{marginLeft: 4}} />}
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#5D5B8D" />
                  </TouchableOpacity>

                  <Text style={styles.label}>Follow-up Date</Text>
                  <TouchableOpacity 
                    style={styles.dateInput} 
                    onPress={() => setShowFollowUpPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={editedApplication.followUpDate ? styles.dateText : styles.placeholderText}>
                      {editedApplication.followUpDate ? formatDate(new Date(editedApplication.followUpDate)) : 'mm/dd/yyyy'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#5D5B8D" style={styles.calendarIcon} />
                  </TouchableOpacity>

                  {showFollowUpPicker && (
                    <DateTimePicker
                      value={editedApplication.followUpDate ? new Date(editedApplication.followUpDate) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleFollowUpChange}
                    />
                  )}

                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={editedApplication.notes}
                    onChangeText={(text) => setEditedApplication({...editedApplication, notes: text})}
                    placeholder="Add your notes here..."
                    multiline
                  />

                  {/* Save button removed - using Done button in header instead */}
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
        <View style={styles.androidStatusPickerContainer}>
          <View style={styles.androidStatusPickerContent}>
            <Text style={styles.androidStatusPickerTitle}>Select Status</Text>
            
            {['saved', 'applied', 'interview', 'rejected', 'accepted'].map((status) => (
              <TouchableOpacity 
                key={status}
                style={[styles.androidStatusOption, { borderLeftColor: getStatusColor(status), borderLeftWidth: 4 }]}
                onPress={() => handleAndroidStatusSelect(status)}
              >
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status), marginRight: 10 }]}>
                  <Text style={styles.statusText}>{formatStatusText(status)}</Text>
                  {status === 'rejected' && <Ionicons name="close" size={14} color="#fff" style={{marginLeft: 4}} />}
                  {status === 'accepted' && <Ionicons name="checkmark" size={14} color="#fff" style={{marginLeft: 4}} />}
                </View>
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
    backgroundColor: '#f8f9fa',
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
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 18,
    color: '#495057',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6c757d',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  timeline: {
    marginLeft: 8,
  },
  timelineItem: {
    marginBottom: 8,
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
  timelineConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#dee2e6',
    marginLeft: 11,
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
    backgroundColor: '#f8f9fa',
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
  congratsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5D5B8D',
  },
  congratsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 12,
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
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
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
  doneButton: {
    overflow: 'hidden',
    borderRadius: 20,
    width: 75,
    height: 36,
  },
  doneButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#dc3545',
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
  androidStatusPickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  androidStatusPickerContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
    marginBottom: 0,
    paddingBottom: 30,
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
  }
});
