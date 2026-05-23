import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Animated, TouchableOpacity } from 'react-native';

export default function App() {
  const [phase, setPhase] = useState('Ready');
  const scaleAnim = useMemo(() => new Animated.Value(1), []);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeout1: NodeJS.Timeout;
    let timeout2: NodeJS.Timeout;

    if (active) {
      const runCycle = () => {
        if (!isMounted) return;

        // Inhale
        setPhase('Inhale (4s)');
        Animated.timing(scaleAnim, {
          toValue: 2,
          duration: 4000,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished || !isMounted) return;

          // Hold
          setPhase('Hold (4s)');
          timeout1 = setTimeout(() => {
            if (!isMounted) return;

            // Exhale
            setPhase('Exhale (4s)');
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 4000,
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (!finished || !isMounted) return;

              // Hold
              setPhase('Hold (4s)');
              timeout2 = setTimeout(() => {
                if (isMounted) runCycle();
              }, 4000);
            });
          }, 4000);
        });
      };

      runCycle();
    } else {
      // Reset state when not active
      // Wrap in setTimeout to avoid 'setState in effect' warning and ensure async update
      const timer = setTimeout(() => {
          if (isMounted) {
            setPhase('Ready');
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
          }
      }, 0);
      return () => clearTimeout(timer);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      scaleAnim.stopAnimation();
    };
  }, [active, scaleAnim]);

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Zen Breather 🧘
      </Text>

      <Animated.View
        style={[styles.circle, { transform: [{ scale: scaleAnim }] }]}
        accessible={true}
        accessibilityLabel={`Current phase: ${phase}`}
      >
        <Text style={styles.phaseText}>{phase}</Text>
      </Animated.View>

      <TouchableOpacity
        style={[styles.btn, active ? styles.stopBtn : styles.startBtn]}
        onPress={() => setActive(!active)}
        accessibilityRole="button"
        accessibilityLabel={active ? 'Stop Breathing Exercise' : 'Start Breathing Exercise'}
        accessibilityHint="Toggles the breathing exercise"
      >
        <Text style={styles.btnText}>{active ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 50,
    color: '#004d40',
  },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#80cbc4',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  phaseText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  btn: {
    marginTop: 50,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 5,
  },
  startBtn: {
    backgroundColor: '#00695c',
  },
  stopBtn: {
    backgroundColor: '#d32f2f',
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
