const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');

describe('Auth', () => {
      test('register then login', async () => {
            const reg = await request(app)
                  .post('/api/auth/register')
                  .send({ name: 'Alice', username: 'alice', password: 'password123' })
                  .expect(201);
            expect(reg.body.token).toBeDefined();
            expect(reg.body.user.username).toBe('alice');

            const login = await request(app)
                  .post('/api/auth/login')
                  .send({ username: 'alice', password: 'password123' })
                  .expect(200);
            expect(login.body.token).toBeDefined();
      });
});


