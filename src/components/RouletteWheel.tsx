import React from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';

interface RouletteWheelProps {
  /**
   * The animated value controlling the rotation of the wheel.
   */
  spinValue: Animated.Value;
}

/**
 * Displays the spinning wheel component.
 *
 * @param {RouletteWheelProps} props - The component props.
 * @returns {JSX.Element} The rendered component.
 */
export default function RouletteWheel({ spinValue }: RouletteWheelProps) {
  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'],
  });

  return (
    <View style={styles.wheelContainer}>
      <Animated.View style={[styles.wheel, { transform: [{ rotate: spinInterpolate }] }]}>
        <Text style={styles.wheelText}>🎡</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wheelContainer: { marginBottom: 30 },
  wheel: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ff5722',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#fff',
  },
  wheelText: { fontSize: 80 },
});
