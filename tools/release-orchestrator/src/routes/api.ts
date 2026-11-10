import { Router, Request, Response } from 'express';
import { releaseService } from '../services/releaseService.js';
import { configService } from '../services/configService.js';

export const apiRouter = Router();

export const MAX_PAGE = 10000;
export const MAX_PAGE_SIZE = 100;

type Pagination =
  | { page: number; limit: number }
  | { error: { error: 'invalid_query'; field: string; message: string } };

function parseBounded(value: unknown, fallback: number, max: number) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 && n <= max ? n : null;
}

/** Validates `page`/`limit`; missing params use the defaults (1 and 10). */
export function parsePagination(query: Record<string, unknown>): Pagination {
  const fields = [
    ['page', 1, MAX_PAGE],
    ['limit', 10, MAX_PAGE_SIZE]
  ] as const;
  const out: Record<string, number> = {};
  for (const [field, fallback, max] of fields) {
    const n = parseBounded(query[field], fallback, max);
    if (n === null) {
      const message = `${field} must be an integer between 1 and ${max}`;
      return { error: { error: 'invalid_query', field, message } };
    }
    out[field] = n;
  }
  return { page: out.page, limit: out.limit };
}

apiRouter.get('/history', (req: Request, res: Response) => {
  const parsed = parsePagination(req.query);
  if ('error' in parsed) {
    res.status(400).json(parsed.error);
    return;
  }
  res.json(releaseService.getHistory(parsed.page, parsed.limit));
});

apiRouter.get('/pending', (_req: Request, res: Response) => {
  const pending = releaseService.getPendingReleases();
  res.json(pending);
});

apiRouter.get('/config', (_req: Request, res: Response) => {
  const config = configService.getConfigStatus();
  res.json(config);
});
