import { motion } from "framer-motion";

interface Props {
  score: number;
  total: number;
  avgTime: number;
  onReplay: () => void;
  onHome: () => void;
}

export default function Results({ score, total, avgTime, onReplay, onHome }: Props) {
  const pct = Math.round((score / total) * 100);
  const grade = pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : 'F';
  const gradeColor = pct >= 80 ? 'text-primary' : pct >= 50 ? 'text-accent' : 'text-destructive';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className={`text-8xl font-display font-bold ${gradeColor} block mb-4`}
        >
          {grade}
        </motion.span>
        <h2 className="text-3xl font-display font-bold text-foreground mb-2">
          {score} / {total}
        </h2>
        <p className="text-muted-foreground font-mono mb-8">
          Avg {avgTime.toFixed(1)}s per question
        </p>

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
