import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform, ViewStyle } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  style?: ViewStyle;
  iconName?: keyof typeof Ionicons.glyphMap;
  minimumDate?: Date;
  mode?: 'date' | 'time';
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  style,
  iconName = 'calendar-outline',
  minimumDate,
  mode = 'date'
}) => {
  const [showPicker, setShowPicker] = useState(false);
  
  const handleChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      onChange(selectedDate);
    }
  };
  
  const formatValue = () => {
    if (!value) return '';
    
    if (mode === 'date') {
      return value.toLocaleDateString();
    } else {
      return value.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={[styles.dateInput, style]} 
        onPress={() => setShowPicker(!showPicker)}
      >
        <Text style={styles.dateText}>
          {formatValue()}
        </Text>
        <Ionicons 
          name={mode === 'date' ? iconName : 'time-outline'} 
          size={20} 
          color="#5D5B8D" 
          style={styles.icon} 
        />
      </TouchableOpacity>
      
      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
          style={Platform.OS === 'ios' ? styles.picker : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#5D5B8D',
  },
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  dateText: {
    color: '#000',
  },
  icon: {
    marginLeft: 5,
  },
  picker: {
    height: 120,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 15,
  }
});

export default DatePickerField;
