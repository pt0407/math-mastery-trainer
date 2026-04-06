import { motion } from "framer-motion";
import { Difficulty } from "@/lib/rankings";
import RankBadge from "./RankBadge";
import { PlayerStats } from "@/lib/rankings";

interface Props {
  score: number;
  total: number;
  avgTime: number;
  pointsEarned: number;
  stats: PlayerStats;
  botScore?: number;
  botWin?: boolean;
  onReplay: () => void;
  onHome: () => void;
}

export default function Results({ score, total, avgTime, pointsEarned, stats, botScore, botWin, onReplay, onHome }: Props) {
  const pct = Math.round((score / total) * 100);
  const grade = pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : 'F';
  const gradeColor = pct >= 80 ? 'text-primary' : pct >= 50 ? 'text-accent' : 'text-destructive';
  const isVsBot = botScore !== undefined;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        {isVsBot && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <span className="text-5xl block mb-2">{botWin ? '🏆' : '😔'}</span>
            <p className={`text-xl font-display font-bold ${botWin ? 'text-primary' : 'text-destructive'}`}>
              {botWin ? 'You Win!' : 'Bot Wins!'}
            </p>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              You: {score} vs Bot: {botScore}
            </p>
          </motion.div>
        )}

        {!isVsBot && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className={`text-8xl font-display font-bold ${gradeColor} block mb-4`}
          >
            {grade}
          </motion.span>
        )}

        <h2 className="text-3xl font-display font-bold text-foreground mb-2">
          {score} / {total}
        </h2>
        <p className="text-muted-foreground font-mono mb-2">
          Avg {avgTime.toFixed(1)}s per question
        </p>

        {/* Points earned */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-accent/20 text-accent font-mono font-bold text-lg">
            +{pointsEarned} pts
          </span>
        </motion.div>

        {/* Rank */}
        <div className="flex justify-center mb-8">
          <RankBadge stats={stats} />
        </div>

        <div className="flex gap-4">
          <button
            onClick={onReplay}
            className="px-8 py-3 rounded-md bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity"
          >
            Play Again
          </button>
          <button
            onClick={onHome}
            className="px-8 py-3 rounded-md bg-secondary text-secondary-foreground font-display font-semibold hover:opacity-90 transition-opacity"
          >
            Subjects
          </button>
        </div>
      </motion.div>
    </div>
  );
}
