export type GameStatus = 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';
export type VoteChoice = 'YES' | 'NO';

export interface Player {
  id: string;
  name: string;
  score: number;
  eliminated: boolean;
  joinOrder: number;
}

export interface RoundOutcome {
  rule: string;
  performers: string[];
  scoreChanges: Record<string, number>;
  resetScores: boolean;
  chosenBy?: string;
  notes: string;
}

export interface GameState {
  id: string;
  code: string;
  hostId: string;
  status: GameStatus;
  players: Player[];
  round: number;
  winnerId: string | null;
}

export interface Challenge {
  id: string;
  text: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface RoundContext {
  challenge: Challenge;
  votes: Record<string, VoteChoice>;
  expiresAt: number | null;
  startedAt: number;
}

export interface GameRoom {
  state: GameState;
  roundContext?: RoundContext;
  timer?: NodeJS.Timeout;
  lastOutcome?: RoundOutcome;
}
