import { convertValue, formatConversion, UnitType } from '../converter';

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
