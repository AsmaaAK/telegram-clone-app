## WhatsApp Clone - Server

Production-ready Express + Socket.IO backend with MongoDB.

### Stack
- Express, Socket.IO, MongoDB (Mongoose)
- JWT, bcrypt, Multer, Sharp
- Helmet, CORS, rate-limit, morgan
- Jest, Supertest, mongodb-memory-server

### Setup
1. Copy `.env.example` to `.env` and adjust values
2. Install deps:
```bash
cd server
npm install
```
3. Run dev:
```bash
npm run dev
```

### Scripts
- `dev`: start with nodemon
- `start`: start server
- `test`: run tests
- `migrate` / `seed`: placeholder scripts

### API
- `POST /api/auth/register` { name, username, password }
- `POST /api/auth/login` { username, password }
- `GET /api/users` (auth)
- `GET /api/users/:id` (auth)
- `PUT /api/users/me` (auth)
- `POST /api/users/me/avatar` (auth, multipart `avatar`)
- `POST /api/account/password` (auth)
- `POST /api/account/settings` (auth)
- `POST /api/conversations` (auth)
- `GET /api/conversations` (auth)
- `GET /api/conversations/:id/messages` (auth)
- `POST /api/conversations/:id/messages` (auth)
- `POST /api/users/:id/block` (auth)
- `GET /api/ping`

Uploads served at `/uploads`.

### Socket.IO Events
- In: `presence:subscribe`, `typing`, `message:send`, `message:delivered`, `message:read`, `user:update`
- Out: `user:online`, `user:offline`, `user:typing`, `message:new`, `message:updated`, `conversation:updated`


