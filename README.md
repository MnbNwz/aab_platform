# AAS Platform Monorepo

## Structure

- `client/` — React + Vite frontend
- `server/` — Node.js + Express backend
- `shared/` — Shared code (types, utils, validation)

## Setup

1. Install dependencies:
   - `cd client && npm install`
   - `cd server && npm install`
2. Create `.env` files as needed (see `.env.example`)
3. Start development:
   - `npm run dev` in both `client` and `server`

## Scripts

You can add root-level scripts for running both apps together using `concurrently`.

## Folder Details

- `server/routes/` — Express route definitions
- `server/controllers/` — Route handler logic
- `server/models/` — Mongoose models
- `server/middlewares/` — Custom Express middlewares
- `shared/` — Common code for both client and server

## Testing

Add tests in `client/tests/` and `server/tests/` as needed.

---

This monorepo is ready for scalable full-stack development.

# aab_platform
