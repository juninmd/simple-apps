import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';

export default function App() {
  const [gameState, setGameState] = useState('waiting'); // waiting, ready, go, result
  const [message, setMessage] = useState('Tap to Start');
  const [result, setResult] = useState(0);
  const startTime = useRef(0);
  const styles = getStyles(gameState);

  const handlePress = () => {
    if (gameState === 'waiting' || gameState === 'result') {
      setGameState('ready');
      setMessage('Wait for Green...');
      const delay = Math.floor(Math.random() * 3000) + 1000;
      setTimeout(() => {
        setGameState('go');
        setMessage('TAP NOW!');
        startTime.current = Date.now();
      }, delay);
    } else if (gameState === 'ready') {
      setGameState('waiting');
      setMessage('Too early! Tap to restart.');
    } else if (gameState === 'go') {
      const reactionTime = Date.now() - startTime.current;
      setResult(reactionTime);
      setGameState('result');
      setMessage(`${reactionTime} ms`);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={1}>
      <Text style={styles.title}>Reaction Trainer ⚡</Text>

      <View style={styles.center}>
        <Text style={styles.message}>{message}</Text>
        {gameState === 'result' && <Text style={styles.subtext}>Tap to try again</Text>}
      </View>

      <View style={styles.ad}>
        <Text>[Ad: Brain Training Games]</Text>
      </View>
      <StatusBar style="auto" />
    </TouchableOpacity>
  );
}

const getStyles = (state: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: state === 'go' ? '#4caf50' : state === 'ready' ? '#ce1818' : '#2196f3',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: { fontSize: 30, fontWeight: 'bold', color: '#fff', position: 'absolute', top: 60 },
  center: { alignItems: 'center' },
  message: { fontSize: 50, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtext: { fontSize: 20, color: '#eee', marginTop: 10 },
  ad: { position: 'absolute', bottom: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 5 }
});
