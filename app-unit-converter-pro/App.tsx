import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { formatConversion, UnitType } from './src/utils/converter';

export default function App() {
  const [val, setVal] = useState('');
  const [type, setType] = useState<UnitType>('Length');

  const getResult = () => {
    const n = parseFloat(val);
    if (isNaN(n)) return '...';
    return formatConversion(n, type);
  };

  const tabs: UnitType[] = ['Length', 'Weight', 'Temp', 'Speed'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unit Converter Pro 📏</Text>

      <View style={styles.tabs}>
        {tabs.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, type === t && styles.activeTab]} onPress={() => setType(t)}>
            <Text style={[styles.tabText, type === t && styles.activeTabText]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Enter {type}:</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          keyboardType="numeric"
          value={val}
          onChangeText={setVal}
        />
        <Text style={styles.result}>{val ? getResult() : '...'}</Text>
      </View>

      <View style={styles.ad}>
        <Text>[Ad: Engineering Tools]</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, color: '#33691e' },
  tabs: { flexDirection: 'row', marginBottom: 30 },
  tab: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#dcedc8', marginHorizontal: 5 },
  activeTab: { backgroundColor: '#558b2f' },
  tabText: { color: '#33691e', fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
  card: { width: '100%', padding: 30, backgroundColor: '#fff', borderRadius: 15, alignItems: 'center', elevation: 3 },
  label: { fontSize: 18, color: '#666', marginBottom: 10 },
  input: { fontSize: 32, borderBottomWidth: 1, borderColor: '#ccc', width: '80%', textAlign: 'center', marginBottom: 20 },
  result: { fontSize: 24, fontWeight: 'bold', color: '#33691e' },
  ad: { position: 'absolute', bottom: 20, padding: 10, backgroundColor: '#c5e1a5', width: '100%', alignItems: 'center' }
});
