import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../providers/SocketProvider';
import { HostView } from './HostView';
import { PlayerView } from './PlayerView';

export function GameScreen() {
  const { code } = useParams<{ code: string }>();
  const { game, playerId, emit, error } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!game && code) {
      emit('rejoin_game', { code });
    }
  }, [game, code, emit]);

  useEffect(() => {
    if (game && code && game.state.code !== code.toUpperCase()) {
      navigate(`/game/${game.state.code}`);
    }
  }, [game, code, navigate]);

  if (!game) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <p>Connecting to game...</p>
      </main>
    );
  }

  const isHost = playerId === game.state.hostId;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
        <div>
          <p className="text-xs uppercase tracking-wider text-cyan-400">Room</p>
          <p className="text-2xl font-bold tracking-widest">{game.state.code}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-slate-400">You</p>
          <p className="text-lg font-semibold text-white">{isHost ? 'Host' : 'Player'}</p>
        </div>
      </header>

      {error && <p className="rounded-xl border border-rose-500 bg-rose-900/40 px-3 py-2 text-rose-100">{error}</p>}

      {isHost ? <HostView /> : <PlayerView />}
    </main>
  );
}
