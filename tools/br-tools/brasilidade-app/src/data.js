import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.resolve(__dirname, '../data/entries.json');

export function getAllEntries() {
  const content = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(content);
}

export function getCategories() {
  const entries = getAllEntries();
  const categories = new Set(entries.map((entry) => entry.category));
  return Array.from(categories).sort();
}

export function getEntriesByCategory(category) {
  const entries = getAllEntries();
  if (!category || category.toLowerCase() === 'all') {
    return entries;
  }
  return entries.filter(
    (entry) => entry.category.toLowerCase() === category.trim().toLowerCase()
  );
}

export function searchEntries(query, category) {
  let entries = getEntriesByCategory(category);
  if (!query) return entries;

  const q = query.toLowerCase().trim();
  return entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(q) ||
      entry.summary.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q)
  );
}
