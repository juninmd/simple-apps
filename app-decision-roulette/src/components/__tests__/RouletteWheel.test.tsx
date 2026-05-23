import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import RouletteWheel from '../RouletteWheel';

describe('RouletteWheel', () => {
  it('renders correctly', () => {
    const spinValue = new Animated.Value(0);
    const tree = render(<RouletteWheel spinValue={spinValue} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
