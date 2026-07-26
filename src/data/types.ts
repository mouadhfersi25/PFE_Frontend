// Types (données réelles via API)
// UserDTO et types requêtes/réponses API : @/api/types

import type { QuizPlayMode } from '@/api/types';

export type { UserDTO, QuizPlayMode } from '@/api/types';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'player' | 'parent' | 'admin' | 'educator' | 'sponsor';
  age?: number;
  avatar?: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  age: number;
  avatar?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string | null;
  avatarUrl?: string | null;
  role?: string;
  etatCompte?: string;
  enabled?: boolean;
  dateDeNaissance?: string | null;
  onboardingCompleted?: boolean;
  idRegion?: number | null;
  idPays?: number | null;
  idGenre?: number | null;
  paysNom?: string;
  regionNom?: string;
  niveau?: number;
  scoreTotal?: number;
  pointsExperience?: number;
  currentStreakDays?: number;
  bestStreakDays?: number;
  lastStreakDate?: string | null;
  dateDerniereConnexion?: string | null;
  dateCreation?: string | null;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalScore: number;
  badgesEarned: number;
  currentStreak: number;
  totalSessions: number;
  weeklyPlayTime: string;
  averageSuccessRate: number;
  skills: { math: number; logic: number; memory: number; reflex: number };
}

export interface Game {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'memory' | 'logic' | 'reflex';
  modeJeu?: 'INDIVIDUEL' | 'EN_LIGNE';
  ageRange: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: string;
  durationMinutes?: number;
  quizPlayMode?: QuizPlayMode;
  quizVariant?: string;
  icon: string;
  coverImageUrl?: string;
  active?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockCondition: string;
  earned: boolean;
  earnedDate?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

export interface AdminQuestion {
  id: string;
  content: string;
  gameId: string;
  gameName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  options: string[];
  correctAnswer: number;
  createdDate: string;
  createdBy: string;
}

export interface ModerationItem {
  id: string;
  type: 'question' | 'comment' | 'report';
  content: string;
  reportedBy: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
}
