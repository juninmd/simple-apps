import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { getCategories, getEntriesByCategory, searchEntries } from '../src/data.js';
import app from '../src/server.js';

describe('Data Module - Category Filtering', () => {
  it('should list all available categories sorted', () => {
    const categories = getCategories();
    assert.ok(Array.isArray(categories));
    assert.ok(categories.includes('Gastronomy'));
    assert.ok(categories.includes('Music'));
    assert.ok(categories.includes('History'));
  });

  it('should return all entries when category is "All" or undefined', () => {
    const all = getEntriesByCategory('All');
    const undefinedCat = getEntriesByCategory();
    assert.equal(all.length, undefinedCat.length);
    assert.ok(all.length >= 10);
  });

  it('should filter entries specifically by category (e.g. Gastronomy)', () => {
    const gastronomyEntries = getEntriesByCategory('Gastronomy');
    assert.ok(gastronomyEntries.length > 0);
    gastronomyEntries.forEach((entry) => {
      assert.equal(entry.category, 'Gastronomy');
    });
  });

  it('should search entries within a category filter', () => {
    const musicSamba = searchEntries('samba', 'Music');
    assert.ok(musicSamba.length > 0);
    musicSamba.forEach((entry) => {
      assert.equal(entry.category, 'Music');
      assert.ok(
        entry.title.toLowerCase().includes('samba') ||
        entry.summary.toLowerCase().includes('samba') ||
        entry.description.toLowerCase().includes('samba')
      );
    });
  });
});

describe('Web Server API Endpoints', () => {
  let server;
  let baseUrl;

  it('GET /api/categories and /api/entries', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    try {
      const resCat = await fetch(`${baseUrl}/api/categories`);
      assert.equal(resCat.status, 200);
      const categories = await resCat.json();
      assert.ok(Array.isArray(categories));
      assert.ok(categories.includes('Music'));

      const resEntries = await fetch(`${baseUrl}/api/entries?category=Music`);
      assert.equal(resEntries.status, 200);
      const entries = await resEntries.json();
      assert.ok(entries.length > 0);
      entries.forEach((e) => assert.equal(e.category, 'Music'));
    } finally {
      if (server) {
        await new Promise((resolve) => server.close(resolve));
      }
    }
  });
});
