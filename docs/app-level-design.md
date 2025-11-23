# Absolute Minority – App-Level Design

This document explains how the shipped prototype pieces fit together so the game can be run, tested, and extended. It maps the functional rules in the specification to concrete frontend and backend responsibilities and clarifies the top-level flows the app supports.

## Runtime architecture
- **Client (Vite + React, `frontend/`):** mobile-first SPA that connects to the WebSocket backend. `SocketProvider` holds the live game payload and exposes a thin emit helper.
- **Server (Express + Socket.IO, `src/server/`):** owns canonical game rooms in-memory via `GameStore`, broadcasts state updates, and runs the round timer.
- **Shared game logic (`src/gameLogic.js`):** deterministic rule engine used by the server to resolve votes and apply scoring, elimination, and win checks.

The WebSocket channel is the single source of truth during play; REST endpoints are limited to `/health` and `/challenges` for lightweight diagnostics and content.

## High-level flows
1. **Create & Join**
   - Host calls `create_game` → server creates a room with a 4-letter code and returns initial state.
   - Players call `join_game` with code + nickname → server appends them to the room and broadcasts the new lobby state to everyone.
2. **Start Game**
   - Host triggers `start_game` once ≥6 players are present → server marks status `IN_PROGRESS` and increments round counter.
3. **Round lifecycle**
   - Host triggers `start_round` → `GameStore` picks or accepts a challenge, starts a 40s timer, and clears previous outcomes.
   - Players submit `submit_vote`; when all active players have voted, the timer shortens to 10s (or resolves immediately if already below the threshold).
   - On expiry or full-vote completion, `resolveRound` applies the vote rules and broadcasts `round_result` + `game_state`.
   - If performers exist, host calls `round_confirm_challenge_result` with pass/fail toggles to eliminate any failures and potentially end the game.
4. **Finish**
   - First non-eliminated player to reach 5 points wins; ties break by score then join order. Server emits `game_finished` and locks state at `FINISHED`.

## UI composition (top level)
- `App.tsx` wires the primary routes: home, create, join, and `/game/:code`.
- `GameScreen` inspects `SocketProvider` data to render either `HostView` or `PlayerView` with shared chrome for room code and role.
- `HostView` exposes lobby controls, round start, timer display, and performer confirmation UI.
- `PlayerView` focuses on challenge text, vote buttons, and last-outcome summaries.
- `Scoreboard` provides a consistent sorted scoreboard for both host and player views.

## State authority & synchronization
- Server: owns `GameRoom` objects, round timers, vote tallies, and applies `resolveRound` outcomes; emits authoritative snapshots via `game_state` and event-specific payloads.
- Client: holds the latest snapshot in context, re-requests state on reload via `rejoin_game`, and treats `round_started`, `vote_update`, and `round_result` as transient enrichments.

## Developer operations
- **Run backend (dev):** `npm run dev:server` (env: `PORT`, optional `CORS_ORIGIN`).
- **Run frontend (dev):** `npm run dev:frontend` (env: `VITE_WS_URL` pointing to backend).
- **Tests:** `npm test` executes scenario coverage for `resolveRound`.

This structure keeps the app easy to reason about: deterministic core rules, a small stateful server orchestrator, and a thin React shell that reflects server truth in real time.
