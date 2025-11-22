import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../providers/SocketProvider';

export function CreateGameScreen() {
  const [nickname, setNickname] = useState('');
  const { emit, game, playerId, error, setError } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (game?.state?.code && playerId === game?.state?.hostId) {
      navigate(`/game/${game.state.code}`);
    }
  }, [game?.state?.code, playerId, game?.state?.hostId, navigate]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    emit('create_game', { nickname: nickname.trim() });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Host a new room</h1>
      <form onSubmit={onSubmit} className="card space-y-3">
        <label className="block text-sm text-slate-300">
          Nickname
          <input
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 focus:border-cyan-500 focus:outline-none"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button type="submit" className="button-primary">Start lobby</button>
      </form>
    </main>
  );
}
