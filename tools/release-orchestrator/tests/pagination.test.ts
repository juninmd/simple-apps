import { describe, it, expect } from 'vitest';
import { parsePagination } from '../src/routes/api.js';

describe('parsePagination', () => {
  it('uses defaults when params are missing', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 10 });
  });

  it('accepts the exact limits', () => {
    expect(parsePagination({ limit: '1' })).toEqual({ page: 1, limit: 1 });
    expect(parsePagination({ limit: '100', page: '10000' })).toEqual({ page: 10000, limit: 100 });
  });

  it.each([
    [{ limit: '101' }, 'limit'],
    [{ limit: '0' }, 'limit'],
    [{ limit: '-1' }, 'limit'],
    [{ limit: '5.7abc' }, 'limit'],
    [{ page: 'abc' }, 'page'],
    [{ page: '1.5' }, 'page'],
    [{ page: '10001' }, 'page']
  ])('rejects %j', (query, field) => {
    const r = parsePagination(query);
    expect('error' in r && r.error.field).toBe(field);
  });
});
