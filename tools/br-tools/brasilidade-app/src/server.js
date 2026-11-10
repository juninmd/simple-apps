import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCategories, searchEntries } from './data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.resolve(__dirname, '../public')));

app.get('/api/categories', (req, res) => {
  try {
    const categories = getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/entries', (req, res) => {
  try {
    const { category, q } = req.query;
    const entries = searchEntries(q, category);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🇧🇷 Brasilidade web app running at http://localhost:${PORT}`);
  });
}

export default app;
