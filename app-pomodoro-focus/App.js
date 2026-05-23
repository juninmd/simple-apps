import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';

const FOCUS_TIME_MINUTES = 25;
const BREAK_TIME_MINUTES = 5;

const FOCUS_TIME_SECONDS = FOCUS_TIME_MINUTES * 60;
const BREAK_TIME_SECONDS = BREAK_TIME_MINUTES * 60;

export default function App() {
  const [timeRemaining, setTimeRemaining] = useState(FOCUS_TIME_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      Vibration.vibrate(1000); // Vibrate for 1 second
      if (isBreak) {
        // Break is over, reset to focus
        setIsBreak(false);
        setTimeRemaining(FOCUS_TIME_SECONDS);
        setIsActive(false); // Stop the timer, wait for user to start next session
      } else {
        // Focus is over, start break
        setIsBreak(true);
        setTimeRemaining(BREAK_TIME_SECONDS);
        // Break starts automatically
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeRemaining, isBreak]);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const containerStyle = [
    styles.container,
    { backgroundColor: isBreak ? '#2a9d8f' : '#d95550' }
  ];

  return (
    <View style={containerStyle}>
      <Text style={styles.title}>
        {isBreak ? 'Break Time' : 'Focus Time'}
      </Text>
      <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>
      <TouchableOpacity style={styles.button} onPress={handleToggle}>
        <Text style={styles.buttonText}>{isActive ? 'Pause' : 'Start'}</Text>
      </TouchableOpacity>
      {isBreak && (
        <View style={styles.adContainer}>
          <Text style={styles.adText}>Ad Placeholder</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  timer: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  adContainer: {
    position: 'absolute',
    bottom: 50,
    width: '90%',
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff'
  },
  adText: {
    fontSize: 18,
    color: '#fff',
  },
});
