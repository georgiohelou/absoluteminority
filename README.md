# Absolute Minority

A mobile-first party game where players vote on dares and race to five points. This repository contains the functional and technical specification for version 1 of the web experience, a reference implementation of the round resolution logic, and a lightweight full-stack prototype (React + Socket.IO backend).

## Specification

See [docs/functional-technical-spec.md](docs/functional-technical-spec.md) for the full game rules, flows, and architectural outline. For a concise view of how the frontend, backend, and Socket.IO contracts fit together, read the new [app-level design](docs/app-level-design.md).

## Running the prototype

- Backend (dev): `npm run dev:server` (env: `PORT`, optional `CORS_ORIGIN`)
- Frontend (dev): `npm run dev:frontend` (env: `VITE_WS_URL` pointing to the backend URL)

The backend exposes `/health` and `/challenges` endpoints alongside the WebSocket server. Game state is held in-memory by the Node process.

## Game logic prototype

The `src/gameLogic.js` module models the authoritative round resolution rules described in the specification, including:

- Majority/minority handling and special one-vote edge cases.
- Full-score reset when everyone votes NO.
- Challenge assignment, elimination on failed performances, and winner detection with the specified tie-breaker.

A lightweight test harness in `tests/run-tests.js` executes scenario-based assertions in `tests/gameLogic.test.js` without external dependencies.

### Running tests

```bash
npm test
```

All tests are written with Node's built-in `assert` and a minimal test runner to avoid external package installation.
