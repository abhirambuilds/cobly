import request from 'supertest';
import { createApp } from './helpers/app';
import { createTestUser } from './helpers/auth';

const app = createApp();

describe('Discussion Security', () => {
  let u1Token: string;
  let ws1Id: string;
  let p1Id: string;
  let d1Id: string;
  let u2Id: string;
  let u2Token: string;

  beforeEach(async () => {
    const u1 = await createTestUser('User1', 'u1@example.com', 'password');
    u1Token = u1.token;

    const u2 = await createTestUser('User2', 'u2@example.com', 'password');
    u2Id = u2.user.id;
    u2Token = u2.token;

    const ws1Res = await request(app).post('/api/workspaces').set('Authorization', `Bearer ${u1Token}`).send({ name: 'WS1' });
    ws1Id = ws1Res.body.workspace.id;

    const p1Res = await request(app).post(`/api/workspaces/${ws1Id}/projects`).set('Authorization', `Bearer ${u1Token}`).send({ name: 'P1' });
    p1Id = p1Res.body.project.id;

    const d1Res = await request(app).post(`/api/workspaces/${ws1Id}/projects/${p1Id}/discussions`).set('Authorization', `Bearer ${u1Token}`).send({ title: 'Disc1', content: 'hello' });
    d1Id = d1Res.body.discussion.id;
  });

  it('allows member to create comment', async () => {
    await request(app).post(`/api/workspaces/${ws1Id}/members`).set('Authorization', `Bearer ${u1Token}`).send({ email: 'u2@example.com' });

    const res = await request(app)
      .post(`/api/workspaces/${ws1Id}/projects/${p1Id}/discussions/${d1Id}/comments`)
      .set('Authorization', `Bearer ${u2Token}`)
      .send({ content: 'My comment' });

    expect(res.status).toBe(201);
  });

  it('rejects non-member creating comment', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${ws1Id}/projects/${p1Id}/discussions/${d1Id}/comments`)
      .set('Authorization', `Bearer ${u2Token}`)
      .send({ content: 'My comment' });

    expect(res.status).toBe(403);
  });
});
