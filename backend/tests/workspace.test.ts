import request from 'supertest';
import { createApp } from './helpers/app';
import { createTestUser, loginTestUser } from './helpers/auth';

const app = createApp();

describe('Workspace Flow & Security', () => {
  let user1Token: string;
  let user2Token: string;
  let user2Id: string;
  let workspace1Id: string;

  beforeEach(async () => {
    const u1 = await createTestUser('User1', 'u1@example.com', 'password');
    user1Token = u1.token;
    
    const u2 = await createTestUser('User2', 'u2@example.com', 'password');
    user2Token = u2.token;
    user2Id = u2.user.id;
  });

  it('authenticated user can create a workspace', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Workspace 1', description: 'Test WS' });

    expect(res.status).toBe(201);
    expect(res.body.workspace.name).toBe('Workspace 1');
    workspace1Id = res.body.workspace.id;
  });

  it('unauthenticated access rejected', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .send({ name: 'Hacker WS' });
    expect(res.status).toBe(401);
  });

  it('creator becomes owner', async () => {
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'My WS' });
    const wsId = wsRes.body.workspace.id;

    const memberRes = await request(app)
      .get(`/api/workspaces/${wsId}/members`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(memberRes.status).toBe(200);
    expect(memberRes.body.members[0].role).toBe('owner');
  });

  it('workspace list is user-scoped', async () => {
    await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'U1 WS' });

    const res1 = await request(app).get('/api/workspaces').set('Authorization', `Bearer ${user1Token}`);
    expect(res1.body.workspaces.length).toBe(1);

    const res2 = await request(app).get('/api/workspaces').set('Authorization', `Bearer ${user2Token}`);
    expect(res2.body.workspaces.length).toBe(0);
  });

  it('non-member access rejected for getting workspace', async () => {
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'U1 WS' });
    const wsId = wsRes.body.workspace.id;

    const res = await request(app)
      .get(`/api/workspaces/${wsId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
  });

  // Membership tests
  it('owner can add member', async () => {
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'My WS' });
    if (!wsRes.body.workspace) console.log('DEBUG WSRES', wsRes.body);
    const wsId = wsRes.body.workspace.id;

    const addRes = await request(app)
      .post(`/api/workspaces/${wsId}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ userId: user2Id });

    expect(addRes.status).toBe(200);
  });

  it('member cannot add member', async () => {
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'My WS' });
    const wsId = wsRes.body.workspace.id;

    await request(app)
      .post(`/api/workspaces/${wsId}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ userId: user2Id });

    const u3 = await createTestUser('User3', 'u3@example.com', 'password');

    const addRes = await request(app)
      .post(`/api/workspaces/${wsId}/members`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ userId: u3.user.id });

    expect(addRes.status).toBe(403);
  });

  it('duplicate membership rejected', async () => {
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'My WS' });
    const wsId = wsRes.body.workspace.id;

    await request(app)
      .post(`/api/workspaces/${wsId}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ userId: user2Id });

    const addRes = await request(app)
      .post(`/api/workspaces/${wsId}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ userId: user2Id });

    expect(addRes.status).toBe(409);
  });

  it('owner cannot remove themselves', async () => {
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'My WS' });
    const wsId = wsRes.body.workspace.id;
    
    // Attempt to remove self via /members/:userId
    // Need to get user1 id
    const meRes = await request(app).get('/api/users/me').set('Authorization', `Bearer ${user1Token}`);
    
    const delRes = await request(app)
      .delete(`/api/workspaces/${wsId}/members/${meRes.body.user.id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(delRes.status).toBe(400); // CANNOT_REMOVE_OWNER
  });

  it('owner can remove member', async () => {
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'My WS' });
    const wsId = wsRes.body.workspace.id;

    await request(app)
      .post(`/api/workspaces/${wsId}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ userId: user2Id });

    const delRes = await request(app)
      .delete(`/api/workspaces/${wsId}/members/${user2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(delRes.status).toBe(200);
  });
});
