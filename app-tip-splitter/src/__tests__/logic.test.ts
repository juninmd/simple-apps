import { calculateTip, parseAmount } from '../logic';

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

describe('parseAmount', () => {
  it('accepts a comma as decimal separator', () => {
    expect(parseAmount('12,50')).toBe(12.5);
    expect(parseAmount('12.50')).toBe(12.5);
    expect(parseAmount(' 100 ')).toBe(100);
  });

  it('rejects partial, empty or non-finite input instead of truncating it', () => {
    expect(parseAmount('12abc')).toBeNaN();
    expect(parseAmount('1,2,3')).toBeNaN();
    expect(parseAmount('')).toBeNaN();
    expect(parseAmount('-5')).toBeNaN();
    expect(parseAmount('9'.repeat(400))).toBeNaN();
  });
});

describe('calculateTip guards', () => {
  it('returns null for non-finite bill or invalid tip', () => {
    expect(calculateTip(Infinity, 10, 1)).toBeNull();
    expect(calculateTip(100, -5, 1)).toBeNull();
    expect(calculateTip(100, NaN, 1)).toBeNull();
  });

  it('returns null when people is NaN or not a whole number', () => {
    expect(calculateTip(100, 10, NaN)).toBeNull();
    expect(calculateTip(100, 10, 2.5)).toBeNull();
  });
});
