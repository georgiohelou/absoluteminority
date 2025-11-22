import { Challenge } from './types';

export const challenges: Challenge[] = [
  { id: 'stretch', text: 'Do a 30-second wall sit.', category: 'physical', difficulty: 'medium' },
  { id: 'sing', text: 'Sing the chorus of your favorite song loudly.', category: 'fun', difficulty: 'easy' },
  { id: 'balance', text: 'Balance a book on your head and walk across the room.', category: 'silly', difficulty: 'medium' },
  { id: 'story', text: 'Tell an embarrassing two-sentence story.', category: 'social', difficulty: 'easy' },
  { id: 'dance', text: 'Do your best dance move for 10 seconds.', category: 'fun', difficulty: 'easy' },
  { id: 'math', text: 'Solve a random 4-digit addition problem without writing it down.', category: 'brain', difficulty: 'hard' }
];

export function pickChallenge(previousId?: string): Challenge {
  const available = challenges.filter((c) => c.id !== previousId);
  const pool = available.length ? available : challenges;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
