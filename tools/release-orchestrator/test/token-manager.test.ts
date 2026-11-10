import { describe, it, expect } from 'vitest';
import { TokenManager } from '../src/token-manager.js';

describe('TokenManager', () => {
  it('should initialize with provided tokens and return active token', () => {
    const tm = new TokenManager({ tokens: ['token-1', 'token-2'] });
    expect(tm.getActiveToken()).toBe('token-1');
    expect(tm.getValidTokenCount()).toBe(2);
  });

  it('should rotate to next token on call', () => {
    const tm = new TokenManager({ tokens: ['token-1', 'token-2', 'token-3'] });
    const nextToken = tm.rotateToken('401 error');
    expect(nextToken).toBe('token-2');
    expect(tm.getActiveToken()).toBe('token-2');
    expect(tm.getValidTokenCount()).toBe(2);
  });

  it('should throw error when all tokens are exhausted', () => {
    const tm = new TokenManager({ tokens: ['token-1', 'token-2'] });
    tm.rotateToken();
    expect(() => tm.rotateToken()).toThrow('All tokens exhausted');
  });

  it('should correctly mask token secrets', () => {
    expect(TokenManager.maskToken('npm_1234567890abcdef')).toBe('npm_....cdef');
    expect(TokenManager.maskToken('short')).toBe('****');
    expect(TokenManager.maskToken('')).toBe('');
  });
});
