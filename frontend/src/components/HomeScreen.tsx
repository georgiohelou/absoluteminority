import { Link } from 'react-router-dom';

export function HomeScreen() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-10">
      <header className="text-center">
        <p className="text-cyan-400 font-semibold uppercase tracking-wide">Absolute Minority</p>
        <h1 className="text-4xl font-bold">Vote, dare, and outlast your friends</h1>
        <p className="mt-2 text-slate-300">Mobile-first party game for 6+ players. One host screen, everyone else joins with a code.</p>
      </header>

      <div className="card space-y-3">
        <Link to="/create" className="button-primary">
          Host a game
        </Link>
        <Link to="/join" className="button-secondary">
          Join a game
        </Link>
      </div>

      <section className="card space-y-2 text-sm text-slate-300">
        <p className="font-semibold text-white">How it works</p>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Host creates a room and shares the 4-letter code.</li>
          <li>At least 6 players join and vote YES/NO on each dare.</li>
          <li>Scores, eliminations, and winners are handled automatically.</li>
        </ol>
      </section>
    </main>
  );
}
