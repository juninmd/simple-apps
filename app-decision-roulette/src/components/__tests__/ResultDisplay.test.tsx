import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ResultDisplay from '../ResultDisplay';

describe('ResultDisplay', () => {
  it('renders correctly with initial state', () => {
    const tree = render(<ResultDisplay result="?" />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('displays the result text', () => {
    render(<ResultDisplay result="Yes" />);
    expect(screen.getByText('Yes')).toBeTruthy();
  });
});
