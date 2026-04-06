import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Subject, subjectInfo } from "@/lib/questions";
import { generateStepByStep, StepByStepProblem } from "@/lib/stepByStep";

interface Props {
  subject: Subject;
  onBack: () => void;
}

export default function StepByStepMode({ subject, onBack }: Props) {
  const [problem, setProblem] = useState<StepByStepProblem>(() => generateStepByStep(subject));
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [completed, setCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const info = subjectInfo[subject];

  useEffect(() => {
    inputRef.current?.focus();
  }, [stepIndex]);

  const currentStep = problem.steps[stepIndex];
  const progress = ((stepIndex) / problem.steps.length) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(input);
    if (isNaN(parsed)) return;

    const correct = parsed === currentStep.answer;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setCorrectCount(c => c + 1);

    setTimeout(() => {
      if (stepIndex + 1 >= problem.steps.length) {
        setCompleted(true);
      } else {
        setStepIndex(s => s + 1);
        setInput("");
        setFeedback(null);
      }
    }, 800);
  };

  const handleNewProblem = () => {
    setProblem(generateStepByStep(subject));
    setStepIndex(0);
    setInput("");
    setFeedback(null);
    setCompleted(false);
    setCorrectCount(0);
  };

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
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-accent/20 text-accent">Step-by-Step</span>
          </div>
          <span className="font-mono text-primary text-sm">{correctCount}/{stepIndex + (completed ? 0 : 0)}</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            animate={{ width: `${completed ? 100 : progress}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>
      </div>

      {/* Problem title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mb-4"
      >
        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground font-mono mb-1">Problem</p>
          <pre className="text-lg font-mono font-bold text-foreground whitespace-pre-wrap">{problem.title}</pre>
        </div>
      </motion.div>

      {/* Step card */}
      {!completed ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg"
          >
            <div className={`p-6 rounded-lg border bg-card transition-colors ${
              feedback === 'correct' ? 'border-primary shadow-[var(--glow-primary)]' :
              feedback === 'wrong' ? 'border-destructive shadow-[var(--glow-destructive)]' :
              'border-border'
            }`}>
              <p className="text-xs text-muted-foreground font-mono mb-1">
                Step {stepIndex + 1} of {problem.steps.length}
              </p>
              <pre className="text-xl font-mono font-bold text-foreground whitespace-pre-wrap leading-relaxed mb-4">
                {currentStep.prompt}
              </pre>

              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  ref={inputRef}
                  type="number"
                  step="any"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Your answer"
                  className="flex-1 bg-muted border border-border rounded-md px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={feedback !== null}
                />
                <button
                  type="submit"
                  disabled={feedback !== null || !input}
                  className="px-5 py-3 rounded-md bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
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
                  Answer: {currentStep.answer}
                </motion.p>
              )}

              {currentStep.hint && feedback === null && (
                <p className="mt-3 text-muted-foreground font-mono text-xs italic">💡 {currentStep.hint}</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-lg text-center p-8 rounded-lg bg-card border border-border"
        >
          <span className="text-5xl block mb-3">
            {correctCount === problem.steps.length ? '🎉' : '📝'}
          </span>
          <h3 className="text-2xl font-display font-bold text-foreground mb-2">
            {correctCount === problem.steps.length ? 'Perfect!' : 'Problem Complete'}
          </h3>
          <p className="text-muted-foreground font-mono mb-6">
            {correctCount}/{problem.steps.length} steps correct
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleNewProblem}
              className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity"
            >
              Next Problem
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-md bg-secondary text-secondary-foreground font-display font-semibold hover:opacity-90 transition-opacity"
            >
              Back
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
