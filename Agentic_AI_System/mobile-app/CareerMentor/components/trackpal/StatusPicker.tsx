import React from 'react';
import { StyleSheet, TouchableOpacity, View, Platform, ActionSheetIOS, ViewStyle, Modal } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge, { formatStatusText, getStatusColor } from './StatusBadge';

interface StatusPickerProps {
  status: string;
  onStatusChange: (status: string) => void;
  style?: ViewStyle;
}

const STATUS_OPTIONS = [
  'saved',
  'applied',
  'interview',
  'rejected',
  'accepted'
];

const StatusPicker: React.FC<StatusPickerProps> = ({
  status,
  onStatusChange,
  style
}) => {
  const [showAndroidStatusPicker, setShowAndroidStatusPicker] = React.useState(false);

  const showStatusActionSheet = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...STATUS_OPTIONS.map(s => formatStatusText(s)), 'Cancel'],
          cancelButtonIndex: STATUS_OPTIONS.length,
          title: 'Select Status'
        },
        (buttonIndex) => {
          if (buttonIndex < STATUS_OPTIONS.length) {
            onStatusChange(STATUS_OPTIONS[buttonIndex]);
          }
        }
      );
    } else {
      setShowAndroidStatusPicker(true);
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.statusInput, { borderColor: getStatusColor(status) }, style]}
        onPress={showStatusActionSheet}
      >
        <View style={styles.statusContainer}>
          <StatusBadge status={status} style={styles.statusBadge} />
        </View>
        <Ionicons name="chevron-down" size={20} color="#5D5B8D" />
      </TouchableOpacity>

      {/* Android Status Picker Modal */}
      <Modal
        visible={showAndroidStatusPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAndroidStatusPicker(false)}
      >
        <View style={styles.androidStatusPickerBackdrop}>
          <View style={styles.androidStatusPickerContent}>
            {STATUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.androidStatusOption}
                onPress={() => {
                  onStatusChange(option);
                  setShowAndroidStatusPicker(false);
                }}
              >
                <Text style={styles.androidStatusOptionText}>{formatStatusText(option)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  statusInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
  },

  androidStatusPickerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  androidStatusPickerContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '80%',
    overflow: 'hidden',
  },
  androidStatusOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  androidStatusOptionText: {
    fontSize: 16,
    color: '#5D5B8D',
    textAlign: 'center',
  },
  statusOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionBadge: {
    alignSelf: 'center',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  cancelText: {
    color: '#5D5B8D',
    fontWeight: 'bold',
  },
});

export default StatusPicker;
