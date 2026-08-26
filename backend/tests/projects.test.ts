import request from 'supertest';
import { createApp } from './helpers/app';
import { createTestUser } from './helpers/auth';

const app = createApp();

describe('Project & Task Security Flow', () => {
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  
  let ws1Id: string;
  let ws2Id: string;
  let p1Id: string;
  
  beforeEach(async () => {
    const u1 = await createTestUser('User1', 'u1@example.com', 'password');
    user1Token = u1.token;
    
    const u2 = await createTestUser('User2', 'u2@example.com', 'password');
    user2Token = u2.token; // User2 will be a member of WS1
    
    const u3 = await createTestUser('User3', 'u3@example.com', 'password');
    user3Token = u3.token; // User3 will be owner of WS2, completely isolated from WS1
    
    // Create Workspace 1 (owned by User1)
    const ws1Res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'WS1' });
    ws1Id = ws1Res.body.workspace.id;
    
    // Add User2 to Workspace 1
    await request(app)
      .post(`/api/workspaces/${ws1Id}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ email: 'u2@example.com' });

    // Create Workspace 2 (owned by User3)
    const ws2Res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user3Token}`)
      .send({ name: 'WS2' });
    ws2Id = ws2Res.body.workspace.id;
    
    // Create Project in WS1 by User1
    const p1Res = await request(app)
      .post(`/api/workspaces/${ws1Id}/projects`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Project 1' });
    p1Id = p1Res.body.project.id;
  });

  it('member can create/view project', async () => {
    const pRes = await request(app)
      .post(`/api/workspaces/${ws1Id}/projects`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'Member Project' });
    
    expect(pRes.status).toBe(201);
    
    const getRes = await request(app)
      .get(`/api/workspaces/${ws1Id}/projects/${pRes.body.project.id}`)
      .set('Authorization', `Bearer ${user2Token}`);
      
    expect(getRes.status).toBe(200);
  });

  it('ordinary member cannot update/delete project they do not own', async () => {
    // p1Id is owned by user1 (or workspace owner user1)
    const updateRes = await request(app)
      .patch(`/api/workspaces/${ws1Id}/projects/${p1Id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'Hacked Name' });
      
    expect(updateRes.status).toBe(403);
    
    const delRes = await request(app)
      .delete(`/api/workspaces/${ws1Id}/projects/${p1Id}`)
      .set('Authorization', `Bearer ${user2Token}`);
      
    expect(delRes.status).toBe(403);
  });

  it('workspace owner can update/delete any project', async () => {
    // Let user2 create a project
    const pRes = await request(app)
      .post(`/api/workspaces/${ws1Id}/projects`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'Member Project' });
    
    const p2Id = pRes.body.project.id;
    
    // User1 (ws owner) deletes it
    const delRes = await request(app)
      .delete(`/api/workspaces/${ws1Id}/projects/${p2Id}`)
      .set('Authorization', `Bearer ${user1Token}`);
      
    expect(delRes.status).toBe(200);
  });

  it('non-member cannot access projects', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${ws1Id}/projects`)
      .set('Authorization', `Bearer ${user3Token}`);
      
    expect(res.status).toBe(403);
  });

  it('CRITICAL: Workspace A + Project B cross-workspace attack must fail', async () => {
    // Try to access p1Id (which belongs to ws1Id) through ws2Id
    // User3 is owner of ws2Id, so they pass the workspace membership check for ws2Id
    const res = await request(app)
      .get(`/api/workspaces/${ws2Id}/projects/${p1Id}`)
      .set('Authorization', `Bearer ${user3Token}`);
      
    // Because project service forces query: { _id: p1Id, workspaceId: ws2Id }, it should not find the project
    expect(res.status).toBe(404); // Or 403, but not 200
  });

  // Task tests
  it('member can create/view task', async () => {
    const tRes = await request(app)
      .post(`/api/workspaces/${ws1Id}/projects/${p1Id}/tasks`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: 'Task 1' });
      
    expect(tRes.status).toBe(201);
  });
  
  it('CRITICAL: Cross-workspace Task attack must fail', async () => {
    const tRes = await request(app)
      .post(`/api/workspaces/${ws1Id}/projects/${p1Id}/tasks`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Task 1' });
    const taskId = tRes.body.task.id;

    // User3 tries to access Task 1 via WS2 and Project 1
    const hackRes = await request(app)
      .get(`/api/workspaces/${ws2Id}/projects/${p1Id}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user3Token}`);

    expect(hackRes.status).toBe(404);
  });
});
