import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Audio } from 'expo-av';

export default function App() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<{ sound: Audio.Sound | null, duration: string, file: string }[]>([]);
  const [message, setMessage] = useState('');

  // Ref to keep track of recordings for cleanup on unmount
  const recordingsRef = useRef(recordings);
  recordingsRef.current = recordings;

  // Cleanup sounds when component unmounts
  useEffect(() => {
    return () => {
      if (recordingsRef.current) {
        recordingsRef.current.forEach(async (rec) => {
            if (rec.sound) {
                try {
                    await rec.sound.unloadAsync();
                } catch (e) {
                    console.log('Error unloading sound', e);
                }
            }
        });
      }
    };
  }, []);

  /**
   * Starts recording audio.
   */
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

  /**
   * Stops the current recording and saves it.
   */
  async function stopRecording() {
    if (!recording) return;
    setRecording(null);
    try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setMessage('Stopped recording');
        if (uri) {
        const { sound, status } = await recording.createNewLoadedSoundAsync();
        const durationMillis = (status as any).durationMillis || 0;
        const duration = getDurationFormatted(durationMillis);
        setRecordings([...recordings, { sound, duration, file: uri }]);
        Alert.alert("Saved", "Voice note saved! [Ad: Cloud Storage]");
        }
    } catch (error) {
        console.error('Failed to stop recording', error);
    }
  }

  /**
   * Formats milliseconds into MM:SS string.
   * @param millis Duration in milliseconds
   */
  function getDurationFormatted(millis: number) {
    const minutes = Math.floor(millis / 1000 / 60);
    const seconds = Math.round((millis / 1000) % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  /**
   * Deletes a recording at the specified index.
   * @param index Index of the recording to delete
   */
  async function deleteRecording(index: number) {
      const recordingToDelete = recordings[index];
      if (recordingToDelete.sound) {
          try {
            await recordingToDelete.sound.unloadAsync();
          } catch (error) {
              console.error("Error unloading sound during delete:", error);
          }
      }
      const updatedRecordings = [...recordings];
      updatedRecordings.splice(index, 1);
      setRecordings(updatedRecordings);
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
            <View style={styles.actions}>
                <TouchableOpacity style={styles.playBtn} onPress={() => item.sound?.replayAsync()}>
                <Text style={styles.btnText}>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteRecording(index)}>
                <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
            </View>
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
  actions: { flexDirection: 'row' },
  playBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#607d8b', borderRadius: 5, marginRight: 10 },
  deleteBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#e53935', borderRadius: 5 },
  btnText: { color: '#fff' },
  ad: { width: '100%', padding: 15, backgroundColor: '#cfd8dc', alignItems: 'center', marginTop: 10 }
});
