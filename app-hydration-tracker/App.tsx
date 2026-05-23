import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';

export default function App() {
  const [water, setWater] = useState(0);
  const GOAL = 2000;

  const addWater = () => {
    const newVal = water + 250;
    setWater(newVal);
    if (newVal >= GOAL) {
       Alert.alert("Daily Goal Reached!", "Good job! [Ad: Buy Water Bottle]");
    }
  };

  const reset = () => setWater(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💧 Hydration Tracker</Text>
      <Text style={styles.counter}>{water} / {GOAL} ml</Text>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${Math.min((water/GOAL)*100, 100)}%` }]} />
      </View>
      <TouchableOpacity style={styles.button} onPress={addWater}>
        <Text style={styles.buttonText}>+ 250ml</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={reset}><Text style={styles.reset}>Reset</Text></TouchableOpacity>
      
      <View style={styles.adBanner}>
        <Text style={styles.adText}>[Ad Banner Placeholder]</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0f7fa', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#006064' },
  counter: { fontSize: 40, fontWeight: 'bold', color: '#00838f', marginBottom: 20 },
  progressContainer: { width: '100%', height: 20, backgroundColor: '#b2ebf2', borderRadius: 10, overflow: 'hidden', marginBottom: 40 },
  progressBar: { height: '100%', backgroundColor: '#00bcd4' },
  button: { backgroundColor: '#00acc1', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, elevation: 3 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  reset: { marginTop: 20, color: '#006064' },
  adBanner: { position: 'absolute', bottom: 0, width: '100%', height: 60, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  adText: { color: '#666' }
});
