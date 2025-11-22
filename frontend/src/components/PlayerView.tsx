import { useEffect, useState } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { Scoreboard } from './Scoreboard';

function useCountdown(target?: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [target]);
  const remaining = target ? Math.max(0, target - now) : 0;
  return Math.ceil(remaining / 1000);
}

export function PlayerView() {
  const { game, emit, playerId } = useSocket();
  const countdown = useCountdown(game?.roundContext?.expiresAt);

  if (!game || !playerId) return null;
  const self = game.state.players.find((p: any) => p.id === playerId);
  const hasVoted = !!game.roundContext?.votes?.[playerId];

  const handleVote = (choice: 'YES' | 'NO') => emit('submit_vote', { code: game.state.code, playerId, choice });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="card lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Status</p>
            <p className="text-xl font-semibold text-white">{game.state.status}</p>
          </div>
          {game.state.status === 'IN_PROGRESS' && game.roundContext && (
            <div className="text-right">
              <p className="text-sm text-slate-400">Time left</p>
              <p className="text-2xl font-bold text-cyan-400">{countdown}s</p>
            </div>
          )}
        </div>

        {game.state.status === 'LOBBY' && (
          <div className="rounded-xl border border-emerald-700 bg-emerald-900/30 p-4 text-emerald-100">
            Waiting for host to start the game. Share the code with friends!
          </div>
        )}

        {game.state.status === 'IN_PROGRESS' && game.roundContext && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-widest text-cyan-400">Challenge</p>
              <p className="mt-2 text-xl font-semibold text-white">{game.roundContext.challenge?.text}</p>
              <p className="mt-1 text-sm text-slate-400">Select YES or NO. You can change anytime until the timer ends.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleVote('YES')}
                className={`rounded-xl px-4 py-4 text-lg font-bold transition ${
                  game.roundContext?.votes?.[playerId] === 'YES'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                YES
              </button>
              <button
                onClick={() => handleVote('NO')}
                className={`rounded-xl px-4 py-4 text-lg font-bold transition ${
                  game.roundContext?.votes?.[playerId] === 'NO'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                NO
              </button>
            </div>
            <p className="text-sm text-slate-300">{hasVoted ? 'Vote saved. You can change it anytime.' : 'No vote yet — defaults to YES when time ends.'}</p>
          </div>
        )}

        {game.lastOutcome && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-widest text-cyan-400">Round result</p>
            <p className="text-lg font-semibold text-white">{game.lastOutcome.rule}</p>
            <p className="text-sm text-slate-300">{game.lastOutcome.notes}</p>
          </div>
        )}

        {game.state.status === 'FINISHED' && (
          <div className="rounded-xl border border-emerald-600 bg-emerald-900/40 p-4 text-emerald-100">
            Winner: {game.state.players.find((p: any) => p.id === game.state.winnerId)?.name}
          </div>
        )}
      </section>

      <aside className="card space-y-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200">
          <p className="font-semibold">You</p>
          <p className="text-lg font-bold text-white">{self?.name}</p>
          <p className="text-sm text-slate-300">Score: {self?.score}</p>
          {self?.eliminated && <p className="text-rose-300">Eliminated</p>}
        </div>
        <Scoreboard players={game.state.players} />
      </aside>
    </div>
  );
}
