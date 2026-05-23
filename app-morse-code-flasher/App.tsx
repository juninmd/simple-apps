import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { generateMorseEvents, textToMorse } from './src/utils/morse';

export default function App() {
  const [text, setText] = useState('');
  const [flashing, setFlashing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const stopTransmission = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    setFlashing(false);
    setFlashOn(false);
  };

  const transmit = async () => {
    if (flashing) {
        stopTransmission();
        return;
    }

    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        Alert.alert("Permission Required", "Camera permission is needed for the flashlight.");
        return;
      }
    }

    if (!text.trim()) {
        Alert.alert("Input Required", "Please enter some text to transmit.");
        return;
    }

    setFlashing(true);
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    const events = generateMorseEvents(text);

    try {
      for (const event of events) {
        if (signal.aborted) break;
        setFlashOn(event.on);
        await new Promise(resolve => setTimeout(resolve, event.duration));
      }
      if (!signal.aborted) {
          Alert.alert("Transmission Complete", "Message sent successfully.");
      }
    } catch (e) {
        console.error(e);
    } finally {
        // Only reset if we finished naturally (not aborted, or if aborted we handle it in stopTransmission)
        // Actually stopTransmission handles state.
        // If we finished naturally:
        if (!signal.aborted) {
            setFlashing(false);
            setFlashOn(false);
        }
    }
  };

  return (
    <View style={styles.container}>
      {/* Hidden Camera View for Torch Control */}
      {permission?.granted && (
        <CameraView
          style={{ width: 0, height: 0 }}
          enableTorch={flashOn}
        />
      )}

      <Text style={styles.title}>Morse Code Flasher 🔦</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Text"
        placeholderTextColor="#999"
        value={text}
        onChangeText={setText}
        accessibilityLabel="Text input for Morse code"
      />

      <TouchableOpacity
        style={[styles.btn, flashing && styles.btnActive]}
        onPress={transmit}
        accessibilityLabel={flashing ? "Stop Transmitting" : "Start Transmitting"}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>{flashing ? 'STOP TRANSMITTING' : 'FLASH MESSAGE'}</Text>
      </TouchableOpacity>

      <Text style={styles.code}>{textToMorse(text)}</Text>

      <View style={styles.ad}>
        <Text style={{ color: '#fff' }}>[Ad: Survival Gear]</Text>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#212121', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40, color: '#fff' },
  input: { width: '100%', backgroundColor: '#fff', padding: 15, borderRadius: 5, fontSize: 18, marginBottom: 20 },
  btn: { width: '100%', padding: 20, backgroundColor: '#ffca28', borderRadius: 5, alignItems: 'center' },
  btnActive: { backgroundColor: '#e65100' },
  btnText: { fontWeight: 'bold', fontSize: 18, color: '#212121' },
  code: { color: '#ffca28', fontSize: 24, marginTop: 40, fontFamily: 'monospace', textAlign: 'center' },
  ad: { position: 'absolute', bottom: 20, padding: 10, backgroundColor: '#424242', width: '100%', alignItems: 'center' }
});
