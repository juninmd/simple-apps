import request from 'supertest';
import { app } from '../src/server';

describe('API Routes Integration', () => {
  it('GET /api/config should return 200 and config status', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('environment');
    expect(res.body).toHaveProperty('monitoredRepository');
  });

  it('GET /api/pending should return 200 and pending releases array', async () => {
    const res = await request(app).get('/api/pending');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/history should return 200 and paginated release history', async () => {
    const res = await request(app).get('/api/history?page=1&limit=2');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body.data.length).toBe(2);
  });

  it('GET / should serve the Web UI Dashboard HTML', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Release Orchestrator');
  });

  it('GET / should include Content-Security-Policy header', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-security-policy']).toBe(
      "default-src 'self'; script-src 'self'; style-src 'self'"
    );
  });
});
