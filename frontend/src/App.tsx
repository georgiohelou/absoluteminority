import { Routes, Route, Navigate } from 'react-router-dom';
import { HomeScreen } from './components/HomeScreen';
import { CreateGameScreen } from './components/CreateGameScreen';
import { JoinGameScreen } from './components/JoinGameScreen';
import { GameScreen } from './components/GameScreen';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/create" element={<CreateGameScreen />} />
        <Route path="/join" element={<JoinGameScreen />} />
        <Route path="/game/:code" element={<GameScreen />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
