import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeCnae,
  formatCnae,
  isValidCnae,
  normalizeCnae,
  CnaeDecoder
} from '../src/index.js';

describe('CNAE Decoder', () => {
  describe('Acceptance Criteria', () => {
    it("should display '6201-5/00' as 'Development of customizable software'", () => {
      const result = decodeCnae('6201-5/00');
      assert.equal(result, 'Development of customizable software');
    });
  });

  describe('decodeCnae', () => {
    it('should decode unformatted string code', () => {
      assert.equal(decodeCnae('6201500'), 'Development of customizable software');
    });

    it('should decode numeric code', () => {
      assert.equal(decodeCnae(6201500), 'Development of customizable software');
    });

    it('should decode with surrounding whitespace and punctuation', () => {
      assert.equal(decodeCnae('  6201-5/00  '), 'Development of customizable software');
    });

    it('should return fallback description when code is valid but not in dataset', () => {
      const fallback = decodeCnae('9999-9/99', {
        fallbackDescription: 'Unknown Activity'
      });
      assert.equal(fallback, 'Unknown Activity');
    });

    it('should return null when code is not in dataset and no fallback provided', () => {
      assert.equal(decodeCnae('9999-9/99'), null);
    });

    it('should use custom dataset when provided', () => {
      const customDataset = {
        '1234567': 'Custom Industry Test'
      };
      assert.equal(
        decodeCnae('1234-5/67', { customDataset }),
        'Custom Industry Test'
      );
      assert.equal(decodeCnae('6201-5/00', { customDataset }), null);
    });

    it('should return null for null or undefined input', () => {
      assert.equal(decodeCnae(null), null);
      assert.equal(decodeCnae(undefined), null);
    });

    it('should return null for invalid code formats', () => {
      assert.equal(decodeCnae('abc'), null);
      assert.equal(decodeCnae('123456789'), null);
    });
  });

  describe('normalizeCnae', () => {
    it('should strip formatting characters', () => {
      assert.equal(normalizeCnae('6201-5/00'), '6201500');
    });

    it('should handle number inputs', () => {
      assert.equal(normalizeCnae(6201500), '6201500');
    });

    it('should return empty string for nullish values', () => {
      assert.equal(normalizeCnae(null), '');
      assert.equal(normalizeCnae(undefined), '');
    });

    it('should strip non-digits from short inputs', () => {
      assert.equal(normalizeCnae('12-345'), '12345');
    });
  });

  describe('formatCnae', () => {
    it('should format raw numeric string to XXXX-X/XX', () => {
      assert.equal(formatCnae('6201500'), '6201-5/00');
    });

    it('should handle already formatted strings', () => {
      assert.equal(formatCnae('6201-5/00'), '6201-5/00');
    });

    it('should return null for invalid inputs', () => {
      assert.equal(formatCnae('123'), null);
      assert.equal(formatCnae(null), null);
    });
  });

  describe('isValidCnae', () => {
    it('should return true for valid formatted and unformatted codes', () => {
      assert.equal(isValidCnae('6201-5/00'), true);
      assert.equal(isValidCnae('6201500'), true);
      assert.equal(isValidCnae(6201500), true);
    });

    it('should return false for invalid codes', () => {
      assert.equal(isValidCnae('123'), false);
      assert.equal(isValidCnae(''), false);
      assert.equal(isValidCnae(null), false);
    });
  });

  describe('CnaeDecoder class', () => {
    it('should decode using instance methods', () => {
      const decoder = new CnaeDecoder();
      assert.equal(decoder.decode('6201-5/00'), 'Development of customizable software');
    });

    it('should allow registering new codes dynamically', () => {
      const decoder = new CnaeDecoder({});
      decoder.register('1111-1/11', 'Dynamic Industry');
      assert.equal(decoder.decode('1111111'), 'Dynamic Industry');
    });

    it('should retrieve full CnaeInfo object', () => {
      const decoder = new CnaeDecoder();
      const info = decoder.getInfo('6201-5/00');
      assert.deepEqual(info, {
        code: '6201500',
        formattedCode: '6201-5/00',
        description: 'Development of customizable software'
      });
    });

    it('should return null for getInfo on unknown code', () => {
      const decoder = new CnaeDecoder();
      assert.equal(decoder.getInfo('0000-0/00'), null);
    });
  });
});
