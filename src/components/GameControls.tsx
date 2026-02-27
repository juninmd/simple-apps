import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface GameControlsProps {
  /**
   * Callback function when the spin button is pressed.
   */
  onSpin: () => void;
  /**
   * Whether the spin button is disabled.
   */
  disabled: boolean;
}

/**
 * Displays the game controls, including the spin button.
 *
 * @param {GameControlsProps} props - The component props.
 * @returns {JSX.Element} The rendered component.
 */
export default function GameControls({ onSpin, disabled }: GameControlsProps) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onSpin} disabled={disabled}>
      <Text style={styles.btnText}>SPIN</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 15, paddingHorizontal: 50, backgroundColor: '#ffca28', borderRadius: 30 },
  btnText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
});
