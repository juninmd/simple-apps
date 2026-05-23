import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'counters_data';

interface Counter {
  id: number;
  name: string;
  count: number;
}

/**
 * Main App Component
 *
 * Features:
 * - Displays a tally counter
 * - Allows multiple counters
 * - Persists data using AsyncStorage
 */
export default function App() {
  const [counters, setCounters] = useState<Counter[]>([{ id: 1, name: 'Default', count: 0 }]);
  const [activeId, setActiveId] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          const loadedCounters = JSON.parse(jsonValue);
          setCounters(loadedCounters);
        }
      } catch (e) {
        console.error('Failed to load counters', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save data on change
  useEffect(() => {
    if (isLoaded) {
      const saveData = async () => {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
        } catch (e) {
          console.error('Failed to save counters', e);
        }
      };
      saveData();
    }
  }, [counters, isLoaded]);

  const increment = () => updateCount(1);
  const decrement = () => updateCount(-1);

  const updateCount = (val: number) => {
    setCounters(counters.map(c => c.id === activeId ? { ...c, count: c.count + val } : c));
  };

  const addCounter = () => {
    const newId = (counters.length > 0 ? Math.max(...counters.map(c => c.id)) : 0) + 1;
    setCounters([...counters, { id: newId, name: `Counter ${newId}`, count: 0 }]);
    setActiveId(newId);
  };

  const activeCounter = counters.find(c => c.id === activeId) || counters[0];

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  // Handle edge case where activeCounter might be undefined if counters is empty (should not happen with default)
  if (!activeCounter) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">Tally Counter 🔢</Text>

      <View style={styles.counterBox}>
        <TextInput
          style={styles.nameInput}
          value={activeCounter.name}
          onChangeText={(txt) => setCounters(counters.map(c => c.id === activeId ? { ...c, name: txt } : c))}
          accessibilityLabel="Counter Name"
          accessibilityHint="Edit the name of the current counter"
        />
        <Text style={styles.countText} accessibilityLabel={`Count is ${activeCounter.count}`}>
          {activeCounter.count}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.btn}
          onPress={decrement}
          accessibilityRole="button"
          accessibilityLabel="Decrement count"
        >
          <Text style={styles.btnText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.plusBtn]}
          onPress={increment}
          accessibilityRole="button"
          accessibilityLabel="Increment count"
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        style={styles.list}
        contentContainerStyle={styles.listContent}
        accessibilityRole="tablist"
      >
        {counters.map(c => (
          <TouchableOpacity
            key={c.id}
            onPress={() => setActiveId(c.id)}
            style={[styles.tab, c.id === activeId && styles.activeTab]}
            accessibilityRole="tab"
            accessibilityState={{ selected: c.id === activeId }}
            accessibilityLabel={`Switch to ${c.name}`}
          >
            <Text style={[styles.tabText, c.id === activeId && styles.activeTabText]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={addCounter}
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel="Add new counter"
        >
          <Text>+</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.ad} accessibilityLabel="Advertisement">
        <Text>[Ad: Cloud Storage]</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f3f3', alignItems: 'center', justifyContent: 'center', paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  counterBox: { backgroundColor: '#fff', width: '80%', padding: 30, borderRadius: 20, alignItems: 'center', elevation: 5, marginBottom: 30 },
  nameInput: { fontSize: 20, color: '#666', borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 10, textAlign: 'center' },
  countText: { fontSize: 80, fontWeight: 'bold', color: '#333' },
  controls: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  btn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' },
  plusBtn: { backgroundColor: '#2196f3' },
  btnText: { fontSize: 40, color: '#fff' },
  list: { maxHeight: 60, marginBottom: 80 },
  listContent: { paddingHorizontal: 20, alignItems: 'center' },
  tab: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#fff', borderRadius: 20, marginRight: 10, elevation: 2 },
  activeTab: { backgroundColor: '#2196f3' },
  tabText: { color: '#333' },
  activeTabText: { color: '#fff' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  ad: { position: 'absolute', bottom: 20, padding: 10, backgroundColor: '#ccc' }
});
