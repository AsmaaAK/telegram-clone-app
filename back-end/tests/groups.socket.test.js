const http = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');
const app = require('../src/app');
const { setupSocket } = require('../src/socket');
const request = require('supertest');

async function registerAndLogin(name, username) {
      await request(app).post('/api/auth/register').send({ name, username, password: 'pass1234' });
      const login = await request(app).post('/api/auth/login').send({ username, password: 'pass1234' });
      return { token: login.body.token, user: login.body.user };
}

describe('Groups Socket', () => {
      let io, server, url;
      beforeEach((done) => {
            server = http.createServer(app);
            io = new Server(server, { cors: { origin: '*' } });
            setupSocket(io);
            app.set('io', io);
            server.listen(() => {
                  const port = server.address().port;
                  url = `http://localhost:${port}`;
                  done();
            });
      });
      afterEach(() => {
            io.close();
            server.close();
      });

      test('send and receive group_message with delivered/read updates', async () => {
            const a = await registerAndLogin('Alice', 'sock_alice');
            const b = await registerAndLogin('Bob', 'sock_bob');

            // Create group (Alice owner, add Bob)
            const usersForA = await request(app).get('/api/users').set('Authorization', `Bearer ${a.token}`);
            const bob = usersForA.body.find((u) => u.username === 'sock_bob');
            const created = await request(app).post('/api/groups').set('Authorization', `Bearer ${a.token}`).send({ name: 'Sock Group', members: [bob._id] });
            const groupId = created.body._id;

            const cA = Client(url, { auth: { token: a.token }, transports: ['websocket'] });
            const cB = Client(url, { auth: { token: b.token }, transports: ['websocket'] });

            await new Promise((res) => cA.on('connect', res));
            await new Promise((res) => cB.on('connect', res));

            cA.emit('join_group', { groupId });
            cB.emit('join_group', { groupId });

            const got = new Promise((resolve) => {
                  cB.on('group_message', ({ message }) => resolve(message));
            });

            cA.emit('group_message', { groupId, content: 'Hello Socket', type: 'text' });

            const msg = await got;
            expect(msg.content).toBe('Hello Socket');

            // Delivered
            cB.emit('group_message_delivered', { messageId: msg._id });
            // Read
            cB.emit('group_message_read', { groupId, messageId: msg._id });

            cA.close();
            cB.close();
      });
});



