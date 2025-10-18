const request = require('supertest');
const app = require('../src/app');

async function createUser(name, username) {
      await request(app).post('/api/auth/register').send({ name, username, password: 'pass1234' })
      const login = await request(app).post('/api/auth/login').send({ username, password: 'pass1234' })
      return login.body.token
}

describe('Conversations API', () => {
      test('create and list conversations', async () => {
            const aToken = await createUser('Alice', 'conv_alice')
            const bToken = await createUser('Bob', 'conv_bob')
            const users = await request(app).get('/api/users').set('Authorization', `Bearer ${aToken}`)
            const bob = users.body.find(u => u.username === 'conv_bob')
            const created = await request(app).post('/api/conversations').set('Authorization', `Bearer ${aToken}`).send({ participantId: bob._id }).expect(201)
            expect(created.body.participants.length).toBe(2)
            const list = await request(app).get('/api/conversations').set('Authorization', `Bearer ${aToken}`).expect(200)
            expect(list.body.length).toBeGreaterThan(0)
      })
})


