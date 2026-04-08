import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateQuestion, Subject, subjectInfo, Question } from "@/lib/questions";
import { Difficulty, DIFFICULTY_INFO } from "@/lib/rankings";
import { Bot, loadBots, findOpponent } from "@/lib/bots";
import { getEloTier, loadProfile } from "@/lib/elo";
import {
  Tournament, TournamentFormat, TournamentMatch,
  TOURNAMENT_FORMATS, createTournament, getNextPlayerMatch,
  advanceTournament, getTournamentSizes
} from "@/lib/tournament";
import MultipleChoice from "./MultipleChoice";

interface Props {
  subject: Subject;
  difficulty: Difficulty;
  onFinish: (wins: number, losses: number, format: TournamentFormat) => void;
  onBack: () => void;
}

type Phase = 'setup' | 'bracket' | 'playing' | 'results';

export default function TournamentMode({ subject, difficulty, onFinish, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [format, setFormat] = useState<TournamentFormat>('single_elim');
  const [size, setSize] = useState(8);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [currentMatch, setCurrentMatch] = useState<TournamentMatch | null>(null);
  const [opponent, setOpponent] = useState<Bot | null>(null);

  // Match state
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'player' | 'bot' | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [times, setTimes] = useState<number[]>([]);
  const [botProgress, setBotProgress] = useState(0);
  const [botTimerId, setBotTimerId] = useState<number | null>(null);
  const [animFrameId, setAnimFrameId] = useState<number | null>(null);

  const info = subjectInfo[subject];
  const MATCH_QUESTIONS = 10;

  const startTournament = () => {
    const bots = loadBots();
    const t = createTournament(format, bots, size);
    setTournament(t);
    setPhase('bracket');
  };

  const startNextMatch = useCallback(() => {
    if (!tournament) return;
    const match = getNextPlayerMatch(tournament);
    if (!match) {
      setPhase('results');
      return;
    }
    setCurrentMatch(match);
    const botParticipant = match.player1.type === 'bot' ? match.player1 : match.player2;
    setOpponent(botParticipant?.bot || null);
    setQIndex(0);
    setPlayerScore(0);
    setBotScore(0);
    setSelected(null);
    setFeedback(null);
    setQuestion(generateQuestion(subject, difficulty));
    setStartTime(Date.now());
    setTimes([]);
    setBotProgress(0);
    setPhase('playing');
  }, [tournament, subject, difficulty]);

  // Bot timer for match
  useEffect(() => {
    if (phase !== 'playing' || !opponent || feedback) return;

    const baseSpeed = opponent.avgSpeed;
    const variance = baseSpeed * 0.3;
    const botTime = baseSpeed - variance + Math.random() * variance * 2;
    const start = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - start) / 1000;
      setBotProgress(Math.min(1, elapsed / botTime));
      if (elapsed / botTime < 1) {
        const id = requestAnimationFrame(animate);
        setAnimFrameId(id);
      }
    };
    const afId = requestAnimationFrame(animate);
    setAnimFrameId(afId);

    const timerId = window.setTimeout(() => {
      setBotProgress(1);
      const botCorrect = Math.random() < opponent.accuracy;
      if (botCorrect) {
        setFeedback('bot');
        setBotScore(s => s + 1);
      }
      advanceMatchQuestion(false, botCorrect);
    }, botTime * 1000);
    setBotTimerId(timerId);

    return () => {
      clearTimeout(timerId);
      cancelAnimationFrame(afId);
    };
  }, [qIndex, phase, opponent]);

  const advanceMatchQuestion = useCallback((playerWon: boolean, botWon?: boolean) => {
    const elapsed = (Date.now() - startTime) / 1000;
    const newTimes = [...times, elapsed];

    if (qIndex + 1 >= MATCH_QUESTIONS) {
      const fp = playerScore + (playerWon ? 1 : 0);
      const fb = botScore + (botWon ? 1 : 0);
      const won = fp > fb;

      setTimeout(() => {
        if (tournament && currentMatch) {
          const matchIdx = tournament.matches.indexOf(currentMatch);
          const allBots = tournament.matches.flatMap(m => [m.player1, m.player2].filter(Boolean)) as any[];
          const updated = advanceTournament(tournament, matchIdx, won, fp, fb, allBots);
          setTournament(updated);

          if (updated.completed || updated.playerEliminated) {
            setPhase('results');
          } else {
            setPhase('bracket');
          }
        }
      }, 800);
      return;
    }

    setTimeout(() => {
      setQuestion(generateQuestion(subject, difficulty));
      setQIndex(q => q + 1);
      setSelected(null);
      setFeedback(null);
      setStartTime(Date.now());
      setTimes(newTimes);
      setBotProgress(0);
    }, 800);
  }, [startTime, times, playerScore, botScore, qIndex, subject, difficulty, tournament, currentMatch]);

  const handleSelect = (value: number) => {
    if (feedback || !question) return;
    setSelected(value);

    if (botTimerId) clearTimeout(botTimerId);
    if (animFrameId) cancelAnimationFrame(animFrameId);

    const correct = value === question.answer;
    if (correct) {
      setFeedback('player');
      setPlayerScore(s => s + 1);
      advanceMatchQuestion(true, false);
    } else {
      setFeedback('bot');
      const botGetsIt = Math.random() < 0.6;
      if (botGetsIt) setBotScore(s => s + 1);
      advanceMatchQuestion(false, botGetsIt);
    }
  };

  // SETUP PHASE
  if (phase === 'setup') {
    const sizes = getTournamentSizes(format);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-mono">← Back</button>
            <h1 className="text-2xl font-display font-bold text-foreground">🏆 Tournament</h1>
            <div />
          </div>

          <p className="text-sm text-muted-foreground font-mono mb-3">Format</p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {(Object.keys(TOURNAMENT_FORMATS) as TournamentFormat[]).map(f => {
              const fi = TOURNAMENT_FORMATS[f];
              return (
                <button
                  key={f}
                  onClick={() => { setFormat(f); setSize(getTournamentSizes(f)[0]); }}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    format === f ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-lg block">{fi.emoji}</span>
                  <span className={`text-sm font-display font-semibold block ${format === f ? 'text-primary' : 'text-foreground'}`}>{fi.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">{fi.desc}</span>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground font-mono mb-3">Size</p>
          <div className="flex gap-2 mb-6">
            {sizes.map(s => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`flex-1 py-2 rounded-lg border font-mono font-bold transition-colors ${
                  size === s ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startTournament}
            className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-display font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Start Tournament →
          </motion.button>
        </div>
      </div>
    );
  }

  // BRACKET PHASE
  if (phase === 'bracket' && tournament) {
    const nextMatch = getNextPlayerMatch(tournament);
    const opponentInfo = nextMatch
      ? (nextMatch.player1.type === 'bot' ? nextMatch.player1 : nextMatch.player2)
      : null;
    const oppBot = opponentInfo?.bot;
    const oppTier = oppBot ? getEloTier(oppBot.elo) : null;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-mono">← Quit</button>
            <h1 className="text-xl font-display font-bold text-foreground">
              {TOURNAMENT_FORMATS[tournament.format].emoji} {TOURNAMENT_FORMATS[tournament.format].label}
            </h1>
            <span className="font-mono text-sm text-muted-foreground">R{tournament.round}</span>
          </div>

          {/* Record */}
          <div className="flex justify-center gap-4 mb-6">
            <span className="font-mono text-primary font-bold">{tournament.playerWins}W</span>
            <span className="text-muted-foreground">-</span>
            <span className="font-mono text-destructive font-bold">{tournament.playerLosses}L</span>
          </div>

          {/* Recent matches */}
          <div className="space-y-2 mb-6">
            {tournament.matches
              .filter(m => m.winner && (m.player1.type === 'player' || m.player2?.type === 'player'))
              .slice(-5)
              .map((m, i) => {
                const isP1 = m.player1.type === 'player';
                const playerWon = (isP1 && m.winner === 'player1') || (!isP1 && m.winner === 'player2');
                const oppName = isP1 ? m.player2?.name : m.player1.name;
                return (
                  <div key={i} className={`p-3 rounded-lg border ${playerWon ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-foreground">vs {oppName}</span>
                      <span className={`font-mono text-sm font-bold ${playerWon ? 'text-primary' : 'text-destructive'}`}>
                        {playerWon ? 'WIN' : 'LOSS'} {m.score1}-{m.score2}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Next opponent */}
          {nextMatch && oppBot && oppTier && (
            <div className="p-5 rounded-lg bg-card border border-border mb-6">
              <p className="text-xs text-muted-foreground font-mono mb-2">NEXT OPPONENT</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-display font-bold text-foreground">{oppBot.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold" style={{ color: oppTier.color }}>{oppBot.elo}</span>
                    <span className="text-xs">{oppTier.emoji} {oppTier.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {Math.round(oppBot.accuracy * 100)}% acc · {oppBot.avgSpeed.toFixed(1)}s avg
                  </p>
                </div>
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startNextMatch}
            className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-display font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Fight! →
          </motion.button>
        </div>
      </div>
    );
  }

  // PLAYING PHASE
  if (phase === 'playing' && question && opponent) {
    const oppTier = getEloTier(opponent.elo);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-lg mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-muted-foreground">
              {TOURNAMENT_FORMATS[tournament?.format || 'single_elim'].emoji} R{tournament?.round}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl">{info.emoji}</span>
              <span className="font-display font-semibold text-foreground">{info.label}</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{DIFFICULTY_INFO[difficulty].emoji}</span>
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${(qIndex / MATCH_QUESTIONS) * 100}%` }} />
          </div>
        </div>

        {/* Scoreboard */}
        <div className="w-full max-w-lg flex justify-between mb-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border flex-1 mr-2">
            <span className="text-lg">👤</span>
            <div>
              <p className="text-xs text-muted-foreground font-mono">You</p>
              <p className="text-xl font-mono font-bold text-primary">{playerScore}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border flex-1 ml-2">
            <span className="text-lg">🤖</span>
            <div>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-[80px]">{opponent.name}</p>
              <p className="text-xl font-mono font-bold text-destructive">{botScore}</p>
            </div>
            <span className="text-xs font-mono ml-auto" style={{ color: oppTier.color }}>{opponent.elo}</span>
          </div>
        </div>

        {/* Bot progress */}
        <div className="w-full max-w-lg mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">🤖 Thinking...</span>
            <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-destructive/60 rounded-full" style={{ width: `${botProgress * 100}%` }} />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={qIndex} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="w-full max-w-lg">
            <div className={`p-8 rounded-lg border bg-card transition-colors ${
              feedback === 'player' ? 'border-primary shadow-[var(--glow-primary)]' :
              feedback === 'bot' ? 'border-destructive shadow-[var(--glow-destructive)]' : 'border-border'
            }`}>
              <p className="text-sm text-muted-foreground font-mono mb-2">Q{qIndex + 1}/{MATCH_QUESTIONS}</p>
              <pre className="text-2xl md:text-3xl font-mono font-bold text-foreground whitespace-pre-wrap leading-relaxed mb-6">
                {question.question}
              </pre>
              <MultipleChoice
                choices={question.choices}
                onSelect={handleSelect}
                disabled={feedback !== null}
                selected={selected}
                correctAnswer={question.answer}
                showResult={feedback !== null}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // RESULTS PHASE

  if (phase === 'results' && tournament) {
    const won = tournament.playerWins > tournament.playerLosses;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center w-full max-w-lg">
          <span className="text-6xl block mb-4">{won ? '🏆' : tournament.playerEliminated ? '💀' : '🏅'}</span>
          <h2 className="text-3xl font-display font-bold text-foreground mb-2">
            {won ? 'Tournament Champion!' : tournament.playerEliminated ? 'Eliminated!' : 'Tournament Over'}
          </h2>
          <p className="text-muted-foreground font-mono mb-2">
            {TOURNAMENT_FORMATS[tournament.format].label} · {tournament.size} players
          </p>
          <div className="flex justify-center gap-4 mb-6">
            <span className="font-mono text-primary font-bold text-xl">{tournament.playerWins}W</span>
            <span className="text-muted-foreground text-xl">-</span>
            <span className="font-mono text-destructive font-bold text-xl">{tournament.playerLosses}L</span>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => { setPhase('setup'); setTournament(null); }}
              className="px-8 py-3 rounded-md bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity"
            >
              New Tournament
            </button>
            <button
              onClick={onBack}
              className="px-8 py-3 rounded-md bg-secondary text-secondary-foreground font-display font-semibold hover:opacity-90 transition-opacity"
            >
              Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
