import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import App from '../App';

jest.useFakeTimers();

describe('<App />', () => {
  it('renders correctly', () => {
    const { getByText } = render(<App />);
    expect(getByText('Reaction Trainer ⚡')).toBeTruthy();
    expect(getByText('Tap to Start')).toBeTruthy();
  });

  it('starts the game on tap', () => {
    const { getByText } = render(<App />);
    fireEvent.press(getByText('Tap to Start'));
    expect(getByText('Wait for Green...')).toBeTruthy();
  });

  it('handles early tap correctly', () => {
    const { getByText, queryByText } = render(<App />);

    // Start game
    fireEvent.press(getByText('Tap to Start'));
    expect(getByText('Wait for Green...')).toBeTruthy();

    // Tap early
    fireEvent.press(getByText('Wait for Green...'));
    expect(getByText('Too early! Tap to restart.')).toBeTruthy();

    // Fast-forward time to ensure no hidden timer triggers "TAP NOW!"
    act(() => {
      jest.runAllTimers();
    });

    // Should still show early message, not "TAP NOW!"
    expect(getByText('Too early! Tap to restart.')).toBeTruthy();
    expect(queryByText('TAP NOW!')).toBeNull();
  });

  it('measures reaction time correctly', () => {
    const { getByText, queryByText } = render(<App />);

    // Start game
    fireEvent.press(getByText('Tap to Start'));

    // Fast-forward to green
    act(() => {
      jest.runAllTimers();
    });

    expect(getByText('TAP NOW!')).toBeTruthy();

    // Tap immediately
    fireEvent.press(getByText('TAP NOW!'));

    // Should show result
    expect(queryByText(/ms$/)).toBeTruthy();
  });
});
