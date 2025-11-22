import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export interface ClientGameState {
  state: any;
  roundContext?: any;
  lastOutcome?: any;
  playerId?: string;
}

interface SocketContextValue {
  socket: Socket | null;
  game: ClientGameState | null;
  error: string | null;
  setError: (value: string | null) => void;
  setPlayerId: (id: string) => void;
  playerId?: string;
  emit: (event: string, payload?: any) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [game, setGame] = useState<ClientGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | undefined>(undefined);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(WS_URL, { autoConnect: true, transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect_error', (err) => setError(err.message));
    socket.on('error_message', (message) => setError(message));
    socket.on('game_state', (payload: ClientGameState) => {
      setGame(payload);
      if (payload.playerId) {
        setPlayerId(payload.playerId);
      }
    });
    socket.on('round_started', (payload) => {
      setGame((current) =>
        current
          ? {
              ...current,
              roundContext: {
                challenge: payload.challenge,
                expiresAt: payload.expiresAt,
                startedAt: Date.now(),
                votes: {}
              }
            }
          : current
      );
    });
    socket.on('vote_update', ({ votes }) => {
      setGame((current) => (current ? { ...current, roundContext: { ...current.roundContext, votes } } : current));
    });
    socket.on('round_result', ({ outcome, state }) => {
      setGame((current) =>
        current
          ? {
              ...current,
              state,
              lastOutcome: outcome,
              roundContext: undefined
            }
          : current
      );
    });
    socket.on('game_finished', ({ winnerId }) => {
      setGame((current) => (current ? { ...current, state: { ...current.state, status: 'FINISHED', winnerId } } : current));
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      game,
      error,
      setError,
      playerId,
      setPlayerId,
      emit: (event: string, payload?: any) => socketRef.current?.emit(event, payload)
    }),
    [game, error, playerId]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('Socket context missing');
  return ctx;
}
