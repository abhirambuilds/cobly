import request from 'supertest';
import { createApp } from './helpers/app';
import { createTestUser } from './helpers/auth';

const app = createApp();

describe('Task Security', () => {
  let u1Token: string;
  let ws1Id: string;
  let p1Id: string;
  let t1Id: string;
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

    const t1Res = await request(app).post(`/api/workspaces/${ws1Id}/projects/${p1Id}/tasks`).set('Authorization', `Bearer ${u1Token}`).send({ title: 'Task1' });
    t1Id = t1Res.body.task.id;
  });

  it('rejects assigning a non-member to a task', async () => {
    const res = await request(app)
      .patch(`/api/workspaces/${ws1Id}/projects/${p1Id}/tasks/${t1Id}`)
      .set('Authorization', `Bearer ${u1Token}`)
      .send({ assignee: u2Id });

    expect(res.status).toBe(400); // INVALID_ASSIGNEE
  });

  it('allows assigning a member to a task', async () => {
    await request(app).post(`/api/workspaces/${ws1Id}/members`).set('Authorization', `Bearer ${u1Token}`).send({ email: 'u2@example.com' });

    const res = await request(app)
      .patch(`/api/workspaces/${ws1Id}/projects/${p1Id}/tasks/${t1Id}`)
      .set('Authorization', `Bearer ${u1Token}`)
      .send({ assignee: u2Id });

    expect(res.status).toBe(200);
  });
});
