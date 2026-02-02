import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';

export default function App() {
  const [result, setResult] = useState('?');
  const [spinning, setSpinning] = useState(false);
  const spinValue = new Animated.Value(0);

  const options = ['Yes', 'No', 'Maybe', 'Try Again', 'Definitely', 'No Way'];

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult('...');

    Animated.timing(spinValue, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      const random = options[Math.floor(Math.random() * options.length)];
      setResult(random);
      setSpinning(false);
      spinValue.setValue(0);
    });
  };

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg']
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Decision Roulette 🎯</Text>

      <View style={styles.wheelContainer}>
        <Animated.View style={[styles.wheel, { transform: [{ rotate: spinInterpolate }] }]}>
          <Text style={styles.wheelText}>🎡</Text>
        </Animated.View>
      </View>

      <Text style={styles.result}>{result}</Text>

      <TouchableOpacity style={styles.btn} onPress={spin} disabled={spinning}>
        <Text style={styles.btnText}>SPIN</Text>
      </TouchableOpacity>

      <View style={styles.ad}>
        <Text>[Ad: Online Casino]</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#37474f', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: 'bold', marginBottom: 50, color: '#fff' },
  wheelContainer: { marginBottom: 30 },
  wheel: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#ff5722', alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: '#fff' },
  wheelText: { fontSize: 80 },
  result: { fontSize: 40, fontWeight: 'bold', color: '#ffca28', marginBottom: 50, height: 50 },
  btn: { paddingVertical: 15, paddingHorizontal: 50, backgroundColor: '#ffca28', borderRadius: 30 },
  btnText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  ad: { position: 'absolute', bottom: 20, padding: 10, backgroundColor: '#fff', borderRadius: 5 }
});
