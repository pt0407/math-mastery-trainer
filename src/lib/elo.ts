export type GameModeKey = 'practice' | 'vsbot' | 'tournament';

export interface EloRatings {
  practice: number;
  vsbot: number;
  tournament: number;
}

export interface ModeStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalCorrect: number;
  totalQuestions: number;
  totalTimeSec: number;
  currentStreak: number;
  bestStreak: number;
}

export interface PlayerProfile {
  elo: EloRatings;
  modeStats: Record<GameModeKey, ModeStats>;
  overallGames: number;
  totalPoints: number;
  prestige: number;
}

const DEFAULT_MODE_STATS: ModeStats = {
  gamesPlayed: 0, wins: 0, losses: 0,
  totalCorrect: 0, totalQuestions: 0, totalTimeSec: 0,
  currentStreak: 0, bestStreak: 0,
};

const DEFAULT_PROFILE: PlayerProfile = {
  elo: { practice: 1000, vsbot: 1000, tournament: 1000 },
  modeStats: {
    practice: { ...DEFAULT_MODE_STATS },
    vsbot: { ...DEFAULT_MODE_STATS },
    tournament: { ...DEFAULT_MODE_STATS },
  },
  overallGames: 0,
  totalPoints: 0,
  prestige: 0,
};

const STORAGE_KEY = 'mathsprint_profile';

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        elo: { ...DEFAULT_PROFILE.elo, ...parsed.elo },
        modeStats: {
          practice: { ...DEFAULT_MODE_STATS, ...parsed.modeStats?.practice },
          vsbot: { ...DEFAULT_MODE_STATS, ...parsed.modeStats?.vsbot },
          tournament: { ...DEFAULT_MODE_STATS, ...parsed.modeStats?.tournament },
        },
      };
    }
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
}

export function saveProfile(p: PlayerProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// ELO calculation
const K_BASE = 32;

export function calculateEloChange(
  playerElo: number,
  opponentElo: number,
  won: boolean,
  performanceMultiplier = 1 // based on speed/accuracy
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actual = won ? 1 : 0;
  const k = K_BASE * performanceMultiplier;
  return Math.round(k * (actual - expected));
}

export function getPerformanceMultiplier(
  accuracy: number, // 0-1
  avgTimeSec: number,
): number {
  // Speed factor: faster = higher multiplier (max 1.5 at <2s, min 0.5 at >10s)
  const speedFactor = Math.max(0.5, Math.min(1.5, 1.5 - (avgTimeSec - 2) * 0.125));
  // Accuracy factor: 1.0 at 100%, 0.3 at 0%
  const accFactor = 0.3 + accuracy * 0.7;
  return speedFactor * accFactor;
}

export function getEloTier(elo: number): { label: string; emoji: string; color: string } {
  if (elo < 600) return { label: 'Beginner', emoji: '🌱', color: 'hsl(120 40% 45%)' };
  if (elo < 800) return { label: 'Novice', emoji: '🥉', color: 'hsl(30 60% 50%)' };
  if (elo < 1000) return { label: 'Apprentice', emoji: '⚔️', color: 'hsl(220 10% 70%)' };
  if (elo < 1200) return { label: 'Skilled', emoji: '🥈', color: 'hsl(220 30% 75%)' };
  if (elo < 1500) return { label: 'Expert', emoji: '🥇', color: 'hsl(45 90% 55%)' };
  if (elo < 1800) return { label: 'Master', emoji: '💎', color: 'hsl(200 80% 65%)' };
  if (elo < 2200) return { label: 'Grandmaster', emoji: '👑', color: 'hsl(280 70% 60%)' };
  return { label: 'Legend', emoji: '🏆', color: 'hsl(0 80% 55%)' };
}
