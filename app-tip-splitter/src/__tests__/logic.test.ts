import { calculateTip } from '../logic';

describe('calculateTip', () => {
  it('calculates tip correctly for single person', () => {
    const result = calculateTip(100, 20, 1);
    expect(result).toEqual({
      total: '120.00',
      perPerson: '120.00',
      tipAmount: '20.00',
    });
  });

  it('calculates split correctly', () => {
    const result = calculateTip(100, 20, 2);
    expect(result).toEqual({
      total: '120.00',
      perPerson: '60.00',
      tipAmount: '20.00',
    });
  });

  it('handles zero bill', () => {
    const result = calculateTip(0, 20, 1);
    expect(result).toEqual({
      total: '0.00',
      perPerson: '0.00',
      tipAmount: '0.00',
    });
  });

  it('returns null for negative bill', () => {
    const result = calculateTip(-10, 20, 1);
    expect(result).toBeNull();
  });

  it('returns null for zero or negative people', () => {
    expect(calculateTip(100, 20, 0)).toBeNull();
    expect(calculateTip(100, 20, -1)).toBeNull();
  });

  it('handles NaN bill', () => {
    expect(calculateTip(NaN, 20, 1)).toBeNull();
  });
});
