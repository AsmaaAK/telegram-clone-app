const request = require('supertest');
const app = require('../src/app');

async function setupUser(username = 'alice') {
      await request(app).post('/api/auth/register').send({ name: 'Alice', username, password: 'pass1234' })
      const login = await request(app).post('/api/auth/login').send({ username, password: 'pass1234' })
      return login.body.token
}

describe('Account API', () => {
      test('update settings', async () => {
            const token = await setupUser('accuser')
            const res = await request(app).post('/api/account/settings').set('Authorization', `Bearer ${token}`).send({ theme: 'dark', language: 'ar' }).expect(200)
            expect(res.body.theme).toBe('dark')
            expect(res.body.language).toBe('ar')
      })

      test('change password success and failure', async () => {
            const token = await setupUser('accpass')
            await request(app).post('/api/account/password').set('Authorization', `Bearer ${token}`).send({ currentPassword: 'pass1234', newPassword: 'newpass1' }).expect(200)
            // wrong current password
            await request(app).post('/api/account/password').set('Authorization', `Bearer ${token}`).send({ currentPassword: 'wrong', newPassword: 'newpass2' }).expect(400)
      })
})


