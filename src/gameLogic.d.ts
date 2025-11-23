export interface PlayerState {
  id: string;
  name: string;
  score: number;
  eliminated: boolean;
  joinOrder: number;
}

export interface GameState {
  id: string;
  hostId: string;
  status: string;
  players: PlayerState[];
  round: number;
  winnerId: string | null;
}

export const GameStatus: {
  LOBBY: 'LOBBY';
  IN_PROGRESS: 'IN_PROGRESS';
  FINISHED: 'FINISHED';
};

export type VoteChoice = 'YES' | 'NO';

export interface RoundOutcome {
  rule: string;
  performers: string[];
  scoreChanges: Record<string, number>;
  resetScores: boolean;
  chosenBy?: string;
  notes: string;
}

export function createGame(hostName: string): GameState;
export function joinGame(gameState: GameState, name: string): GameState;
export function startGame(gameState: GameState): GameState;
export function resolveRound(
  gameState: GameState,
  votes: Record<string, VoteChoice>,
  options?: any
): { outcome: RoundOutcome; state: GameState };
export function ensureVotes(activePlayers: PlayerState[], votes: Record<string, VoteChoice>): Record<string, VoteChoice>;
export function determineWinner(players: PlayerState[]): string | null;
