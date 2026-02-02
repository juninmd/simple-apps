import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, Slider, TouchableOpacity, Clipboard, Alert } from 'react-native';

export default function App() {
  const [r, setR] = useState(100);
  const [g, setG] = useState(150);
  const [b, setB] = useState(200);

  const color = `rgb(${r}, ${g}, ${b})`;

  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();

  const copyToClipboard = () => {
    Clipboard.setString(hexColor);
    Alert.alert("Copied!", `${hexColor} copied to clipboard. [Ad: Design Course]`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Color Palette 🎨</Text>

      <View style={[styles.preview, { backgroundColor: color }]}>
        <Text style={styles.previewText}>{hexColor}</Text>
      </View>

      <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
        <Text style={styles.copyText}>Copy Hex Code</Text>
      </TouchableOpacity>

      <View style={styles.controls}>
        <Text style={styles.label}>R: {r}</Text>
        <Slider style={styles.slider} minimumValue={0} maximumValue={255} step={1} value={r} onValueChange={setR} minimumTrackTintColor="red" thumbTintColor="red" />

        <Text style={styles.label}>G: {g}</Text>
        <Slider style={styles.slider} minimumValue={0} maximumValue={255} step={1} value={g} onValueChange={setG} minimumTrackTintColor="green" thumbTintColor="green" />

        <Text style={styles.label}>B: {b}</Text>
        <Slider style={styles.slider} minimumValue={0} maximumValue={255} step={1} value={b} onValueChange={setB} minimumTrackTintColor="blue" thumbTintColor="blue" />
      </View>

      <View style={styles.ad}>
        <Text>[Ad: Adobe Creative Cloud]</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#212121', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 30, fontWeight: 'bold', marginBottom: 20, color: '#fff' },
  preview: { width: '100%', height: 150, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#fff' },
  previewText: { fontSize: 32, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 10 },
  copyBtn: { padding: 10, backgroundColor: '#424242', borderRadius: 5, marginBottom: 30 },
  copyText: { color: '#fff', fontSize: 16 },
  controls: { width: '100%' },
  label: { color: '#fff', fontSize: 18, marginBottom: 5 },
  slider: { width: '100%', height: 40, marginBottom: 10 },
  ad: { position: 'absolute', bottom: 20, padding: 10, backgroundColor: '#ddd', borderRadius: 5, width: '100%', alignItems: 'center' }
});
