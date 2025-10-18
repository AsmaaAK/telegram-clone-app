## WhatsApp Clone - Client

Vue 3 + Vite + Tailwind + Pinia + Router + socket.io-client

### Setup
1. Copy `.env.example` to `.env` and set:
   - `VITE_API_BASE=http://localhost:4000/api`
   - `VITE_SOCKET_URL=http://localhost:4000`
2. Install and run:
```bash
cd client
npm install
npm run dev
```

### Structure
- `src/stores`: Pinia stores (`auth`, `chat`)
- `src/utils/api.ts`: axios instance with Bearer token
- `src/views`: `Login`, `Register`, `Chat` (sidebar + window + composer)


