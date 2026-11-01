import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateEVP, validateEVP, formatEVP } from '../src/index.js';

describe('EVP Key Generation and Validation', () => {
  describe('generateEVP()', () => {
    test('should generate a valid EVP key (UUID v4 format)', () => {
      const key = generateEVP();
      assert.equal(typeof key, 'string');
      assert.equal(validateEVP(key), true);
    });

    test('should generate unique keys on consecutive calls', () => {
      const key1 = generateEVP();
      const key2 = generateEVP();
      assert.notEqual(key1, key2);
    });
  });

  describe('validateEVP()', () => {
    test('should return true for valid lowercase UUID', () => {
      const validKey = '123e4567-e89b-12d3-a456-426614174000';
      assert.equal(validateEVP(validKey), true);
    });

    test('should return true for valid uppercase UUID', () => {
      const validKey = '123E4567-E89B-12D3-A456-426614174000';
      assert.equal(validateEVP(validKey), true);
    });

    test('should return true for UUID with leading and trailing whitespace', () => {
      const validKey = '  123e4567-e89b-12d3-a456-426614174000  ';
      assert.equal(validateEVP(validKey), true);
    });

    test('should return false for invalid string formats', () => {
      assert.equal(validateEVP('invalid-uuid'), false);
      assert.equal(validateEVP('123e4567-e89b-12d3-a456-42661417400'), false); // too short
      assert.equal(validateEVP('123e4567-e89b-12d3-a456-4266141740000'), false); // too long
      assert.equal(validateEVP('123e4567e89b12d3a456426614174000'), false); // missing hyphens
      assert.equal(validateEVP('123g4567-e89b-12d3-a456-426614174000'), false); // non-hex character 'g'
    });

    test('should return false for non-string inputs', () => {
      assert.equal(validateEVP(null), false);
      assert.equal(validateEVP(undefined), false);
      assert.equal(validateEVP(12345), false);
      assert.equal(validateEVP({}), false);
    });
  });

  describe('formatEVP()', () => {
    test('should format uppercase UUID to canonical lowercase UUID', () => {
      const uppercase = '123E4567-E89B-12D3-A456-426614174000';
      assert.equal(formatEVP(uppercase), '123e4567-e89b-12d3-a456-426614174000');
    });

    test('should trim whitespace and format lowercase', () => {
      const unformatted = '  123E4567-E89B-12D3-A456-426614174000  ';
      assert.equal(formatEVP(unformatted), '123e4567-e89b-12d3-a456-426614174000');
    });

    test('should return null for invalid EVP key', () => {
      assert.equal(formatEVP('not-a-uuid'), null);
    });
  });
});
