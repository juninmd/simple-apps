import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import GameControls from '../GameControls';

describe('GameControls', () => {
  it('renders correctly', () => {
    const tree = render(<GameControls onSpin={() => {}} disabled={false} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('calls onSpin when pressed', () => {
    const onSpinMock = jest.fn();
    render(<GameControls onSpin={onSpinMock} disabled={false} />);
    const button = screen.getByText('SPIN');
    fireEvent.press(button);
    expect(onSpinMock).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const onSpinMock = jest.fn();
    render(<GameControls onSpin={onSpinMock} disabled={true} />);
    const button = screen.getByText('SPIN');
    fireEvent.press(button);
    expect(onSpinMock).not.toHaveBeenCalled();
  });
});
