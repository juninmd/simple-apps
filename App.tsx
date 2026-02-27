import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';

import GameControls from './src/components/GameControls';
import ResultDisplay from './src/components/ResultDisplay';
import RouletteWheel from './src/components/RouletteWheel';

/**
 * List of possible outcomes for the roulette.
 */
const OPTIONS = ['Yes', 'No', 'Maybe', 'Try Again', 'Definitely', 'No Way'];

/**
 * Main application component for Decision Roulette.
 * Displays a spinning wheel that randomly selects an option.
 */
export default function App() {
  const [result, setResult] = useState('?');
  const [spinning, setSpinning] = useState(false);
  // Use useRef to maintain the Animated.Value instance across re-renders
  const spinValue = useRef(new Animated.Value(0)).current;

  /**
   * Initiates the spinning animation and determines the result.
   */
  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult('...');

    Animated.timing(spinValue, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      const random = OPTIONS[Math.floor(Math.random() * OPTIONS.length)];
      setResult(random);
      setSpinning(false);
      spinValue.setValue(0);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Decision Roulette 🎯</Text>

      <RouletteWheel spinValue={spinValue} />

      <ResultDisplay result={result} />

      <GameControls onSpin={spin} disabled={spinning} />

      <View style={styles.ad}>
        <Text>[Ad Space]</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#37474f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 30, fontWeight: 'bold', marginBottom: 50, color: '#fff' },
  ad: { position: 'absolute', bottom: 20, padding: 10, backgroundColor: '#fff', borderRadius: 5 },
});
