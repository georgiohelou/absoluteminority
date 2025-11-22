# Absolute Minority – Functional & Technical Specification v1

## 1. Product overview
### 1.1 Concept
Absolute Minority is a mobile-first party game where players vote **YES** or **NO** on dares. Votes determine who performs the dare, who gains points, who gets eliminated, and whether scores reset. The first player to reach 5 points wins and assigns a collective punishment to the losers.

Version 1 is web-only, with one phone acting as the host screen and all other players using a minimal controller UI. No voluntary card or bonus mechanics are included in v1.

## 2. Game rules (authoritative logic)
### 2.1 Basic structure
- Each game has one host player (creator) and at least 6 players in total.
- Games are played in rounds:
  1. A challenge (dare) is shown.
  2. All non-eliminated players vote **YES** or **NO**.
  3. After the timer, the vote is resolved according to the rules below.
  4. Points, eliminations, and resets are applied.
- The first player to reach 5 points wins.

### 2.2 Voting phase
- A round starts with a selected challenge and a 40-second timer.
- Each active player (not eliminated) can vote **YES** or **NO** and may change their vote until the timer ends.
- If all active players have voted before 40 seconds, the timer is reduced to 10 seconds remaining (minimum: if less than 10 seconds remain, keep current remaining).
- If a player does not vote by the end of the timer, their vote defaults to **YES**.

### 2.3 Resolution rules (no voluntary card)
Let:
- **Y** = number of YES votes
- **N** = number of NO votes
- **T** = Y + N (total active voters this round)

**Case A: Majority YES (Y > N, not 100%)**
- No points awarded by default.
- One YES voter is chosen at random (uniform) to perform the challenge.
- After performing, if the group validates completion, nothing else happens. If not validated, that player is eliminated.
- Minority NO voters cannot be selected for the challenge.

**Case B: Majority NO (N > Y, not 100%)**
- All YES voters gain +1 point.
- No one performs the challenge.

**Case C: 100% NO (Y = 0, N = T)**
- Full reset: all active players' scores reset to 0.
- No challenge is performed.

**Case D: 100% YES (Y = T, N = 0)**
- Everyone performs the challenge.
- For each player: validated performance → stay; failed performance → eliminated.

**Case E: Exactly one NO (Y = T-1, N = 1)**
- Majority YES scenario.
- The single NO voter chooses which YES voter must do the challenge.
- The chosen YES voter performs the challenge; failure eliminates them.

**Case F: Exactly one YES (Y = 1, N = T-1)**
- Majority NO scenario.
- The single YES voter gains +2 points.

**Case G: Perfect tie (Y = N)**
- Randomly pick one player among all voters (YES + NO).
- If the picked player voted YES, they perform the challenge.
- If the picked player voted NO, they choose one YES voter who gains +1 point.
- No one performs the challenge unless the random pick is a YES voter.

### 2.4 End of game
- After each round, check if any player has reached 5 points.
- If multiple players cross 5 in the same round, the highest score wins. If still tied, the player with earliest join order (or earliest to reach the score) wins.
- When a winner is decided, set game state to **FINISHED**, show winner screen with winner name, final scoreboard, and flavor text that the winner gives a gage to losers (no enforcement logic).

## 3. Tech stack
### 3.1 Frontend
- Language: TypeScript
- Framework: React
- Build tool: Vite
- Styling: Tailwind CSS
- Runtime target: mobile browsers (responsive)
- Features: SPA, PWA-ready (manifest + service worker), WebSocket client (socket.io-client)

### 3.2 Backend
- Language: TypeScript
- Runtime: Node.js
- HTTP framework: Express or Fastify
- WebSocket: Socket.IO server
- ORM: Prisma
- Database: PostgreSQL
- Optional: Redis for in-memory state (room / round / timer) if scaling

## 4. High-level architecture
- **Frontend (Vercel):** serves the SPA and communicates with backend via REST (for health and optional /challenges) and WebSockets for game actions.
- **Backend (Railway or similar):** HTTP + WebSocket servers, reads/writes persistent data from Postgres, stores ephemeral game state in memory or Redis.
- **Database (Postgres):** stores players, games, rounds, and challenges.

## 5. Data model (Prisma-style)
Key models:
- **Game** with status enum (LOBBY, IN_PROGRESS, FINISHED), code, host reference, winner reference, rounds, and players.
- **Player** with nickname, join order, score, eliminated flag, and game reference.
- **Round** with game reference, sequence index, current challenge, timer/expiry timestamps, resolution status, and votes.
- **Vote** with player reference, choice enum (**YES**/**NO**), timestamps, and whether the vote was defaulted.
- **Challenge** with text and optional metadata.

Key enums:
- **GameStatus** = LOBBY | IN_PROGRESS | FINISHED
- **VoteChoice** = YES | NO
- **RoundResolution** = PENDING | CHALLENGE_PERFORMED | POINTS_AWARDED | SCORES_RESET | ELIMINATIONS | FINISHED

## 6. Backend API design
- Minimal REST endpoints: `/health`, `/challenges` (optional), `/debug/reset` (optional).
- Most game logic over Socket.IO.

## 7. Socket.IO events
**Client → Server:**
- `create_game`
- `join_game`
- `start_game`
- `start_round`
- `submit_vote`
- `round_confirm_challenge_result`
- `rejoin_game` (for reconnect)

**Server → Client:**
- `game_state`
- `player_joined`
- `round_started`
- `round_timer_shortened`
- `vote_update` (optional)
- `round_result`
- `game_finished`

## 8. Frontend UX & structure
Routes:
- `/` — home screen to create or join.
- `/create` — nickname form, then host view.
- `/join` — nickname + code, then player view.
- `/game/:code` — main game screen; layout depends on `isHost` flag.

Main components:
- `App`
- `SocketProvider`
- `HomeScreen`
- `CreateGameScreen`
- `JoinGameScreen`
- `GameScreen`
- `HostView` (Lobby, Round, Result, Finished)
- `PlayerView` (Lobby, Vote, Result, Finished)

## 9. Game state machine
- **LOBBY → IN_PROGRESS → FINISHED**
- Within **IN_PROGRESS**: rounds flow **ROUND_ACTIVE → ROUND_RESOLVED → ROUND_FINALIZED →** next round or **FINISHED**.

## 10. Hosting & deployment
- **Backend on Railway:** start with `npx prisma migrate deploy && node dist/index.js`; environment vars: `DATABASE_URL`, `PORT`, `CORS_ORIGIN`.
- **Frontend on Vercel:** environment vars: `VITE_API_URL`, `VITE_WS_URL`.
- Domains: `absoluteminority.app` (frontend) and `api.absoluteminority.app` (backend).
