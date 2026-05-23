import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  SafeAreaView,
  Platform
} from 'react-native';
import { calculateTip, TipResult } from './src/logic';

export default function App() {
  const [bill, setBill] = useState('');
  const [tipPct, setTipPct] = useState(15);
  const [people, setPeople] = useState(1);
  const [result, setResult] = useState<TipResult | null>(null);

  const calculate = () => {
    Keyboard.dismiss();
    const b = parseFloat(bill);
    const res = calculateTip(b, tipPct, people);
    setResult(res);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle} accessibilityRole="header">Tip Splitter</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Bill Amount */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BILL TOTAL</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  value={bill}
                  onChangeText={setBill}
                  accessibilityLabel="Bill Amount Input"
                />
              </View>
            </View>

            {/* Tip Percentage */}
            <View style={styles.section}>
              <View style={styles.tipHeader}>
                <Text style={styles.sectionTitle}>SELECT TIP</Text>
                <Text style={styles.tipSelectedLabel}>{tipPct}% Selected</Text>
              </View>
              <View style={styles.tipGrid} accessibilityRole="radiogroup">
                {[10, 15, 18, 20, 25].map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    style={[styles.tipBtn, tipPct === pct && styles.tipBtnActive]}
                    onPress={() => setTipPct(pct)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: tipPct === pct }}
                    accessibilityLabel={`${pct}% Tip`}
                  >
                    <Text style={[styles.tipBtnText, tipPct === pct && styles.tipBtnTextActive]}>{pct}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Number of People */}
            <View style={styles.peopleCard}>
              <Text style={styles.peopleTitle}>Number of People</Text>
              <View style={styles.peopleControls}>
                <TouchableOpacity
                  style={styles.peopleBtn}
                  onPress={() => setPeople(Math.max(1, people - 1))}
                  accessibilityLabel="Decrease People"
                  accessibilityRole="button"
                >
                  <Text style={styles.peopleBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.peopleCount} accessibilityLabel={`${people} People`}>{people}</Text>
                <TouchableOpacity
                  style={styles.peopleBtnPrimary}
                  onPress={() => setPeople(people + 1)}
                  accessibilityLabel="Increase People"
                  accessibilityRole="button"
                >
                  <Text style={styles.peopleBtnTextPrimary}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
              style={styles.calcBtn}
              onPress={calculate}
              accessibilityRole="button"
              accessibilityLabel="Calculate Tip"
            >
              <Text style={styles.calcBtnText}>Calculate Split</Text>
            </TouchableOpacity>

            {/* Results Card */}
            {result && (
              <View style={styles.resultCard} accessibilityLiveRegion="polite">
                <View style={styles.resultRow}>
                  <View>
                    <Text style={styles.resultLabelSmall}>TOTAL BILL (WITH TIP)</Text>
                    <Text style={styles.resultValueSmall}>${result.total}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.resultLabelSmall}>TIP AMOUNT</Text>
                    <Text style={styles.resultValueSmall}>${result.tipAmount}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                  <Text style={styles.resultLabelLarge}>AMOUNT PER PERSON</Text>
                  <Text style={styles.resultValueLarge}>${result.perPerson}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Ad Placeholder */}
          <View style={styles.adContainer} accessibilityLabel="Advertisement">
            <View style={styles.adBanner}>
              <Text style={styles.adText}>ADVERTISEMENT BANNER AREA</Text>
            </View>
          </View>
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f8f7',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f8f7',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111814',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#638872',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPrefix: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#19e66b',
    marginRight: 4,
  },
  input: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111814',
    textAlign: 'center',
    minWidth: 150,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  tipSelectedLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#19e66b',
    backgroundColor: 'rgba(25, 230, 107, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  tipBtn: {
    width: '30%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tipBtnActive: {
    backgroundColor: '#19e66b',
    borderColor: '#19e66b',
    shadowColor: '#19e66b',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  tipBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111814',
  },
  tipBtnTextActive: {
    color: '#112117',
  },
  peopleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  peopleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111814',
    marginBottom: 16,
  },
  peopleControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  peopleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  peopleBtnPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#19e66b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#19e66b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  peopleBtnText: {
    fontSize: 32,
    fontWeight: '400',
    color: '#111814',
    lineHeight: 36,
  },
  peopleBtnTextPrimary: {
    fontSize: 32,
    fontWeight: '400',
    color: '#112117',
    lineHeight: 36,
  },
  peopleCount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111814',
    minWidth: 60,
    textAlign: 'center',
  },
  calcBtn: {
    backgroundColor: '#19e66b',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#19e66b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 30,
  },
  calcBtnText: {
    color: '#112117',
    fontSize: 20,
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: '#fef08a',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  resultLabelSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(17, 33, 23, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultValueSmall: {
    fontSize: 24,
    fontWeight: '800',
    color: '#112117',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(17, 33, 23, 0.1)',
    marginBottom: 16,
  },
  resultLabelLarge: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(17, 33, 23, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  resultValueLarge: {
    fontSize: 48,
    fontWeight: '900',
    color: '#112117',
  },
  adContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f6f8f7',
  },
  adBanner: {
    height: 64,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  adText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
