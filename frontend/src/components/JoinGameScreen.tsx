import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../providers/SocketProvider';

export function JoinGameScreen() {
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const { emit, game, playerId, error, setError } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (game?.state?.code && game.state.code === code.toUpperCase() && playerId) {
      navigate(`/game/${game.state.code}`);
    }
  }, [code, game?.state?.code, playerId, navigate]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    emit('join_game', { nickname: nickname.trim(), code: code.trim().toUpperCase() });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Join a room</h1>
      <form onSubmit={onSubmit} className="card space-y-3">
        <label className="block text-sm text-slate-300">
          Room code
          <input
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 uppercase focus:border-cyan-500 focus:outline-none"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            minLength={4}
            maxLength={4}
            required
          />
        </label>
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
        <button type="submit" className="button-primary">Join lobby</button>
      </form>
    </main>
  );
}
