import { cleanCNPJ, isValidCNPJ, formatCNPJ } from '../src/cnpj';

describe('CNPJ Validator (src/cnpj.ts)', () => {
  describe('cleanCNPJ', () => {
    it('removes dots, slashes, dashes, and letters from input string', () => {
      expect(cleanCNPJ('00.000.000/0001-91')).toBe('00000000000191');
      expect(cleanCNPJ('12abc345def678')).toBe('12345678');
    });
  });

  describe('isValidCNPJ', () => {
    it('returns true for valid formatted CNPJs', () => {
      expect(isValidCNPJ('00.000.000/0001-91')).toBe(true); // Banco do Brasil
      expect(isValidCNPJ('33.000.167/0001-01')).toBe(true); // Petrobras
      expect(isValidCNPJ('06.990.590/0001-23')).toBe(true); // Google Brasil
      expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
    });

    it('returns true for valid unformatted 14-digit CNPJs', () => {
      expect(isValidCNPJ('00000000000191')).toBe(true);
      expect(isValidCNPJ('33000167000101')).toBe(true);
      expect(isValidCNPJ('06990590000123')).toBe(true);
    });

    it('returns false for repeated digit patterns', () => {
      expect(isValidCNPJ('00000000000000')).toBe(false);
      expect(isValidCNPJ('11.111.111/1111-11')).toBe(false);
      expect(isValidCNPJ('99999999999999')).toBe(false);
    });

    it('returns false for CNPJs with incorrect length', () => {
      expect(isValidCNPJ('1234567890123')).toBe(false);
      expect(isValidCNPJ('123456789012345')).toBe(false);
      expect(isValidCNPJ('')).toBe(false);
    });

    it('returns false for CNPJs with invalid verification digits', () => {
      expect(isValidCNPJ('00.000.000/0001-00')).toBe(false);
      expect(isValidCNPJ('33.000.167/0001-99')).toBe(false);
    });

    it('returns false for invalid inputs or null/undefined', () => {
      expect(isValidCNPJ(null as unknown as string)).toBe(false);
      expect(isValidCNPJ(undefined as unknown as string)).toBe(false);
      expect(isValidCNPJ('invalid text')).toBe(false);
    });
  });

  describe('formatCNPJ', () => {
    it('formats 14-digit CNPJ correctly', () => {
      expect(formatCNPJ('00000000000191')).toBe('00.000.000/0001-91');
    });

    it('returns original input if not 14 digits', () => {
      expect(formatCNPJ('123')).toBe('123');
    });
  });
});
