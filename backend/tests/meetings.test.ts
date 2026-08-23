import request from 'supertest';
import { createApp } from './helpers/app';
import { createTestUser } from './helpers/auth';

const app = createApp();

describe('Meeting Security & Validation', () => {
  let user1Token: string;
  let user2Token: string; // Outside user
  let ws1Id: string;
  let u1Id: string;
  let u2Id: string;
  
  beforeEach(async () => {
    const u1 = await createTestUser('User1', 'u1@example.com', 'password');
    user1Token = u1.token;
    u1Id = u1.user.id;
    
    const u2 = await createTestUser('User2', 'u2@example.com', 'password');
    user2Token = u2.token;
    u2Id = u2.user.id;
    
    const ws1Res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'WS1' });
    ws1Id = ws1Res.body.workspace.id;
  });

  it('rejects endTime <= startTime', async () => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() - 1000); // Past

    const res = await request(app)
      .post(`/api/workspaces/${ws1Id}/meetings`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Bad Time Meeting',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendees: [u1Id]
      });

    expect(res.status).toBe(400); // Validation should reject it
  });

  it('rejects outside attendees not in workspace', async () => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 3600000);

    const res = await request(app)
      .post(`/api/workspaces/${ws1Id}/meetings`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Secret Meeting',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendees: [u1Id, u2Id] // u2 is NOT in ws1
      });

    expect(res.status).toBe(400); 
    // Wait, the API returns INVALID_ATTENDEE usually, which we mapped to 400. Let's assume it fails.
  });
});
