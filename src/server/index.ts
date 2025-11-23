import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { GameStore } from './gameStore';
import { challenges } from './challenges';
import { GameRoom } from './types';
import { GameStatus } from '../gameLogic';

const app = express();
const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (_req: any, res: any) => {
  res.json({ ok: true });
});

app.get('/challenges', (_req: any, res: any) => {
  res.json({ challenges });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin
  }
});

const store = new GameStore((room, outcome) => {
  io.to(room.state.code).emit('round_result', { outcome, state: room.state });
  io.to(room.state.code).emit('game_state', toClientRoomPayload(room));
  if (room.state.status === GameStatus.FINISHED) {
    io.to(room.state.code).emit('game_finished', { winnerId: room.state.winnerId });
  }
});

function toClientRoomPayload(room: GameRoom, playerId?: string) {
  return {
    state: room.state,
    roundContext: room.roundContext,
    lastOutcome: room.lastOutcome,
    playerId
  };
}

io.on('connection', (socket: any) => {
  socket.on('create_game', ({ nickname }: { nickname: string }) => {
    try {
      const room = store.createGame(nickname);
      socket.join(room.state.code);
      socket.emit('game_state', toClientRoomPayload(room, room.state.hostId));
    } catch (error: any) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('join_game', ({ code, nickname }: { code: string; nickname: string }) => {
    try {
      const room = store.joinGame(code, nickname);
      socket.join(room.state.code);
      const joinedPlayer = room.state.players.at(-1);
      socket.emit('game_state', toClientRoomPayload(room, joinedPlayer?.id));
      io.to(room.state.code).emit('game_state', toClientRoomPayload(room));
      io.to(room.state.code).emit('player_joined', { player: joinedPlayer });
    } catch (error: any) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('start_game', ({ code }: { code: string }) => {
    try {
      const room = store.startGame(code);
      io.to(room.state.code).emit('game_state', toClientRoomPayload(room));
    } catch (error: any) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('start_round', ({ code, challengeId }: { code: string; challengeId?: string }) => {
    try {
      const challenge = challenges.find((c) => c.id === challengeId);
      const room = store.startRound(code, challenge);
      io.to(room.state.code).emit('round_started', {
        round: room.state.round,
        challenge: room.roundContext?.challenge,
        expiresAt: room.roundContext?.expiresAt
      });
      io.to(room.state.code).emit('game_state', toClientRoomPayload(room));
    } catch (error: any) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('submit_vote', ({ code, playerId, choice }: { code: string; playerId: string; choice: 'YES' | 'NO' }) => {
    try {
      const room = store.submitVote(code, playerId, choice);
      io.to(room.state.code).emit('vote_update', { votes: room.roundContext?.votes });
    } catch (error: any) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('round_confirm_challenge_result', ({ code, performances }: { code: string; performances: Record<string, boolean> }) => {
    try {
      const room = store.applyPerformanceResults(code, performances);
      io.to(room.state.code).emit('game_state', toClientRoomPayload(room));
      if (room.state.status === GameStatus.FINISHED) {
        io.to(room.state.code).emit('game_finished', { winnerId: room.state.winnerId });
      }
    } catch (error: any) {
      socket.emit('error_message', error.message);
    }
  });

  socket.on('rejoin_game', ({ code }: { code: string }) => {
    try {
      const room = store.getRoom(code);
      if (!room) throw new Error('Game not found');
      socket.join(room.state.code);
      socket.emit('game_state', toClientRoomPayload(room));
    } catch (error: any) {
      socket.emit('error_message', error.message);
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on :${port}`);
});
