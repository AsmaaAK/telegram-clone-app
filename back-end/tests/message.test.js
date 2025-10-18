const request = require('supertest');
const app = require('../src/app');
const Conversation = require('../src/models/Conversation');

async function registerAndLogin(name, username) {
      await request(app).post('/api/auth/register').send({ name, username, password: 'pass1234' });
      const login = await request(app).post('/api/auth/login').send({ username, password: 'pass1234' });
      return { token: login.body.token };
}

describe('Messaging', () => {
      test('send text message', async () => {
            const a = await registerAndLogin('Alice', 'alice');
            const b = await registerAndLogin('Bob', 'bob');

            const usersRes = await request(app).get('/api/users').set('Authorization', `Bearer ${a.token}`);
            const bob = usersRes.body.find((u) => u.username === 'bob');
            const convoRes = await request(app)
                  .post('/api/conversations')
                  .set('Authorization', `Bearer ${a.token}`)
                  .send({ participantId: bob._id })
                  .expect(201);

            const conv = convoRes.body;

            const msgRes = await request(app)
                  .post(`/api/conversations/${conv._id}/messages`)
                  .set('Authorization', `Bearer ${a.token}`)
                  .send({ to: bob._id, type: 'text', content: 'Hello Bob' })
                  .expect(201);

            expect(msgRes.body.content).toBe('Hello Bob');
      });
});


