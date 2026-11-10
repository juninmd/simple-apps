import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isValidCNPJ, formatCNPJ, sanitizeCNPJ } from '../src/validator.js';

describe('CNPJ Validator', () => {
  describe('sanitizeCNPJ', () => {
    it('should strip non-numeric characters from CNPJ', () => {
      assert.strictEqual(sanitizeCNPJ('11.222.333/0001-81'), '11222333000181');
      assert.strictEqual(sanitizeCNPJ('11-222-333/0001 81'), '11222333000181');
    });

    it('should return empty string for non-string inputs', () => {
      assert.strictEqual(sanitizeCNPJ(null), '');
      assert.strictEqual(sanitizeCNPJ(undefined), '');
      assert.strictEqual(sanitizeCNPJ(12345678901234), '');
    });
  });

  describe('isValidCNPJ', () => {
    it('should return true for valid CNPJs (formatted and unformatted)', () => {
      // Known valid CNPJs
      const validCNPJs = [
        '00.000.000/0001-91',
        '00000000000191',
        '11.222.333/0001-81',
        '11222333000181',
        '19.131.243/0001-97',
        '19131243000197',
        '33.000.167/0001-01',
        '33000167000101'
      ];

      for (const cnpj of validCNPJs) {
        assert.strictEqual(isValidCNPJ(cnpj), true, `Expected ${cnpj} to be valid`);
      }
    });

    it('should return false for invalid CNPJs (wrong verification digits)', () => {
      const invalidCNPJs = [
        '00.000.000/0001-00',
        '11.222.333/0001-00',
        '19.131.243/0001-00',
        '11222333000182'
      ];

      for (const cnpj of invalidCNPJs) {
        assert.strictEqual(isValidCNPJ(cnpj), false, `Expected ${cnpj} to be invalid`);
      }
    });

    it('should return false for repeated digits', () => {
      const repeatedDigits = [
        '00.000.000/0000-00',
        '11.111.111/1111-11',
        '22.222.222/2222-22',
        '33.333.333/3333-33',
        '44444444444444',
        '99999999999999'
      ];

      for (const cnpj of repeatedDigits) {
        assert.strictEqual(isValidCNPJ(cnpj), false, `Expected sequence ${cnpj} to be invalid`);
      }
    });

    it('should return false for invalid lengths or invalid types', () => {
      assert.strictEqual(isValidCNPJ(''), false);
      assert.strictEqual(isValidCNPJ('123'), false);
      assert.strictEqual(isValidCNPJ('11.222.333/0001-810'), false);
      assert.strictEqual(isValidCNPJ(null), false);
      assert.strictEqual(isValidCNPJ(undefined), false);
    });
  });

  describe('formatCNPJ', () => {
    it('should format a 14-digit string to standard CNPJ format', () => {
      assert.strictEqual(formatCNPJ('11222333000181'), '11.222.333/0001-81');
      assert.strictEqual(formatCNPJ('00000000000191'), '00.000.000/0001-91');
    });

    it('should return already formatted CNPJ intact', () => {
      assert.strictEqual(formatCNPJ('11.222.333/0001-81'), '11.222.333/0001-81');
    });

    it('should return original string or empty string if input is invalid', () => {
      assert.strictEqual(formatCNPJ('12345'), '12345');
      assert.strictEqual(formatCNPJ(null), '');
    });
  });
});
