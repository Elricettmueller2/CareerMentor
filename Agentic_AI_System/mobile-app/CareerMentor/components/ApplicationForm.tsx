import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  ScrollView,
  Modal,
  ActionSheetIOS
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ApplicationFormProps {
  onSubmit: (application: {
    jobTitle: string;
    company: string;
    location: string;
    applicationDeadline: Date | null;
    status: string;
    followUpDate: Date | null;
    followUpTime: string;
    notes: string;
  }) => void;
  onCancel: () => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ onSubmit, onCancel }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState<Date | null>(null);
  const [status, setStatus] = useState('saved');
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
  const [followUpTime, setFollowUpTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return 'mm/dd/yyyy';
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const handleDeadlineChange = (event: any, selectedDate?: Date) => {
    setShowDeadlinePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      setApplicationDeadline(selectedDate);
    }
  };

  const handleFollowUpChange = (event: any, selectedDate?: Date) => {
    setShowFollowUpPicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      setFollowUpDate(selectedDate);
    }
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      const formattedHours = hours < 10 ? `0${hours}` : hours;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      setFollowUpTime(`${formattedHours}:${formattedMinutes}`);
    }
  };
  
  const getStatusLabel = (value: string) => {
    switch(value) {
      case 'saved': return 'Saved';
      case 'applied': return 'Applied';
      case 'interview': return 'Interview';
      case 'rejected': return 'Rejected';
      case 'accepted': return 'Accepted';
      default: return 'Saved';
    }
  };
  
  const showStatusActionSheet = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Saved', 'Applied', 'Interview', 'Rejected', 'Accepted'],
          cancelButtonIndex: 0,
          title: 'Select Status'
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Cancel
            return;
          }
          
          const statusValues = ['saved', 'applied', 'interview', 'rejected', 'accepted'];
          setStatus(statusValues[buttonIndex - 1]);
        }
      );
    } else {
      setShowStatusPicker(true);
    }
  };

  const handleSubmit = () => {
    if (!jobTitle.trim() || !company.trim()) {
      alert('Please enter job title and company');
      return;
    }

    onSubmit({
      jobTitle,
      company,
      location,
      applicationDeadline,
      status,
      followUpDate,
      followUpTime,
      notes
    });
  };



  return (
    <ScrollView style={styles.container}>

      <Text style={styles.label}>Job Title</Text>
      <TextInput
        style={styles.input}
        value={jobTitle}
        onChangeText={setJobTitle}
        placeholder="Enter job title"
      />

      <Text style={styles.label}>Company</Text>
      <TextInput
        style={styles.input}
        value={company}
        onChangeText={setCompany}
        placeholder="Enter company name"
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Enter job location"
      />

      <Text style={styles.label}>Application Deadline</Text>
      <TouchableOpacity 
        style={styles.dateInput} 
        onPress={() => setShowDeadlinePicker(true)}
        activeOpacity={0.7}
      >
        <Text style={applicationDeadline ? styles.dateText : styles.placeholderText}>
          {formatDate(applicationDeadline)}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#5D5B8D" style={styles.calendarIcon} />
      </TouchableOpacity>
      
      {showDeadlinePicker && (
        <DateTimePicker
          value={applicationDeadline || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDeadlineChange}
          minimumDate={new Date()}
        />
      )}

      <Text style={styles.label}>Status</Text>
      {Platform.OS === 'ios' ? (
        <TouchableOpacity 
          style={styles.statusInput}
          onPress={showStatusActionSheet}
          activeOpacity={0.7}
        >
          <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
          <Ionicons name="chevron-down" size={20} color="#5D5B8D" />
        </TouchableOpacity>
      ) : (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={status}
            style={styles.picker}
            onValueChange={(itemValue: string) => setStatus(itemValue)}
          >
            <Picker.Item label="Saved" value="saved" />
            <Picker.Item label="Applied" value="applied" />
            <Picker.Item label="Interview" value="interview" />
            <Picker.Item label="Rejected" value="rejected" />
            <Picker.Item label="Accepted" value="accepted" />
          </Picker>
        </View>
      )}

      <Text style={styles.label}>Set Follow-up Reminder</Text>
      <View style={styles.reminderContainer}>
        <TouchableOpacity 
          style={[styles.dateInput, { flex: 2 }]} 
          onPress={() => setShowFollowUpPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={followUpDate ? styles.dateText : styles.placeholderText}>
            {formatDate(followUpDate)}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#5D5B8D" style={styles.calendarIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.dateInput, { flex: 1, marginLeft: 10 }]}
          onPress={() => setShowTimePicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dateText}>{followUpTime}</Text>
          <Ionicons name="time-outline" size={20} color="#5D5B8D" style={styles.calendarIcon} />
        </TouchableOpacity>
        
      {showTimePicker && (
        <DateTimePicker
          value={(() => {
            const [hours, minutes] = followUpTime.split(':').map(Number);
            const date = new Date();
            date.setHours(hours);
            date.setMinutes(minutes);
            return date;
          })()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
      </View>

      {showFollowUpPicker && (
        <DateTimePicker
          value={followUpDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleFollowUpChange}
          minimumDate={new Date()}
        />
      )}

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Add your notes here..."
        multiline
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
        <LinearGradient
          colors={['#C29BB8', '#8089B4']}
          style={styles.saveButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.saveButtonText}>Save Application</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
    paddingTop: 8,
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
  placeholderText: {
    color: '#999',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  statusInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    color: '#000',
    fontSize: 16,
  },
  reminderContainer: {
    flexDirection: 'row',
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
});

export default ApplicationForm;
