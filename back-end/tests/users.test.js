const request = require('supertest');
const app = require('../src/app');

async function register(name, username) {
      await request(app).post('/api/auth/register').send({ name, username, password: 'pass1234' })
}

async function login(username) {
      const res = await request(app).post('/api/auth/login').send({ username, password: 'pass1234' })
      return res.body.token
}

describe('Users API', () => {
      test('list users requires auth', async () => {
            const res = await request(app).get('/api/users').expect(401)
            expect(res.body.code).toBe('UNAUTHORIZED')
      })

      test('list and get user', async () => {
            await register('Alice', 'alice')
            const token = await login('alice')
            const list = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`).expect(200)
            expect(Array.isArray(list.body)).toBe(true)
            const me = list.body.find(u => u.username === 'alice')
            const get = await request(app).get(`/api/users/${me._id}`).set('Authorization', `Bearer ${token}`).expect(200)
            expect(get.body.username).toBe('alice')
      })

      test('update profile and avatar', async () => {
            await register('Bob', 'bob')
            const token = await login('bob')
            const upd = await request(app).put('/api/users/me').set('Authorization', `Bearer ${token}`).send({ name: 'Bobby', about: 'Hello' }).expect(200)
            expect(upd.body.name).toBe('Bobby')
            // avatar upload with dummy buffer
            const avatar = await request(app)
                  .post('/api/users/me/avatar')
                  .set('Authorization', `Bearer ${token}`)
                  .attach('avatar', Buffer.from('fake'), 'avatar.jpg')
                  .expect(200)
            expect(avatar.body.avatarUrl).toMatch(/\/uploads\//)
      })
})


