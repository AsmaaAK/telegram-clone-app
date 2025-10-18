const request = require('supertest');
const app = require('../src/app');

async function registerAndLogin(name, username) {
      await request(app).post('/api/auth/register').send({ name, username, password: 'pass1234' });
      const login = await request(app).post('/api/auth/login').send({ username, password: 'pass1234' });
      return { token: login.body.token, user: login.body.user };
}

describe('Groups API', () => {
      test('create group, list my groups, add/remove members, send/list messages', async () => {
            const a = await registerAndLogin('Alice', 'grp_alice');
            const b = await registerAndLogin('Bob', 'grp_bob');
            const c = await registerAndLogin('Charlie', 'grp_charlie');

            // Fetch Bob id
            const usersForA = await request(app).get('/api/users').set('Authorization', `Bearer ${a.token}`).expect(200);
            const bob = usersForA.body.find((u) => u.username === 'grp_bob');
            const charlie = usersForA.body.find((u) => u.username === 'grp_charlie');

            // Create group with Bob as member
            const fd = { name: 'My Group', description: 'Test group', members: [bob._id] };
            const created = await request(app).post('/api/groups').set('Authorization', `Bearer ${a.token}`).send(fd).expect(201);
            expect(created.body.name).toBe('My Group');
            const groupId = created.body._id;

            // A (owner) can fetch details
            const detailsA = await request(app).get(`/api/groups/${groupId}`).set('Authorization', `Bearer ${a.token}`).expect(200);
            expect(detailsA.body.members.length).toBeGreaterThanOrEqual(2);

            // Bob (member) can fetch details
            await request(app).get(`/api/groups/${groupId}`).set('Authorization', `Bearer ${b.token}`).expect(200);

            // Charlie (not member) forbidden
            await request(app).get(`/api/groups/${groupId}`).set('Authorization', `Bearer ${c.token}`).expect(403);

            // Owner adds Charlie, promotes Bob to admin
            const updated = await request(app)
                  .put(`/api/groups/${groupId}`)
                  .set('Authorization', `Bearer ${a.token}`)
                  .send({ addMembers: [charlie._id], promoteAdmins: [bob._id] })
                  .expect(200);
            expect(updated.body.members.find((m) => m.userId === charlie._id)).toBeTruthy();

            // Bob (now admin) removes Charlie
            const updated2 = await request(app)
                  .put(`/api/groups/${groupId}`)
                  .set('Authorization', `Bearer ${b.token}`)
                  .send({ removeMembers: [charlie._id] })
                  .expect(200);
            expect(updated2.body.members.find((m) => m.userId === charlie._id)).toBeFalsy();

            // List my groups (for Alice)
            const myGroups = await request(app).get(`/api/users/${a.user.id}/groups`).set('Authorization', `Bearer ${a.token}`).expect(200);
            expect(myGroups.body.find((g) => g._id === groupId)).toBeTruthy();

            // Send message via HTTP fallback
            await request(app)
                  .post(`/api/groups/${groupId}/messages`)
                  .set('Authorization', `Bearer ${a.token}`)
                  .send({ content: 'Hello Group', type: 'text' })
                  .expect(201);

            // List messages
            const msgs = await request(app).get(`/api/groups/${groupId}/messages`).set('Authorization', `Bearer ${a.token}`).expect(200);
            expect(Array.isArray(msgs.body)).toBe(true);
            expect(msgs.body.length).toBeGreaterThan(0);
            expect(msgs.body[0].content).toBe('Hello Group');
      });
});



