import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadProfile, PlayerProfile, GameModeKey, getEloTier } from "@/lib/elo";
import { loadBots, getLeaderboard, Bot } from "@/lib/bots";
import { RANKS, getRank, getEffectivePoints, loadStats } from "@/lib/rankings";

interface Props {
  onBack: () => void;
}

type Tab = 'overview' | 'leaderboard';
type LeaderboardMode = 'practice' | 'vsbot' | 'tournament';

export default function StatsPage({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [lbMode, setLbMode] = useState<LeaderboardMode>('vsbot');
  const [lbPage, setLbPage] = useState(0);
  const profile = loadProfile();
  const oldStats = loadStats();
  const bots = loadBots();
  const { rank, prestige } = getRank(oldStats);
  const rankInfo = RANKS[rank];

  const modes: GameModeKey[] = ['practice', 'vsbot', 'tournament'];
  const modeLabels: Record<GameModeKey, string> = { practice: 'Practice', vsbot: 'VS Bot', tournament: 'Tournament' };
  const modeEmojis: Record<GameModeKey, string> = { practice: '🎯', vsbot: '🤖', tournament: '🏆' };

  const leaderboard = getLeaderboard(bots, 'elo');
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(leaderboard.length / PAGE_SIZE);
  const displayBots = leaderboard.slice(lbPage * PAGE_SIZE, (lbPage + 1) * PAGE_SIZE);

  // Find player's rank on leaderboard
  const playerElo = profile.elo[lbMode] || 1000;
  const playerLbRank = leaderboard.filter(b => b.elo > playerElo).length + 1;

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-mono">
            ← Back
          </button>
          <h1 className="text-2xl font-display font-bold text-foreground">Stats & Leaderboard</h1>
          <div />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'leaderboard'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg font-display font-semibold text-sm transition-colors border ${
                tab === t ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {t === 'overview' ? '📊 Overview' : '🏅 Leaderboard'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Overall stats card */}
            <div className="p-5 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{rankInfo.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-lg" style={{ color: rankInfo.color }}>{rankInfo.label}</span>
                    {prestige > 0 && <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-accent/20 text-accent">P{prestige}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{oldStats.totalPoints} total pts</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox label="Games" value={oldStats.gamesPlayed} />
                <StatBox label="Accuracy" value={oldStats.questionsAnswered > 0 ? `${Math.round(oldStats.correctAnswers / oldStats.questionsAnswered * 100)}%` : '—'} />
                <StatBox label="Avg Speed" value={oldStats.questionsAnswered > 0 ? `${(oldStats.totalTimeSec / oldStats.questionsAnswered).toFixed(1)}s` : '—'} />
                <StatBox label="Bot Record" value={`${oldStats.botWins}W-${oldStats.botLosses}L`} />
              </div>
            </div>

            {/* Per-mode ELO ratings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {modes.map(mode => {
                const elo = profile.elo[mode];
                const tier = getEloTier(elo);
                const ms = profile.modeStats[mode];
                return (
                  <div key={mode} className="p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{modeEmojis[mode]}</span>
                      <span className="font-display font-semibold text-sm text-foreground">{modeLabels[mode]}</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-mono font-bold" style={{ color: tier.color }}>{elo}</span>
                      <span className="text-xs font-mono text-muted-foreground">{tier.emoji} {tier.label}</span>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground space-y-0.5">
                      <p>{ms.gamesPlayed} games · {ms.wins}W-{ms.losses}L</p>
                      <p>Accuracy: {ms.totalQuestions > 0 ? `${Math.round(ms.totalCorrect / ms.totalQuestions * 100)}%` : '—'}</p>
                      <p>Best streak: {ms.bestStreak} 🔥</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {tab === 'leaderboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Mode filter */}
            <div className="flex gap-2 mb-4">
              {(['practice', 'vsbot', 'tournament'] as LeaderboardMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => { setLbMode(m); setLbPage(0); }}
                  className={`flex-1 py-1.5 rounded text-xs font-display font-semibold transition-colors border ${
                    lbMode === m ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground'
                  }`}
                >
                  {modeEmojis[m]} {modeLabels[m]}
                </button>
              ))}
            </div>

            {/* Player position */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/30 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-primary font-bold">#{playerLbRank}</span>
                <span className="font-display font-semibold text-foreground text-sm">You</span>
              </div>
              <span className="font-mono font-bold text-primary">{playerElo}</span>
            </div>

            {/* Leaderboard table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-[3rem_1fr_4rem_4rem] bg-secondary/50 px-3 py-2 text-xs font-mono text-muted-foreground">
                <span>#</span>
                <span>Name</span>
                <span className="text-right">ELO</span>
                <span className="text-right">W/L</span>
              </div>
              {displayBots.map((bot, i) => {
                const tier = getEloTier(bot.elo);
                const globalIdx = lbPage * PAGE_SIZE + i + 1;
                return (
                  <div key={bot.id} className="grid grid-cols-[3rem_1fr_4rem_4rem] px-3 py-2 text-sm border-t border-border hover:bg-card/50 transition-colors">
                    <span className="font-mono text-muted-foreground">{globalIdx}</span>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs">{tier.emoji}</span>
                      <span className="font-mono text-foreground truncate">{bot.name}</span>
                    </div>
                    <span className="font-mono font-bold text-right" style={{ color: tier.color }}>{bot.elo}</span>
                    <span className="font-mono text-xs text-muted-foreground text-right">{bot.wins}/{bot.losses}</span>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setLbPage(p => Math.max(0, p - 1))}
                disabled={lbPage === 0}
                className="text-sm font-mono text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="text-xs font-mono text-muted-foreground">{lbPage + 1}/{totalPages}</span>
              <button
                onClick={() => setLbPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={lbPage >= totalPages - 1}
                className="text-sm font-mono text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 rounded bg-secondary/50">
      <p className="text-xs text-muted-foreground font-mono mb-1">{label}</p>
      <p className="text-lg font-mono font-bold text-foreground">{value}</p>
    </div>
  );
}
