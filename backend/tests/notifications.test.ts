import request from 'supertest';
import { createApp } from './helpers/app';
import { createTestUser } from './helpers/auth';
import { NotificationService } from '../src/services/notificationService';

const app = createApp();

describe('Notification Isolation', () => {
  let u1Token: string;
  let u2Token: string;
  let notif1Id: string;
  let notif2Id: string;
  
  beforeEach(async () => {
    const u1 = await createTestUser('User1', 'u1@example.com', 'password');
    u1Token = u1.token;
    
    const u2 = await createTestUser('User2', 'u2@example.com', 'password');
    u2Token = u2.token;

    // Use service directly to inject test notifications easily
    await NotificationService.sendNotification({
      recipientId: u1.user.id,
      workspaceId: '000000000000000000000000',
      type: 'task_assigned',
      title: 'U1 Notif',
      message: 'Test 1',
      entityType: 'task',
      entityId: '000000000000000000000000'
    });

    await NotificationService.sendNotification({
      recipientId: u2.user.id,
      workspaceId: '000000000000000000000000',
      type: 'task_assigned',
      title: 'U2 Notif',
      message: 'Test 2',
      entityType: 'task',
      entityId: '000000000000000000000000'
    });

    const res1 = await request(app).get('/api/notifications').set('Authorization', `Bearer ${u1Token}`);
    notif1Id = res1.body.notifications[0].id;
    
    const res2 = await request(app).get('/api/notifications').set('Authorization', `Bearer ${u2Token}`);
    notif2Id = res2.body.notifications[0].id;
  });

  it('User A can read own notifications', async () => {
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${u1Token}`);
    expect(res.body.notifications.length).toBe(1);
    expect(res.body.notifications[0].title).toBe('U1 Notif');
  });

  it('CRITICAL: User A cannot mark User B notification read', async () => {
    const res = await request(app).patch(`/api/notifications/${notif2Id}/read`).set('Authorization', `Bearer ${u1Token}`);
    expect(res.status).toBe(404); // Or 403, but not 200
  });

  it('CRITICAL: User A cannot delete User B notification', async () => {
    const res = await request(app).delete(`/api/notifications/${notif2Id}`).set('Authorization', `Bearer ${u1Token}`);
    expect(res.status).toBe(404);
  });
});
