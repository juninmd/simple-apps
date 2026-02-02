import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated, TouchableOpacity } from 'react-native';

export default function App() {
  const [phase, setPhase] = useState('Ready'); // Inhale, Hold, Exhale, Hold
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [active, setActive] = useState(false);

  const startBreathing = () => {
    setActive(true);
    cycle();
  };

  const cycle = () => {
    if (!active) return;
    
    // Inhale
    setPhase('Inhale (4s)');
    Animated.timing(scaleAnim, { toValue: 2, duration: 4000, useNativeDriver: true }).start(() => {
        // Hold
        setPhase('Hold (4s)');
        setTimeout(() => {
            // Exhale
            setPhase('Exhale (4s)');
            Animated.timing(scaleAnim, { toValue: 1, duration: 4000, useNativeDriver: true }).start(() => {
                // Hold
                setPhase('Hold (4s)');
                setTimeout(() => {
                    cycle();
                }, 4000);
            });
        }, 4000);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zen Breather 🧘</Text>
      
      <Animated.View style={[styles.circle, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.phaseText}>{phase}</Text>
      </Animated.View>

      {!active && (
        <TouchableOpacity style={styles.btn} onPress={startBreathing}>
            <Text style={styles.btnText}>Start</Text>
        </TouchableOpacity>
      )}

      <View style={styles.ad}>
        <Text>[Ad: Meditation App]</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0f2f1', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: 'bold', marginBottom: 50, color: '#004d40' },
  circle: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#80cbc4', alignItems: 'center', justifyContent: 'center', elevation: 10 },
  phaseText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  btn: { marginTop: 50, padding: 15, backgroundColor: '#00695c', borderRadius: 10 },
  btnText: { color: '#fff', fontSize: 18 },
  ad: { position: 'absolute', bottom: 20, padding: 10, backgroundColor: '#ccc' }
});
