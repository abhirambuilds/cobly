import request from 'supertest';
import { createApp } from './helpers/app';
import { createTestUser } from './helpers/auth';

const app = createApp();

describe('Activity Side-Effects', () => {
  let user1Token: string;
  let ws1Id: string;
  
  beforeEach(async () => {
    const u1 = await createTestUser('User1', 'u1@example.com', 'password');
    user1Token = u1.token;
  });

  it('creates activity when workspace is created', async () => {
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'WS1' });
    ws1Id = wsRes.body.workspace.id;

    const actRes = await request(app).get(`/api/workspaces/${ws1Id}/activity`).set('Authorization', `Bearer ${user1Token}`);
    
    expect(actRes.status).toBe(200);
    // There should be at least one activity for workspace_created
    const activities = actRes.body.activities;
    expect(activities.some((a: { action: string }) => a.action === 'workspace_created')).toBe(true);
  });
});
