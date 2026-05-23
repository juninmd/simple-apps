import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from './App';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('renders correctly and loads data', async () => {
    const { findByText, getByText } = render(<App />);
    await findByText('Tally Counter 🔢');
    expect(getByText('0')).toBeTruthy();
  });

  it('increments counter', async () => {
    const { findByText, getByText, getByLabelText } = render(<App />);
    await findByText('Tally Counter 🔢');

    const incrementBtn = getByLabelText('Increment count');
    fireEvent.press(incrementBtn);

    expect(getByText('1')).toBeTruthy();
  });

  it('decrements counter', async () => {
    const { findByText, getByText, getByLabelText } = render(<App />);
    await findByText('Tally Counter 🔢');

    // Increment first
    const incrementBtn = getByLabelText('Increment count');
    fireEvent.press(incrementBtn);
    expect(getByText('1')).toBeTruthy();

    const decrementBtn = getByLabelText('Decrement count');
    fireEvent.press(decrementBtn);
    expect(getByText('0')).toBeTruthy();
  });

  it('adds a new counter', async () => {
    const { findByText, getByText, getByLabelText } = render(<App />);
    await findByText('Tally Counter 🔢');

    const addBtn = getByLabelText('Add new counter');
    fireEvent.press(addBtn);

    expect(getByText('Counter 2')).toBeTruthy();
    // It should switch to new counter which starts at 0
    expect(getByText('0')).toBeTruthy();
  });

  it('edits counter name', async () => {
    const { findByText, getByDisplayValue, getByLabelText } = render(<App />);
    await findByText('Tally Counter 🔢');

    const nameInput = getByLabelText('Counter Name');
    fireEvent.changeText(nameInput, 'New Name');

    expect(getByDisplayValue('New Name')).toBeTruthy();
  });

  it('switches counters', async () => {
    const { findByText, getByText, getByLabelText } = render(<App />);
    await findByText('Tally Counter 🔢');

    const addBtn = getByLabelText('Add new counter');
    fireEvent.press(addBtn); // Now on Counter 2

    const tab1 = getByLabelText('Switch to Default');
    fireEvent.press(tab1);

    // Default counter name should be visible in input
    const nameInput = getByLabelText('Counter Name');
    expect(nameInput.props.value).toBe('Default');
  });

  it('saves data to AsyncStorage', async () => {
    const { findByText, getByLabelText } = render(<App />);
    await findByText('Tally Counter 🔢');

    const incrementBtn = getByLabelText('Increment count');
    fireEvent.press(incrementBtn);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    const expectedData = JSON.stringify([{ id: 1, name: 'Default', count: 1 }]);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('counters_data', expectedData);
  });

  it('loads persisted data', async () => {
    const savedData = JSON.stringify([{ id: 1, name: 'Saved Counter', count: 5 }]);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(savedData);

    const { findByDisplayValue, getByText } = render(<App />);

    await findByDisplayValue('Saved Counter');
    expect(getByText('5')).toBeTruthy();
  });

  it('handles load error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Load failed'));

    const { findByText } = render(<App />);
    await findByText('Tally Counter 🔢');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load counters', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('handles save error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { findByText, getByLabelText } = render(<App />);
    await findByText('Tally Counter 🔢');

    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Save failed'));

    const incrementBtn = getByLabelText('Increment count');
    fireEvent.press(incrementBtn);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save counters', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });
});
