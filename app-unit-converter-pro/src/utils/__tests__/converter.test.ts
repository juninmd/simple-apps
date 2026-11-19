import { convertValue, formatConversion, parseInput, UnitType } from '../converter';

describe('converter utility', () => {
  describe('convertValue', () => {
    it('converts Length (m to ft) correctly', () => {
      const result = convertValue(10, 'Length');
      expect(result).toBeCloseTo(32.8084);
    });

    it('converts Weight (kg to lbs) correctly', () => {
      const result = convertValue(10, 'Weight');
      expect(result).toBeCloseTo(22.0462);
    });

    it('converts Temp (C to F) correctly', () => {
      const result = convertValue(0, 'Temp'); // 0C = 32F
      expect(result).toBe(32);

      const result100 = convertValue(100, 'Temp'); // 100C = 212F
      expect(result100).toBe(212);
    });

    it('converts Speed (km/h to mph) correctly', () => {
      const result = convertValue(100, 'Speed');
      expect(result).toBeCloseTo(62.1371);
    });

    it('throws error for unknown type', () => {
        // @ts-ignore
        expect(() => convertValue(10, 'Unknown')).toThrow('Unknown unit type');
    });
  });

  describe('formatConversion', () => {
    it('formats Length correctly', () => {
      expect(formatConversion(10, 'Length')).toBe('10 m = 32.81 ft');
    });

    it('formats Weight correctly', () => {
      expect(formatConversion(10, 'Weight')).toBe('10 kg = 22.05 lbs');
    });

    it('formats Temp correctly', () => {
      expect(formatConversion(0, 'Temp')).toBe('0 °C = 32.00 °F');
    });

    it('formats Speed correctly', () => {
      expect(formatConversion(100, 'Speed')).toBe('100 km/h = 62.14 mph');
    });
  });
});

describe('parseInput', () => {
  it('accepts comma or dot decimals and a leading minus', () => {
    expect(parseInput('3,5')).toBe(3.5);
    expect(parseInput('3.5')).toBe(3.5);
    expect(parseInput('-40')).toBe(-40);
    expect(parseInput(' .5 ')).toBe(0.5);
  });

  it('rejects partial, empty or non-finite input instead of truncating it', () => {
    expect(parseInput('5abc')).toBeNaN();
    expect(parseInput('1,2,3')).toBeNaN();
    expect(parseInput('')).toBeNaN();
    expect(parseInput('-')).toBeNaN();
    expect(parseInput('9'.repeat(400))).toBeNaN();
  });
});

describe('formatConversion edge cases', () => {
  it('does not print negative zero for tiny negative results', () => {
    expect(formatConversion(-0.0001, 'Length')).toBe('-0.0001 m = 0.00 ft');
  });

  it('keeps legitimate negative results', () => {
    expect(formatConversion(-40, 'Temp')).toBe('-40 °C = -40.00 °F');
  });
});
