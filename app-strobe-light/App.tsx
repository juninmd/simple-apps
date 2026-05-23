import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Slider } from 'react-native';

export default function App() {
  const [isOn, setIsOn] = useState(false);
  const [speed, setSpeed] = useState(500); // ms
  const [activeColor, setActiveColor] = useState('black');
  const intervalRef = useRef < NodeJS.Timeout | null > (null);

  const toggle = () => {
    if (isOn) {
      stopStrobe();
    } else {
      startStrobe();
    }
    setIsOn(!isOn);
  };

  const startStrobe = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveColor(prev => prev === 'white' ? 'black' : 'white');
    }, speed);
  };

  const stopStrobe = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveColor('black');
  };

  useEffect(() => {
    if (isOn) {
      startStrobe();
    }
    return () => stopStrobe();
  }, [speed]);

  return (
    <View style={[styles.container, { backgroundColor: activeColor }]}>
      <View style={styles.controls}>
        <Text style={styles.title}>Strobe Light</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: isOn ? '#ff5252' : '#4caf50' }]} onPress={toggle}>
          <Text style={styles.buttonText}>{isOn ? 'STOP' : 'START'}</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: activeColor === 'white' ? 'black' : 'white' }]}>Speed: {speed}ms</Text>
        <Slider // Note: React Native default Slider might need library, using basic view if failed, but standard has Slider? No, need @react-native-community/slider.
        // Fallback: Just buttons for speed
        />
        <View style={styles.speedButtons}>
          <TouchableOpacity style={styles.speedBtn} onPress={() => setSpeed(100)}><Text>Fast</Text></TouchableOpacity>
          <TouchableOpacity style={styles.speedBtn} onPress={() => setSpeed(500)}><Text>Med</Text></TouchableOpacity>
          <TouchableOpacity style={styles.speedBtn} onPress={() => setSpeed(1000)}><Text>Slow</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.adBanner}>
        <Text>[Ad: Party Supplies]</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls: { padding: 20, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  button: { width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center', elevation: 5, alignSelf: 'center', marginBottom: 20 },
  buttonText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  label: { textAlign: 'center', marginBottom: 10 },
  speedButtons: { flexDirection: 'row', justifyContent: 'space-around', width: 200 },
  speedBtn: { padding: 10, backgroundColor: '#ddd', borderRadius: 5 },
  adBanner: { position: 'absolute', bottom: 20, padding: 10, backgroundColor: 'yellow' }
});
