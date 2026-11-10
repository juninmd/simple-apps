import { describe, it, expect } from 'vitest';
import { normalizeDescription } from '../src/utils/normalize';

describe('normalizeDescription', () => {
  it('strips accents and diacritics', () => {
    expect(normalizeDescription('Café Torrado e Moído')).toBe('cafe torrado e moido');
    expect(normalizeDescription('PÃO DE FORMA INTEGRAL')).toBe('pao de forma integral');
    expect(normalizeDescription('Maçã Fuji')).toBe('maca fuji');
  });

  it('handles casing and collapses extra whitespaces', () => {
    expect(normalizeDescription('  Leite   INTEGRAL  1L  ')).toBe('leite integral 1l');
    expect(normalizeDescription('Coca-Cola 2L')).toBe('coca cola 2l');
  });

  it('handles punctuation and special characters', () => {
    expect(normalizeDescription('Cerveja Heineken 350ml - Lata!')).toBe('cerveja heineken 350ml lata');
    expect(normalizeDescription('Sabão em Pó OMO 1.6kg / refil')).toBe('sabao em po omo 1 6kg refil');
  });

  it('returns empty string for falsy/empty values', () => {
    expect(normalizeDescription('')).toBe('');
    expect(normalizeDescription(null as unknown as string)).toBe('');
  });
});
