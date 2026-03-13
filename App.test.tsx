import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import App from './App';

describe('App', () => {
  it('renders correctly', () => {
    const tree = render(<App />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('has a title and a spin button', () => {
    render(<App />);
    expect(screen.getByText('Decision Roulette 🎯')).toBeTruthy();
    expect(screen.getByText('SPIN')).toBeTruthy();
  });

  it('changes text when spinning', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    const { unmount } = render(<App />);
    const button = screen.getByText('SPIN');

    fireEvent.press(button);
    expect(screen.getByText('...')).toBeTruthy();

    // Fast-forward timers to complete the animation
    act(() => {
      jest.runAllTimers();
    });

    unmount();
    jest.useRealTimers();
  });
});
