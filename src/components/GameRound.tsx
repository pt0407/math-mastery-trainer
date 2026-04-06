import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateQuestion, Subject, subjectInfo, Question } from "@/lib/questions";

interface Props {
  subject: Subject;
  onFinish: (score: number, total: number, avgTime: number) => void;
  onBack: () => void;
}

const ROUND_QUESTIONS = 10;

export default function GameRound({ subject, onFinish, onBack }: Props) {
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState<Question>(() => generateQuestion(subject));
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [times, setTimes] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const info = subjectInfo[subject];

  useEffect(() => {
    inputRef.current?.focus();
  }, [qIndex]);

  const next = useCallback((correct: boolean) => {
    const elapsed = (Date.now() - startTime) / 1000;
    const newTimes = [...times, elapsed];
    const newScore = correct ? score + 1 : score;

    if (qIndex + 1 >= ROUND_QUESTIONS) {
      const avg = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
      setTimeout(() => onFinish(newScore, ROUND_QUESTIONS, avg), 600);
      return;
    }

    setTimeout(() => {
      setQuestion(generateQuestion(subject));
      setQIndex(q => q + 1);
      setInput("");
      setFeedback(null);
      setStartTime(Date.now());
      setTimes(newTimes);
      if (correct) setScore(newScore);
    }, 600);
  }, [startTime, times, score, qIndex, subject, onFinish]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(input);
    if (isNaN(parsed)) return;

    const correct = parsed === question.answer;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);
    next(correct);
  };

  const progressPercent = ((qIndex) / ROUND_QUESTIONS) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      {/* Header */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-mono">
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{info.emoji}</span>
            <span className="font-display font-semibold text-foreground">{info.label}</span>
          </div>
          <span className="font-mono text-accent font-bold">{score}/{qIndex}</span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-lg"
        >
          <div className={`p-8 rounded-lg border bg-card transition-colors ${
            feedback === 'correct' ? 'border-primary shadow-[var(--glow-primary)]' :
            feedback === 'wrong' ? 'border-destructive shadow-[var(--glow-destructive)]' :
            'border-border'
          }`}>
            <p className="text-sm text-muted-foreground font-mono mb-2">
              Question {qIndex + 1} of {ROUND_QUESTIONS}
            </p>
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
                placeholder="Your answer"
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

            {feedback === 'wrong' && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-destructive font-mono text-sm"
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
