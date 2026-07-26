/**
 * Pont entre le store auth (backend) et le contexte Auth des pages jeu.
 * Fournit useAuth() aux pages admin/player/educator/parent.
 */
import React, { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import { AuthContext as StoreAuthContext } from '@/store/auth/AuthContext';
import type { User, PlayerProfile } from '@/data/types';
import userApi from '@/api/user/user.api';

interface AuthContextType {
  user: User | null;
  playerProfile: PlayerProfile | null;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updatePlayerProfile: (updates: Partial<PlayerProfile>) => void;
}

const EduGameAuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoreUserWithFallback(storeUser: { email?: string; role?: string } | null): { email: string; role: string } | null {
  const email = storeUser?.email ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_email') : null);
  const role = storeUser?.role ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_role') : null);
  if (!email) return null;
  return { email, role: role || '' };
}

function mapStoreUserToEduGameUser(storeUser: { email?: string; role?: string } | null): User | null {
  const auth = getStoreUserWithFallback(storeUser);
  if (!auth) return null;
  const role = (auth.role || '').toUpperCase();
  const roleMap: Record<string, User['role']> = {
    JOUEUR: 'player',
    PARENT: 'parent',
    EDUCATEUR: 'educator',
    ADMIN: 'admin',
    SPONSOR: 'sponsor',
  };
  return {
    id: '1',
    name: auth.email.split('@')[0] || 'User',
    email: auth.email,
    role: roleMap[role] || 'player',
  };
}

function getLocalProfileFallback() {
  if (typeof localStorage === 'undefined') {
    return { paysNom: '', regionNom: '', avatar: '' };
  }
  return {
    paysNom: localStorage.getItem('player_pays_nom') || '',
    regionNom: localStorage.getItem('player_region_nom') || '',
    avatar: localStorage.getItem('player_avatar') || '',
  };
}

function computeAgeFromDateOfBirth(value?: string | null): number | null {
  if (!value) return null;
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function fallbackXpToNextLevel(levelRaw?: number | null): number {
  const level = Math.max(1, levelRaw ?? 1);
  return Math.max(250, (level * 150) + (level * level * 55));
}

export function EduGameAuthBridge({ children }: { children: ReactNode }) {
  const storeAuth = useContext(StoreAuthContext);
  const user = useMemo(() => mapStoreUserToEduGameUser(storeAuth?.user ?? null), [storeAuth?.user]);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);

  const refreshUser = async () => {
    if (!user || user.role !== 'player') return;
    try {
      const { data } = await userApi.getMe();
      const u = data as any;
      const localFallback = getLocalProfileFallback();
      const fullName = [u.prenom, u.nom].filter(Boolean).join(' ').trim();
      const computedAge = computeAgeFromDateOfBirth(u.dateDeNaissance);

      setPlayerProfile((prev) => ({
        ...prev!,
        id: u.id || user.id,
        name: fullName || u.name || user.name,
        age: u.age || computedAge || 12,
        avatar: u.avatarUrl || u.avatar || localFallback.avatar || '👦',
        nom: u.nom || '',
        prenom: u.prenom || '',
        email: u.email || user.email,
        telephone: u.telephone ?? null,
        avatarUrl: u.avatarUrl ?? null,
        role: u.role || '',
        etatCompte: u.etatCompte || '',
        enabled: Boolean(u.enabled),
        dateDeNaissance: u.dateDeNaissance ?? null,
        onboardingCompleted: u.onboardingCompleted,
        idRegion: u.idRegion ?? null,
        idPays: u.idPays ?? null,
        idGenre: u.idGenre ?? null,
        paysNom: u.paysNom || localFallback.paysNom || '',
        regionNom: u.regionNom || localFallback.regionNom || '',
        niveau: u.niveau || 1,
        scoreTotal: u.scoreTotal || 0,
        pointsExperience: u.pointsExperience || 0,
        currentStreakDays: typeof u.currentStreakDays === 'number' ? u.currentStreakDays : 0,
        bestStreakDays: typeof u.bestStreakDays === 'number' ? u.bestStreakDays : 0,
        lastStreakDate: u.lastStreakDate ?? null,
        dateDerniereConnexion: u.dateDerniereConnexion ?? null,
        dateCreation: u.dateCreation ?? null,
        level: u.niveau || 1,
        xp: u.pointsExperience || 0,
        xpToNextLevel:
          typeof u.xpToNextLevel === 'number' && u.xpToNextLevel > 0
            ? u.xpToNextLevel
            : fallbackXpToNextLevel(u.niveau || 1),
        totalScore: u.scoreTotal || 0,
        badgesEarned: 0,
        currentStreak: typeof u.currentStreakDays === 'number' ? u.currentStreakDays : 0,
        totalSessions: 0,
        weeklyPlayTime: '0 min',
        averageSuccessRate: 0,
        skills: { math: 0, logic: 0, memory: 0, reflex: 0 },
      }));
    } catch (err) {
      console.error("Failed to refresh user", err);
    }
  };

  // Initialiser un profil joueur par défaut dès qu'un user JOUEUR est connecté
  useEffect(() => {
    if (!user || user.role !== 'player') {
      setPlayerProfile(null);
      return;
    }
    refreshUser();
  }, [user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      playerProfile,
      login: () => {},
      logout: () => storeAuth?.logout?.(),
      refreshUser,
      updatePlayerProfile: (updates) =>
        setPlayerProfile((prev) => (prev ? { ...prev, ...updates } : prev)),
    }),
    [user, playerProfile, storeAuth]
  );

  return (
    <EduGameAuthContext.Provider value={value}>
      {children}
    </EduGameAuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(EduGameAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within EduGameAuthBridge');
  }
  return context;
}
