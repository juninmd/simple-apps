import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Keyboard } from 'react-native';

export default function App() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState < string | null > (null);
  const [status, setStatus] = useState('');

  const calculateBMI = () => {
    Keyboard.dismiss();
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w) return;

    const val = w / (h * h);
    setBmi(val.toFixed(1));

    if (val < 18.5) setStatus('Underweight');
    else if (val < 25) setStatus('Normal');
    else if (val < 30) setStatus('Overweight');
    else setStatus('Obese');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IMC Simples</Text>

      <TextInput
        style={styles.input}
        placeholder="Height (cm)"
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
      />
      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />

      <TouchableOpacity style={styles.button} onPress={calculateBMI}>
        <Text style={styles.buttonText}>Calculate</Text>
      </TouchableOpacity>

      {bmi && (
        <View style={styles.result}>
          <Text style={styles.bmiValue}>{bmi}</Text>
          <Text style={styles.bmiStatus}>{status}</Text>
        </View>
      )}

      <View style={styles.adBanner}>
        <Text style={styles.adText}>[Ad: Healthy Diet Plans]</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, color: '#333' },
  input: { width: '80%', height: 50, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, elevation: 1 },
  button: { width: '80%', height: 50, backgroundColor: '#4CAF50', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 2 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  result: { marginTop: 40, alignItems: 'center' },
  bmiValue: { fontSize: 48, fontWeight: 'bold', color: '#333' },
  bmiStatus: { fontSize: 20, color: '#666', marginTop: 5 },
  adBanner: { position: 'absolute', bottom: 0, width: '100%', height: 60, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderColor: '#ccc' },
  adText: { color: '#555' }
});
