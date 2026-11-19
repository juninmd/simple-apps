import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { calculateBmi, BmiResult } from './src/bmi';

export default function App() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState<BmiResult | null>(null);
  const [error, setError] = useState(false);

  const calculate = () => {
    Keyboard.dismiss();
    const next = calculateBmi(height, weight);
    setResult(next);
    setError(next === null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>IMC Simples</Text>

      <TextInput
        style={styles.input}
        placeholder="Height (cm)"
        accessibilityLabel="Height in centimeters"
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
      />
      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        accessibilityLabel="Weight in kilograms"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />

      <TouchableOpacity style={styles.button} onPress={calculate} accessibilityRole="button">
        <Text style={styles.buttonText}>Calculate</Text>
      </TouchableOpacity>

      {error && <Text style={styles.error} accessibilityRole="alert">Enter a height and weight greater than zero.</Text>}

      {result && (
        <View style={styles.result} accessibilityLiveRegion="polite">
          <Text style={styles.bmiValue}>{result.value}</Text>
          <Text style={styles.bmiStatus}>{result.status}</Text>
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
  error: { marginTop: 20, color: '#b00020', fontSize: 16 },
  result: { marginTop: 40, alignItems: 'center' },
  bmiValue: { fontSize: 48, fontWeight: 'bold', color: '#333' },
  bmiStatus: { fontSize: 20, color: '#666', marginTop: 5 },
  adBanner: { position: 'absolute', bottom: 0, width: '100%', height: 60, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderColor: '#ccc' },
  adText: { color: '#555' }
});
