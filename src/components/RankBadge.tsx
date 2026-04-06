import { motion } from "framer-motion";
import { getRank, getNextRankProgress, calculateSkillRating, PlayerStats, RANKS } from "@/lib/rankings";

interface Props {
  stats: PlayerStats;
  compact?: boolean;
}

export default function RankBadge({ stats, compact }: Props) {
  const { rank, prestige } = getRank(stats);
  const info = RANKS[rank];
  const progress = getNextRankProgress(stats);
  const skill = calculateSkillRating(stats);
  const pct = progress.needed > 0 ? Math.min(100, (progress.current / progress.needed) * 100) : 100;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <span>{info.emoji}</span>
        <span className="font-display font-semibold" style={{ color: info.color }}>{info.label}</span>
        {prestige > 0 && (
          <span className="text-xs font-mono text-accent">P{prestige}</span>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg bg-card border border-border w-full max-w-xs"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{info.emoji}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg" style={{ color: info.color }}>{info.label}</span>
            {prestige > 0 && (
              <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-accent/20 text-accent">
                P{prestige}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-mono">Skill: {skill}</span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: info.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground font-mono">{progress.current} pts</span>
        <span className="text-xs text-muted-foreground font-mono">
          {progress.nextRank ? `${RANKS[progress.nextRank].emoji} ${progress.needed}` : 'Prestige →'}
        </span>
      </div>
    </motion.div>
  );
}
