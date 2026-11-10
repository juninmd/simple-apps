import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'"
  );
  next();
});

app.use(cors());
app.use(express.json());

// Serve API routes
app.use('/api', apiRouter);

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// Fallback to index.html for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public/index.html'));
});

const PORT = process.env.PORT || 3000;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`Web UI Dashboard running on http://localhost:${PORT}`);
  });
}
