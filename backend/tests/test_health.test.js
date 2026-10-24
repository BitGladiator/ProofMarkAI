import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app/main.js';
import { createTestClient } from './test_helpers.js';

const client = createTestClient(app);

describe('Health Endpoint Tests', () => {
  it('GET /api/health returns 200 and expected status schema', async () => {
    const res = await client.get('/api/health');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      status: 'ok',
      service: 'ProofMark AI Backend'
    });
  });

  it('GET /api/health does not expose API keys or internal environment secrets', async () => {
    const res = await client.get('/api/health');

    assert.equal(res.body.apiKey, undefined);
    assert.equal(res.body.env, undefined);
    assert.equal(res.body.config, undefined);
  });

  it('GET /api/health includes correlation x-request-id header', async () => {
    const res = await client.get('/api/health');

    assert.ok(res.headers['x-request-id']);
  });

  it('GET /docs returns interactive OpenAPI documentation HTML', async () => {
    const res = await client.get('/docs');

    assert.equal(res.status, 200);
    assert.ok(res.text.includes('SwaggerUIBundle'));
  });
});
