import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import App from './App';
import GameControls from './src/components/GameControls';

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

  it('does not start spin if already spinning', () => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    const { root } = render(<App />);
    const gameControls = root.findByType(GameControls);

    act(() => {
      gameControls.props.onSpin();
    });

    act(() => {
      gameControls.props.onSpin();
    });

    // The text should remain '...' because the second call to onSpin is ignored
    expect(screen.getByText('...')).toBeTruthy();
  });
});
