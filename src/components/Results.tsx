import { motion } from "framer-motion";
import { PlayerStats } from "@/lib/rankings";
import { getEloTier } from "@/lib/elo";
import { GameModeKey, loadProfile } from "@/lib/elo";
import RankBadge from "./RankBadge";

interface Props {
  score: number;
  total: number;
  avgTime: number;
  pointsEarned: number;
  stats: PlayerStats;
  botScore?: number;
  botWin?: boolean;
  eloChange?: number;
  mode?: GameModeKey;
  onReplay: () => void;
  onHome: () => void;
}

export default function Results({ score, total, avgTime, pointsEarned, stats, botScore, botWin, eloChange, mode, onReplay, onHome }: Props) {
  const pct = Math.round((score / total) * 100);
  const grade = pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : 'F';
  const gradeColor = pct >= 80 ? 'text-primary' : pct >= 50 ? 'text-accent' : 'text-destructive';
  const isVsBot = botScore !== undefined;
  const isTourney = mode === 'tournament';

  const profile = loadProfile();
  const currentElo = mode ? profile.elo[mode] : 1000;
  const tier = getEloTier(currentElo);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        {isVsBot && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <span className="text-5xl block mb-2">{botWin ? '🏆' : '😔'}</span>
            <p className={`text-xl font-display font-bold ${botWin ? 'text-primary' : 'text-destructive'}`}>
              {botWin ? 'You Win!' : 'Bot Wins!'}
            </p>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              You: {score} vs Bot: {botScore}
            </p>
          </motion.div>
        )}

        {isTourney && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <span className="text-5xl block mb-2">🏆</span>
            <p className="text-xl font-display font-bold text-foreground">
              Tournament: {score}W - {total - score}L
            </p>
          </motion.div>
        )}

        {!isVsBot && !isTourney && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className={`text-8xl font-display font-bold ${gradeColor} block mb-4`}
          >
            {grade}
          </motion.span>
        )}

        {!isTourney && (
          <>
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">{score} / {total}</h2>
            <p className="text-muted-foreground font-mono mb-2">Avg {avgTime.toFixed(1)}s per question</p>
          </>
        )}

        {/* Points earned */}
        {pointsEarned > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mb-3">
            <span className="inline-block px-4 py-2 rounded-full bg-accent/20 text-accent font-mono font-bold text-lg">
              +{pointsEarned} pts
            </span>
          </motion.div>
        )}

        {/* ELO change */}
        {eloChange !== undefined && eloChange !== 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-3">
            <span className={`inline-block px-3 py-1 rounded-full font-mono font-bold text-sm ${
              eloChange > 0 ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
            }`}>
              {eloChange > 0 ? '+' : ''}{eloChange} ELO
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-sm">{tier.emoji}</span>
              <span className="font-mono font-bold text-sm" style={{ color: tier.color }}>{currentElo}</span>
              <span className="text-xs text-muted-foreground font-mono">{tier.label}</span>
            </div>
          </motion.div>
        )}

        {/* Rank */}
        <div className="flex justify-center mb-8">
          <RankBadge stats={stats} />
        </div>

        <div className="flex gap-4">
          <button onClick={onReplay} className="px-8 py-3 rounded-md bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity">
            Play Again
          </button>
          <button onClick={onHome} className="px-8 py-3 rounded-md bg-secondary text-secondary-foreground font-display font-semibold hover:opacity-90 transition-opacity">
            Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
