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

export function HostView() {
  const { game, emit } = useSocket();
  const countdown = useCountdown(game?.roundContext?.expiresAt);
  const [performances, setPerformances] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setPerformances({});
  }, [game?.roundContext, game?.lastOutcome]);

  if (!game) return null;

  const activePlayers = game.state.players.filter((p: any) => !p.eliminated);

  const outcomePerformers = game.lastOutcome?.performers || [];
  const unresolvedPerformances = outcomePerformers.filter((id: string) => performances[id] === undefined);

  const handleStartGame = () => emit('start_game', { code: game.state.code });
  const handleStartRound = () => emit('start_round', { code: game.state.code });
  const handleFinalizePerformances = () => emit('round_confirm_challenge_result', { code: game.state.code, performances });

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
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Share this code with players and start when ready.</p>
            <button onClick={handleStartGame} className="button-primary" disabled={activePlayers.length < 6}>
              Start game ({activePlayers.length}/6)
            </button>
          </div>
        )}

        {game.state.status === 'IN_PROGRESS' && (
          <div className="space-y-4">
            {!game.roundContext && (
              <button onClick={handleStartRound} className="button-primary">
                Start next round
              </button>
            )}

            {game.roundContext && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-widest text-cyan-400">Challenge</p>
                <p className="mt-2 text-xl font-semibold text-white">{game.roundContext.challenge?.text}</p>
                <p className="mt-1 text-sm text-slate-400">Vote YES or NO. Defaults to YES if idle.</p>
              </div>
            )}

            {game.lastOutcome && (
              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-widest text-cyan-400">Round result</p>
                <p className="text-lg font-semibold text-white">{game.lastOutcome.rule}</p>
                <p className="text-sm text-slate-300">{game.lastOutcome.notes}</p>
                {game.lastOutcome.performers.length > 0 && (
                  <div className="space-y-1 text-sm text-slate-200">
                    <p className="font-semibold">Performers</p>
                    <div className="flex flex-wrap gap-2">
                      {game.lastOutcome.performers.map((id: string) => {
                        const player = game.state.players.find((p: any) => p.id === id);
                        const verdict = performances[id];
                        return (
                          <button
                            key={id}
                            onClick={() =>
                              setPerformances((prev) => ({
                                ...prev,
                                [id]: verdict === false ? true : verdict === true ? undefined : false
                              }))
                            }
                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                              verdict === false
                                ? 'bg-rose-600 text-white'
                                : verdict === true
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 text-slate-200'
                            }`}
                          >
                            {player?.name}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-400">Tap performers to mark failures before continuing.</p>
                    <button
                      onClick={handleFinalizePerformances}
                      disabled={unresolvedPerformances.length === 0}
                      className="button-secondary"
                    >
                      Confirm performance results
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {game.state.status === 'FINISHED' && (
          <div className="rounded-xl border border-emerald-600 bg-emerald-900/40 p-4">
            <p className="text-xs uppercase tracking-widest text-emerald-400">Winner</p>
            <p className="text-2xl font-bold text-white">
              {game.state.players.find((p: any) => p.id === game.state.winnerId)?.name}
            </p>
            <p className="text-sm text-emerald-100">Assign a collective punishment to everyone else!</p>
          </div>
        )}
      </section>

      <aside className="card space-y-3">
        <Scoreboard players={game.state.players} eliminatedLabel />
      </aside>
    </div>
  );
}
