import request from 'supertest';
import { createApp } from './helpers/app';
import { createTestUser } from './helpers/auth';

const app = createApp();

describe('Mass Assignment & Data Injection', () => {
  let user1Token: string;
  
  beforeEach(async () => {
    const u1 = await createTestUser('User1', 'u1@example.com', 'password');
    user1Token = u1.token;
  });

  it('rejects injecting workspaceId during workspace creation', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Hacked WS',
        id: '123456789012345678901234',
        _id: '123456789012345678901234',
        owner: '123456789012345678901234'
      });

    // It should either ignore it or create it with a generated ID, but not the injected one
    expect(res.status).toBe(201);
    expect(res.body.workspace.id).not.toBe('123456789012345678901234');
    expect(res.body.workspace.owner).not.toBe('123456789012345678901234');
  });
});
