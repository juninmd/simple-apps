import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from './App';

describe('App', () => {
  it('renders correctly', () => {
    const { getByText } = render(<App />);
    expect(getByText('Zen Breather 🧘')).toBeTruthy();
  });

  it('starts and stops breathing cycle', async () => {
    const { getByText } = render(<App />);
    const startBtn = getByText('Start');

    fireEvent.press(startBtn);

    // If Animated is instant (mocked by jest-expo), we skip Inhale and go to Hold.
    // We check for Hold.
    // waitFor handles async state updates.
    await waitFor(() => expect(getByText('Hold (4s)')).toBeTruthy());
    expect(getByText('Stop')).toBeTruthy();

    const stopBtn = getByText('Stop');
    fireEvent.press(stopBtn);

    // Reset happens.
    await waitFor(() => expect(getByText('Ready')).toBeTruthy());
    expect(getByText('Start')).toBeTruthy();
  });
});
