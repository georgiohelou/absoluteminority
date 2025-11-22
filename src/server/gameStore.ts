import { createGame, joinGame as joinGameCore, startGame as startGameCore, resolveRound, GameStatus } from '../gameLogic';
import { Challenge, GameRoom, GameState, Player, RoundOutcome, VoteChoice } from './types';
import { pickChallenge } from './challenges';

const ROUND_DURATION_MS = 40_000;

function generateCode(): string {
  const letters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i += 1) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

function mapStateWithCode(state: any, code: string): GameState {
  return { ...state, code };
}

export class GameStore {
  private games: Map<string, GameRoom> = new Map();

  constructor(private onRoundResolved?: (room: GameRoom, outcome: RoundOutcome) => void) {}

  createGame(hostName: string): GameRoom {
    const baseState = createGame(hostName);
    const code = generateCode();
    const room: GameRoom = {
      state: mapStateWithCode(baseState, code)
    };
    this.games.set(code, room);
    return room;
  }

  getRoom(code: string): GameRoom | undefined {
    return this.games.get(code.toUpperCase());
  }

  joinGame(code: string, name: string): GameRoom {
    const room = this.requireRoom(code);
    room.state = mapStateWithCode(joinGameCore(room.state, name), room.state.code);
    this.games.set(room.state.code, room);
    return room;
  }

  startGame(code: string): GameRoom {
    const room = this.requireRoom(code);
    room.state = mapStateWithCode(startGameCore(room.state), room.state.code);
    this.games.set(room.state.code, room);
    return room;
  }

  startRound(code: string, challenge?: Challenge): GameRoom {
    const room = this.requireRoom(code);
    if (room.state.status !== GameStatus.IN_PROGRESS) {
      throw new Error('Game must be in progress to start a round');
    }

    const picked = challenge || pickChallenge(room.roundContext?.challenge.id);
    const now = Date.now();
    const expiresAt = now + ROUND_DURATION_MS;

    if (room.timer) {
      clearTimeout(room.timer);
    }

    room.roundContext = {
      challenge: picked,
      votes: {},
      startedAt: now,
      expiresAt
    };
    room.lastOutcome = undefined;

    room.timer = setTimeout(() => {
      const result = this.finalizeRound(room.state.code);
      if (result && this.onRoundResolved) {
        this.onRoundResolved(result.room, result.outcome);
      }
    }, ROUND_DURATION_MS);

    this.games.set(room.state.code, room);
    return room;
  }

  submitVote(code: string, playerId: string, choice: VoteChoice): GameRoom {
    const room = this.requireRoom(code);
    if (!room.roundContext) {
      throw new Error('Round not active');
    }
    room.roundContext.votes[playerId] = choice;
    const activePlayers = room.state.players.filter((p) => !p.eliminated);
    const votesCount = Object.keys(room.roundContext.votes).length;

    const remainingMs = (room.roundContext.expiresAt || Date.now()) - Date.now();
    if (votesCount === activePlayers.length && remainingMs > 10_000) {
      room.roundContext.expiresAt = Date.now() + 10_000;
      if (room.timer) {
        clearTimeout(room.timer);
      }
      room.timer = setTimeout(() => {
        const result = this.finalizeRound(room.state.code);
        if (result && this.onRoundResolved) {
          this.onRoundResolved(result.room, result.outcome);
        }
      }, 10_000);
    }

    // Immediate resolution if everyone has voted and timer already below threshold
    if (votesCount === activePlayers.length && remainingMs <= 10_000) {
      if (room.timer) {
        clearTimeout(room.timer);
      }
      const result = this.finalizeRound(room.state.code);
      if (result && this.onRoundResolved) {
        this.onRoundResolved(result.room, result.outcome);
      }
    }

    this.games.set(room.state.code, room);
    return room;
  }

  finalizeRound(code: string, performanceResults: Record<string, boolean | undefined> = {}): { room: GameRoom; outcome: RoundOutcome } | null {
    const room = this.requireRoom(code);
    if (!room.roundContext) {
      return null;
    }
    const votes = room.roundContext.votes;
    const { state, outcome } = resolveRound(room.state, votes, { performanceResults });
    room.state = mapStateWithCode(state, room.state.code);
    room.roundContext = undefined;
    room.lastOutcome = outcome;
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = undefined;
    }
    this.games.set(room.state.code, room);
    return { room, outcome };
  }

  applyPerformanceResults(code: string, performances: Record<string, boolean>): GameRoom {
    const room = this.requireRoom(code);
    if (!room.lastOutcome) {
      return room;
    }
    room.state.players = room.state.players.map((player: Player) => {
      if (room.lastOutcome?.performers.includes(player.id) && performances[player.id] === false) {
        return { ...player, eliminated: true };
      }
      return player;
    });

    const winnerId = room.state.players
      .filter((p) => !p.eliminated && p.score >= 5)
      .sort((a, b) => {
        if (b.score === a.score) return a.joinOrder - b.joinOrder;
        return b.score - a.score;
      })[0]?.id;

    if (winnerId) {
      room.state = { ...room.state, status: GameStatus.FINISHED, winnerId } as GameState;
    }

    this.games.set(room.state.code, room);
    return room;
  }

  private requireRoom(code: string): GameRoom {
    const room = this.getRoom(code);
    if (!room) {
      throw new Error('Game not found');
    }
    return room;
  }
}
