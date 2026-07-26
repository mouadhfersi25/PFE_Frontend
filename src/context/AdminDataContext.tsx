import { createContext, useContext, useState, ReactNode } from 'react';
import type { Game, Badge, QuizQuestion, AdminQuestion } from '@/data/types';

interface LogicPuzzle {
  id: number;
  question: string;
  pattern: number[];
  answer: number;
  hint: string;
}

type GameConfig =
  | { type: 'quiz'; questions: QuizQuestion[] }
  | { type: 'memory'; pairs: string[] }
  | { type: 'logic'; puzzles: LogicPuzzle[] }
  | { type: 'reflex'; rounds: number };

interface AdminDataContextType {
  games: Game[];
  setGames: React.Dispatch<React.SetStateAction<Game[]>>;
  badges: Badge[];
  setBadges: React.Dispatch<React.SetStateAction<Badge[]>>;
  gameConfigs: Record<string, GameConfig>;
  setGameConfigs: React.Dispatch<React.SetStateAction<Record<string, GameConfig>>>;
  educatorQuestions: AdminQuestion[];
  setEducatorQuestions: React.Dispatch<React.SetStateAction<AdminQuestion[]>>;
}

const defaultConfigs: Record<string, GameConfig> = {
  'quiz-1': {
    type: 'quiz',
    questions: [
      { id: 'q1', question: 'What is 15 × 8?', options: ['110', '120', '130', '140'], correctAnswer: 1, explanation: '15 × 8 = 120', points: 10 },
      { id: 'q2', question: 'Which number is prime?', options: ['15', '21', '23', '27'], correctAnswer: 2, explanation: '23 is prime', points: 15 },
    ],
  },
  'quiz-2': { type: 'quiz', questions: [] },
  'memory-1': { type: 'memory', pairs: ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎹'] },
  'memory-2': { type: 'memory', pairs: ['🦁', '🐘', '🐼', '🦊', '🐸', '🐙', '🦋', '🐢'] },
  'logic-1': {
    type: 'logic',
    puzzles: [
      { id: 1, question: 'What number comes next?', pattern: [2, 4, 8, 16, 32], answer: 64, hint: 'Each number is double the previous' },
      { id: 2, question: 'Complete the sequence:', pattern: [1, 4, 9, 16, 25], answer: 36, hint: 'Perfect squares' },
    ],
  },
  'reflex-1': { type: 'reflex', rounds: 10 },
};

const AdminDataContext = createContext<AdminDataContextType | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [gameConfigs, setGameConfigs] = useState<Record<string, GameConfig>>(defaultConfigs);
  const [educatorQuestions, setEducatorQuestions] = useState<AdminQuestion[]>([]);

  return (
    <AdminDataContext.Provider value={{ games, setGames, badges, setBadges, gameConfigs, setGameConfigs, educatorQuestions, setEducatorQuestions }}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used within AdminDataProvider');
  return ctx;
}
