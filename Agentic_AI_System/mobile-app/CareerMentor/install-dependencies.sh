#!/bin/bash
# CareerMentor Frontend Dependencies Installation Script

echo "Installing CareerMentor frontend dependencies..."

# Install core dependencies
npx expo install @react-native-async-storage/async-storage
npx expo install @react-native-community/datetimepicker
npx expo install @react-native-picker/picker
npx expo install @react-native-community/slider
npx expo install expo-document-picker
npx expo install react-native-svg react-native-reanimated

echo "All dependencies installed successfully!"
echo "You can now run 'npm start' to start the application."
