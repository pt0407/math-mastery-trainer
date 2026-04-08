export type Rank = 'bronze' | 'silver' | 'gold' | 'platinum';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export interface RankInfo {
  label: string;
  emoji: string;
  color: string;
  minPoints: number;
}

export const RANKS: Record<Rank, RankInfo> = {
  bronze:   { label: 'Bronze',   emoji: '🥉', color: 'hsl(30 60% 50%)',   minPoints: 0 },
  silver:   { label: 'Silver',   emoji: '🥈', color: 'hsl(220 10% 70%)',  minPoints: 500 },
  gold:     { label: 'Gold',     emoji: '🥇', color: 'hsl(45 90% 55%)',   minPoints: 1500 },
  platinum: { label: 'Platinum', emoji: '💎', color: 'hsl(200 80% 65%)',  minPoints: 3500 },
};

export const RANK_ORDER: Rank[] = ['bronze', 'silver', 'gold', 'platinum'];
const PRESTIGE_THRESHOLD = 3500;

export interface PlayerStats {
  totalPoints: number;
  prestige: number;
  gamesPlayed: number;
  questionsAnswered: number;
  correctAnswers: number;
  totalTimeSec: number;
  botWins: number;
  botLosses: number;
}

const DEFAULT_STATS: PlayerStats = {
  totalPoints: 0, prestige: 0, gamesPlayed: 0,
  questionsAnswered: 0, correctAnswers: 0, totalTimeSec: 0,
  botWins: 0, botLosses: 0,
};

const STORAGE_KEY = 'mathsprint_stats';

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_STATS };
}

export function saveStats(stats: PlayerStats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function getEffectivePoints(stats: PlayerStats): number {
  return stats.totalPoints - stats.prestige * PRESTIGE_THRESHOLD;
}

export function getRank(stats: PlayerStats): { rank: Rank; prestige: number } {
  const pts = getEffectivePoints(stats);
  let rank: Rank = 'bronze';
  for (const r of RANK_ORDER) {
    if (pts >= RANKS[r].minPoints) rank = r;
  }
  return { rank, prestige: stats.prestige };
}

export function getNextRankProgress(stats: PlayerStats): { current: number; needed: number; nextRank: Rank | null } {
  const pts = getEffectivePoints(stats);
  const { rank } = getRank(stats);
  const idx = RANK_ORDER.indexOf(rank);
  if (idx >= RANK_ORDER.length - 1) {
    return { current: pts, needed: PRESTIGE_THRESHOLD, nextRank: null };
  }
  const next = RANK_ORDER[idx + 1];
  return { current: pts - RANKS[rank].minPoints, needed: RANKS[next].minPoints - RANKS[rank].minPoints, nextRank: next };
}

export function checkPrestige(stats: PlayerStats): PlayerStats {
  const pts = getEffectivePoints(stats);
  if (pts >= PRESTIGE_THRESHOLD) {
    return { ...stats, prestige: stats.prestige + 1 };
  }
  return stats;
}

export function calculatePoints(score: number, total: number, avgTime: number, difficulty: Difficulty, botWin?: boolean): number {
  const diffMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : difficulty === 'hard' ? 2.5 : 4;
  const basePoints = score * 10 * diffMultiplier;
  const speedBonus = Math.max(0, Math.round((5 - avgTime) * 3 * score));
  const botBonus = botWin ? 50 * diffMultiplier : 0;
  return Math.round(basePoints + speedBonus + botBonus);
}

export const DIFFICULTY_INFO: Record<Difficulty, { label: string; emoji: string; description: string }> = {
  easy:    { label: 'Easy',    emoji: '🟢', description: 'Smaller numbers, simpler problems' },
  medium:  { label: 'Medium',  emoji: '🟡', description: 'Standard difficulty' },
  hard:    { label: 'Hard',    emoji: '🔴', description: 'Larger numbers, complex problems' },
  extreme: { label: 'Extreme', emoji: '💀', description: 'Maximum difficulty, brutal numbers' },
};
