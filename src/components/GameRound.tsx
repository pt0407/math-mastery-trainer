import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateQuestion, Subject, subjectInfo, Question } from "@/lib/questions";
import { Difficulty, DIFFICULTY_INFO } from "@/lib/rankings";
import MultipleChoice from "./MultipleChoice";

interface Props {
  subject: Subject;
  difficulty: Difficulty;
  onFinish: (score: number, total: number, avgTime: number) => void;
  onBack: () => void;
}

const ROUND_QUESTIONS = 10;

export default function GameRound({ subject, difficulty, onFinish, onBack }: Props) {
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState<Question>(() => generateQuestion(subject, difficulty));
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [times, setTimes] = useState<number[]>([]);
  const info = subjectInfo[subject];

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
      setQuestion(generateQuestion(subject, difficulty));
      setQIndex(q => q + 1);
      setSelected(null);
      setFeedback(null);
      setStartTime(Date.now());
      setTimes(newTimes);
      if (correct) setScore(newScore);
    }, 600);
  }, [startTime, times, score, qIndex, subject, difficulty, onFinish]);

  const handleSelect = (value: number) => {
    if (feedback) return;
    setSelected(value);
    const correct = value === question.answer;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);
    next(correct);
  };

  const progressPercent = ((qIndex) / ROUND_QUESTIONS) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-mono">
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{info.emoji}</span>
            <span className="font-display font-semibold text-foreground">{info.label}</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-secondary text-muted-foreground">{DIFFICULTY_INFO[difficulty].emoji} {DIFFICULTY_INFO[difficulty].label}</span>
          </div>
          <span className="font-mono text-accent font-bold">{score}/{qIndex}</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>
      </div>

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
