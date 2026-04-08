import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Subject, subjectInfo } from "@/lib/questions";
import { Difficulty, DIFFICULTY_INFO, loadStats } from "@/lib/rankings";
import { loadProfile, getEloTier } from "@/lib/elo";
import RankBadge from "./RankBadge";

export type GameMode = 'practice' | 'vsbot' | 'stepbystep' | 'tournament';

interface Props {
  onStart: (subject: Subject, difficulty: Difficulty, mode: GameMode) => void;
  onStats: () => void;
  onLogout?: () => void;
  username?: string;
}

const subjects: Subject[] = ['basic', 'algebra', 'algebra2', 'geometry', 'chemistry'];
const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'extreme'];
const modes: { key: GameMode; label: string; emoji: string; desc: string }[] = [
  { key: 'practice', label: 'Practice', emoji: '🎯', desc: 'Solo rounds for points' },
  { key: 'vsbot', label: 'VS Bot', emoji: '🤖', desc: 'Race against AI' },
  { key: 'tournament', label: 'Tournament', emoji: '🏆', desc: 'Bracket competition' },
  { key: 'stepbystep', label: 'Step-by-Step', emoji: '📝', desc: 'Learn the process' },
];

export default function SubjectSelect({ onStart, onStats, onLogout, username }: Props) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [mode, setMode] = useState<GameMode>('practice');
  const stats = loadStats();
  const profile = loadProfile();
  const overallElo = Math.round((profile.elo.practice + profile.elo.vsbot + profile.elo.tournament) / 3);
  const tier = getEloTier(overallElo);

  const handleGo = () => {
    if (selectedSubject) onStart(selectedSubject, difficulty, mode);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl md:text-6xl font-display font-bold text-foreground mb-2 tracking-tight"
      >
        Math<span className="text-primary">Sprint</span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground mb-6 text-lg"
      >
        Train your mental math. Pick a subject.
      </motion.p>

      {/* User + Rank + Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6 flex items-center gap-4">
        {username && (
          <span className="text-sm font-mono text-muted-foreground">👤 {username}</span>
        )}
        <RankBadge stats={stats} />
        <button
          onClick={onStats}
          className="px-4 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors font-mono text-sm text-muted-foreground hover:text-foreground"
        >
          📊 Stats
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="px-3 py-2 rounded-lg bg-card border border-border hover:border-destructive/50 transition-colors font-mono text-xs text-muted-foreground hover:text-destructive"
          >
            Logout
          </button>
        )}
      </motion.div>

      {/* ELO display */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mb-8 flex items-center gap-2">
        <span className="text-sm">{tier.emoji}</span>
        <span className="font-mono font-bold" style={{ color: tier.color }}>{overallElo}</span>
        <span className="text-xs text-muted-foreground font-mono">{tier.label}</span>
      </motion.div>

      {/* Subject grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl w-full mb-8">
        {subjects.map((s, i) => {
          const info = subjectInfo[s];
          const selected = selectedSubject === s;
          return (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedSubject(s)}
              className={`flex items-center gap-4 p-5 rounded-lg border transition-colors text-left ${
                selected
                  ? 'bg-primary/10 border-primary shadow-[var(--glow-primary)]'
                  : 'bg-card border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl">{info.emoji}</span>
              <span className="text-base font-display font-semibold text-card-foreground">{info.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Config panel */}
      <AnimatePresence>
        {selectedSubject && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-2xl overflow-hidden"
          >
            {/* Difficulty */}
            <div className="mb-5">
              <p className="text-sm text-muted-foreground font-mono mb-2">Difficulty</p>
              <div className="flex gap-2">
                {difficulties.map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 p-3 rounded-lg border font-display font-semibold text-sm transition-colors ${
                      difficulty === d
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {DIFFICULTY_INFO[d].emoji} {DIFFICULTY_INFO[d].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground font-mono mb-2">Mode</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {modes.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      mode === m.key
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-lg block">{m.emoji}</span>
                    <span className={`text-xs font-display font-semibold block ${mode === m.key ? 'text-primary' : 'text-muted-foreground'}`}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Go button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGo}
              className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-display font-bold text-lg hover:opacity-90 transition-opacity animate-pulse-glow"
            >
              Start {modes.find(m => m.key === mode)?.label} →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
