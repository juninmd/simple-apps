import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from './App';
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

// Mock Clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial values', () => {
    const { getByText } = render(<App />);
    expect(getByText('Color Palette 🎨')).toBeTruthy();
    expect(getByText('R: 100')).toBeTruthy();
    expect(getByText('G: 150')).toBeTruthy();
    expect(getByText('B: 200')).toBeTruthy();

    // Initial Hex: 100->64, 150->96, 200->C8 => #6496C8
    expect(getByText('#6496C8')).toBeTruthy();
  });

  it('updates color when sliders change', () => {
    const { getByLabelText, getByText } = render(<App />);

    const redSlider = getByLabelText('Red Slider');
    const greenSlider = getByLabelText('Green Slider');
    const blueSlider = getByLabelText('Blue Slider');

    fireEvent(redSlider, 'valueChange', 0);
    fireEvent(greenSlider, 'valueChange', 0);
    fireEvent(blueSlider, 'valueChange', 0);

    expect(getByText('R: 0')).toBeTruthy();
    expect(getByText('G: 0')).toBeTruthy();
    expect(getByText('B: 0')).toBeTruthy();
    expect(getByText('#000000')).toBeTruthy();
  });

  it('copies to clipboard', async () => {
    const { getByText } = render(<App />);
    const copyBtn = getByText('Copy Hex Code');

    fireEvent.press(copyBtn);

    await waitFor(() => {
        expect(Clipboard.setStringAsync).toHaveBeenCalledWith('#6496C8');
    });

    expect(Alert.alert).toHaveBeenCalledWith("Copied!", "#6496C8 copied to clipboard. [Ad: Design Course]");
  });
});
