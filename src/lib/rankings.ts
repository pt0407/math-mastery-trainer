export type Rank = 'bronze' | 'silver' | 'gold' | 'platinum';
export type Difficulty = 'easy' | 'medium' | 'hard';

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
const PRESTIGE_THRESHOLD = 3500; // points to reach platinum

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
  totalPoints: 0,
  prestige: 0,
  gamesPlayed: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  totalTimeSec: 0,
  botWins: 0,
  botLosses: 0,
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
  // Points within current prestige cycle
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
    // At platinum - progress to prestige
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

export function calculateSkillRating(stats: PlayerStats): number {
  if (stats.questionsAnswered === 0) return 0;
  const accuracy = stats.correctAnswers / stats.questionsAnswered;
  const avgSpeed = stats.totalTimeSec / stats.questionsAnswered;
  const speedScore = Math.max(0, 1 - avgSpeed / 15); // 15s = 0 score
  const botWinRate = stats.botWins + stats.botLosses > 0
    ? stats.botWins / (stats.botWins + stats.botLosses) : 0;
  // Weighted composite: 40% accuracy, 30% speed, 30% bot wins
  return Math.round((accuracy * 40 + speedScore * 30 + botWinRate * 30) * 10);
}

export function calculatePoints(score: number, total: number, avgTime: number, difficulty: Difficulty, botWin?: boolean): number {
  const diffMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2.5;
  const basePoints = score * 10 * diffMultiplier;
  const speedBonus = Math.max(0, Math.round((5 - avgTime) * 3 * score)); // bonus for <5s avg
  const botBonus = botWin ? 50 * diffMultiplier : 0;
  return Math.round(basePoints + speedBonus + botBonus);
}

export const DIFFICULTY_INFO: Record<Difficulty, { label: string; emoji: string; description: string }> = {
  easy:   { label: 'Easy',   emoji: '🟢', description: 'Smaller numbers, simpler problems' },
  medium: { label: 'Medium', emoji: '🟡', description: 'Standard difficulty' },
  hard:   { label: 'Hard',   emoji: '🔴', description: 'Larger numbers, complex problems' },
};
