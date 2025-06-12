import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';

export default function TrackPalScreen() {
  const [response, setResponse] = useState<string | null>(null);

  const checkReminders = async () => {
    try {
      const res = await fetch("http://localhost:8000/agents/track_pal/check_reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "demo-user"  // später dynamisch
        }),
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      Alert.alert("Error", "Could not fetch reminders");
      console.error("Reminder Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TrackPal – Reminders</Text>
      <View style={styles.separator} />
      <Button title="Check Reminders" onPress={checkReminders} />
      {response && <Text style={styles.result}>{response}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
    backgroundColor: '#ccc',
  },
  result: {
    marginTop: 20,
    fontSize: 16,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
});
