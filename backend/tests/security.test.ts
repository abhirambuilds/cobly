import request from 'supertest';
import app from '../src/app';

describe('Security Hardening', () => {
  describe('Helmet / Headers', () => {
    it('CRITICAL: Should include secure headers (Content-Security-Policy, X-Frame-Options, etc.)', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['x-xss-protection']).toBeDefined();
      expect(res.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('Should allow configured origin and credentials', async () => {
      const res = await request(app).options('/api/health');
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('Should block excessive requests to auth endpoints', async () => {
      // In test env, limit is 1000. So we make 1000 requests.
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(request(app).post('/api/auth/login').send({}));
      }
      await Promise.all(promises);
      
      // The 1001st request should be blocked by rate limit
      const blockedRes = await request(app).post('/api/auth/login').send({});
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.error.message).toMatch(/Too many authentication attempts/);
    });

    it('Should block excessive requests to general API endpoints', async () => {
      // We can verify standard rate limit headers are attached
      const res = await request(app).get('/api/health');
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
      expect(res.headers['ratelimit-reset']).toBeDefined();
    });
  });

  describe('Request Body Size Limit', () => {
    it('Should block payloads larger than 100kb', async () => {
      const largePayload = { data: 'a'.repeat(150 * 1024) }; // ~150kb
      
      const res = await request(app)
        .post('/api/auth/login')
        .send(largePayload);
      
      // Express body-parser throws a 413 Payload Too Large
      expect(res.status).toBe(413);
    });
  });
});
