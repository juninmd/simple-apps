import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<{ sound: Audio.Sound | null, duration: string, file: string }[]>([]);
  const [message, setMessage] = useState('');

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
        setMessage('Recording...');
      } else {
        setMessage('Please grant permission to app to access microphone');
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setRecording(null);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setMessage('Stopped recording');
    if (uri) {
      const { sound, status } = await recording.createNewLoadedSoundAsync();
      const duration = getDurationFormatted((status as any).durationMillis);
      setRecordings([...recordings, { sound, duration, file: uri }]);
      Alert.alert("Saved", "Voice note saved! [Ad: Cloud Storage]");
    }
  }

  function getDurationFormatted(millis: number) {
    const minutes = Math.floor(millis / 1000 / 60);
    const seconds = Math.round((millis / 1000) % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  function getRecordingLines() {
    return recordings.map((recordingLine, index) => {
      return (
        <View key={index} style={styles.row}>
          <Text style={styles.fill}>Recording {index + 1} - {recordingLine.duration}</Text>
          <TouchableOpacity style={styles.playBtn} onPress={() => recordingLine.sound?.replayAsync()}>
            <Text style={styles.btnText}>Play</Text>
          </TouchableOpacity>
        </View>
      );
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Vault 🎙️</Text>
      <Text style={styles.msg}>{message}</Text>

      <TouchableOpacity
        style={[styles.recordBtn, recording ? styles.recording : null]}
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.recordBtnText}>{recording ? 'STOP' : 'RECORD'}</Text>
      </TouchableOpacity>

      <FlatList
        data={recordings}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.fill}>Note #{index + 1} ({item.duration})</Text>
            <TouchableOpacity style={styles.playBtn} onPress={() => item.sound?.replayAsync()}>
              <Text style={styles.btnText}>Play</Text>
            </TouchableOpacity>
          </View>
        )}
        style={styles.list}
      />

      <View style={styles.ad}>
        <Text>[Ad: Speech to Text App]</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eceff1', alignItems: 'center', justifyContent: 'center', paddingTop: 50 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#37474f' },
  msg: { marginBottom: 30, color: '#e53935' },
  recordBtn: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#f44336', alignItems: 'center', justifyContent: 'center', marginBottom: 30, elevation: 5 },
  recording: { backgroundColor: '#b71c1c' },
  recordBtnText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  list: { width: '90%' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderRadius: 10, marginBottom: 10 },
  fill: { flex: 1, fontSize: 16 },
  playBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#607d8b', borderRadius: 5 },
  btnText: { color: '#fff' },
  ad: { width: '100%', padding: 15, backgroundColor: '#cfd8dc', alignItems: 'center', marginTop: 10 }
});
