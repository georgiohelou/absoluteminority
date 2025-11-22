interface ScoreboardProps {
  players: any[];
  eliminatedLabel?: boolean;
}

export function Scoreboard({ players, eliminatedLabel }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score || a.joinOrder - b.joinOrder);
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Players</span>
        <span>Score</span>
      </div>
      <ul className="mt-2 space-y-2">
        {sorted.map((player) => (
          <li
            key={player.id}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
              player.eliminated
                ? 'border-rose-800 bg-rose-900/30 text-rose-100'
                : 'border-slate-800 bg-slate-900 text-white'
            }`}
          >
            <div>
              <p className="font-semibold">{player.name}</p>
              {eliminatedLabel && player.eliminated && <p className="text-xs text-rose-200">Eliminated</p>}
            </div>
            <span className="text-lg font-bold">{player.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
