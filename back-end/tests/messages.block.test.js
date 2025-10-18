const request = require('supertest');
const app = require('../src/app');

async function registerAndLogin(name, username) {
      await request(app).post('/api/auth/register').send({ name, username, password: 'pass1234' })
      const login = await request(app).post('/api/auth/login').send({ username, password: 'pass1234' })
      return { token: login.body.token }
}

describe('Blocking', () => {
      test('blocked users cannot send', async () => {
            const a = await registerAndLogin('Alice', 'block_alice')
            const b = await registerAndLogin('Bob', 'block_bob')
            const usersRes = await request(app).get('/api/users').set('Authorization', `Bearer ${a.token}`)
            const bob = usersRes.body.find((u) => u.username === 'block_bob')
            const aliceUsers = await request(app).get('/api/users').set('Authorization', `Bearer ${b.token}`)
            const alice = aliceUsers.body.find((u) => u.username === 'block_alice')

            // Create conversation
            const conv = await request(app).post('/api/conversations').set('Authorization', `Bearer ${a.token}`).send({ participantId: bob._id }).expect(201)

            // Bob blocks Alice
            await request(app).post(`/api/users/${alice._id}/block`).set('Authorization', `Bearer ${b.token}`).expect(200)

            // Alice tries to send
            await request(app)
                  .post(`/api/conversations/${conv.body._id}/messages`)
                  .set('Authorization', `Bearer ${a.token}`)
                  .send({ to: bob._id, type: 'text', content: 'Hello' })
                  .expect(403)
      })
})


