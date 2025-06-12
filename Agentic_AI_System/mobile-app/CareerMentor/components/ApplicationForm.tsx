import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

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
    jobUrl?: string;
  }) => void;
  onCancel: () => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ onSubmit, onCancel }) => {
  const [jobUrl, setJobUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState<Date | null>(null);
  const [status, setStatus] = useState('To Apply');
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
  const [followUpTime, setFollowUpTime] = useState('12:00');
  const [notes, setNotes] = useState('');
  
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);

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
      notes,
      jobUrl: jobUrl.trim() ? jobUrl : undefined
    });
  };

  const handleAutoFill = () => {
    // In a real app, this would parse the job URL and extract information
    // For now, we'll just fill in some dummy data
    if (jobUrl.includes('google')) {
      setJobTitle('UX Designer');
      setCompany('Google');
      setLocation('Mountain View, CA');
    } else if (jobUrl.includes('microsoft')) {
      setJobTitle('Software Engineer');
      setCompany('Microsoft');
      setLocation('Redmond, WA');
    } else {
      alert('Could not auto-fill from this URL. Please enter details manually.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.urlContainer}>
        <TextInput
          style={styles.urlInput}
          placeholder="Paste job URL here"
          value={jobUrl}
          onChangeText={setJobUrl}
        />
        <TouchableOpacity style={styles.autoFillButton} onPress={handleAutoFill}>
          <Text style={styles.autoFillButtonText}>Auto-Fill</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.divider}>- or -</Text>

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
      >
        <Text style={applicationDeadline ? styles.dateText : styles.placeholderText}>
          {formatDate(applicationDeadline)}
        </Text>
      </TouchableOpacity>
      
      {showDeadlinePicker && (
        <DateTimePicker
          value={applicationDeadline || new Date()}
          mode="date"
          display="default"
          onChange={handleDeadlineChange}
        />
      )}

      <Text style={styles.label}>Status</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={status}
          style={styles.picker}
          onValueChange={(itemValue: string) => setStatus(itemValue)}
        >
          <Picker.Item label="To Apply" value="To Apply" />
          <Picker.Item label="Applied" value="Applied" />
          <Picker.Item label="Interview Scheduled" value="Interview Scheduled" />
          <Picker.Item label="Offer Received" value="Offer Received" />
          <Picker.Item label="Rejected" value="Rejected" />
        </Picker>
      </View>

      <Text style={styles.label}>Set Follow-up Reminder</Text>
      <View style={styles.reminderContainer}>
        <TouchableOpacity 
          style={[styles.dateInput, { flex: 2 }]} 
          onPress={() => setShowFollowUpPicker(true)}
        >
          <Text style={followUpDate ? styles.dateText : styles.placeholderText}>
            {formatDate(followUpDate)}
          </Text>
        </TouchableOpacity>
        
        <TextInput
          style={[styles.input, { flex: 1, marginLeft: 10 }]}
          value={followUpTime}
          onChangeText={setFollowUpTime}
          placeholder="--:-- --"
        />
      </View>

      {showFollowUpPicker && (
        <DateTimePicker
          value={followUpDate || new Date()}
          mode="date"
          display="default"
          onChange={handleFollowUpChange}
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
        <Text style={styles.saveButtonText}>Save Application</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  urlContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  urlInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  autoFillButton: {
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  autoFillButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  divider: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    justifyContent: 'center',
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
  },
  picker: {
    height: 50,
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
    backgroundColor: '#000',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ApplicationForm;
