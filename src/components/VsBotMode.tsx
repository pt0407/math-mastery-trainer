import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateQuestion, Subject, subjectInfo, Question } from "@/lib/questions";
import { Difficulty, DIFFICULTY_INFO } from "@/lib/rankings";

interface Props {
  subject: Subject;
  difficulty: Difficulty;
  onFinish: (playerScore: number, botScore: number, total: number, avgTime: number, won: boolean) => void;
  onBack: () => void;
}

const ROUND_QUESTIONS = 10;

function getBotSpeed(difficulty: Difficulty): { min: number; max: number } {
  switch (difficulty) {
    case 'easy': return { min: 4, max: 8 };
    case 'medium': return { min: 2.5, max: 5.5 };
    case 'hard': return { min: 1.2, max: 3.5 };
  }
}

export default function VsBotMode({ subject, difficulty, onFinish, onBack }: Props) {
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState<Question>(() => generateQuestion(subject, difficulty));
  const [input, setInput] = useState("");
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [feedback, setFeedback] = useState<'player' | 'bot' | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [times, setTimes] = useState<number[]>([]);
  const [botProgress, setBotProgress] = useState(0);
  const botTimerRef = useRef<number | null>(null);
  const botTimeTarget = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const info = subjectInfo[subject];

  const startBotTimer = useCallback(() => {
    const speed = getBotSpeed(difficulty);
    const botTime = speed.min + Math.random() * (speed.max - speed.min);
    botTimeTarget.current = botTime;
    const start = Date.now();
    setBotProgress(0);

    const animate = () => {
      const elapsed = (Date.now() - start) / 1000;
      const pct = Math.min(1, elapsed / botTime);
      setBotProgress(pct);
      if (pct < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);

    botTimerRef.current = window.setTimeout(() => {
      // Bot answers
      setBotProgress(1);
      // Bot has ~85% accuracy on easy, ~75% medium, ~90% hard (it's smarter on hard)
      const botAccuracy = difficulty === 'easy' ? 0.85 : difficulty === 'medium' ? 0.75 : 0.9;
      const botCorrect = Math.random() < botAccuracy;
      if (botCorrect) {
        setFeedback('bot');
        setBotScore(s => s + 1);
      }
      advanceQuestion(false, botCorrect);
    }, botTime * 1000);
  }, [difficulty]);

  useEffect(() => {
    startBotTimer();
    inputRef.current?.focus();
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [qIndex]);

  const advanceQuestion = useCallback((playerWon: boolean, botWon?: boolean) => {
    const elapsed = (Date.now() - startTime) / 1000;
    const newTimes = [...times, elapsed];

    if (qIndex + 1 >= ROUND_QUESTIONS) {
      const finalPlayerScore = playerScore + (playerWon ? 1 : 0);
      const finalBotScore = botScore + (botWon ? 1 : 0);
      const avg = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
      setTimeout(() => onFinish(finalPlayerScore, finalBotScore, ROUND_QUESTIONS, avg, finalPlayerScore > finalBotScore), 800);
      return;
    }

    setTimeout(() => {
      setQuestion(generateQuestion(subject, difficulty));
      setQIndex(q => q + 1);
      setInput("");
      setFeedback(null);
      setStartTime(Date.now());
      setTimes(newTimes);
      setBotProgress(0);
    }, 800);
  }, [startTime, times, playerScore, botScore, qIndex, subject, difficulty, onFinish]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback) return;
    const parsed = parseFloat(input);
    if (isNaN(parsed)) return;

    // Cancel bot timer - player answered first
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const correct = parsed === question.answer;
    if (correct) {
      setFeedback('player');
      setPlayerScore(s => s + 1);
      advanceQuestion(true, false);
    } else {
      setFeedback('bot');
      // Wrong answer = bot gets a chance (50% it gets it right)
      const botGetsIt = Math.random() < 0.6;
      if (botGetsIt) setBotScore(s => s + 1);
      advanceQuestion(false, botGetsIt);
    }
  };

  const progressPercent = (qIndex / ROUND_QUESTIONS) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      {/* Header */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-mono">
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{info.emoji}</span>
            <span className="font-display font-semibold text-foreground">{info.label}</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-destructive/20 text-destructive">VS BOT</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">{DIFFICULTY_INFO[difficulty].emoji}</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
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
            <p className="text-xs text-muted-foreground font-mono">Bot</p>
            <p className="text-xl font-mono font-bold text-destructive">{botScore}</p>
          </div>
        </div>
      </div>

      {/* Bot progress indicator */}
      <div className="w-full max-w-lg mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">🤖 Thinking...</span>
          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-destructive/60 rounded-full"
              style={{ width: `${botProgress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg"
        >
          <div className={`p-8 rounded-lg border bg-card transition-colors ${
            feedback === 'player' ? 'border-primary shadow-[var(--glow-primary)]' :
            feedback === 'bot' ? 'border-destructive shadow-[var(--glow-destructive)]' :
            'border-border'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-mono">
                Q{qIndex + 1}/{ROUND_QUESTIONS}
              </p>
              {feedback && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`text-xs font-mono px-2 py-1 rounded ${
                    feedback === 'player' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                  }`}
                >
                  {feedback === 'player' ? '✓ You got it!' : '✗ Bot wins'}
                </motion.span>
              )}
            </div>
            <pre className="text-2xl md:text-3xl font-mono font-bold text-foreground whitespace-pre-wrap leading-relaxed mb-6">
              {question.question}
            </pre>

            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                ref={inputRef}
                type="number"
                step="any"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Beat the bot!"
                className="flex-1 bg-muted border border-border rounded-md px-4 py-3 font-mono text-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={feedback !== null}
              />
              <button
                type="submit"
                disabled={feedback !== null || !input}
                className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                →
              </button>
            </form>

            {feedback && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-muted-foreground font-mono text-sm"
              >
                Answer: {question.answer}
              </motion.p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
