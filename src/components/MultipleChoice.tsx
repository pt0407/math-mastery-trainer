import { motion } from "framer-motion";

interface Props {
  choices: number[];
  onSelect: (value: number) => void;
  disabled: boolean;
  selected: number | null;
  correctAnswer: number;
  showResult: boolean;
}

export default function MultipleChoice({ choices, onSelect, disabled, selected, correctAnswer, showResult }: Props) {
  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div className="grid grid-cols-2 gap-3">
      {choices.map((choice, i) => {
        const isSelected = selected === choice;
        const isCorrect = choice === correctAnswer;
        let borderClass = 'border-border hover:border-primary/50';
        let bgClass = 'bg-muted';

        if (showResult) {
          if (isCorrect) {
            borderClass = 'border-primary shadow-[var(--glow-primary)]';
            bgClass = 'bg-primary/10';
          } else if (isSelected && !isCorrect) {
            borderClass = 'border-destructive shadow-[var(--glow-destructive)]';
            bgClass = 'bg-destructive/10';
          } else {
            borderClass = 'border-border opacity-50';
          }
        } else if (isSelected) {
          borderClass = 'border-primary';
          bgClass = 'bg-primary/5';
        }

        return (
          <motion.button
            key={`${choice}-${i}`}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            onClick={() => !disabled && onSelect(choice)}
            disabled={disabled}
            className={`relative p-4 rounded-lg border ${borderClass} ${bgClass} transition-all duration-150 text-left disabled:cursor-default`}
          >
            <span className="absolute top-2 left-3 text-xs font-mono text-muted-foreground">
              {labels[i]}
            </span>
            <span className="block text-center text-lg font-mono font-bold text-foreground mt-2">
              {choice}
            </span>
            {showResult && isCorrect && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-3 text-primary text-sm"
              >
                ✓
              </motion.span>
            )}
            {showResult && isSelected && !isCorrect && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-3 text-destructive text-sm"
              >
                ✗
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
