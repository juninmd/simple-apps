import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface ResultDisplayProps {
  /**
   * The result of the spin to display.
   */
  result: string;
}

/**
 * Displays the result of the roulette spin.
 *
 * @param {ResultDisplayProps} props - The component props.
 * @returns {JSX.Element} The rendered component.
 */
export default function ResultDisplay({ result }: ResultDisplayProps) {
  return (
    <Text style={styles.result} accessible={true} accessibilityLiveRegion="polite">
      {result}
    </Text>
  );
}

const styles = StyleSheet.create({
  result: { fontSize: 40, fontWeight: 'bold', color: '#ffca28', marginBottom: 50, height: 50 },
});
