import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Vibration } from 'react-native';

export default function App() {
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // focus | break

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive) {
            interval = setInterval(() => {
                if (seconds === 0) {
                    if (minutes === 0) {
                        // Timer Done
                        Vibration.vibrate();
                        toggleMode();
                    } else {
                        setMinutes(minutes - 1);
                        setSeconds(59);
                    }
                } else {
                    setSeconds(seconds - 1);
                }
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            if (interval) clearInterval(interval);
        }
        return () => { if (interval) clearInterval(interval) };
    }, [isActive, seconds, minutes]);

    const toggleMode = () => {
        setIsActive(false);
        if (mode === 'focus') {
            setMode('break');
            setMinutes(5);
            setSeconds(0);
        } else {
            setMode('focus');
            setMinutes(25);
            setSeconds(0);
        }
    };

    const toggleTimer = () => setIsActive(!isActive);
    const reset = () => {
        setIsActive(false);
        setMinutes(mode === 'focus' ? 25 : 5);
        setSeconds(0);
    };

    return (
        <View style={[styles.container, { backgroundColor: mode === 'focus' ? '#ff8a80' : '#b9f6ca' }]}>
            <Text style={styles.title}>{mode === 'focus' ? 'Focus Time' : 'Break Time'}</Text>
            <Text style={styles.timer}>{`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</Text>

            <TouchableOpacity style={styles.button} onPress={toggleTimer}>
                <Text style={styles.buttonText}>{isActive ? 'PAUSE' : 'START'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={reset} style={styles.resetBtn}>
                <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>

            {mode === 'break' && (
                <View style={styles.adBanner}>
                    <Text style={styles.adText}>[Ad: Relaxing Music]</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 32, color: '#fff', marginBottom: 20, fontWeight: 'bold' },
    timer: { fontSize: 80, color: '#fff', fontWeight: 'bold', marginBottom: 40 },
    button: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 40, paddingVertical: 20, borderRadius: 50, marginBottom: 20 },
    buttonText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
    resetBtn: { padding: 10 },
    resetText: { color: 'rgba(255,255,255,0.8)', fontSize: 18 },
    adBanner: { position: 'absolute', bottom: 50, padding: 20, backgroundColor: '#fff', borderRadius: 10, elevation: 5 },
    adText: { color: '#333' }
});
